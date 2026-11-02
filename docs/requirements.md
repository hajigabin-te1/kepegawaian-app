# Kebutuhan Sistem — SIMPEG STIA Amuntai

Ringkasan dua dokumen sumber dan penyesuaiannya dengan `CLAUDE.md`:

1. **Analisa Kebutuhan** (Tahap 1: Requirement Analysis), 3 halaman
2. **Use Case Diagram / Activity Diagram / User Flow / Data Requirement**, 8 halaman

Skema database Supabase yang dibuat dari dokumen ini ada di `supabase/` (penjelasan: `docs/database-schema.md`).

---

## 1. Masalah

Belum ada sistem informasi untuk **presensi**, **pengelolaan pegawai**, dan **penilaian kinerja**
dosen dan tenaga kependidikan di lingkungan STIA Amuntai.

## 2. Pengguna & peran

| Dokumen menyebut | Peran di sistem (`roles.code`) | Catatan |
|---|---|---|
| Admin Sistem / PUSKOM, Superadmin | `superadmin` | Akun, role & hak akses, konfigurasi, audit log |
| Bagian Kepegawaian, Kabag Kepegawaian, HR | `hr_admin` | Mengelola seluruh data kepegawaian |
| Pimpinan | `leader` | Melihat data & laporan |
| Pegawai (Dosen & Tendik) | `employee` | Data diri, presensi, cuti/izin, diklat |
| Atasan Langsung (Kaprodi/Kabag/Manajer Unit) | *bukan role* → relasi `employees.supervisor_id` | Pegawai yang menjadi atasan tetap ber-role `employee`, tetapi mendapat akses ke data bawahannya |
| Sistem eksternal (Keuangan, SIAKAD, SSO) | — | Di luar cakupan tahap awal |

## 3. Modul (kebutuhan fungsional)

| # | Modul | Fitur utama | Cakupan inti?* |
|---|---|---|---|
| 1 | Data Pegawai | Data pokok, kepegawaian, riwayat (pendidikan, diklat, jabatan, pangkat, mutasi, sanksi, penghargaan), unggah dokumen, tambah/edit/nonaktifkan, pegawai ajukan perbaikan data | Prasyarat |
| 2 | Presensi | Catat masuk/pulang/terlambat/pulang awal, data dari fingerprint/RFID/GPS, rekap harian–bulanan per pegawai & unit, riwayat sendiri, koreksi oleh HR + persetujuan atasan | ✅ |
| 3 | Cuti & Izin | Ajukan cuti (tahunan, sakit, alasan penting, besar, melahirkan) dan izin (setengah hari, penting), atasan setuju/tolak, kuota berkurang, rekap HR | ✅ |
| 4 | Penilaian Kinerja (DP3/SKP) | HR buka periode, sistem buat daftar yang dinilai, atasan isi indikator/target/realisasi/nilai, verifikasi/perbaikan, rekap per unit, pegawai lihat hasil | ✅ |
| 5 | Diklat | HR buka pendaftaran + kuota, pegawai daftar, atasan setuju/tolak, HR tetapkan peserta & hasil, masuk riwayat | |
| 6 | Mutasi | HR/atasan usulkan, alur persetujuan, update unit/jabatan + riwayat | |
| 7 | Kenaikan Pangkat & Jabatan | Usulan, persetujuan, SK (hanya di use case) | |
| 8 | Laporan & Dashboard | Rekap pegawai per unit/fakultas/prodi, rekap cuti/absensi/kinerja, neraca kebutuhan pegawai | |
| 9 | Pengumuman | HR buat & kelola, pegawai lihat | |
| 10 | Pengguna & Keamanan | Kelola akun & role, audit log, login terenkripsi | Prasyarat |

\* "Scope sistem" di Analisa Kebutuhan hanya menyebut presensi, cuti/izin, dan penilaian kinerja.

**Kebutuhan non-fungsional:** minimal 100 pengguna aktif bersamaan, lokasi GPS presensi ditentukan,
login wajib dengan username & password terenkripsi.

---

## 4. Penyesuaian dengan CLAUDE.md

