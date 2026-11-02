-- =============================================================================
-- Announcements, reporting views, and Storage buckets for employee files.
-- =============================================================================

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.announcements for each row execute function public.set_updated_at();

alter table public.announcements enable row level security;

create policy "announcement read" on public.announcements for select to authenticated
  using (is_published or public.has_permission('announcement.manage'));
create policy "announcement manage" on public.announcements for all to authenticated
  using (public.has_permission('announcement.manage')) with check (public.has_permission('announcement.manage'));

-- Rekap pegawai per unit kerja (fakultas, prodi, bagian), split by category and status.
-- Aggregates only, so leaders (report.view) can see statistics without individual employee rows.
create or replace function public.report_employee_statistics()
returns table (
  work_unit_id uuid,
  work_unit_name text,
  unit_type public.work_unit_type,
  parent_id uuid,
  active_lecturers bigint,
  active_staff bigint,
  inactive_employees bigint,
  retired_employees bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (public.has_permission('report.view') or public.has_permission('employee.view')) then
    raise exception 'Not allowed to view employee statistics';
  end if;
  return query
  select w.id, w.name, w.unit_type, w.parent_id,
         count(e.id) filter (where e.category = 'lecturer' and e.active_status = 'active'),
         count(e.id) filter (where e.category = 'staff' and e.active_status = 'active'),
         count(e.id) filter (where e.active_status = 'inactive'),
         count(e.id) filter (where e.active_status = 'retired')
  from public.work_units w
  left join public.employees e on e.work_unit_id = w.id
  group by w.id, w.name, w.unit_type, w.parent_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage: private buckets. Object paths start with the employee id: "<employee_id>/<file name>".
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('employee-photos', 'employee-photos', false),
  ('employee-documents', 'employee-documents', false),
  ('leave-attachments', 'leave-attachments', false)
on conflict (id) do nothing;

create policy "employee files read" on storage.objects for select to authenticated
  using (
    bucket_id in ('employee-photos', 'employee-documents', 'leave-attachments')
    and case
      when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then public.can_view_employee(((storage.foldername(name))[1])::uuid, 'employee.view')
      else false
    end
  );

create policy "employee files manage" on storage.objects for all to authenticated
  using (bucket_id in ('employee-photos', 'employee-documents') and public.has_permission('employee.manage'))
  with check (bucket_id in ('employee-photos', 'employee-documents') and public.has_permission('employee.manage'));

-- Employees upload supporting documents for their own leave requests.
create policy "leave attachment upload own" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'leave-attachments'
    and (storage.foldername(name))[1] = public.current_employee_id()::text
  );
