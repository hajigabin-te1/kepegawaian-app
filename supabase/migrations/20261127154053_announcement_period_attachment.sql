-- =============================================================================
-- Decisions 2026-11-27:
--   * Announcements have a display period (starts_on .. ends_on, campus dates) and an optional document.
--     Employees see a published announcement only within its period; HR sees everything.
--   * A tendik who also teaches (additional_category = 'lecturer') counts as a lecturer in the
--     employee headcount statistics. Attendance/leave statistics are unchanged.
-- =============================================================================

-- Today's date on campus (app_settings.timezone, WITA). Used by RLS policies.
create or replace function public.campus_today()
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select (now() at time zone public.app_timezone())::date
$$;

revoke execute on function public.campus_today() from public, anon;
grant execute on function public.campus_today() to authenticated;

-- ---------------------------------------------------------------------------
-- Announcement period and attachment
-- ---------------------------------------------------------------------------
alter table public.announcements
  add column starts_on date,
  add column ends_on date,
  add column attachment_path text,
  add column attachment_name text;

-- Existing rows start on the day they were published (or created). They keep no end date,
-- so they stay visible until HR edits them; the form requires an end date from now on.
update public.announcements
set starts_on = (coalesce(published_at, created_at) at time zone public.app_timezone())::date
where starts_on is null;

alter table public.announcements
  alter column starts_on set not null,
  add constraint announcements_period_check check (ends_on is null or ends_on >= starts_on),
  add constraint announcements_attachment_check check ((attachment_path is null) = (attachment_name is null));

comment on column public.announcements.starts_on is 'First campus date the announcement is shown to employees (release date).';
comment on column public.announcements.ends_on is 'Last campus date the announcement is shown. Null only for rows created before 2026-11-27.';
comment on column public.announcements.attachment_path is 'Object path in the announcement-attachments bucket.';
comment on column public.announcements.attachment_name is 'Original file name shown to users.';

drop policy "announcement read" on public.announcements;
create policy "announcement read" on public.announcements for select to authenticated
  using (
    public.has_permission('announcement.manage')
    or (
      is_published
      and starts_on <= public.campus_today()
      and (ends_on is null or ends_on >= public.campus_today())
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: private bucket, max 5 MB, PDF/Word/JPG/PNG
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'announcement-attachments',
  'announcement-attachments',
  false,
  5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do nothing;

-- Readable by whoever can read the announcement that references the file (RLS above applies).
create policy "announcement attachment read" on storage.objects for select to authenticated
  using (
    bucket_id = 'announcement-attachments'
    and exists (select 1 from public.announcements a where a.attachment_path = objects.name)
  );

create policy "announcement attachment manage" on storage.objects for all to authenticated
  using (bucket_id = 'announcement-attachments' and public.has_permission('announcement.manage'))
  with check (bucket_id = 'announcement-attachments' and public.has_permission('announcement.manage'));

-- ---------------------------------------------------------------------------
-- Headcount statistics: dual-category employees count as lecturers
-- ---------------------------------------------------------------------------
create or replace function public.report_employee_statistics()
returns table (
  work_unit_id uuid,
  work_unit_name text,
  unit_type public.work_unit_type,
  parent_id uuid,
  category public.employee_category,
  active_employees bigint,
  inactive_employees bigint,
  retired_employees bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_report_access('employees') then
    raise exception 'Not allowed to view employee statistics';
  end if;
  return query
  select w.id, w.name, w.unit_type, w.parent_id, c.category,
         count(*) filter (where e.active_status = 'active'),
         count(*) filter (where e.active_status = 'inactive'),
         count(*) filter (where e.active_status = 'retired')
  from public.employees e
  cross join lateral (
    select case when e.additional_category = 'lecturer' then 'lecturer'::public.employee_category else e.category end
  ) as c (category)
  left join public.work_units w on w.id = e.work_unit_id
  where public.can_report_on('employees', e.work_unit_id, c.category)
  group by w.id, w.name, w.unit_type, w.parent_id, c.category;
end;
$$;
