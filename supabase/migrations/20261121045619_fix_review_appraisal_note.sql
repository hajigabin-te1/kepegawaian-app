-- Fix: sending an appraisal back failed with "column reference \"note\" is ambiguous" (42702).
-- The parameter `note` collides with the column public.appraisals.note inside the UPDATE.
-- The parameter name stays `note` (the client calls the RPC with named arguments), so every
-- reference is qualified with the function name instead.

create or replace function public.review_appraisal(target_appraisal_id uuid, accept boolean, note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  appraisal public.appraisals;
  reason text := nullif(trim(review_appraisal.note), '');
begin
  if not public.has_permission('appraisal.manage') then
    raise exception 'Not allowed to review appraisals';
  end if;
  select * into appraisal from public.appraisals where id = target_appraisal_id for update;
  if appraisal.id is null or appraisal.status <> 'submitted' then
    raise exception 'Only submitted appraisals can be reviewed';
  end if;
  if not accept and reason is null then
    raise exception 'A reason is required when sending back';
  end if;

  if accept then
    update public.appraisals
    set status = 'verified', verified_by = auth.uid(), verified_at = now(), revision_note = null
    where id = target_appraisal_id;
    perform public.notify_employee(appraisal.employee_id, 'Hasil penilaian kinerja tersedia', null, '/performance');
  else
    update public.appraisals
    set status = 'revision_requested', revision_note = reason
    where id = target_appraisal_id;
  end if;
end;
$$;
