-- HR can delete an appraisal form that is still a draft (decision 2026-11-26), e.g. the lecturer form left
-- over after HR removed an employee's "also a lecturer" status. Submitted, returned, or verified forms stay.
-- Indicator rows go with the form (on delete cascade); the audit trigger records the deletion.
create or replace function public.delete_draft_appraisal(target_appraisal_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  appraisal public.appraisals;
begin
  if not public.has_permission('appraisal.manage') then
    raise exception 'Not allowed to delete appraisals';
  end if;

  select * into appraisal from public.appraisals where id = target_appraisal_id for update;
  if not found then
    raise exception 'Appraisal not found';
  end if;
  if appraisal.status <> 'draft' then
    raise exception 'Only draft appraisals can be deleted';
  end if;

  delete from public.appraisals where id = target_appraisal_id;
end;
$$;

revoke execute on function public.delete_draft_appraisal(uuid) from public, anon, authenticated;
grant execute on function public.delete_draft_appraisal(uuid) to authenticated;
