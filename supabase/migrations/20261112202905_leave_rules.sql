-- Leave rules confirmed by the HR head (Nov 2026):
--  * General leave quota is 12 days per employee per year (configurable in app_settings).
--  * Sundays and national holidays (tanggal merah) are not counted as leave days; Saturdays are.
--  * Maternity leave (female employees, up to 3 months) and long-term sick leave (several weeks)
--    are outside the general quota.
-- Requests are created and cancelled through RPCs so the day count and the rules are enforced on the server.

-- ---------------------------------------------------------------------------
-- National holidays (maintained by HR)
-- ---------------------------------------------------------------------------
create table public.public_holidays (
  holiday_date date primary key,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.public_holidays enable row level security;
create policy "holiday read" on public.public_holidays for select to authenticated using (true);
create policy "holiday manage" on public.public_holidays for all to authenticated
  using (public.has_permission('leave.manage')) with check (public.has_permission('leave.manage'));
create trigger audit_row_change after insert or update or delete on public.public_holidays
  for each row execute function public.audit_row_change();

-- ---------------------------------------------------------------------------
-- Leave type rules and the general quota setting
-- ---------------------------------------------------------------------------
alter table public.leave_types
  add column counts_toward_quota boolean not null default true,   -- deducts from the general yearly quota
  add column female_only boolean not null default false,
  add column max_months smallint check (max_months > 0);          -- longest allowed span of one request

update public.leave_types set counts_toward_quota = false where category = 'permit';
update public.leave_types set counts_toward_quota = false, female_only = true, max_months = 3 where code = 'maternity';

insert into public.leave_types (code, name, category, counts_toward_quota)
values ('long_sick', 'Sakit Berkepanjangan', 'leave', false)
on conflict (code) do nothing;

insert into public.app_settings (key, value, description)
values ('annual_leave_quota', '12', 'Kuota cuti umum per pegawai per tahun (hari kerja)')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Day counting and balance
-- ---------------------------------------------------------------------------
-- Days between two dates (inclusive) that are neither Sunday nor a national holiday.
create or replace function public.count_leave_days(from_date date, to_date date)
returns numeric
language sql
stable
set search_path = ''
as $$
  select count(*)::numeric
  from generate_series(from_date::timestamp, to_date::timestamp, interval '1 day') as d
  where extract(isodow from d) <> 7
    and not exists (select 1 from public.public_holidays h where h.holiday_date = d::date)
$$;

-- The part of a request that falls inside one calendar year (requests may span New Year).
create or replace function public.leave_days_in_year(from_date date, to_date date, target_year integer)
returns numeric
language sql
stable
set search_path = ''
as $$
  select case
    when greatest(from_date, make_date(target_year, 1, 1)) > least(to_date, make_date(target_year, 12, 31)) then 0
    else public.count_leave_days(greatest(from_date, make_date(target_year, 1, 1)), least(to_date, make_date(target_year, 12, 31)))
  end
$$;

-- General quota usage for one employee and year. Used = approved, pending = waiting for HR.
-- A row in leave_balances for the 'annual' type overrides the default quota for that employee and year.
create or replace function public.get_leave_balance(target_employee_id uuid, target_year integer)
returns table (quota numeric, used numeric, pending numeric, remaining numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  default_quota numeric;
  override_quota numeric;
  total_quota numeric;
  used_days numeric;
  pending_days numeric;
begin
  if not public.can_view_employee(target_employee_id, 'leave.view') then
    raise exception 'Not allowed to view this leave balance';
  end if;

  select coalesce((select (s.value #>> '{}')::numeric from public.app_settings s where s.key = 'annual_leave_quota'), 12)
  into default_quota;

  select b.quota_days into override_quota
  from public.leave_balances b
  join public.leave_types t on t.id = b.leave_type_id
  where b.employee_id = target_employee_id and b.year = target_year and t.code = 'annual';
  total_quota := coalesce(override_quota, default_quota);

  select coalesce(sum(public.leave_days_in_year(r.start_date, r.end_date, target_year)) filter (where r.status = 'approved'), 0),
         coalesce(sum(public.leave_days_in_year(r.start_date, r.end_date, target_year)) filter (where r.status = 'pending'), 0)
  into used_days, pending_days
  from public.leave_requests r
  join public.leave_types t on t.id = r.leave_type_id
  where r.employee_id = target_employee_id
    and r.status in ('approved', 'pending')
    and t.category = 'leave' and t.counts_toward_quota;

  return query select total_quota, used_days, pending_days, total_quota - used_days - pending_days;
end;
$$;

-- ---------------------------------------------------------------------------
-- Submit / cancel
-- ---------------------------------------------------------------------------
create or replace function public.submit_leave_request(
  request_type_id uuid,
  request_start date,
  request_end date,
  request_reason text,
  attachment_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  employee uuid := public.current_employee_id();
  employee_gender public.gender;
  leave_type public.leave_types;
  days numeric;
  year_number integer;
  remaining_days numeric;
  new_id uuid;
begin
  if employee is null then
    raise exception 'No employee linked to this account';
  end if;
  select e.gender into employee_gender from public.employees e where e.id = employee and e.active_status = 'active';
  if not found then
    raise exception 'Employee is not active';
  end if;

  select * into leave_type from public.leave_types t where t.id = request_type_id and t.is_active;
  if leave_type.id is null then
    raise exception 'Unknown leave type';
  end if;
  if request_end < request_start then
    raise exception 'End date is before start date';
  end if;
  if coalesce(trim(request_reason), '') = '' then
    raise exception 'A reason is required';
  end if;

  if leave_type.female_only and employee_gender is distinct from 'female' then
    raise exception 'This leave type is only for female employees';
  end if;
  if leave_type.max_months is not null
     and request_end > (request_start + make_interval(months => leave_type.max_months))::date - 1 then
    raise exception 'Exceeds the maximum duration of this leave type';
  end if;

  if leave_type.code = 'half_day_permit' then
    if request_end <> request_start then
      raise exception 'A half-day permit must be a single day';
    end if;
    days := case when public.count_leave_days(request_start, request_start) = 1 then 0.5 else 0 end;
  else
    days := public.count_leave_days(request_start, request_end);
  end if;
  if days <= 0 then
    raise exception 'The selected dates contain no working days';
  end if;

  if leave_type.requires_document and attachment_path is null then
    raise exception 'A supporting document is required';
  end if;
  if attachment_path is not null and split_part(attachment_path, '/', 1) <> employee::text then
    raise exception 'Invalid attachment';
  end if;

  if exists (
    select 1 from public.leave_requests r
    where r.employee_id = employee and r.status in ('pending', 'approved')
      and r.start_date <= request_end and r.end_date >= request_start
  ) then
    raise exception 'Overlaps with another leave request';
  end if;

  if leave_type.category = 'leave' and leave_type.counts_toward_quota then
    for year_number in extract(year from request_start)::integer .. extract(year from request_end)::integer loop
      select b.remaining into remaining_days from public.get_leave_balance(employee, year_number) b;
      if public.leave_days_in_year(request_start, request_end, year_number) > remaining_days then
        raise exception 'Leave quota exceeded';
      end if;
    end loop;
  end if;

  insert into public.leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason, document_path)
  values (employee, request_type_id, request_start, request_end, days, trim(request_reason), attachment_path)
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.cancel_leave_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.leave_requests
  set status = 'cancelled'
  where id = request_id and employee_id = public.current_employee_id() and status = 'pending';
  if not found then
    raise exception 'Only your own pending request can be cancelled';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- HR decision. Usage is now computed from requests (get_leave_balance), so approval no longer
-- writes leave_balances; that table only holds per-employee quota overrides.
-- ---------------------------------------------------------------------------
create or replace function public.decide_leave_request(request_id uuid, approve boolean, note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  request public.leave_requests;
begin
  if not public.has_permission('leave.manage') then
    raise exception 'Not allowed to decide this leave request';
  end if;

  select * into request from public.leave_requests where id = request_id for update;
  if request.id is null then
    raise exception 'Leave request not found';
  end if;
  if request.status <> 'pending' then
    raise exception 'Leave request has already been decided';
  end if;
  if not approve and coalesce(trim(note), '') = '' then
    raise exception 'A reason is required when rejecting';
  end if;

  update public.leave_requests
  set status = case when approve then 'approved'::public.request_status else 'rejected'::public.request_status end,
      decided_by = auth.uid(),
      decided_at = now(),
      decision_note = note
  where id = request_id;

  perform public.notify_employee(request.employee_id,
    case when approve then 'Pengajuan cuti/izin disetujui' else 'Pengajuan cuti/izin ditolak' end,
    coalesce(note, ''), '/leave');
end;
$$;

create or replace function public.notify_leave_request_submitted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester_name text;
begin
  select e.full_name into requester_name from public.employees e where e.id = new.employee_id;
  perform public.notify_permission_holders('leave.manage', 'Pengajuan cuti/izin baru',
    requester_name || ' mengajukan cuti/izin ' || to_char(new.start_date, 'DD-MM-YYYY') || ' s.d. ' || to_char(new.end_date, 'DD-MM-YYYY') || '.',
    '/leave/requests');
  return new;
end;
$$;

-- Employees create and cancel requests only through the RPCs above.
drop policy if exists "leave submit" on public.leave_requests;
drop policy if exists "leave cancel own" on public.leave_requests;

revoke execute on function public.count_leave_days(date, date) from public, anon, authenticated;
revoke execute on function public.leave_days_in_year(date, date, integer) from public, anon, authenticated;
revoke execute on function public.get_leave_balance(uuid, integer) from public, anon, authenticated;
revoke execute on function public.submit_leave_request(uuid, date, date, text, text) from public, anon, authenticated;
revoke execute on function public.cancel_leave_request(uuid) from public, anon, authenticated;
grant execute on function public.get_leave_balance(uuid, integer) to authenticated;
grant execute on function public.submit_leave_request(uuid, date, date, text, text) to authenticated;
grant execute on function public.cancel_leave_request(uuid) to authenticated;
