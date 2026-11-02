-- =============================================================================
-- Performance appraisal (penilaian kinerja DP3/SKP): periods, appraisal forms, indicators.
-- Flow: HR opens period -> system generates forms -> appraiser fills -> submit -> verify/revise -> recap.
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
  appraiser_id uuid references public.employees (id) on delete set null,   -- atasan_id
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
create index appraisals_appraiser_idx on public.appraisals (appraiser_id, status);

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

-- "Sistem generate daftar pegawai yang harus dinilai": one draft form per active employee, appraiser = supervisor.
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

  insert into public.appraisals (period_id, employee_id, appraiser_id)
  select target_period_id, e.id, e.supervisor_id
  from public.employees e
  where e.active_status = 'active'
  on conflict (period_id, employee_id) do nothing;

  get diagnostics created_count = row_count;
  return created_count;
end;
$$;

-- HR verifies a submitted appraisal or sends it back for revision (notifies the appraiser).
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
    if appraisal.appraiser_id is not null then
      perform public.notify_employee(appraisal.appraiser_id, 'Penilaian kinerja perlu diperbaiki', note, '/performance/' || appraisal.id);
    end if;
  end if;
end;
$$;

-- Rekap nilai per unit kerja (verified forms only).
create or replace view public.appraisal_unit_summary
with (security_invoker = true)
as
select
  a.period_id,
  e.work_unit_id,
  count(*) as appraised_employees,
  round(avg(a.performance_score), 2) as average_score,
  min(a.performance_score) as lowest_score,
  max(a.performance_score) as highest_score
from public.appraisals a
join public.employees e on e.id = a.employee_id
where a.status = 'verified'
group by a.period_id, e.work_unit_id;

create trigger set_updated_at before update on public.appraisal_periods for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.appraisals for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.appraisal_items for each row execute function public.set_updated_at();
create trigger audit_row_change after insert or update or delete on public.appraisals for each row execute function public.audit_row_change();

alter table public.appraisal_periods enable row level security;
alter table public.appraisals enable row level security;
alter table public.appraisal_items enable row level security;

create policy "period read" on public.appraisal_periods for select to authenticated using (true);
create policy "period manage" on public.appraisal_periods for all to authenticated using (public.has_permission('appraisal.manage')) with check (public.has_permission('appraisal.manage'));

-- Employees see their own result once verified; appraisers see forms they fill; leaders/HR see per permission.
create policy "appraisal read" on public.appraisals for select to authenticated
  using (
    (employee_id = public.current_employee_id() and status = 'verified')
    or appraiser_id = public.current_employee_id()
    or public.has_permission('appraisal.view')
  );
-- Appraisers edit drafts/revisions and may only move them to "submitted".
create policy "appraisal fill" on public.appraisals for update to authenticated
  using (appraiser_id = public.current_employee_id() and status in ('draft', 'revision_requested'))
  with check (appraiser_id = public.current_employee_id() and status in ('draft', 'revision_requested', 'submitted') and verified_at is null);
create policy "appraisal manage" on public.appraisals for all to authenticated
  using (public.has_permission('appraisal.manage')) with check (public.has_permission('appraisal.manage'));

create policy "item read" on public.appraisal_items for select to authenticated
  using (exists (select 1 from public.appraisals a where a.id = appraisal_id));
create policy "item fill" on public.appraisal_items for all to authenticated
  using (exists (
    select 1 from public.appraisals a
    where a.id = appraisal_id and a.appraiser_id = public.current_employee_id() and a.status in ('draft', 'revision_requested')
  ))
  with check (exists (
    select 1 from public.appraisals a
    where a.id = appraisal_id and a.appraiser_id = public.current_employee_id() and a.status in ('draft', 'revision_requested')
  ));
create policy "item manage" on public.appraisal_items for all to authenticated
  using (public.has_permission('appraisal.manage')) with check (public.has_permission('appraisal.manage'));
