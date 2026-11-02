-- =============================================================================
-- Reference data. Only values stated in the requirement documents are seeded;
-- anything still unconfirmed (leave quotas, working hours, GPS locations) is left for HR to fill in.
-- =============================================================================

insert into public.roles (code, name) values
  ('superadmin', 'Admin Sistem / PUSKOM'),
  ('hr_admin', 'Bagian Kepegawaian'),
  ('chair', 'Ketua'),
  ('vice_chair', 'Wakil Ketua Bidang'),
  ('quality_assurance', 'Lembaga Penjaminan Mutu (LPM)'),
  ('employee', 'Pegawai (Dosen & Tenaga Kependidikan)')
on conflict (code) do nothing;

insert into public.permissions (code, description) values
  ('user.manage', 'Kelola akun pengguna'),
  ('role.manage', 'Kelola role & hak akses'),
  ('settings.manage', 'Konfigurasi parameter sistem (jenis cuti, jam kerja, titik & radius GPS)'),
  ('audit.view', 'Lihat audit log'),
  ('master.manage', 'Kelola data jabatan & unit kerja'),
  ('employee.view', 'Lihat data seluruh pegawai'),
  ('employee.manage', 'Tambah, edit, nonaktifkan data pegawai'),
  ('attendance.view', 'Lihat data presensi seluruh pegawai'),
  ('attendance.manage', 'Koreksi & rekap absensi'),
  ('leave.view', 'Lihat data cuti & izin seluruh pegawai'),
  ('leave.manage', 'Setujui/tolak, koreksi, rekap cuti & izin'),
  ('appraisal.manage', 'Kelola periode, isi, verifikasi, rekap penilaian kinerja'),
  ('training.manage', 'Kelola pembukaan, persetujuan, seleksi, dan hasil diklat'),
  ('mutation.manage', 'Kelola usulan & eksekusi mutasi'),
  ('promotion.manage', 'Kelola kenaikan pangkat & jabatan'),
  ('announcement.manage', 'Buat & kelola pengumuman'),
  ('report.view', 'Lihat dashboard statistik (agregat, tanpa data per pegawai) sesuai report_scopes')
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
      'appraisal.manage',
      'training.manage', 'mutation.manage', 'promotion.manage',
      'announcement.manage', 'report.view'
    ]
    when 'chair' then array['report.view']
    when 'vice_chair' then array['report.view']
    when 'quality_assurance' then array['report.view']
    else array[]::text[]
  end
)
on conflict do nothing;

-- Amuntai (Kalimantan Selatan) uses WITA.
insert into public.app_settings (key, value, description) values
  ('timezone', '"Asia/Makassar"', 'Zona waktu kampus untuk presensi (WITA)')
on conflict (key) do nothing;

-- Single campus attendance point; check-in is accepted within 100 m.
insert into public.attendance_locations (name, latitude, longitude, radius_meters) values
  ('Kampus STIA Amuntai', -2.422180, 115.262310, 100);

-- Confirmed working hours. Lecturers' check-out is flexible (teaching), so it is never flagged as early leave.
insert into public.work_schedules (name, employee_category, check_in_time, check_out_time, late_tolerance_minutes, flags_early_leave) values
  ('Jam kerja tenaga kependidikan', 'staff', '09:00', '16:30', 30, true),
  ('Jam kerja dosen', 'lecturer', '08:30', '18:00', 30, false)
on conflict (employee_category) do nothing;

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
