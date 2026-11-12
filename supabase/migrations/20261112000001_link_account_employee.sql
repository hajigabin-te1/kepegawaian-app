-- Lets a superadmin (user.manage) pick which employee an account belongs to, without granting
-- employee.view. Returns only the minimum needed to choose: active employees that are not yet linked
-- to any account, plus the employee already linked to the given account.
create or replace function public.list_linkable_employees(for_account_id uuid default null)
returns table (id uuid, full_name text, employee_number text)
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
  select e.id, e.full_name, e.employee_number
  from public.employees e
  where (e.active_status = 'active' and not exists (select 1 from public.user_accounts ua where ua.employee_id = e.id))
     or exists (select 1 from public.user_accounts ua where ua.employee_id = e.id and ua.id = for_account_id)
  order by e.full_name;
end;
$$;

revoke execute on function public.list_linkable_employees(uuid) from public, anon, authenticated;
grant execute on function public.list_linkable_employees(uuid) to authenticated;
