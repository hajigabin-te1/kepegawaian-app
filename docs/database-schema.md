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
4. Buat user pertama di **Authentication → Users → Add user** (email + password).
5. Hubungkan user itu sebagai superadmin di SQL Editor:
   ```sql
   insert into public.user_accounts (id, username, role_id)
   values ('<UUID user dari langkah 4>', 'admin', (select id from public.roles where code = 'superadmin'));
   ```
6. Salin **Project URL** dan **anon public key** (Settings → API) ke `.env.local`:
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
| Data Pegawai | `employees` | `employee_number` (NIP), `lecturer_number` (NIDN), `national_id_number` (NIK), `full_name` (nama), `birth_place`, `birth_date`, `gender`, `religion` (agama), `marital_status`, `address`, `city`, `province`, `postal_code`, `phone` (no_hp), `email`, `photo_path` (foto), `employment_status_code` (status_kepegawaian), `appointment_date` (tanggal_pengangkatan), `work_unit_id`, `position_id`, `rank_grade` (golongan), `service_years`/`service_months` (masa_kerja), `active_status` (status_aktif), `category` (dosen/tendik), `supervisor_id` (atasan langsung) |
| Unit Kerja | `work_units` | `name`, `unit_type` (jenis unit), `parent_id` (induk unit) |
| Jabatan | `positions` | `name`, `position_type` (jenis), `level` |
| Riwayat Pendidikan | `education_histories` | `education_level` (jenjang), `institution`, `graduation_year`, `certificate_path` (ijazah) |
| Riwayat Diklat | `training_histories` | `training_name`, `organizer` (penyelenggara), `start_date`, `end_date`, `certificate_path` |
| Absensi | `attendance_records` | `attendance_date`, `check_in_at` (jam masuk), `check_out_at` (jam pulang), `status`, `note` (keterangan), `source` (sumber) |
| Cuti | `leave_types` + `leave_balances` | jenis, kuota per tahun, `requires_document` |
| Pengajuan Cuti | `leave_requests` | `leave_type_id`, `start_date`, `end_date`, `reason` (alasan), `status`, `approver_id` (disetujui_oleh), `decided_at` (tanggal_disetujui), `decision_note` (catatan) |
| Penilaian Kinerja (periode) | `appraisal_periods` | `name`, `start_date`, `end_date`, `is_active` |
| Form Penilaian | `appraisals` + `appraisal_items` | `period_id`, `employee_id`, `appraiser_id` (atasan_id), `performance_score` (nilai_kinerja), `note`, `status`; item: indikator, target, realisasi, nilai |
| Mutasi | `mutations` | `from_work_unit_id` (unit lama), `to_work_unit_id` (unit baru), `effective_date` |
| Users | `user_accounts` | `id` (= `auth.users.id`), `employee_id`, `username`, `role_id`, `is_active` (status_akun) |
| Role / Permission / Role Permission | `roles`, `permissions`, `role_permissions` | `code` mis. `leave.manage` |
| audit_log | `audit_logs` | `user_id`, `action` (aksi), `entity` (entitas), `entity_id`, `change_description`, `old_data`, `new_data`, `created_at` (timestamp) |

**Tambahan di luar Data Requirement** (dibutuhkan oleh use case/activity diagram):
`rank_histories`, `position_histories`, `disciplinary_histories`, `award_histories` (riwayat di Analisa Kebutuhan),
`employee_documents`, `profile_change_requests` (ajukan perbaikan data), `attendance_corrections`,
`work_schedules`, `attendance_locations`, `training_registrations`, `promotion_proposals`,
`announcements`, `notifications`, `app_settings`.

**Perbedaan dari Data Requirement:** `users.password_hash` tidak ada. Password disimpan dan di-hash
oleh Supabase Auth (`auth.users`), jadi tidak perlu disimpan di tabel sendiri.

---

## Keamanan (Row Level Security)

Semua tabel memakai RLS. Aturan dasarnya:

| Siapa | Boleh melihat |
|---|---|
| Pegawai | Data dirinya sendiri |
| Atasan (`supervisor_id`) | Data bawahan langsungnya |
| Role dengan permission tertentu | Semua data modul itu (mis. `employee.view`, `leave.view`) |

Fungsi bantu: `current_employee_id()`, `has_permission(code)`, `is_supervisor_of(employee_id)`,
`can_view_employee(employee_id, permission)`.

Aksi yang mengubah status (persetujuan) dilakukan lewat fungsi RPC, bukan update langsung:

| Fungsi | Dipakai untuk |
|---|---|
| `decide_leave_request(id, approve, note)` | Atasan setuju/tolak cuti; kuota otomatis bertambah terpakai; notifikasi ke pegawai |
| `decide_attendance_correction(id, approve, note)` | Atasan setuju/tolak koreksi presensi; data presensi otomatis diperbarui |
| `generate_appraisals(period_id)` | HR membuat form penilaian untuk semua pegawai aktif |
| `review_appraisal(id, accept, note)` | HR memverifikasi atau minta perbaikan penilaian |
| `decide_training_registration(id, approve, note)` | Atasan setuju/tolak pendaftaran diklat |
| `execute_mutation(id)` | HR menjalankan mutasi yang disetujui (unit/jabatan + riwayat) |
| `log_audit_event(action, entity, …)` | Mencatat kejadian non-tabel, mis. login |

Perubahan pada tabel penting (pegawai, akun, cuti, presensi, penilaian, mutasi, dll.) otomatis dicatat
di `audit_logs` lewat trigger.

**Belum ditangani di skema (perlu Edge Function nanti):** validasi lokasi GPS & jam saat presensi
mandiri, impor data fingerprint/RFID, dan pembuatan akun pegawai otomatis oleh HR (butuh service role key).

---

## Pengujian

Skema sudah diuji dengan PGlite (Postgres di Node) memakai stub `auth` & `storage`:
seluruh migrasi + seed berjalan, dan 28 skenario RLS/alur lolos (visibilitas per peran, pengajuan →
persetujuan cuti + kuota + notifikasi, presensi mandiri & koreksi, penilaian kinerja, diklat → riwayat,
mutasi, laporan, akses file Storage). Tetap jalankan di project Supabase uji coba sebelum dipakai.
