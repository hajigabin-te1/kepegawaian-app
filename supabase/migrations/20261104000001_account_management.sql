-- =============================================================================
-- Account management support for the superadmin screen (Kelola Akun).
-- =============================================================================

-- Accounts with their sign-in email (auth.users is not exposed through the API).
create or replace function public.list_user_accounts()
returns table (
  id uuid,
  email text,
  role_id smallint,
  role_code text,
  role_name text,
  is_active boolean,
  employee_id uuid,
  employee_name text,
  last_sign_in_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_permission('user.manage') then
    raise exception 'Not allowed to manage accounts';
  end if;
  return query
  select ua.id, u.email::text, r.id, r.code, r.name, ua.is_active, ua.employee_id, e.full_name, u.last_sign_in_at, ua.created_at
  from public.user_accounts ua
  join auth.users u on u.id = ua.id
  join public.roles r on r.id = ua.role_id
  left join public.employees e on e.id = ua.employee_id
  order by ua.created_at;
end;
$$;

revoke execute on function public.list_user_accounts() from public, anon, authenticated;
grant execute on function public.list_user_accounts() to authenticated;

-- Nobody can deactivate their own account or change their own role (prevents locking out the last admin).
create or replace function public.prevent_self_lockout()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id = auth.uid() and (new.is_active is distinct from old.is_active or new.role_id is distinct from old.role_id) then
    raise exception 'Cannot deactivate or change the role of your own account' using errcode = 'P0001', hint = 'self_lockout';
  end if;
  return new;
end;
$$;

revoke execute on function public.prevent_self_lockout() from public, anon, authenticated;

create trigger prevent_self_lockout before update on public.user_accounts
for each row execute function public.prevent_self_lockout();
