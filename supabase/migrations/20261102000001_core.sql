-- =============================================================================
-- Core schema: organization, employees, accounts, RBAC, audit log, histories.
-- Source: docs/requirements.md (Analisa Kebutuhan + Use Case/Activity Diagram).
-- Table/column names are English; the Indonesian mapping is in docs/database-schema.md.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.employee_category as enum ('lecturer', 'staff');
create type public.gender as enum ('male', 'female');
create type public.marital_status as enum ('single', 'married', 'divorced', 'widowed');
create type public.employee_active_status as enum ('active', 'inactive', 'retired');
create type public.work_unit_type as enum ('faculty', 'study_program', 'bureau', 'section', 'technical_unit', 'other');
create type public.request_status as enum ('pending', 'approved', 'rejected', 'cancelled');

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at current
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Master data
-- ---------------------------------------------------------------------------
create table public.work_units (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit_type public.work_unit_type not null default 'other',
  parent_id uuid references public.work_units (id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_id, name)
);
comment on table public.work_units is 'Unit kerja (fakultas, prodi, bagian, UPT). parent_id = induk unit.';

create table public.positions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  position_type text,
  level smallint,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.positions is 'Jabatan. position_type = jenis (struktural/fungsional/pelaksana), level = tingkat.';

create table public.employment_statuses (
  code text primary key,
  name text not null
);
comment on table public.employment_statuses is 'Status kepegawaian (PNS, PPPK, TTU, TTK, dll.).';

-- ---------------------------------------------------------------------------
-- Employees
-- ---------------------------------------------------------------------------
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_number text unique,          -- NIP
  lecturer_number text unique,          -- NIDN (dosen)
  national_id_number text unique,       -- NIK
  full_name text not null,
  birth_place text,
  birth_date date,
  gender public.gender,
  religion text,
  marital_status public.marital_status,
  address text,
  city text,
  province text,
  postal_code text,
  phone text,
  email text,
  photo_path text,                      -- Supabase Storage path (bucket employee-photos)
  category public.employee_category not null,
  employment_status_code text references public.employment_statuses (code) on delete restrict,
  appointment_date date,
  work_unit_id uuid references public.work_units (id) on delete restrict,
  position_id uuid references public.positions (id) on delete restrict,
  rank_grade text,                      -- golongan
  service_years smallint check (service_years >= 0),
  service_months smallint check (service_months between 0 and 11),
  supervisor_id uuid references public.employees (id) on delete set null,  -- atasan langsung
  active_status public.employee_active_status not null default 'active',
  deactivation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (supervisor_id is distinct from id)
);
comment on table public.employees is 'Data pokok + data kepegawaian dosen dan tenaga kependidikan.';
comment on column public.employees.supervisor_id is 'Atasan langsung (Kaprodi/Kabag/Manajer Unit) yang menyetujui cuti, diklat, dan menilai kinerja.';

create index employees_work_unit_idx on public.employees (work_unit_id);
create index employees_supervisor_idx on public.employees (supervisor_id);
create index employees_active_status_idx on public.employees (active_status);

-- ---------------------------------------------------------------------------
-- Roles, permissions, accounts
-- ---------------------------------------------------------------------------
create table public.roles (
  id smallint generated always as identity primary key,
  code text not null unique,
  name text not null
);

create table public.permissions (
  id smallint generated always as identity primary key,
  code text not null unique,            -- e.g. leave.create, employee.manage, report.view
  description text
);

