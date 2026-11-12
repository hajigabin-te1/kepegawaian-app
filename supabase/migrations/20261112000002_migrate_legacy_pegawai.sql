-- =============================================================================
-- One-off: copy rows from the legacy public.pegawai table (created by hand before this schema)
-- into employees, and close the legacy table to the API by enabling RLS (no policies = no access).
-- The legacy table has no category column; rows are imported as 'staff' and HR corrects them in the app.
-- The table itself is dropped in a later migration once the import is confirmed.
-- =============================================================================

do $$
begin
  if to_regclass('public.pegawai') is not null then
    insert into public.employees (employee_number, full_name, email, category, appointment_date)
    select nullif(trim(p.nip), ''), p.nama_lengkap, lower(nullif(trim(p.email), '')), 'staff', p.tanggal_bergabung
    from public.pegawai p
    where p.nama_lengkap is not null
      and not exists (select 1 from public.employees e where e.employee_number = nullif(trim(p.nip), ''));

    alter table public.pegawai enable row level security;
  end if;
end;
$$;
