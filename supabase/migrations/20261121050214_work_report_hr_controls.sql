-- HR controls for employee work reports (decision 2026-11-21):
--   * HR can delete any work report (and its evidence file).
--   * HR can lock or unlock an employee's reports for a period. The manual setting overrides the automatic
--     rule (locked once the appraisal form is submitted/verified). A closed period stays locked regardless.
--     Clearing the setting (locked = null) returns to the automatic rule.

create table public.appraisal_work_report_locks (
  period_id uuid not null references public.appraisal_periods (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  is_locked boolean not null,
  set_by uuid references auth.users (id) on delete set null,
  set_at timestamptz not null default now(),
  primary key (period_id, employee_id)
);

create trigger audit_row_change after insert or update or delete on public.appraisal_work_report_locks
  for each row execute function public.audit_row_change();

alter table public.appraisal_work_report_locks enable row level security;

-- Read: the employee (to see why reports are locked) or HR. Writes only through set_work_reports_lock().
create policy "work report lock read" on public.appraisal_work_report_locks for select to authenticated
  using (employee_id = public.current_employee_id() or public.has_permission('appraisal.manage'));

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
        where a.period_id = target_period_id
          and a.employee_id = target_employee_id
          and a.status in ('submitted', 'verified')
      )
    )
  end;
$$;

-- HR: lock (true), unlock (false), or return to the automatic rule (null).
create or replace function public.set_work_reports_lock(target_period_id uuid, target_employee_id uuid, locked boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_permission('appraisal.manage') then
    raise exception 'Not allowed to lock work reports';
  end if;
  if not exists (select 1 from public.appraisal_periods p where p.id = target_period_id and p.is_active) then
    raise exception 'The appraisal period is not active';
  end if;
  if not exists (select 1 from public.employees e where e.id = target_employee_id) then
    raise exception 'Employee not found';
  end if;

  if locked is null then
    delete from public.appraisal_work_report_locks
    where period_id = target_period_id and employee_id = target_employee_id;
  else
    insert into public.appraisal_work_report_locks (period_id, employee_id, is_locked, set_by)
    values (target_period_id, target_employee_id, locked, auth.uid())
    on conflict (period_id, employee_id) do update
    set is_locked = excluded.is_locked, set_by = excluded.set_by, set_at = now();
  end if;
end;
$$;

-- Employees delete their own unlocked reports; HR may delete any report.
-- Returns the evidence path so the client can remove the file.
create or replace function public.delete_work_report(target_report_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public.current_employee_id();
  is_hr boolean := public.has_permission('appraisal.manage');
  report public.appraisal_work_reports;
begin
  if me is null and not is_hr then
    raise exception 'Your account is not linked to an employee';
  end if;
  select * into report from public.appraisal_work_reports where id = target_report_id for update;
  if report.id is null or (not is_hr and report.employee_id <> me) then
    raise exception 'Work report not found';
  end if;
  if not is_hr and public.work_reports_locked(report.period_id, me) then
    raise exception 'Work reports for this period are locked';
  end if;

  delete from public.appraisal_work_reports where id = target_report_id;
  return report.evidence_path;
end;
$$;

revoke execute on function public.set_work_reports_lock(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_work_reports_lock(uuid, uuid, boolean) to authenticated;

-- HR removes the evidence file of a report it deleted.
create policy "appraisal evidence delete manage" on storage.objects for delete to authenticated
  using (bucket_id = 'appraisal-evidence' and public.has_permission('appraisal.manage'));
