-- "Ajukan perbaikan data": an employee proposes corrections to their own personal data; HR approves or rejects.
-- Approval applies the proposed values to public.employees inside decide_profile_change_request(),
-- so employees never write employee rows directly and HR does not update the request row by hand.
--
-- Only personal-data columns can be requested. Employment data (NIP, unit, position, status, ...) is HR-only.

create or replace function public.profile_change_fields()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array[
    'full_name', 'national_id_number', 'birth_place', 'birth_date', 'gender', 'religion', 'marital_status',
    'address', 'city', 'province', 'postal_code', 'phone', 'email'
  ]
$$;

create or replace function public.submit_profile_change_request(changes jsonb, request_reason text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  employee uuid := public.current_employee_id();
  unsupported text;
  new_id uuid;
begin
  if employee is null then
    raise exception 'No employee linked to this account';
  end if;
  if jsonb_typeof(changes) is distinct from 'object' or changes = '{}'::jsonb then
    raise exception 'No changes requested';
  end if;
  if coalesce(trim(request_reason), '') = '' then
    raise exception 'A reason is required';
  end if;

  select k into unsupported from jsonb_object_keys(changes) as k where k <> all (public.profile_change_fields()) limit 1;
  if unsupported is not null then
    raise exception 'Unsupported field: %', unsupported;
  end if;
  if changes ? 'full_name' and coalesce(trim(changes ->> 'full_name'), '') = '' then
    raise exception 'Name cannot be empty';
  end if;

  insert into public.profile_change_requests (employee_id, requested_changes, reason)
  values (employee, changes, trim(request_reason))
  returning id into new_id;

  perform public.notify_permission_holders('employee.manage', 'Pengajuan perbaikan data pegawai',
    'Ada pengajuan perbaikan data yang menunggu persetujuan.', '/employees/change-requests');
  return new_id;
end;
$$;

create or replace function public.decide_profile_change_request(request_id uuid, approve boolean, note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  request public.profile_change_requests;
  changes jsonb;
begin
  if not public.has_permission('employee.manage') then
    raise exception 'Not allowed to decide this request';
  end if;

  select * into request from public.profile_change_requests where id = request_id for update;
  if request.id is null then
    raise exception 'Request not found';
  end if;
  if request.status <> 'pending' then
    raise exception 'Request has already been decided';
  end if;
  if not approve and coalesce(trim(note), '') = '' then
    raise exception 'A reason is required when rejecting';
  end if;

  if approve then
    changes := request.requested_changes;
    update public.employees e
    set full_name = case when changes ? 'full_name' then trim(changes ->> 'full_name') else e.full_name end,
        national_id_number = case when changes ? 'national_id_number' then nullif(trim(changes ->> 'national_id_number'), '') else e.national_id_number end,
        birth_place = case when changes ? 'birth_place' then nullif(trim(changes ->> 'birth_place'), '') else e.birth_place end,
        birth_date = case when changes ? 'birth_date' then nullif(changes ->> 'birth_date', '')::date else e.birth_date end,
        gender = case when changes ? 'gender' then nullif(changes ->> 'gender', '')::public.gender else e.gender end,
        religion = case when changes ? 'religion' then nullif(trim(changes ->> 'religion'), '') else e.religion end,
        marital_status = case when changes ? 'marital_status' then nullif(changes ->> 'marital_status', '')::public.marital_status else e.marital_status end,
        address = case when changes ? 'address' then nullif(trim(changes ->> 'address'), '') else e.address end,
        city = case when changes ? 'city' then nullif(trim(changes ->> 'city'), '') else e.city end,
        province = case when changes ? 'province' then nullif(trim(changes ->> 'province'), '') else e.province end,
        postal_code = case when changes ? 'postal_code' then nullif(trim(changes ->> 'postal_code'), '') else e.postal_code end,
        phone = case when changes ? 'phone' then nullif(trim(changes ->> 'phone'), '') else e.phone end,
        email = case when changes ? 'email' then nullif(trim(changes ->> 'email'), '') else e.email end
    where e.id = request.employee_id;
  end if;

  update public.profile_change_requests
  set status = case when approve then 'approved'::public.request_status else 'rejected'::public.request_status end,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_note = nullif(trim(note), '')
  where id = request_id;

  perform public.notify_employee(request.employee_id,
    case when approve then 'Perbaikan data disetujui' else 'Perbaikan data ditolak' end,
    coalesce(note, ''), '/profile');
end;
$$;

revoke execute on function public.profile_change_fields() from public, anon, authenticated;
revoke execute on function public.submit_profile_change_request(jsonb, text) from public, anon, authenticated;
revoke execute on function public.decide_profile_change_request(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.submit_profile_change_request(jsonb, text) to authenticated;
grant execute on function public.decide_profile_change_request(uuid, boolean, text) to authenticated;

-- The RPCs above are the only write path: drop the direct submit/review policies from the core migration.
drop policy if exists "change request submit" on public.profile_change_requests;
drop policy if exists "change request review" on public.profile_change_requests;
