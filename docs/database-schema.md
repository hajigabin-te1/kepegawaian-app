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
| `migrations/20261103000001_restrict_function_execute.sql` | Membatasi fungsi yang bisa dipanggil lewat API: `anon` tidak bisa memanggil fungsi apa pun; pengguna login hanya bisa memanggil RPC aplikasi dan helper RLS |
| `migrations/20261104000001_account_management.sql` | `list_user_accounts()` (daftar akun + email untuk superadmin) dan pengaman agar akun tidak bisa menonaktifkan/mengubah peran dirinya sendiri |
| `migrations/20261112000001_link_account_employee.sql` | `list_linkable_employees()`: superadmin memilih pegawai untuk dihubungkan ke akun tanpa izin `employee.view` (hanya id, nama, NIP pegawai aktif yang belum punya akun) |
| `migrations/20261112000002_profile_change_requests.sql` | `submit_profile_change_request()` (pegawai mengajukan perbaikan data pribadi, kolom divalidasi) dan `decide_profile_change_request()` (HR setuju/tolak; setuju langsung memperbarui `employees`). Kebijakan insert/update langsung pada `profile_change_requests` dihapus |
| `migrations/20261112000003_leave_rules.sql` | Aturan cuti: tabel `public_holidays`, kolom `counts_toward_quota` / `female_only` / `max_months` pada `leave_types`, jenis `long_sick`, pengaturan `annual_leave_quota`, fungsi `count_leave_days`, `get_leave_balance`, `submit_leave_request`, `cancel_leave_request`; `decide_leave_request` tidak lagi menulis `leave_balances` |
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
6. Titik presensi kampus dan jam kerja **sudah diisi oleh `seed.sql`**:

   | Data | Nilai |
   |---|---|
   | Titik presensi | Kampus STIA Amuntai, -2.422180, 115.262310, radius 100 m |
   | Tendik | Datang 09:00 (toleransi 30 menit), pulang 16:30 |
   | Dosen | Datang 08:30 (toleransi 30 menit), pulang 18:00, pulang bebas (`flags_early_leave = false`) |

   Perubahan berikutnya cukup lewat `update` pada `attendance_locations` / `work_schedules`.
