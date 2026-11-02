-- =============================================================================
-- Leave and permits (cuti & izin): types, yearly balances, requests, approval flow.
-- =============================================================================

create type public.leave_category as enum ('leave', 'permit');

-- Jenis cuti/izin. default_annual_quota is null until HR confirms the rule for that type.
create table public.leave_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category public.leave_category not null,
  default_annual_quota smallint check (default_annual_quota >= 0),
  requires_document boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Kuota cuti per pegawai per tahun.
create table public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  leave_type_id uuid not null references public.leave_types (id) on delete restrict,
  year smallint not null,
  quota_days numeric(5, 1) not null check (quota_days >= 0),
  used_days numeric(5, 1) not null default 0 check (used_days >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, leave_type_id, year)
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  leave_type_id uuid not null references public.leave_types (id) on delete restrict,
  start_date date not null,
  end_date date not null,
  total_days numeric(5, 1) not null check (total_days > 0),  -- counted by the app (working-day rule to be confirmed)
  reason text not null,
  document_path text,                   -- dokumen pendukung (Storage path)
  status public.request_status not null default 'pending',
  decided_by uuid references auth.users (id) on delete set null,          -- disetujui_oleh (HR)
  decided_at timestamptz,               -- tanggal_disetujui / ditolak
  decision_note text,                   -- catatan / alasan penolakan
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index leave_requests_employee_idx on public.leave_requests (employee_id, status);
create index leave_requests_dates_idx on public.leave_requests (start_date, end_date);

-- Notify HR when a request is submitted (HR is the only approver).
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
    '/leave/' || new.id);
  return new;
end;
$$;

create trigger notify_leave_request_submitted after insert on public.leave_requests
for each row execute function public.notify_leave_request_submitted();

-- HR approves/rejects. Approval of a "leave" type deducts the yearly quota.
create or replace function public.decide_leave_request(request_id uuid, approve boolean, note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  request public.leave_requests;
  leave_type public.leave_types;
  request_year smallint;
begin
  select * into request from public.leave_requests where id = request_id for update;
  if request.id is null then
    raise exception 'Leave request not found';
  end if;
  if request.status <> 'pending' then
    raise exception 'Leave request has already been decided';
  end if;
  if not public.has_permission('leave.manage') then
    raise exception 'Not allowed to decide this leave request';
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

  select * into leave_type from public.leave_types where id = request.leave_type_id;
  if approve and leave_type.category = 'leave' then
    request_year := extract(year from request.start_date)::smallint;
    insert into public.leave_balances (employee_id, leave_type_id, year, quota_days, used_days)
    values (request.employee_id, request.leave_type_id, request_year, coalesce(leave_type.default_annual_quota, 0), request.total_days)
    on conflict (employee_id, leave_type_id, year)
    do update set used_days = public.leave_balances.used_days + excluded.used_days;
  end if;

  perform public.notify_employee(request.employee_id,
    case when approve then 'Pengajuan cuti/izin disetujui' else 'Pengajuan cuti/izin ditolak' end,
    coalesce(note, ''),
    '/leave/' || request.id);
end;
$$;

-- Rekap cuti per pegawai & per unit kerja.
create or replace view public.leave_summary
with (security_invoker = true)
as
select
  r.employee_id,
  e.work_unit_id,
  r.leave_type_id,
  extract(year from r.start_date)::smallint as year,
  count(*) filter (where r.status = 'approved') as approved_requests,
  coalesce(sum(r.total_days) filter (where r.status = 'approved'), 0) as approved_days,
  count(*) filter (where r.status = 'pending') as pending_requests
from public.leave_requests r
join public.employees e on e.id = r.employee_id
group by r.employee_id, e.work_unit_id, r.leave_type_id, extract(year from r.start_date);

-- Aggregated per work unit, category, and leave type for the leaders' statistics dashboard.
create or replace function public.report_leave_by_unit(target_year smallint)
returns table (
  work_unit_id uuid,
  work_unit_name text,
  category public.employee_category,
  leave_type_name text,
  approved_requests bigint,
  approved_days numeric,
  pending_requests bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (public.has_permission('report.view') or public.has_permission('leave.view')) then
    raise exception 'Not allowed to view leave reports';
  end if;
  return query
  select w.id, w.name, e.category, t.name,
         count(*) filter (where r.status = 'approved'),
         coalesce(sum(r.total_days) filter (where r.status = 'approved'), 0),
         count(*) filter (where r.status = 'pending')
  from public.leave_requests r
  join public.employees e on e.id = r.employee_id
  join public.leave_types t on t.id = r.leave_type_id
  left join public.work_units w on w.id = e.work_unit_id
  where extract(year from r.start_date) = target_year
  group by w.id, w.name, e.category, t.name;
end;
$$;

create trigger set_updated_at before update on public.leave_types for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.leave_balances for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.leave_requests for each row execute function public.set_updated_at();
create trigger audit_row_change after insert or update or delete on public.leave_requests for each row execute function public.audit_row_change();
create trigger audit_row_change after insert or update or delete on public.leave_balances for each row execute function public.audit_row_change();

alter table public.leave_types enable row level security;
alter table public.leave_balances enable row level security;
alter table public.leave_requests enable row level security;

create policy "leave type read" on public.leave_types for select to authenticated using (true);
create policy "leave type manage" on public.leave_types for all to authenticated using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));

create policy "balance read" on public.leave_balances for select to authenticated using (public.can_view_employee(employee_id, 'leave.view'));
create policy "balance manage" on public.leave_balances for all to authenticated using (public.has_permission('leave.manage')) with check (public.has_permission('leave.manage'));

-- Employees submit their own requests and may cancel them while pending; HR decides through decide_leave_request().
create policy "leave read" on public.leave_requests for select to authenticated using (public.can_view_employee(employee_id, 'leave.view'));
create policy "leave submit" on public.leave_requests for insert to authenticated
  with check (employee_id = public.current_employee_id() and status = 'pending' and decided_by is null and decided_at is null);
create policy "leave cancel own" on public.leave_requests for update to authenticated
  using (employee_id = public.current_employee_id() and status = 'pending')
  with check (employee_id = public.current_employee_id() and status in ('pending', 'cancelled') and decided_by is null);
create policy "leave manage" on public.leave_requests for all to authenticated
  using (public.has_permission('leave.manage')) with check (public.has_permission('leave.manage'));
