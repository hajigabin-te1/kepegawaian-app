-- =============================================================================
-- Training (diklat), mutations (mutasi), and rank/position promotions (kenaikan pangkat & jabatan).
-- =============================================================================

create type public.training_status as enum ('open', 'closed', 'completed', 'cancelled');
create type public.training_registration_status as enum (
  'pending',               -- employee applied
  'supervisor_approved',   -- atasan setuju
  'supervisor_rejected',   -- atasan tolak
  'selected',              -- HR menetapkan sebagai peserta
  'not_selected',
  'completed'              -- hasil/sertifikat dicatat
);
create type public.proposal_status as enum ('proposed', 'approved', 'rejected', 'executed');
create type public.promotion_type as enum ('rank', 'position');

-- ---------------------------------------------------------------------------
-- Training
-- ---------------------------------------------------------------------------
create table public.trainings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organizer text,
  description text,
  start_date date,
  end_date date,
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  quota integer check (quota > 0),
  status public.training_status not null default 'open',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

alter table public.training_histories
  add constraint training_histories_training_id_fkey foreign key (training_id) references public.trainings (id) on delete set null;

create table public.training_registrations (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.trainings (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  status public.training_registration_status not null default 'pending',
  supervisor_id uuid references public.employees (id) on delete set null,
  supervisor_decided_at timestamptz,
  supervisor_note text,
  result_note text,
  certificate_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (training_id, employee_id)
);

create or replace function public.decide_training_registration(registration_id uuid, approve boolean, note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  registration public.training_registrations;
begin
  select * into registration from public.training_registrations where id = registration_id for update;
  if registration.id is null or registration.status <> 'pending' then
    raise exception 'Only pending registrations can be decided';
  end if;
  if not (public.is_supervisor_of(registration.employee_id) or public.has_permission('training.manage')) then
    raise exception 'Not allowed to decide this registration';
  end if;

  update public.training_registrations
  set status = case when approve then 'supervisor_approved'::public.training_registration_status else 'supervisor_rejected'::public.training_registration_status end,
      supervisor_id = public.current_employee_id(),
      supervisor_decided_at = now(),
      supervisor_note = note
  where id = registration_id;
end;
$$;

-- When HR marks a participant completed, copy it into the employee's training history ("riwayat diklat di profil").
create or replace function public.record_completed_training()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    insert into public.training_histories (employee_id, training_name, organizer, start_date, end_date, certificate_path, training_id)
    select new.employee_id, t.name, t.organizer, t.start_date, t.end_date, new.certificate_path, t.id
    from public.trainings t
    where t.id = new.training_id;
  end if;
  return new;
end;
$$;

create trigger record_completed_training after update on public.training_registrations
for each row execute function public.record_completed_training();

-- ---------------------------------------------------------------------------
-- Mutations
-- ---------------------------------------------------------------------------
create table public.mutations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  from_work_unit_id uuid references public.work_units (id) on delete set null,
  to_work_unit_id uuid references public.work_units (id) on delete set null,
  from_position_id uuid references public.positions (id) on delete set null,
  to_position_id uuid references public.positions (id) on delete set null,
  effective_date date not null,
  reason text,
  status public.proposal_status not null default 'proposed',
  proposed_by uuid references auth.users (id) on delete set null,
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  decision_note text,
  decree_number text,
  decree_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (to_work_unit_id is not null or to_position_id is not null)
);

-- Applies an approved mutation: updates the employee and records position history.
create or replace function public.execute_mutation(mutation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  mutation public.mutations;
  employee public.employees;
begin
  if not public.has_permission('mutation.manage') then
    raise exception 'Not allowed to execute mutations';
  end if;
  select * into mutation from public.mutations where id = mutation_id for update;
  if mutation.id is null or mutation.status <> 'approved' then
    raise exception 'Only approved mutations can be executed';
  end if;
  select * into employee from public.employees where id = mutation.employee_id for update;

  update public.employees
  set work_unit_id = coalesce(mutation.to_work_unit_id, employee.work_unit_id),
      position_id = coalesce(mutation.to_position_id, employee.position_id)
  where id = employee.id;

  update public.position_histories
  set end_date = mutation.effective_date - 1
  where employee_id = employee.id and end_date is null;

  insert into public.position_histories (employee_id, position_id, work_unit_id, start_date, decree_number, decree_path)
  values (employee.id, coalesce(mutation.to_position_id, employee.position_id),
          coalesce(mutation.to_work_unit_id, employee.work_unit_id), mutation.effective_date,
          mutation.decree_number, mutation.decree_path);

  update public.mutations set status = 'executed' where id = mutation_id;
  perform public.notify_employee(employee.id, 'Mutasi telah ditetapkan', null, '/profile');
end;
$$;

-- ---------------------------------------------------------------------------
-- Rank / position promotions (usulan, persetujuan, SK)
-- ---------------------------------------------------------------------------
create table public.promotion_proposals (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  promotion_type public.promotion_type not null,
  current_rank_grade text,
  proposed_rank_grade text,
  current_position_id uuid references public.positions (id) on delete set null,
  proposed_position_id uuid references public.positions (id) on delete set null,
  effective_date date,
  reason text,
  status public.proposal_status not null default 'proposed',
  proposed_by uuid references auth.users (id) on delete set null,
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  decision_note text,
  decree_number text,
  decree_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (promotion_type = 'rank' and proposed_rank_grade is not null)
    or (promotion_type = 'position' and proposed_position_id is not null)
  )
);

create trigger set_updated_at before update on public.trainings for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.training_registrations for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.mutations for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.promotion_proposals for each row execute function public.set_updated_at();
create trigger audit_row_change after insert or update or delete on public.training_registrations for each row execute function public.audit_row_change();
create trigger audit_row_change after insert or update or delete on public.mutations for each row execute function public.audit_row_change();
create trigger audit_row_change after insert or update or delete on public.promotion_proposals for each row execute function public.audit_row_change();

alter table public.trainings enable row level security;
alter table public.training_registrations enable row level security;
alter table public.mutations enable row level security;
alter table public.promotion_proposals enable row level security;

create policy "training read" on public.trainings for select to authenticated using (true);
create policy "training manage" on public.trainings for all to authenticated using (public.has_permission('training.manage')) with check (public.has_permission('training.manage'));

create policy "registration read" on public.training_registrations for select to authenticated
  using (public.can_view_employee(employee_id, 'training.manage'));
create policy "registration apply" on public.training_registrations for insert to authenticated
  with check (
    employee_id = public.current_employee_id()
    and status = 'pending'
    and exists (
      select 1 from public.trainings t
      where t.id = training_id
        and t.status = 'open'
        and (t.registration_opens_at is null or t.registration_opens_at <= now())
        and (t.registration_closes_at is null or t.registration_closes_at >= now())
    )
  );
create policy "registration manage" on public.training_registrations for all to authenticated
  using (public.has_permission('training.manage')) with check (public.has_permission('training.manage'));

-- Supervisors and HR may propose mutations; only HR approves/executes.
create policy "mutation read" on public.mutations for select to authenticated using (public.can_view_employee(employee_id, 'mutation.manage'));
create policy "mutation propose" on public.mutations for insert to authenticated
  with check (status = 'proposed' and (public.is_supervisor_of(employee_id) or public.has_permission('mutation.manage')));
create policy "mutation manage" on public.mutations for update to authenticated
  using (public.has_permission('mutation.manage')) with check (public.has_permission('mutation.manage'));

create policy "promotion read" on public.promotion_proposals for select to authenticated using (public.can_view_employee(employee_id, 'promotion.manage'));
create policy "promotion propose" on public.promotion_proposals for insert to authenticated
  with check (status = 'proposed' and (public.is_supervisor_of(employee_id) or public.has_permission('promotion.manage')));
create policy "promotion manage" on public.promotion_proposals for update to authenticated
  using (public.has_permission('promotion.manage')) with check (public.has_permission('promotion.manage'));