| Aturan CLAUDE.md | Kondisi baru | Penyesuaian |
|---|---|---|
| "API pegawai sudah disediakan. Jangan membuat backend atau database baru." | Backend memakai **Supabase** (Postgres + Auth + Storage) | Aturan diperbarui: Supabase adalah backend resmi; jangan membuat backend lain |
| "Jangan mengarang endpoint, field, response, atau aturan bisnis." | Field sudah ada di Data Requirement | Skema mengikuti dokumen. Aturan yang belum jelas dibuat **konfigurasi** (bukan hardcode) dan dicatat di bagian 6 |
| "Gunakan Axios … interceptor base URL, Authorization, 401" | Supabase diakses lewat `@supabase/supabase-js` | Service layer memanggil Supabase client, bukan Axios. Axios hanya untuk API pihak ketiga |
| "Semua pemanggilan API harus melalui service layer" | Tetap | `features/*/services` membungkus query Supabase; komponen tidak memanggil Supabase langsung |
| "TanStack Query untuk data server, Zustand hanya UI" | Tetap | Hook di `features/*/hooks` memakai TanStack Query di atas service |
| "Kode, nama variabel … English" | Dokumen memakai nama Indonesia (`pegawai_id`, `nama`) | Tabel & kolom memakai bahasa Inggris; pemetaannya ada di `docs/database-schema.md` |
| "Kerjakan fitur secara bertahap" | 10 modul | Fase di bagian 5; skema dipecah per modul (6 file migrasi) |
| Struktur `features/employees`, `features/auth` | Modul bertambah | Tambah `features/attendance`, `features/leave`, `features/performance`, `features/training`, `features/mutation` saat fasenya tiba |
| Auth mock sementara (`mock-auth.ts`) | Supabase Auth | Diganti di Fase 1; cookie sesi dikelola `@supabase/ssr` |

---

## 5. Rencana bertahap

| Fase | Isi | Migrasi |
|---|---|---|
| 0 | Setup Supabase: jalankan migrasi + seed, buat akun superadmin | semua |
| 1 | Login Supabase Auth (ganti mock), RBAC di proxy & menu, kelola akun (superadmin) | `..._core` |
| 2 | Master data (unit kerja, jabatan) + Data Pegawai CRUD + riwayat + dokumen + perbaikan data | `..._core`, `..._storage` |
| 3 | Presensi (web/GPS) + rekap + koreksi | `..._attendance` |
| 4 | Cuti & Izin (pengajuan → persetujuan atasan → kuota → rekap) | `..._leave` |
| 5 | Penilaian Kinerja | `..._performance_appraisal` |
| 6 | Dashboard per peran + laporan | view rekap |
| 7 | Diklat, Mutasi, Kenaikan Pangkat, Pengumuman | `..._training_mutation_promotion`, `..._announcements` |
| Nanti | Integrasi fingerprint/RFID, Keuangan, SIAKAD (BKD), SSO, backup/restore | — |

---

## 6. Konflik antar dokumen & pertanyaan yang perlu dijawab

**Perbedaan antar dokumen**

1. **Siapa yang mengisi penilaian kinerja?** Analisa Kebutuhan: *atasan* mengisi, HR verifikasi.
   Activity Diagram: *HR* mengisi, *atasan* verifikasi. → Skema mengikuti Analisa Kebutuhan
   (`appraisals.appraiser_id` = atasan; HR memverifikasi lewat `review_appraisal`). HR tetap bisa mengisi.
2. **Daftar role berbeda-beda** (Superadmin/Kabag/Pimpinan/Pegawai vs. Kabag/Pimpinan/Admin/Tenaga
   Pendidik/Tenaga Kependidikan). → 4 role; Dosen vs Tendik dibedakan lewat `employees.category`, bukan role.
3. **"Cuti"** di Data Requirement berisi `jenis, kuota, dokumen` (master jenis cuti), sedangkan
   activity diagram menyebut "sistem kurangi kuota". → `leave_types` (jenis) + `leave_balances` (kuota per pegawai per tahun).
4. **Siapa yang menyetujui cuti?** Analisa: *atasan*. Activity: *Pimpinan/Kabag*. → Atasan langsung
   (`supervisor_id`); HR dengan izin `leave.approve_all` juga bisa.

**Aturan bisnis yang belum ada di dokumen** (dibiarkan kosong/konfigurasi, perlu dikonfirmasi)

5. Kuota tiap jenis cuti per tahun, dan apakah kuota boleh terlampaui.
6. Cara menghitung hari cuti (hari kerja atau hari kalender, libur nasional).
7. Jam kerja, toleransi terlambat, dan apakah berbeda untuk dosen/tendik (`work_schedules`).
8. Titik & radius lokasi GPS presensi (`attendance_locations`).
9. Rumus nilai kinerja dan skala nilai.
10. Arti singkatan **TTU** dan **TTK** serta daftar lengkap status kepegawaian ("dll.").
11. Jenis unit kerja yang dipakai (fakultas, prodi, bagian, UPT, …).
12. Login memakai **username** atau **email**? Supabase Auth memakai email. Usulan: username tetap
    disimpan di `user_accounts.username`, login memakai email (atau NIP sebagai username dengan
    pemetaan ke email). Perlu keputusan.
13. Alur persetujuan mutasi "sesuai kebijakan kampus": siapa saja yang harus menyetujui?
14. "Neraca kebutuhan pegawai": data apa yang dibandingkan (formasi vs. jumlah pegawai)?
