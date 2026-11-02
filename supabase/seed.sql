-- =============================================================================
-- Reference data. Only values stated in the requirement documents are seeded;
-- anything still unconfirmed (leave quotas, working hours, GPS locations) is left for HR to fill in.
-- =============================================================================

insert into public.roles (code, name) values
  ('superadmin', 'Admin Sistem / PUSKOM'),
  ('hr_admin', 'Bagian Kepegawaian'),
  ('leader', 'Pimpinan'),
  ('employee', 'Pegawai (Dosen & Tenaga Kependidikan)')
on conflict (code) do nothing;

insert into public.permissions (code, description) values
  ('user.manage', 'Kelola akun pengguna'),
  ('role.manage', 'Kelola role & hak akses'),
  ('settings.manage', 'Konfigurasi parameter sistem (jenis cuti, aturan absen, lokasi GPS)'),
  ('audit.view', 'Lihat audit log'),
  ('master.manage', 'Kelola data jabatan & unit kerja'),
  ('employee.view', 'Lihat data seluruh pegawai'),
  ('employee.manage', 'Tambah, edit, nonaktifkan data pegawai'),
  ('attendance.view', 'Lihat data presensi seluruh pegawai'),
  ('attendance.manage', 'Impor, koreksi, rekap absensi'),
  ('attendance.approve_all', 'Setujui koreksi absensi pegawai mana pun'),
  ('leave.view', 'Lihat data cuti & izin seluruh pegawai'),
  ('leave.manage', 'Verifikasi, koreksi, rekap cuti & izin'),
  ('leave.approve_all', 'Setujui/tolak cuti pegawai mana pun'),
  ('appraisal.view', 'Lihat rekap penilaian kinerja'),
  ('appraisal.manage', 'Kelola periode, verifikasi, rekap penilaian kinerja'),
  ('training.manage', 'Kelola pembukaan, seleksi, dan hasil diklat'),
  ('mutation.manage', 'Kelola usulan & eksekusi mutasi'),
  ('promotion.manage', 'Kelola kenaikan pangkat & jabatan'),
  ('announcement.manage', 'Buat & kelola pengumuman'),
  ('report.view', 'Generate laporan kepegawaian')
on conflict (code) do nothing;

-- Role -> permission mapping, following the use case diagram.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = any (
  case r.code
    when 'superadmin' then array['user.manage', 'role.manage', 'settings.manage', 'audit.view']
    when 'hr_admin' then array[
      'master.manage', 'employee.view', 'employee.manage',
      'attendance.view', 'attendance.manage',
      'leave.view', 'leave.manage',
      'appraisal.view', 'appraisal.manage',
      'training.manage', 'mutation.manage', 'promotion.manage',
      'announcement.manage', 'report.view'
    ]
    when 'leader' then array['employee.view', 'attendance.view', 'leave.view', 'appraisal.view', 'report.view']
    else array[]::text[]
  end
)
on conflict do nothing;

insert into public.employment_statuses (code, name) values
  ('PNS', 'Pegawai Negeri Sipil'),
  ('PPPK', 'Pegawai Pemerintah dengan Perjanjian Kerja'),
  ('TTU', 'TTU'),
  ('TTK', 'TTK')
on conflict (code) do nothing;

-- Leave/permit types named in the requirements. Quotas and document requirements stay unset until HR confirms them.
insert into public.leave_types (code, name, category, requires_document) values
  ('annual', 'Cuti Tahunan', 'leave', false),
  ('sick', 'Cuti Sakit', 'leave', false),
  ('important_reason', 'Cuti Alasan Penting', 'leave', false),
  ('long_service', 'Cuti Besar', 'leave', false),
  ('maternity', 'Cuti Melahirkan', 'leave', false),
  ('half_day_permit', 'Izin Setengah Hari', 'permit', false),
  ('important_permit', 'Izin Penting', 'permit', false)
on conflict (code) do nothing;
