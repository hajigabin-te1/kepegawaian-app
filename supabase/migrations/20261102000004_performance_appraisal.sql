-- =============================================================================
-- Performance appraisal (penilaian kinerja DP3/SKP): periods, appraisal forms, indicators.
-- Flow (HR only): open period -> generate forms -> fill -> submit -> verify or send back -> recap.
-- Employees see their own verified result; leaders see aggregated statistics only.
-- =============================================================================

create type public.appraisal_period_type as enum ('annual', 'semester');
create type public.appraisal_status as enum ('draft', 'submitted', 'revision_requested', 'verified');

create table public.appraisal_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  period_type public.appraisal_period_type not null,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.appraisals (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.appraisal_periods (id) on delete restrict,
  employee_id uuid not null references public.employees (id) on delete cascade,
  appraised_by uuid references auth.users (id) on delete set null,         -- HR user who filled the form
  performance_score numeric(5, 2),      -- nilai_kinerja (scoring formula to be confirmed)
  note text,
  status public.appraisal_status not null default 'draft',
  submitted_at timestamptz,
  verified_by uuid references auth.users (id) on delete set null,
  verified_at timestamptz,
  revision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (period_id, employee_id)
);
create index appraisals_period_status_idx on public.appraisals (period_id, status);

-- Indikator kinerja, target, realisasi, nilai.
create table public.appraisal_items (
  id uuid primary key default gen_random_uuid(),
  appraisal_id uuid not null references public.appraisals (id) on delete cascade,
  indicator text not null,
  target text,
  realization text,
  score numeric(5, 2),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- "Sistem generate daftar pegawai yang harus dinilai": one draft form per active employee.
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

  insert into public.appraisals (period_id, employee_id)
  select target_period_id, e.id
  from public.employees e
  where e.active_status = 'active'
  on conflict (period_id, employee_id) do nothing;

  get diagnostics created_count = row_count;
  return created_count;
end;
$$;

-- HR verifies a submitted appraisal or sends it back to draft for revision.
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

  if accept then
    update public.appraisals
    set status = 'verified', verified_by = auth.uid(), verified_at = now(), revision_note = null
    where id = target_appraisal_id;
    perform public.notify_employee(appraisal.employee_id, 'Hasil penilaian kinerja tersedia', null, '/performance/' || appraisal.id);
  else
    update public.appraisals
    set status = 'revision_requested', revision_note = note
    where id = target_appraisal_id;
  end if;
end;
$$;

-- Rekap nilai per unit kerja & kategori (verified forms only), for HR and the leaders' dashboard.
create or replace function public.report_appraisal_by_unit(target_period_id uuid)
returns table (
  work_unit_id uuid,
  work_unit_name text,
  category public.employee_category,
  appraised_employees bigint,
  average_score numeric,
  lowest_score numeric,
  highest_score numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (public.has_permission('report.view') or public.has_permission('appraisal.manage')) then
    raise exception 'Not allowed to view appraisal reports';
  end if;
  return query
  select w.id, w.name, e.category, count(*), round(avg(a.performance_score), 2), min(a.performance_score), max(a.performance_score)
  from public.appraisals a
  join public.employees e on e.id = a.employee_id
  left join public.work_units w on w.id = e.work_unit_id
  where a.period_id = target_period_id and a.status = 'verified'
  group by w.id, w.name, e.category;
end;
$$;

create trigger set_updated_at before update on public.appraisal_periods for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.appraisals for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.appraisal_items for each row execute function public.set_updated_at();
create trigger audit_row_change after insert or update or delete on public.appraisals for each row execute function public.audit_row_change();

alter table public.appraisal_periods enable row level security;
alter table public.appraisals enable row level security;
alter table public.appraisal_items enable row level security;

create policy "period read" on public.appraisal_periods for select to authenticated using (true);
create policy "period manage" on public.appraisal_periods for all to authenticated using (public.has_permission('appraisal.manage')) with check (public.has_permission('appraisal.manage'));

-- Employees see their own result once verified; HR manages everything.
create policy "appraisal read own" on public.appraisals for select to authenticated
  using (employee_id = public.current_employee_id() and status = 'verified');
create policy "appraisal manage" on public.appraisals for all to authenticated
  using (public.has_permission('appraisal.manage')) with check (public.has_permission('appraisal.manage'));

create policy "item read" on public.appraisal_items for select to authenticated
  using (exists (select 1 from public.appraisals a where a.id = appraisal_id));
create policy "item manage" on public.appraisal_items for all to authenticated
  using (public.has_permission('appraisal.manage')) with check (public.has_permission('appraisal.manage'));
