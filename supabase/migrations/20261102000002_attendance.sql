-- =============================================================================
-- Attendance (presensi): GPS check-in/out within an allowed radius, HR corrections, recaps.
-- Employees never write attendance rows directly; they call check_in()/check_out(),
-- which validate the location and classify late / early leave on the server.
-- =============================================================================

create type public.attendance_status as enum ('present', 'late', 'early_leave', 'late_and_early_leave', 'absent', 'on_leave', 'on_permit');
create type public.attendance_source as enum ('gps', 'manual');

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

-- Attendance points. Check-in is accepted within radius_meters of a point (default 100 m).
create table public.attendance_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latitude numeric(9, 6) not null check (latitude between -90 and 90),
  longitude numeric(9, 6) not null check (longitude between -180 and 180),
  radius_meters integer not null default 100 check (radius_meters > 0),
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
  attendance_location_id uuid references public.attendance_locations (id) on delete set null,
  check_in_latitude numeric(9, 6),
  check_in_longitude numeric(9, 6),
  check_in_accuracy_meters numeric(7, 1),
  check_out_latitude numeric(9, 6),
  check_out_longitude numeric(9, 6),
  check_out_accuracy_meters numeric(7, 1),
  note text,                            -- keterangan
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, attendance_date),
  check (check_out_at is null or check_in_at is null or check_out_at >= check_in_at)
);
create index attendance_records_date_idx on public.attendance_records (attendance_date);

-- Log of HR corrections (koreksi absensi). Applied immediately by correct_attendance().
create table public.attendance_corrections (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  attendance_date date not null,
  previous_data jsonb,                  -- record before the correction, null if there was none
  check_in_at timestamptz,
  check_out_at timestamptz,
  status public.attendance_status not null,
  reason text not null,
  corrected_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
-- Campus time zone (Amuntai = WITA). Stored in app_settings so it is configurable.
create or replace function public.app_timezone()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select value #>> '{}' from public.app_settings where key = 'timezone'), 'Asia/Makassar')
$$;

-- Great-circle distance in meters (haversine).
create or replace function public.distance_meters(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
returns double precision
language sql
immutable
set search_path = ''
as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians((lat2 - lat1)::double precision) / 2), 2)
    + cos(radians(lat1::double precision)) * cos(radians(lat2::double precision))
      * power(sin(radians((lon2 - lon1)::double precision) / 2), 2)
  ))
$$;

-- Nearest active attendance point that contains the coordinate, or null when outside every radius.
create or replace function public.find_attendance_location(lat numeric, lon numeric)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select l.id
  from public.attendance_locations l
  where l.is_active and public.distance_meters(lat, lon, l.latitude, l.longitude) <= l.radius_meters
  order by public.distance_meters(lat, lon, l.latitude, l.longitude)
  limit 1
$$;

-- ---------------------------------------------------------------------------
-- Self-service check-in / check-out
-- ---------------------------------------------------------------------------
create or replace function public.check_in(lat numeric, lon numeric, accuracy_meters numeric default null)
returns public.attendance_records
language plpgsql
security definer
set search_path = ''
as $$
declare
  employee uuid := public.current_employee_id();
  location_id uuid;
  local_now timestamp := now() at time zone public.app_timezone();
  schedule public.work_schedules;
  new_status public.attendance_status := 'present';
  record public.attendance_records;
begin
  if employee is null then
    raise exception 'No employee linked to this account';
  end if;
  if not exists (select 1 from public.employees where id = employee and active_status = 'active') then
    raise exception 'Employee is not active';
  end if;

  location_id := public.find_attendance_location(lat, lon);
  if location_id is null then
    raise exception 'Outside the attendance area';
  end if;

  if exists (select 1 from public.attendance_records where employee_id = employee and attendance_date = local_now::date) then
    raise exception 'Already checked in today';
  end if;

  select * into schedule from public.work_schedules where is_default;
  if schedule.id is not null
     and local_now::time > schedule.check_in_time + make_interval(mins => schedule.late_tolerance_minutes) then
    new_status := 'late';
  end if;

  insert into public.attendance_records (
    employee_id, attendance_date, check_in_at, status, source, attendance_location_id,
    check_in_latitude, check_in_longitude, check_in_accuracy_meters
  )
  values (employee, local_now::date, now(), new_status, 'gps', location_id, lat, lon, accuracy_meters)
  returning * into record;

  return record;
end;
$$;

create or replace function public.check_out(lat numeric, lon numeric, accuracy_meters numeric default null)
returns public.attendance_records
language plpgsql
security definer
set search_path = ''
as $$
declare
  employee uuid := public.current_employee_id();
  local_now timestamp := now() at time zone public.app_timezone();
  schedule public.work_schedules;
  record public.attendance_records;
  new_status public.attendance_status;
