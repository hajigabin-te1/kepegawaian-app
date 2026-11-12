-- Performance appraisal workflow (HR only): generate forms -> fill -> submit -> verify or send back.
-- All writes to appraisal forms and indicators go through RPCs, so statuses and scores cannot be edited directly.
--
-- ASSUMPTIONS (formula and scale are not confirmed yet, see docs/requirements.md section 7):
--   * performance_score = average of the indicator scores, computed in compute_appraisal_score().
--   * Indicator scores are between 0 and app_settings.appraisal_max_score (default 100).
-- Both are isolated here so they can be replaced without touching the app.

insert into public.app_settings (key, value, description)
values ('appraisal_max_score', '100', 'Nilai maksimal indikator penilaian kinerja (skala belum dikonfirmasi)')
on conflict (key) do nothing;

create or replace function public.appraisal_max_score()
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select (value #>> '{}')::numeric from public.app_settings where key = 'appraisal_max_score'), 100)
$$;

-- Overall score of one form. Replace this function when the real formula is confirmed.
create or replace function public.compute_appraisal_score(target_appraisal_id uuid)
returns numeric
language sql
stable
set search_path = ''
as $$
  select round(avg(i.score), 2) from public.appraisal_items i where i.appraisal_id = target_appraisal_id and i.score is not null
$$;

-- Only open periods can get new forms.
create or replace function public.generate_appraisals(target_period_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_count integer;
begin
  if not public.has_permission('appraisal.manage') then
    raise exception 'Not allowed to generate appraisals';
  end if;
  if not exists (select 1 from public.appraisal_periods p where p.id = target_period_id and p.is_active) then
    raise exception 'The appraisal period is not active';
  end if;

  insert into public.appraisals (period_id, employee_id)
  select target_period_id, e.id
  from public.employees e
  where e.active_status = 'active'
  on conflict (period_id, employee_id) do nothing;

  get diagnostics created_count = row_count;
  return created_count;
end;
$$;

-- Saves the note and replaces the indicator rows of a form that is still editable.
-- items: [{ "indicator": text, "target": text|null, "realization": text|null, "score": number|null }, ...]
create or replace function public.save_appraisal(target_appraisal_id uuid, new_note text, items jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  appraisal public.appraisals;
  max_score numeric := public.appraisal_max_score();
  item jsonb;
  item_score numeric;
  position integer := 0;
begin
  if not public.has_permission('appraisal.manage') then
    raise exception 'Not allowed to edit appraisals';
  end if;
  select * into appraisal from public.appraisals where id = target_appraisal_id for update;
  if appraisal.id is null then
    raise exception 'Appraisal not found';
  end if;
  if appraisal.status not in ('draft', 'revision_requested') then
    raise exception 'This appraisal can no longer be edited';
  end if;
  if jsonb_typeof(items) is distinct from 'array' then
    raise exception 'Invalid indicators';
  end if;

  for item in select * from jsonb_array_elements(items) loop
    if coalesce(trim(item ->> 'indicator'), '') = '' then
      raise exception 'Every indicator needs a name';
    end if;
    item_score := nullif(item ->> 'score', '')::numeric;
    if item_score is not null and (item_score < 0 or item_score > max_score) then
      raise exception 'Score is outside the allowed scale';
    end if;
  end loop;

  delete from public.appraisal_items where appraisal_id = target_appraisal_id;
  for item in select * from jsonb_array_elements(items) loop
    position := position + 1;
    insert into public.appraisal_items (appraisal_id, indicator, target, realization, score, sort_order)
    values (target_appraisal_id, trim(item ->> 'indicator'), nullif(trim(item ->> 'target'), ''),
            nullif(trim(item ->> 'realization'), ''), nullif(item ->> 'score', '')::numeric, position);
  end loop;

  update public.appraisals
  set note = nullif(trim(new_note), ''), performance_score = public.compute_appraisal_score(target_appraisal_id)
  where id = target_appraisal_id;
end;
$$;

-- Draft or returned form -> submitted for verification. Every indicator must be scored.
create or replace function public.submit_appraisal(target_appraisal_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  appraisal public.appraisals;
begin
  if not public.has_permission('appraisal.manage') then
    raise exception 'Not allowed to submit appraisals';
  end if;
  select * into appraisal from public.appraisals where id = target_appraisal_id for update;
  if appraisal.id is null then
    raise exception 'Appraisal not found';
  end if;
  if appraisal.status not in ('draft', 'revision_requested') then
    raise exception 'This appraisal has already been submitted';
  end if;
  if not exists (select 1 from public.appraisal_items i where i.appraisal_id = target_appraisal_id) then
    raise exception 'Add at least one indicator before submitting';
  end if;
  if exists (select 1 from public.appraisal_items i where i.appraisal_id = target_appraisal_id and i.score is null) then
    raise exception 'Every indicator must have a score before submitting';
  end if;

  update public.appraisals
  set status = 'submitted',
      appraised_by = auth.uid(),
      submitted_at = now(),
      revision_note = null,
      performance_score = public.compute_appraisal_score(target_appraisal_id)
  where id = target_appraisal_id;
end;
$$;

create or replace function public.review_appraisal(target_appraisal_id uuid, accept boolean, note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  appraisal public.appraisals;
begin
  if not public.has_permission('appraisal.manage') then
    raise exception 'Not allowed to review appraisals';
  end if;
  select * into appraisal from public.appraisals where id = target_appraisal_id for update;
  if appraisal.id is null or appraisal.status <> 'submitted' then
    raise exception 'Only submitted appraisals can be reviewed';
  end if;
  if not accept and coalesce(trim(note), '') = '' then
    raise exception 'A reason is required when sending back';
  end if;

  if accept then
    update public.appraisals
    set status = 'verified', verified_by = auth.uid(), verified_at = now(), revision_note = null
    where id = target_appraisal_id;
    perform public.notify_employee(appraisal.employee_id, 'Hasil penilaian kinerja tersedia', null, '/performance');
  else
    update public.appraisals
    set status = 'revision_requested', revision_note = trim(note)
    where id = target_appraisal_id;
  end if;
end;
$$;

-- HR can read every form but only the RPCs above write them.
drop policy if exists "appraisal manage" on public.appraisals;
drop policy if exists "item manage" on public.appraisal_items;
create policy "appraisal read manage" on public.appraisals for select to authenticated using (public.has_permission('appraisal.manage'));
create policy "item read manage" on public.appraisal_items for select to authenticated using (public.has_permission('appraisal.manage'));

revoke execute on function public.appraisal_max_score() from public, anon, authenticated;
revoke execute on function public.compute_appraisal_score(uuid) from public, anon, authenticated;
revoke execute on function public.save_appraisal(uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function public.submit_appraisal(uuid) from public, anon, authenticated;
grant execute on function public.save_appraisal(uuid, text, jsonb) to authenticated;
grant execute on function public.submit_appraisal(uuid) to authenticated;
