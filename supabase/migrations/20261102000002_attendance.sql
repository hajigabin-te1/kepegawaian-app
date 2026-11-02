-- =============================================================================
-- Attendance (presensi): schedules, GPS locations, daily records, corrections, recap.
-- =============================================================================

create type public.attendance_status as enum ('present', 'late', 'early_leave', 'late_and_early_leave', 'absent', 'on_leave', 'on_permit');
create type public.attendance_source as enum ('fingerprint', 'rfid', 'gps', 'web', 'manual');

-- Working hours used to classify late / early leave. Values are configured by HR, not hardcoded.
create table public.work_schedules (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  check_in_time time not null,
  check_out_time time not null,
  late_tolerance_minutes smallint not null default 0 check (late_tolerance_minutes >= 0),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out_time > check_in_time)
);
create unique index work_schedules_single_default_idx on public.work_schedules (is_default) where is_default;

-- Allowed GPS areas for web/GPS attendance ("Lokasi GPS untuk presensi ditentukan").
create table public.attendance_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latitude numeric(9, 6) not null check (latitude between -90 and 90),
  longitude numeric(9, 6) not null check (longitude between -180 and 180),
  radius_meters integer not null check (radius_meters > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  attendance_date date not null,
  check_in_at timestamptz,
  check_out_at timestamptz,
  status public.attendance_status not null,
  source public.attendance_source not null,
  check_in_latitude numeric(9, 6),
  check_in_longitude numeric(9, 6),
  check_out_latitude numeric(9, 6),
  check_out_longitude numeric(9, 6),
  note text,                            -- keterangan
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, attendance_date),
  check (check_out_at is null or check_in_at is null or check_out_at >= check_in_at)
);
create index attendance_records_date_idx on public.attendance_records (attendance_date);

-- HR corrects attendance with a reason; the employee's supervisor approves.
create table public.attendance_corrections (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  attendance_record_id uuid references public.attendance_records (id) on delete set null,
  attendance_date date not null,
  proposed_check_in_at timestamptz,
  proposed_check_out_at timestamptz,
  proposed_status public.attendance_status not null,
  reason text not null,
  status public.request_status not null default 'pending',
  requested_by uuid references auth.users (id) on delete set null,
  decided_by uuid references public.employees (id) on delete set null,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Supervisor (or HR with attendance.approve_all) approves/rejects a correction; approval applies it.
create or replace function public.decide_attendance_correction(correction_id uuid, approve boolean, note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  correction public.attendance_corrections;
begin
  select * into correction from public.attendance_corrections where id = correction_id for update;
  if correction.id is null then
    raise exception 'Attendance correction not found';
  end if;
  if correction.status <> 'pending' then
    raise exception 'Attendance correction has already been decided';
  end if;
  if not (public.is_supervisor_of(correction.employee_id) or public.has_permission('attendance.approve_all')) then
    raise exception 'Not allowed to decide this attendance correction';
  end if;

  update public.attendance_corrections
  set status = case when approve then 'approved'::public.request_status else 'rejected'::public.request_status end,
      decided_by = public.current_employee_id(),
      decided_at = now(),
      decision_note = note
  where id = correction_id;

  if approve then
    insert into public.attendance_records (employee_id, attendance_date, check_in_at, check_out_at, status, source, note)
    values (correction.employee_id, correction.attendance_date, correction.proposed_check_in_at,
            correction.proposed_check_out_at, correction.proposed_status, 'manual', correction.reason)
    on conflict (employee_id, attendance_date) do update
      set check_in_at = excluded.check_in_at,
          check_out_at = excluded.check_out_at,
          status = excluded.status,
          source = 'manual',
          note = excluded.note;
  end if;
end;
$$;

-- Monthly recap per employee (rekap absensi bulanan). Weekly/daily recaps can filter attendance_records directly.
create or replace view public.attendance_monthly_summary
with (security_invoker = true)
as
select
  r.employee_id,
  e.work_unit_id,
  date_trunc('month', r.attendance_date)::date as month,
  count(*) filter (where r.status in ('present', 'late', 'early_leave', 'late_and_early_leave')) as days_present,
  count(*) filter (where r.status in ('late', 'late_and_early_leave')) as days_late,
  count(*) filter (where r.status in ('early_leave', 'late_and_early_leave')) as days_early_leave,
  count(*) filter (where r.status = 'absent') as days_absent,
  count(*) filter (where r.status = 'on_leave') as days_on_leave,
  count(*) filter (where r.status = 'on_permit') as days_on_permit
from public.attendance_records r
join public.employees e on e.id = r.employee_id
group by r.employee_id, e.work_unit_id, date_trunc('month', r.attendance_date);

create trigger set_updated_at before update on public.work_schedules for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.attendance_locations for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.attendance_records for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.attendance_corrections for each row execute function public.set_updated_at();
create trigger audit_row_change after insert or update or delete on public.attendance_corrections for each row execute function public.audit_row_change();
create trigger audit_row_change after update or delete on public.attendance_records for each row execute function public.audit_row_change();

alter table public.work_schedules enable row level security;
alter table public.attendance_locations enable row level security;
alter table public.attendance_records enable row level security;
alter table public.attendance_corrections enable row level security;

create policy "schedule read" on public.work_schedules for select to authenticated using (true);
create policy "schedule manage" on public.work_schedules for all to authenticated using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));
create policy "location read" on public.attendance_locations for select to authenticated using (true);
create policy "location manage" on public.attendance_locations for all to authenticated using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));

-- Records: employees see their own; supervisors their subordinates; HR everything.
-- Employees may create their own record for today (web/GPS check-in) and complete it (check-out) the same day.
-- Location/time validation for self check-in must happen server-side (Edge Function) before go-live.
create policy "attendance read" on public.attendance_records for select to authenticated
  using (public.can_view_employee(employee_id, 'attendance.view'));
create policy "attendance self check-in" on public.attendance_records for insert to authenticated
  with check (employee_id = public.current_employee_id() and attendance_date = current_date and source in ('web', 'gps'));
create policy "attendance self check-out" on public.attendance_records for update to authenticated
  using (employee_id = public.current_employee_id() and attendance_date = current_date)
  with check (employee_id = public.current_employee_id() and attendance_date = current_date and source in ('web', 'gps'));
create policy "attendance manage" on public.attendance_records for all to authenticated
  using (public.has_permission('attendance.manage')) with check (public.has_permission('attendance.manage'));

create policy "correction read" on public.attendance_corrections for select to authenticated
  using (public.can_view_employee(employee_id, 'attendance.manage'));
create policy "correction request" on public.attendance_corrections for insert to authenticated
  with check (public.has_permission('attendance.manage') and status = 'pending');
