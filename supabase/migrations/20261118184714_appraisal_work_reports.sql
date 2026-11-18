-- =============================================================================
-- Laporan kerja pegawai (decision 2026-11-19): employees report their work per appraisal period
-- (description + one evidence file). HR reads the reports as input when filling the appraisal form.
--
-- Reports belong to a period and an employee, not to an appraisal row, so employees can report before
-- HR generates the forms. They lock once the period is inactive or the employee's form for that period
-- has been submitted or verified, so a score never changes underneath the material it was based on.
-- All writes go through RPCs; evidence files live in the private bucket "appraisal-evidence".
-- =============================================================================

create table public.appraisal_work_reports (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.appraisal_periods (id) on delete restrict,
  employee_id uuid not null references public.employees (id) on delete cascade,
  description text not null check (char_length(description) between 10 and 2000),
  evidence_path text not null,
  evidence_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index appraisal_work_reports_period_employee_idx on public.appraisal_work_reports (period_id, employee_id);

create trigger set_updated_at before update on public.appraisal_work_reports
  for each row execute function public.set_updated_at();
create trigger audit_row_change after insert or update or delete on public.appraisal_work_reports
  for each row execute function public.audit_row_change();

alter table public.appraisal_work_reports enable row level security;

-- Read: the employee's own reports, or HR. No direct writes; see the RPCs below.
create policy "work report read" on public.appraisal_work_reports for select to authenticated
  using (employee_id = public.current_employee_id() or public.has_permission('appraisal.manage'));

-- True when reports of this employee for this period can no longer change.
-- Callers other than the employee or HR always get true, so the function reveals nothing about other forms.
create or replace function public.work_reports_locked(target_period_id uuid, target_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when target_employee_id is distinct from public.current_employee_id()
      and not public.has_permission('appraisal.manage') then true
    else
      not exists (select 1 from public.appraisal_periods p where p.id = target_period_id and p.is_active)
      or exists (
        select 1 from public.appraisals a
        where a.period_id = target_period_id
          and a.employee_id = target_employee_id
          and a.status in ('submitted', 'verified')
      )
  end;
$$;

-- Adds (target_report_id null) or updates one of the caller's own reports. Returns the report id.
create or replace function public.save_work_report(
  target_report_id uuid,
  target_period_id uuid,
  new_description text,
  new_evidence_path text,
  new_evidence_name text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public.current_employee_id();
  report public.appraisal_work_reports;
  clean_description text := trim(coalesce(new_description, ''));
  result_id uuid;
begin
  if me is null then
    raise exception 'Your account is not linked to an employee';
  end if;

  if target_report_id is not null then
    select * into report from public.appraisal_work_reports where id = target_report_id for update;
    if report.id is null or report.employee_id <> me then
      raise exception 'Work report not found';
    end if;
    -- A report cannot move to another period.
    target_period_id := report.period_id;
  end if;

  if public.work_reports_locked(target_period_id, me) then
    raise exception 'Work reports for this period are locked';
  end if;
  if char_length(clean_description) not between 10 and 2000 then
    raise exception 'Description must be 10 to 2000 characters';
  end if;
  if coalesce(trim(new_evidence_path), '') = '' or coalesce(trim(new_evidence_name), '') = '' then
    raise exception 'Evidence file is required';
  end if;
  if left(new_evidence_path, 37) <> me::text || '/' then
    raise exception 'Evidence must be stored in your own folder';
  end if;

  if target_report_id is null then
    insert into public.appraisal_work_reports (period_id, employee_id, description, evidence_path, evidence_name)
    values (target_period_id, me, clean_description, new_evidence_path, left(trim(new_evidence_name), 200))
    returning id into result_id;
  else
    update public.appraisal_work_reports
    set description = clean_description,
        evidence_path = new_evidence_path,
        evidence_name = left(trim(new_evidence_name), 200)
    where id = target_report_id
    returning id into result_id;
  end if;
  return result_id;
end;
$$;

-- Deletes one of the caller's own reports. Returns the evidence path so the client can remove the file.
create or replace function public.delete_work_report(target_report_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public.current_employee_id();
  report public.appraisal_work_reports;
begin
  if me is null then
    raise exception 'Your account is not linked to an employee';
  end if;
  select * into report from public.appraisal_work_reports where id = target_report_id for update;
  if report.id is null or report.employee_id <> me then
    raise exception 'Work report not found';
  end if;
  if public.work_reports_locked(report.period_id, me) then
    raise exception 'Work reports for this period are locked';
  end if;

  delete from public.appraisal_work_reports where id = target_report_id;
  return report.evidence_path;
end;
$$;

revoke execute on function public.work_reports_locked(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.save_work_report(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.delete_work_report(uuid) from public, anon, authenticated;
-- work_reports_locked is also used by the Storage delete policy, which runs with the caller's privileges.
grant execute on function public.work_reports_locked(uuid, uuid) to authenticated;
grant execute on function public.save_work_report(uuid, uuid, text, text, text) to authenticated;
grant execute on function public.delete_work_report(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Storage: "<employee_id>/<period_id>/<random>.<ext>", max 5 MB, PDF/JPG/PNG.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('appraisal-evidence', 'appraisal-evidence', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "appraisal evidence read" on storage.objects for select to authenticated
  using (
    bucket_id = 'appraisal-evidence'
    and (
      (storage.foldername(name))[1] = public.current_employee_id()::text
      or public.has_permission('appraisal.manage')
    )
  );

create policy "appraisal evidence upload own" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'appraisal-evidence'
    and (storage.foldername(name))[1] = public.current_employee_id()::text
  );

-- Employees may remove their own files, except the evidence of a report that is already locked.
create policy "appraisal evidence delete own" on storage.objects for delete to authenticated
  using (
    bucket_id = 'appraisal-evidence'
    and (storage.foldername(name))[1] = public.current_employee_id()::text
    and not exists (
      select 1 from public.appraisal_work_reports r
      where r.evidence_path = storage.objects.name
        and public.work_reports_locked(r.period_id, r.employee_id)
    )
  );