begin
  if employee is null then
    raise exception 'No employee linked to this account';
  end if;
  if public.find_attendance_location(lat, lon) is null then
    raise exception 'Outside the attendance area';
  end if;

  select * into record
  from public.attendance_records
  where employee_id = employee and attendance_date = local_now::date
  for update;
  if record.id is null or record.check_in_at is null then
    raise exception 'No check-in recorded today';
  end if;
  if record.check_out_at is not null then
    raise exception 'Already checked out today';
  end if;

  new_status := record.status;
  select * into schedule from public.work_schedules where is_default;
  if schedule.id is not null and local_now::time < schedule.check_out_time then
    new_status := case when record.status = 'late' then 'late_and_early_leave'::public.attendance_status
                       else 'early_leave'::public.attendance_status end;
  end if;

  update public.attendance_records
  set check_out_at = now(),
      status = new_status,
      check_out_latitude = lat,
      check_out_longitude = lon,
      check_out_accuracy_meters = accuracy_meters
  where id = record.id
  returning * into record;

  return record;
end;
$$;

-- ---------------------------------------------------------------------------
-- HR correction (koreksi absensi) — applied immediately and logged
-- ---------------------------------------------------------------------------
create or replace function public.correct_attendance(
  target_employee_id uuid,
  target_date date,
  corrected_check_in_at timestamptz,
  corrected_check_out_at timestamptz,
  corrected_status public.attendance_status,
  correction_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous public.attendance_records;
begin
  if not public.has_permission('attendance.manage') then
    raise exception 'Not allowed to correct attendance';
  end if;
  if coalesce(trim(correction_reason), '') = '' then
    raise exception 'A reason is required';
  end if;

  select * into previous from public.attendance_records
  where employee_id = target_employee_id and attendance_date = target_date
  for update;

  insert into public.attendance_corrections (employee_id, attendance_date, previous_data, check_in_at, check_out_at, status, reason, corrected_by)
  values (target_employee_id, target_date, case when previous.id is null then null else to_jsonb(previous) end,
          corrected_check_in_at, corrected_check_out_at, corrected_status, correction_reason, auth.uid());

  insert into public.attendance_records (employee_id, attendance_date, check_in_at, check_out_at, status, source, note)
  values (target_employee_id, target_date, corrected_check_in_at, corrected_check_out_at, corrected_status, 'manual', correction_reason)
  on conflict (employee_id, attendance_date) do update
    set check_in_at = excluded.check_in_at,
        check_out_at = excluded.check_out_at,
        status = excluded.status,
        source = 'manual',
        note = excluded.note;

  perform public.notify_employee(target_employee_id, 'Data presensi dikoreksi',
    to_char(target_date, 'DD-MM-YYYY') || ': ' || correction_reason, '/attendance');
end;
$$;

-- ---------------------------------------------------------------------------
-- Recaps
-- ---------------------------------------------------------------------------
-- Per employee per month (HR sees all, employees see their own through RLS).
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

-- Aggregated per work unit and category for the leaders' statistics dashboard (no individual rows),
-- limited to the caller's report_scopes (HR with attendance.view sees everything).
create or replace function public.report_attendance_by_unit(target_month date)
returns table (
  work_unit_id uuid,
  work_unit_name text,
  category public.employee_category,
  employees_recorded bigint,
  days_present bigint,
  days_late bigint,
  days_early_leave bigint,
  days_absent bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_report_access('attendance') then
    raise exception 'Not allowed to view attendance reports';
  end if;
  return query
  with scoped as materialized (
    select e.id, e.category, e.work_unit_id
    from public.employees e
    where public.can_report_on('attendance', e.work_unit_id, e.category)
  )
  select w.id, w.name, e.category,
         count(distinct r.employee_id),
         count(*) filter (where r.status in ('present', 'late', 'early_leave', 'late_and_early_leave')),
         count(*) filter (where r.status in ('late', 'late_and_early_leave')),
         count(*) filter (where r.status in ('early_leave', 'late_and_early_leave')),
         count(*) filter (where r.status = 'absent')
  from public.attendance_records r
  join scoped e on e.id = r.employee_id
  left join public.work_units w on w.id = e.work_unit_id
  where r.attendance_date >= date_trunc('month', target_month)::date
    and r.attendance_date < (date_trunc('month', target_month) + interval '1 month')::date
  group by w.id, w.name, e.category;
end;
$$;

create trigger set_updated_at before update on public.work_schedules for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.attendance_locations for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.attendance_records for each row execute function public.set_updated_at();
create trigger audit_row_change after update or delete on public.attendance_records for each row execute function public.audit_row_change();
create trigger audit_row_change after insert on public.attendance_corrections for each row execute function public.audit_row_change();
create trigger audit_row_change after insert or update or delete on public.attendance_locations for each row execute function public.audit_row_change();

alter table public.work_schedules enable row level security;
alter table public.attendance_locations enable row level security;
alter table public.attendance_records enable row level security;
alter table public.attendance_corrections enable row level security;

create policy "schedule read" on public.work_schedules for select to authenticated using (true);
create policy "schedule manage" on public.work_schedules for all to authenticated using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));
create policy "location read" on public.attendance_locations for select to authenticated using (true);
create policy "location manage" on public.attendance_locations for all to authenticated using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));

-- No insert/update policy for employees: writes go through check_in(), check_out(), correct_attendance().
create policy "attendance read" on public.attendance_records for select to authenticated
  using (public.can_view_employee(employee_id, 'attendance.view'));
create policy "attendance manage" on public.attendance_records for all to authenticated
  using (public.has_permission('attendance.manage')) with check (public.has_permission('attendance.manage'));

create policy "correction read" on public.attendance_corrections for select to authenticated
  using (public.can_view_employee(employee_id, 'attendance.manage'));
