-- The automatic work-report lock only counts forms of the employee's current categories. A draft form left
-- over from a category the employee no longer has (e.g. HR removed "also a lecturer") must not keep the
-- reports unlocked forever: appraisal forms cannot be deleted in the app.
create or replace function public.work_reports_locked(target_period_id uuid, target_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with current_forms as (
    select a.status
    from public.appraisals a
    join public.employees e on e.id = a.employee_id
    where a.period_id = target_period_id
      and a.employee_id = target_employee_id
      and (a.category = e.category or a.category = e.additional_category)
  )
  select case
    when target_employee_id is distinct from public.current_employee_id()
      and not public.has_permission('appraisal.manage') then true
    when not exists (select 1 from public.appraisal_periods p where p.id = target_period_id and p.is_active) then true
    else coalesce(
      (select l.is_locked from public.appraisal_work_report_locks l
       where l.period_id = target_period_id and l.employee_id = target_employee_id),
      exists (select 1 from current_forms)
      and not exists (select 1 from current_forms f where f.status in ('draft', 'revision_requested'))
    )
  end;
$$;