create table public.role_permissions (
  role_id smallint not null references public.roles (id) on delete cascade,
  permission_id smallint not null references public.permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

-- One row per Supabase Auth user. Passwords live in auth.users (hashed by Supabase), never here.
create table public.user_accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  employee_id uuid unique references public.employees (id) on delete set null,  -- null for pure admins
  username text not null unique,
  role_id smallint not null references public.roles (id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS helper functions (security definer so they can read RBAC tables under RLS)
-- ---------------------------------------------------------------------------
create or replace function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select ua.employee_id
  from public.user_accounts ua
  where ua.id = auth.uid() and ua.is_active
$$;

create or replace function public.has_permission(permission_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_accounts ua
    join public.role_permissions rp on rp.role_id = ua.role_id
    join public.permissions p on p.id = rp.permission_id
    where ua.id = auth.uid() and ua.is_active and p.code = permission_code
  )
$$;

create or replace function public.is_supervisor_of(target_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.employees e
    where e.id = target_employee_id
      and e.supervisor_id is not null
      and e.supervisor_id = public.current_employee_id()
  )
$$;

-- Own data, a direct subordinate's data, or anyone's with the given permission.
create or replace function public.can_view_employee(target_employee_id uuid, permission_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_employee_id = public.current_employee_id()
      or public.is_supervisor_of(target_employee_id)
      or public.has_permission(permission_code)
$$;

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  action text not null,                 -- login, insert, update, delete, ...
  entity text not null,                 -- table name
  entity_id text,
  change_description text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_entity_idx on public.audit_logs (entity, entity_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_id text;
begin
  row_id := case when tg_op = 'DELETE' then to_jsonb(old) ->> 'id' else to_jsonb(new) ->> 'id' end;
  insert into public.audit_logs (user_id, action, entity, entity_id, old_data, new_data)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    row_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

-- Lets the app record events that are not row changes (e.g. login).
create or replace function public.log_audit_event(event_action text, event_entity text, event_entity_id text default null, description text default null)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_logs (user_id, action, entity, entity_id, change_description)
  select auth.uid(), event_action, event_entity, event_entity_id, description
  where auth.uid() is not null
$$;

-- ---------------------------------------------------------------------------
-- Employee histories and documents
-- ---------------------------------------------------------------------------
create table public.education_histories (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  education_level text not null,        -- jenjang (SMA, D3, S1, S2, S3, ...)
  institution text not null,
  major text,
  graduation_year smallint,
  certificate_path text,                -- ijazah (Storage path)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.training_histories (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  training_name text not null,
  organizer text,
  start_date date,
  end_date date,
  certificate_path text,
  training_id uuid,                     -- set when it comes from an internal training (FK added in training migration)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.position_histories (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  position_id uuid references public.positions (id) on delete set null,
  work_unit_id uuid references public.work_units (id) on delete set null,
  start_date date not null,
  end_date date,
  decree_number text,                   -- nomor SK
  decree_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rank_histories (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  rank_grade text not null,             -- pangkat/golongan
  effective_date date not null,
  decree_number text,
  decree_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.disciplinary_histories (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  sanction_type text not null,
  description text,
  effective_date date not null,
  decree_number text,
  decree_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.award_histories (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  award_name text not null,
  awarded_by text,
  award_date date,
  certificate_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  document_type text not null,          -- SK, ijazah, sertifikat, ...
  title text not null,
  file_path text not null,              -- Storage path (bucket employee-documents)
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- "Ajukan perbaikan data": employee proposes corrections, HR reviews.
create table public.profile_change_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  requested_changes jsonb not null,     -- { "field": "new value", ... }
  reason text not null,
  status public.request_status not null default 'pending',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Notifications and system settings (used by later modules)
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications (recipient_user_id, read_at);

-- Sends a notification to an employee's account, if the employee has one.
create or replace function public.notify_employee(target_employee_id uuid, notification_title text, notification_body text, notification_link text default null)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (recipient_user_id, title, body, link)
  select ua.id, notification_title, notification_body, notification_link
  from public.user_accounts ua
  where ua.employee_id = target_employee_id and ua.is_active
$$;

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);
comment on table public.app_settings is 'Konfigurasi parameter sistem (aturan absen, periode penilaian, dll.).';

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create trigger set_updated_at before update on public.work_units for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.positions for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.employees for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.user_accounts for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.education_histories for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.training_histories for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.position_histories for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.rank_histories for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.disciplinary_histories for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.award_histories for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.profile_change_requests for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_settings for each row execute function public.set_updated_at();

create trigger audit_row_change after insert or update or delete on public.employees for each row execute function public.audit_row_change();
create trigger audit_row_change after insert or update or delete on public.user_accounts for each row execute function public.audit_row_change();
create trigger audit_row_change after insert or update or delete on public.role_permissions for each row execute function public.audit_row_change();
create trigger audit_row_change after insert or update or delete on public.profile_change_requests for each row execute function public.audit_row_change();
create trigger audit_row_change after insert or update or delete on public.employee_documents for each row execute function public.audit_row_change();
create trigger audit_row_change after insert or update or delete on public.app_settings for each row execute function public.audit_row_change();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.work_units enable row level security;
alter table public.positions enable row level security;
alter table public.employment_statuses enable row level security;
alter table public.employees enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_accounts enable row level security;
alter table public.audit_logs enable row level security;
alter table public.education_histories enable row level security;
alter table public.training_histories enable row level security;
alter table public.position_histories enable row level security;
alter table public.rank_histories enable row level security;
alter table public.disciplinary_histories enable row level security;
alter table public.award_histories enable row level security;
alter table public.employee_documents enable row level security;
alter table public.profile_change_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.app_settings enable row level security;

-- Master data: readable by any signed-in user, managed by HR.
create policy "master read" on public.work_units for select to authenticated using (true);
create policy "master manage" on public.work_units for all to authenticated using (public.has_permission('master.manage')) with check (public.has_permission('master.manage'));
create policy "master read" on public.positions for select to authenticated using (true);
create policy "master manage" on public.positions for all to authenticated using (public.has_permission('master.manage')) with check (public.has_permission('master.manage'));
create policy "master read" on public.employment_statuses for select to authenticated using (true);
create policy "master manage" on public.employment_statuses for all to authenticated using (public.has_permission('master.manage')) with check (public.has_permission('master.manage'));

-- Employees: own data, subordinates, or employee.view; changes by employee.manage. No hard delete (deactivate instead).
create policy "employee read" on public.employees for select to authenticated using (public.can_view_employee(id, 'employee.view'));
create policy "employee insert" on public.employees for insert to authenticated with check (public.has_permission('employee.manage'));
create policy "employee update" on public.employees for update to authenticated using (public.has_permission('employee.manage')) with check (public.has_permission('employee.manage'));

-- RBAC: readable by signed-in users (the app needs to know its own role), managed by superadmin.
create policy "rbac read" on public.roles for select to authenticated using (true);
create policy "rbac manage" on public.roles for all to authenticated using (public.has_permission('role.manage')) with check (public.has_permission('role.manage'));
create policy "rbac read" on public.permissions for select to authenticated using (true);
create policy "rbac manage" on public.permissions for all to authenticated using (public.has_permission('role.manage')) with check (public.has_permission('role.manage'));
create policy "rbac read" on public.role_permissions for select to authenticated using (true);
create policy "rbac manage" on public.role_permissions for all to authenticated using (public.has_permission('role.manage')) with check (public.has_permission('role.manage'));

create policy "account read" on public.user_accounts for select to authenticated using (id = auth.uid() or public.has_permission('user.manage'));
create policy "account manage" on public.user_accounts for all to authenticated using (public.has_permission('user.manage')) with check (public.has_permission('user.manage'));

create policy "audit read" on public.audit_logs for select to authenticated using (public.has_permission('audit.view'));

-- Histories and documents: same visibility as the employee, managed by HR.
create policy "history read" on public.education_histories for select to authenticated using (public.can_view_employee(employee_id, 'employee.view'));
create policy "history manage" on public.education_histories for all to authenticated using (public.has_permission('employee.manage')) with check (public.has_permission('employee.manage'));
create policy "history read" on public.training_histories for select to authenticated using (public.can_view_employee(employee_id, 'employee.view'));
create policy "history manage" on public.training_histories for all to authenticated using (public.has_permission('employee.manage')) with check (public.has_permission('employee.manage'));
create policy "history read" on public.position_histories for select to authenticated using (public.can_view_employee(employee_id, 'employee.view'));
create policy "history manage" on public.position_histories for all to authenticated using (public.has_permission('employee.manage')) with check (public.has_permission('employee.manage'));
create policy "history read" on public.rank_histories for select to authenticated using (public.can_view_employee(employee_id, 'employee.view'));
create policy "history manage" on public.rank_histories for all to authenticated using (public.has_permission('employee.manage')) with check (public.has_permission('employee.manage'));
create policy "history read" on public.disciplinary_histories for select to authenticated using (public.can_view_employee(employee_id, 'employee.view'));
create policy "history manage" on public.disciplinary_histories for all to authenticated using (public.has_permission('employee.manage')) with check (public.has_permission('employee.manage'));
create policy "history read" on public.award_histories for select to authenticated using (public.can_view_employee(employee_id, 'employee.view'));
create policy "history manage" on public.award_histories for all to authenticated using (public.has_permission('employee.manage')) with check (public.has_permission('employee.manage'));
create policy "document read" on public.employee_documents for select to authenticated using (public.can_view_employee(employee_id, 'employee.view'));
create policy "document manage" on public.employee_documents for all to authenticated using (public.has_permission('employee.manage')) with check (public.has_permission('employee.manage'));

-- Profile change requests: employees submit their own; HR reviews.
create policy "change request read" on public.profile_change_requests for select to authenticated
  using (employee_id = public.current_employee_id() or public.has_permission('employee.manage'));
create policy "change request submit" on public.profile_change_requests for insert to authenticated
  with check (employee_id = public.current_employee_id() and status = 'pending');
create policy "change request review" on public.profile_change_requests for update to authenticated
  using (public.has_permission('employee.manage')) with check (public.has_permission('employee.manage'));

create policy "notification read own" on public.notifications for select to authenticated using (recipient_user_id = auth.uid());
create policy "notification mark read" on public.notifications for update to authenticated using (recipient_user_id = auth.uid()) with check (recipient_user_id = auth.uid());

create policy "settings read" on public.app_settings for select to authenticated using (true);
create policy "settings manage" on public.app_settings for all to authenticated using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));