7. Atur cakupan statistik pimpinan setelah akunnya dibuat (lihat bagian "Statistik untuk pimpinan").
8. Salin **Project URL** dan **anon public key** (Settings → API) ke `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

**Jika `db push` gagal dengan `... already exists`**

Artinya SQL pernah dijalankan manual (SQL Editor), sehingga tabelnya ada tetapi riwayat migrasi CLI kosong.
Tandai migrasi yang sudah terpasang, lalu push sisanya:

```bash
npx supabase migration repair --status applied 20261102000001 20261102000002 20261102000003 20261102000004 20261102000005 20261102000006
npx supabase db push
npx supabase migration list   # kolom Local dan Remote harus sama
```

**Lewat Supabase CLI**

```bash
supabase link --project-ref <ref>
supabase db push          # menjalankan supabase/migrations
psql "<connection string>" -f supabase/seed.sql
```

---

## Edge Function

| Function | Dipakai untuk |
|---|---|
| `admin-create-user` (`supabase/functions/admin-create-user`) | Superadmin membuat akun baru: membuat user di Supabase Auth (langsung terkonfirmasi) dan baris `user_accounts` dengan peran yang dipilih, lalu mencatat audit log. Hanya akun dengan izin `user.manage` yang bisa memanggilnya |
| `admin-delete-user` (`supabase/functions/admin-delete-user`) | Superadmin menghapus akun: menghapus user di Supabase Auth (baris `user_accounts` ikut terhapus). Ditolak untuk akun sendiri dan superadmin terakhir. Data pegawai tidak dihapus; kolom pelaku di riwayat/persetujuan menjadi kosong lewat `on delete set null`. Dicatat di audit log |

Function memakai secret key bawaan Supabase (tidak pernah dikirim ke browser) dan di-deploy dengan
`verify_jwt = false`, karena sesi pemanggil diverifikasi di dalam kode. Deploy ulang setelah mengubah kodenya:

```bash
npx supabase functions deploy admin-create-user
npx supabase functions deploy admin-delete-user
```

Karena akun dibuat oleh superadmin, pendaftaran publik sebaiknya dimatikan:
**Authentication → Sign In / Providers → Allow new users to sign up = off**.

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
| Pimpinan (`chair`, `vice_chair`, `quality_assurance`) | Hanya fungsi statistik `report_*` (agregat, sesuai `report_scopes`) + data dirinya sendiri |
| Superadmin | Akun, role & hak akses, pengaturan, audit log |

Fungsi bantu: `current_employee_id()`, `has_permission(code)`, `can_view_employee(employee_id, permission)`,
`can_report_on(report, unit, category)`, `has_report_access(report)`, `unit_is_within(unit, parent)`.

**Presensi GPS**

| Fungsi | Dipakai untuk |
|---|---|
| `check_in(lat, lon, accuracy)` | Tombol presensi masuk. Ditolak dengan error `Outside the attendance area` jika di luar radius (100 m); UI menampilkan **"Tidak bisa melakukan presensi"**. Juga menolak presensi ganda. Status `late` jika lewat jam datang + toleransi sesuai jadwal kategori pegawai (dosen/tendik) |
| `check_out(lat, lon, accuracy)` | Presensi pulang di dalam radius. Tendik yang pulang sebelum 16:30 ditandai `early_leave`; dosen tidak pernah ditandai pulang awal |
| `correct_attendance(employee, date, …, reason)` | HR mengoreksi presensi; perubahan dicatat di `attendance_corrections`, pegawai mendapat notifikasi |

Pegawai tidak bisa menulis ke `attendance_records` secara langsung. Tanggal dan jam memakai zona waktu
`app_settings.timezone` (`Asia/Makassar`, WITA). Hari tanpa presensi dibiarkan kosong (tidak ada catatan
"tidak hadir" otomatis).

**Persetujuan (semuanya HR)**

| Fungsi | Dipakai untuk |
|---|---|
| `decide_profile_change_request(id, approve, note)` | HR setuju/tolak perbaikan data pegawai (alasan wajib jika ditolak); jika disetujui, data pegawai diperbarui. Kolom yang boleh diajukan: nama, NIK, tempat/tanggal lahir, jenis kelamin, agama, status pernikahan, alamat, kota, provinsi, kode pos, no. HP, email |
| `submit_leave_request(type, start, end, reason, attachment)` | Pegawai mengajukan cuti/izin. Server menghitung hari (tanpa Minggu dan tanggal merah), menolak jika bertabrakan, melebihi sisa kuota, jenis khusus perempuan untuk non-perempuan, atau melebihi 3 bulan (cuti melahirkan) |
| `cancel_leave_request(id)` | Pegawai membatalkan pengajuannya yang masih menunggu |
| `get_leave_balance(employee, year)` | Kuota, terpakai, menunggu, dan sisa. Dihitung dari pengajuan; baris `leave_balances` jenis `annual` hanya menimpa kuota pegawai tertentu |
| `decide_leave_request(id, approve, note)` | HR setuju/tolak cuti (alasan wajib jika ditolak); notifikasi ke pegawai |
| `generate_appraisals(period_id)` | HR membuat form penilaian untuk semua pegawai aktif |
| `review_appraisal(id, accept, note)` | HR memverifikasi atau mengembalikan penilaian untuk diperbaiki |
| `decide_training_registration(id, approve, note)` | HR setuju/tolak pendaftaran diklat |
| `execute_mutation(id)` | HR menjalankan mutasi yang disetujui (unit/jabatan + riwayat) |
| `log_audit_event(action, entity, …)` | Mencatat kejadian non-tabel, mis. login |

**Statistik untuk pimpinan** (juga bisa dipakai HR)

Setiap fungsi hanya menghitung pegawai di dalam cakupan akun pemanggil (`report_scopes`).
HR otomatis melihat seluruh kampus.

| Fungsi | Isi |
|---|---|
| `report_employee_statistics()` | Jumlah pegawai aktif, nonaktif, pensiun per unit kerja & kategori (dosen/tendik) |
| `report_attendance_by_unit(month)` | Hadir, terlambat, pulang awal, tidak hadir per unit & kategori |
| `report_leave_by_unit(year)` | Cuti/izin disetujui & menunggu per unit, kategori, jenis |
| `report_appraisal_by_unit(period_id)` | Rata-rata, terendah, tertinggi nilai kinerja per unit & kategori |

**Mengatur cakupan (`report_scopes`)** — satu baris per cakupan, satu akun boleh punya beberapa:

| Kolom | Arti |
|---|---|
| `work_unit_id` | Unit yang dicakup, termasuk semua unit di bawahnya. `null` = seluruh kampus |
| `employee_category` | `lecturer`, `staff`, atau `null` (keduanya) |
| `reports` | Dari `employees`, `attendance`, `leave`, `appraisal` (default: semua) |

```sql
-- Ketua atau LPM: seluruh kampus, semua statistik
insert into public.report_scopes (user_id) values ('<uuid akun>');

-- Wakil Ketua Bidang Akademik: unit bidang (unit_type 'field') beserta semua unit di bawahnya
insert into public.report_scopes (user_id, work_unit_id) values ('<uuid akun>', '<uuid unit Bidang Akademik>');
```

Supaya cakupan Wakil Ketua bekerja, buat unit bertipe `field` untuk setiap bidang dan jadikan induk
(`parent_id`) bagi unit-unit di bawahnya.

**Notifikasi:** pengajuan cuti baru dikirim ke semua akun HR; hasil keputusan dikirim ke pegawai.
Kolom `notifications.email_sent_at` disiapkan untuk pengiriman email nanti (Edge Function).

Perubahan pada tabel penting (pegawai, akun, cuti, presensi, penilaian, mutasi, dll.) otomatis dicatat
di `audit_logs` lewat trigger.

**Belum ditangani di skema:**
- Pengiriman email notifikasi (Edge Function + layanan email).
- Lokasi GPS dikirim oleh browser, jadi bisa dipalsukan oleh pengguna yang paham teknis (fake GPS).
  Mitigasi yang mungkin nanti: tolak akurasi GPS yang buruk, batasi presensi dari jaringan Wi-Fi kampus.
- Pembuatan akun pegawai oleh HR (butuh service role key, dijalankan di server).

---

## Pengujian

Skema sudah diuji dengan PGlite (Postgres di Node) memakai stub `auth` & `storage`:
seluruh migrasi + seed berjalan, dan 58 skenario lolos (termasuk hak eksekusi fungsi untuk `anon` dan pengguna login). Skenario mencakup: visibilitas per peran
(pimpinan hanya statistik; cakupan Ketua, Wakil Ketua bidang, dan LPM), cuti diajukan → HR setuju → kuota & notifikasi, presensi GPS di titik kampus
(65 m diterima, 150 m ditolak, presensi ganda ditolak, terlambat, pulang awal tendik, pulang bebas dosen), koreksi HR, penilaian kinerja oleh HR, diklat → riwayat,
mutasi, dan akses file Storage. Tetap jalankan di project Supabase uji coba sebelum dipakai.
