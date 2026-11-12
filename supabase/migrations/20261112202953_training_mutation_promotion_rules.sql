-- Phase 7 workflows. HR is the only approver (decision of 2 Nov 2026), and every state change goes through an RPC:
--   training:   pending -> approved/rejected (decide_training_registration, existing)
--               approved -> selected/not_selected -> completed (set_training_outcome)
--   mutation:   proposed -> approved/rejected (decide_mutation) -> executed (execute_mutation, existing)
--   promotion:  proposed -> approved/rejected (decide_promotion) -> executed (execute_promotion)
-- HR can still create proposals and manage trainings/announcements directly; it cannot edit proposal statuses by hand.

-- ---------------------------------------------------------------------------
-- Training outcome
-- ---------------------------------------------------------------------------
create or replace function public.set_training_outcome(
  registration_id uuid,
  new_status public.training_registration_status,
  note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  registration public.training_registrations;
  training public.trainings;
  taken integer;
begin
  if not public.has_permission('training.manage') then
    raise exception 'Not allowed to manage training participants';
  end if;
  select * into registration from public.training_registrations where id = registration_id for update;
  if registration.id is null then
    raise exception 'Registration not found';
  end if;
  select * into training from public.trainings where id = registration.training_id;

  if new_status in ('selected', 'not_selected') then
    if registration.status <> 'approved' then
      raise exception 'Only approved registrations can be selected';
    end if;
    if new_status = 'selected' and training.quota is not null then
      select count(*) into taken from public.training_registrations r
      where r.training_id = registration.training_id and r.status in ('selected', 'completed');
      if taken >= training.quota then
        raise exception 'Training quota is full';
      end if;
    end if;
    update public.training_registrations
    set status = new_status, decision_note = coalesce(nullif(trim(note), ''), decision_note)
    where id = registration_id;
  elsif new_status = 'completed' then
    if registration.status <> 'selected' then
      raise exception 'Only selected participants can be completed';
    end if;
    -- The record_completed_training trigger copies this into the employee's training history.
    update public.training_registrations set status = 'completed', result_note = nullif(trim(note), '') where id = registration_id;
  else
    raise exception 'Unsupported outcome';
  end if;

  perform public.notify_employee(registration.employee_id,
    case new_status
      when 'selected' then 'Anda ditetapkan sebagai peserta diklat'
      when 'not_selected' then 'Anda belum terpilih sebagai peserta diklat'
      else 'Hasil diklat dicatat'
    end,
    training.name, '/training');
end;
$$;

-- ---------------------------------------------------------------------------
-- Mutation and promotion decisions
-- ---------------------------------------------------------------------------
create or replace function public.decide_mutation(mutation_id uuid, approve boolean, note text default null, decree text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  mutation public.mutations;
begin
  if not public.has_permission('mutation.manage') then
    raise exception 'Not allowed to decide mutations';
  end if;
  select * into mutation from public.mutations where id = mutation_id for update;
  if mutation.id is null or mutation.status <> 'proposed' then
    raise exception 'Only proposed items can be decided';
  end if;
  if not approve and coalesce(trim(note), '') = '' then
    raise exception 'A reason is required when rejecting';
  end if;

  update public.mutations
  set status = case when approve then 'approved'::public.proposal_status else 'rejected'::public.proposal_status end,
      decided_by = auth.uid(), decided_at = now(), decision_note = nullif(trim(note), ''),
      decree_number = coalesce(nullif(trim(decree), ''), decree_number)
  where id = mutation_id;

  if not approve then
    perform public.notify_employee(mutation.employee_id, 'Usulan mutasi ditolak', note, '/profile');
  end if;
end;
$$;

create or replace function public.decide_promotion(promotion_id uuid, approve boolean, note text default null, decree text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  promotion public.promotion_proposals;
begin
  if not public.has_permission('promotion.manage') then
    raise exception 'Not allowed to decide promotions';
  end if;
  select * into promotion from public.promotion_proposals where id = promotion_id for update;
  if promotion.id is null or promotion.status <> 'proposed' then
    raise exception 'Only proposed items can be decided';
  end if;
  if not approve and coalesce(trim(note), '') = '' then
    raise exception 'A reason is required when rejecting';
  end if;

  update public.promotion_proposals
  set status = case when approve then 'approved'::public.proposal_status else 'rejected'::public.proposal_status end,
      decided_by = auth.uid(), decided_at = now(), decision_note = nullif(trim(note), ''),
      decree_number = coalesce(nullif(trim(decree), ''), decree_number)
  where id = promotion_id;

  if not approve then
    perform public.notify_employee(promotion.employee_id, 'Usulan kenaikan pangkat/jabatan ditolak', note, '/profile');
  end if;
end;
$$;

-- Applies an approved promotion: updates the employee and writes rank or position history.
create or replace function public.execute_promotion(promotion_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  promotion public.promotion_proposals;
  employee public.employees;
  start_date date;
begin
  if not public.has_permission('promotion.manage') then
    raise exception 'Not allowed to execute promotions';
  end if;
  select * into promotion from public.promotion_proposals where id = promotion_id for update;
  if promotion.id is null or promotion.status <> 'approved' then
    raise exception 'Only approved promotions can be executed';
  end if;
  select * into employee from public.employees where id = promotion.employee_id for update;
  start_date := coalesce(promotion.effective_date, current_date);

  if promotion.promotion_type = 'rank' then
    update public.employees set rank_grade = promotion.proposed_rank_grade where id = employee.id;
    insert into public.rank_histories (employee_id, rank_grade, effective_date, decree_number, decree_path)
    values (employee.id, promotion.proposed_rank_grade, start_date, promotion.decree_number, promotion.decree_path);
  else
    update public.employees set position_id = promotion.proposed_position_id where id = employee.id;
    update public.position_histories set end_date = start_date - 1 where employee_id = employee.id and end_date is null;
    insert into public.position_histories (employee_id, position_id, work_unit_id, start_date, decree_number, decree_path)
    values (employee.id, promotion.proposed_position_id, employee.work_unit_id, start_date, promotion.decree_number, promotion.decree_path);
  end if;

  update public.promotion_proposals set status = 'executed' where id = promotion_id;
  perform public.notify_employee(employee.id, 'Kenaikan pangkat/jabatan telah ditetapkan', null, '/profile');
end;
$$;

-- Fills "current" values and the proposer when a proposal is created, so the form only asks for the target.
create or replace function public.prepare_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select e.work_unit_id, e.position_id into new.from_work_unit_id, new.from_position_id from public.employees e where e.id = new.employee_id;
  new.status := 'proposed';
  new.proposed_by := auth.uid();
  return new;
end;
$$;

create or replace function public.prepare_promotion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select e.rank_grade, e.position_id into new.current_rank_grade, new.current_position_id from public.employees e where e.id = new.employee_id;
  new.status := 'proposed';
  new.proposed_by := auth.uid();
  return new;
end;
$$;

create trigger prepare_mutation before insert on public.mutations for each row execute function public.prepare_mutation();
create trigger prepare_promotion before insert on public.promotion_proposals for each row execute function public.prepare_promotion();

-- HR creates proposals; decisions and execution only through the RPCs.
drop policy if exists "mutation manage" on public.mutations;
drop policy if exists "promotion manage" on public.promotion_proposals;
drop policy if exists "registration manage" on public.training_registrations;
create policy "mutation propose" on public.mutations for insert to authenticated with check (public.has_permission('mutation.manage'));
create policy "promotion propose" on public.promotion_proposals for insert to authenticated with check (public.has_permission('promotion.manage'));
-- Training registrations: employees apply (existing policy); HR reads and decides through RPCs.

-- ---------------------------------------------------------------------------
-- Announcements: publication time and author are set by the database.
-- ---------------------------------------------------------------------------
create or replace function public.prepare_announcement()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
  end if;
  if new.is_published and new.published_at is null then
    new.published_at := now();
  elsif not new.is_published then
    new.published_at := null;
  end if;
  return new;
end;
$$;

create trigger prepare_announcement before insert or update on public.announcements
for each row execute function public.prepare_announcement();

revoke execute on function public.set_training_outcome(uuid, public.training_registration_status, text) from public, anon, authenticated;
revoke execute on function public.decide_mutation(uuid, boolean, text, text) from public, anon, authenticated;
revoke execute on function public.decide_promotion(uuid, boolean, text, text) from public, anon, authenticated;
revoke execute on function public.execute_promotion(uuid) from public, anon, authenticated;
grant execute on function public.set_training_outcome(uuid, public.training_registration_status, text) to authenticated;
grant execute on function public.decide_mutation(uuid, boolean, text, text) to authenticated;
grant execute on function public.decide_promotion(uuid, boolean, text, text) to authenticated;
grant execute on function public.execute_promotion(uuid) to authenticated;
