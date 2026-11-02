# Skema Database Supabase

File SQL ada di `supabase/`:

| File | Isi |
|---|---|
| `migrations/20261102000001_core.sql` | Unit kerja, jabatan, status kepegawaian, pegawai, role & permission, akun, audit log, riwayat, dokumen, perbaikan data, notifikasi, pengaturan |
| `migrations/20261102000002_attendance.sql` | Jam kerja, lokasi GPS, presensi, koreksi presensi, rekap bulanan |
| `migrations/20261102000003_leave.sql` | Jenis cuti/izin, kuota, pengajuan, persetujuan, rekap |
| `migrations/20261102000004_performance_appraisal.sql` | Periode penilaian, form penilaian, indikator, rekap per unit |
| `migrations/20261102000005_training_mutation_promotion.sql` | Diklat, pendaftaran diklat, mutasi, kenaikan pangkat/jabatan |
| `migrations/20261102000006_announcements_reports_storage.sql` | Pengumuman, rekap pegawai per unit, bucket Storage |
| `seed.sql` | Role, permission, pemetaan role→permission, status kepegawaian, jenis cuti/izin |

---

## Cara memakai di Supabase

**Lewat Dashboard (paling mudah)**

1. Buat project baru di supabase.com.
2. Buka **SQL Editor**, jalankan isi setiap file di `supabase/migrations/` **berurutan** (0001 → 0006).
3. Jalankan `supabase/seed.sql`.
4. Buat user pertama di **Authentication → Users → Add user** (email + password). Login aplikasi memakai email.
5. Hubungkan user itu sebagai superadmin di SQL Editor:
   ```sql
   insert into public.user_accounts (id, role_id)
   values ('<UUID user dari langkah 4>', (select id from public.roles where code = 'superadmin'));
   ```
6. Isi titik presensi (radius default 100 m) dan jam kerja:
   ```sql
   insert into public.attendance_locations (name, latitude, longitude) values ('Kampus STIA Amuntai', <lat>, <lng>);
   insert into public.work_schedules (name, check_in_time, check_out_time, late_tolerance_minutes, is_default)
   values ('Jam kerja umum', '<jam masuk>', '<jam pulang>', <toleransi menit>, true);
   ```
