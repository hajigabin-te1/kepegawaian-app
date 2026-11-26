-- Dual-category employees (decision 2026-11-26):
--   * A tendik who also teaches keeps category 'staff' (tendik working hours, counted once as tendik in
--     headcount/attendance/leave statistics) and gets additional_category 'lecturer'.
--   * Appraisal forms are per category: a dual-category employee gets a lecturer form and a staff form per period.
--   * Appraisal statistics group by the form's category.
--   * Work reports stay one set per employee per period and lock automatically only once every form is sent.

-- ---------------------------------------------------------------------------
-- employees.additional_category
-- ---------------------------------------------------------------------------
alter table public.employees
  add column additional_category public.employee_category,
  add constraint employees_additional_category_check
    check (additional_category is null or (category = 'staff' and additional_category = 'lecturer'));

comment on column public.employees.additional_category is
  'Second category of a dual-category employee (tendik who also teaches = lecturer). Null for most employees.';

-- ---------------------------------------------------------------------------
-- appraisals.category: one form per employee per category per period
-- ---------------------------------------------------------------------------
alter table public.appraisals add column category public.employee_category;

update public.appraisals a
set category = e.category
from public.employees e
where e.id = a.employee_id;

alter table public.appraisals
  alter column category set not null,
  drop constraint appraisals_period_id_employee_id_key,
  add constraint appraisals_period_employee_category_key unique (period_id, employee_id, category);

-- One draft form per active employee per category.
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
  if not exists (select 1 from public.appraisal_periods p where p.id = target_period_id and p.is_active) then
    raise exception 'The appraisal period is not active';
  end if;

  insert into public.appraisals (period_id, employee_id, category)
  select target_period_id, e.id, c.category
  from public.employees e
  cross join lateral (values (e.category), (e.additional_category)) as c (category)
  where e.active_status = 'active' and c.category is not null
  on conflict (period_id, employee_id, category) do nothing;

  get diagnostics created_count = row_count;
  return created_count;
end;
$$;

-- Rekap nilai per unit kerja & kategori form (verified forms only), for HR and the leaders' dashboard (scoped).
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
  if not public.has_report_access('appraisal') then
    raise exception 'Not allowed to view appraisal reports';
  end if;
  return query
  select w.id, w.name, a.category, count(*), round(avg(a.performance_score), 2), min(a.performance_score), max(a.performance_score)
  from public.appraisals a
  join public.employees e on e.id = a.employee_id
  left join public.work_units w on w.id = e.work_unit_id
  where a.period_id = target_period_id
    and a.status = 'verified'
    and public.can_report_on('appraisal', e.work_unit_id, a.category)
  group by w.id, w.name, a.category;
end;
$$;

-- Same rules as 2026-11-21, except the automatic lock now waits until every form of the period is sent.
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
    when not exists (select 1 from public.appraisal_periods p where p.id = target_period_id and p.is_active) then true
    else coalesce(
      (select l.is_locked from public.appraisal_work_report_locks l
       where l.period_id = target_period_id and l.employee_id = target_employee_id),
      exists (
        select 1 from public.appraisals a
        where a.period_id = target_period_id and a.employee_id = target_employee_id
      )
      and not exists (
        select 1 from public.appraisals a
        where a.period_id = target_period_id
          and a.employee_id = target_employee_id
          and a.status in ('draft', 'revision_requested')
      )
    )
  end;
$$;
