-- =============================================================================
-- Lets HR see whether an employee already has a sign-in account (Detail Pegawai),
-- without granting read access to user_accounts or auth.users.
-- =============================================================================

create or replace function public.get_employee_account(target_employee_id uuid)
returns table (
  user_id uuid,
  email text,
  is_active boolean,
  last_sign_in_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_permission('employee.view') then
    raise exception 'Not allowed to view employee accounts';
  end if;
  return query
  select ua.id, u.email::text, ua.is_active, u.last_sign_in_at
  from public.user_accounts ua
  join auth.users u on u.id = ua.id
  where ua.employee_id = target_employee_id;
end;
$$;

revoke execute on function public.get_employee_account(uuid) from public, anon, authenticated;
grant execute on function public.get_employee_account(uuid) to authenticated;