7. Salin **Project URL** dan **anon public key** (Settings → API) ke `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

**Lewat Supabase CLI**

```bash
supabase link --project-ref <ref>
supabase db push          # menjalankan supabase/migrations
psql "<connection string>" -f supabase/seed.sql
```

---

## Pemetaan nama (dokumen → tabel/kolom)

| Data Requirement | Tabel | Kolom penting |
|---|---|---|
| Data Pegawai | `employees` | `employee_number` (NIP), `lecturer_number` (NIDN), `national_id_number` (NIK), `full_name` (nama), `birth_place`, `birth_date`, `gender`, `religion` (agama), `marital_status`, `address`, `city`, `province`, `postal_code`, `phone` (no_hp), `email`, `photo_path` (foto), `employment_status_code` (status_kepegawaian), `appointment_date` (tanggal_pengangkatan), `work_unit_id`, `position_id`, `rank_grade` (golongan), `service_years`/`service_months` (masa_kerja), `active_status` (status_aktif), `category` (dosen/tendik) |
| Unit Kerja | `work_units` | `name`, `unit_type` (jenis unit), `parent_id` (induk unit) |
| Jabatan | `positions` | `name`, `position_type` (jenis), `level` |
| Riwayat Pendidikan | `education_histories` | `education_level` (jenjang), `institution`, `graduation_year`, `certificate_path` (ijazah) |
| Riwayat Diklat | `training_histories` | `training_name`, `organizer` (penyelenggara), `start_date`, `end_date`, `certificate_path` |
| Absensi | `attendance_records` | `attendance_date`, `check_in_at` (jam masuk), `check_out_at` (jam pulang), `status`, `note` (keterangan), `source` (`gps` atau `manual` untuk koreksi HR), `attendance_location_id`, koordinat & akurasi GPS |
| Cuti | `leave_types` + `leave_balances` | jenis, kuota per tahun, `requires_document` |
| Pengajuan Cuti | `leave_requests` | `leave_type_id`, `start_date`, `end_date`, `reason` (alasan), `status`, `decided_by` (disetujui_oleh, akun HR), `decided_at` (tanggal_disetujui), `decision_note` (catatan) |
| Penilaian Kinerja (periode) | `appraisal_periods` | `name`, `start_date`, `end_date`, `is_active` |
| Form Penilaian | `appraisals` + `appraisal_items` | `period_id`, `employee_id`, `appraised_by` (HR yang mengisi; menggantikan atasan_id), `performance_score` (nilai_kinerja), `note`, `status`; item: indikator, target, realisasi, nilai |
| Mutasi | `mutations` | `from_work_unit_id` (unit lama), `to_work_unit_id` (unit baru), `effective_date` |
| Users | `user_accounts` | `id` (= `auth.users.id`), `employee_id`, `role_id`, `is_active` (status_akun). Email ada di `auth.users.email` (login memakai email, tanpa username) |
| Role / Permission / Role Permission | `roles`, `permissions`, `role_permissions` | `code` mis. `leave.manage` |
| audit_log | `audit_logs` | `user_id`, `action` (aksi), `entity` (entitas), `entity_id`, `change_description`, `old_data`, `new_data`, `created_at` (timestamp) |

**Tambahan di luar Data Requirement** (dibutuhkan oleh use case/activity diagram):
`rank_histories`, `position_histories`, `disciplinary_histories`, `award_histories` (riwayat di Analisa Kebutuhan),
`employee_documents`, `profile_change_requests` (ajukan perbaikan data), `attendance_corrections`,
`work_schedules`, `attendance_locations`, `training_registrations`, `promotion_proposals`,
`announcements`, `notifications`, `app_settings`.

**Perbedaan dari Data Requirement:**
- `users.password_hash` dan `username` tidak ada. Email & password disimpan oleh Supabase Auth (`auth.users`).
- `atasan_id` di form penilaian diganti `appraised_by` (akun HR), karena penilaian diisi HR.
- Tidak ada relasi atasan–bawahan: pimpinan hanya melihat statistik agregat.

---

## Keamanan (Row Level Security)

Semua tabel memakai RLS. Aturan dasarnya:

| Siapa | Boleh melihat / melakukan |
|---|---|
| Pegawai | Data dirinya sendiri; presensi lewat `check_in`/`check_out`; ajukan cuti, diklat, perbaikan data |
| HR (`hr_admin`) | Semua data kepegawaian; satu-satunya pemberi persetujuan |
| Pimpinan (`leader`) | Hanya fungsi statistik `report_*` (agregat per unit, dosen & tendik dipisah) + data dirinya sendiri |
| Superadmin | Akun, role & hak akses, pengaturan, audit log |

Fungsi bantu: `current_employee_id()`, `has_permission(code)`, `can_view_employee(employee_id, permission)`.

**Presensi GPS**

| Fungsi | Dipakai untuk |
|---|---|
| `check_in(lat, lon, accuracy)` | Pegawai presensi masuk. Ditolak jika di luar radius titik aktif (default 100 m) atau sudah presensi hari ini. Status `late` dihitung dari jam kerja default |
| `check_out(lat, lon, accuracy)` | Presensi pulang di dalam radius; status `early_leave` jika sebelum jam pulang |
| `correct_attendance(employee, date, …, reason)` | HR mengoreksi presensi; perubahan dicatat di `attendance_corrections`, pegawai mendapat notifikasi |

Pegawai tidak bisa menulis ke `attendance_records` secara langsung. Tanggal dan jam memakai zona waktu
`app_settings.timezone` (`Asia/Makassar`, WITA).

**Persetujuan (semuanya HR)**

| Fungsi | Dipakai untuk |
|---|---|
| `decide_leave_request(id, approve, note)` | HR setuju/tolak cuti (alasan wajib jika ditolak); kuota otomatis terpakai; notifikasi ke pegawai |
| `generate_appraisals(period_id)` | HR membuat form penilaian untuk semua pegawai aktif |
| `review_appraisal(id, accept, note)` | HR memverifikasi atau mengembalikan penilaian untuk diperbaiki |
| `decide_training_registration(id, approve, note)` | HR setuju/tolak pendaftaran diklat |
| `execute_mutation(id)` | HR menjalankan mutasi yang disetujui (unit/jabatan + riwayat) |
| `log_audit_event(action, entity, …)` | Mencatat kejadian non-tabel, mis. login |

**Statistik untuk pimpinan** (juga bisa dipakai HR)

| Fungsi | Isi |
|---|---|
| `report_employee_statistics()` | Jumlah dosen & tendik aktif, nonaktif, pensiun per unit kerja |
| `report_attendance_by_unit(month)` | Hadir, terlambat, pulang awal, tidak hadir per unit & kategori |
| `report_leave_by_unit(year)` | Cuti/izin disetujui & menunggu per unit, kategori, jenis |
| `report_appraisal_by_unit(period_id)` | Rata-rata, terendah, tertinggi nilai kinerja per unit & kategori |

**Notifikasi:** pengajuan cuti baru dikirim ke semua akun HR; hasil keputusan dikirim ke pegawai.
Kolom `notifications.email_sent_at` disiapkan untuk pengiriman email nanti (Edge Function).

Perubahan pada tabel penting (pegawai, akun, cuti, presensi, penilaian, mutasi, dll.) otomatis dicatat
di `audit_logs` lewat trigger.

**Belum ditangani di skema:**
- Verifikasi sidik jari (WebAuthn) sebelum `check_in`/`check_out`. Ini dikerjakan di server aplikasi pada Fase 3.
- Pengiriman email notifikasi (Edge Function + layanan email).
- Pembuatan akun pegawai oleh HR (butuh service role key, dijalankan di server).

---

## Pengujian

Skema sudah diuji dengan PGlite (Postgres di Node) memakai stub `auth` & `storage`:
seluruh migrasi + seed berjalan, dan 37 skenario lolos. Skenario mencakup: visibilitas per peran
(pimpinan hanya statistik), cuti diajukan → HR setuju → kuota & notifikasi, presensi GPS (65 m diterima,
150 m ditolak, presensi ganda ditolak, pulang awal), koreksi HR, penilaian kinerja oleh HR, diklat → riwayat,
mutasi, dan akses file Storage. Tetap jalankan di project Supabase uji coba sebelum dipakai.
