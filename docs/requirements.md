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
| Bagian Kepegawaian, Kabag Kepegawaian, HR | `hr_admin` | **Satu-satunya pemberi persetujuan** (cuti/izin, koreksi presensi, penilaian kinerja, diklat, mutasi, kenaikan pangkat) dan pengelola seluruh data kepegawaian |
| Pimpinan dan Atasan Langsung (Kaprodi/Kabag/Manajer Unit) | `leader` | **Hanya melihat dashboard statistik** pegawai (dosen & tendik) dalam bentuk agregat per unit; tidak melihat data per pegawai dan tidak menyetujui apa pun |
| Pegawai (Dosen & Tendik) | `employee` | Data diri, presensi GPS, ajukan cuti/izin, daftar diklat, lihat hasil penilaian |
| Sistem eksternal (Keuangan, SIAKAD, SSO) | — | Di luar cakupan tahap awal |

Pimpinan yang juga dosen/tendik tetap punya data pegawai sendiri. Akunnya ber-role `leader`
tetapi terhubung ke data pegawainya, jadi tetap bisa presensi, mengajukan cuti, dan melihat data dirinya.

## 3. Modul (kebutuhan fungsional)

| # | Modul | Fitur utama | Cakupan inti?* |
|---|---|---|---|
| 1 | Data Pegawai | Data pokok, kepegawaian, riwayat (pendidikan, diklat, jabatan, pangkat, mutasi, sanksi, penghargaan), unggah dokumen, tambah/edit/nonaktifkan, pegawai ajukan perbaikan data | Prasyarat |
| 2 | Presensi | Presensi lewat aplikasi dengan **GPS + scan sidik jari di ponsel**, hanya di dalam **radius 100 m** dari titik yang ditentukan. Status masuk/terlambat/pulang awal dihitung otomatis. Rekap harian–bulanan per pegawai & unit, riwayat sendiri, koreksi oleh HR | ✅ |
| 3 | Cuti & Izin | Ajukan cuti (tahunan, sakit, alasan penting, besar, melahirkan) dan izin (setengah hari, penting), **HR setuju/tolak**, kuota berkurang, rekap | ✅ |
| 4 | Penilaian Kinerja (DP3/SKP) | HR buka periode, sistem buat daftar yang dinilai, **HR isi** indikator/target/realisasi/nilai, HR verifikasi/perbaikan, rekap per unit, pegawai lihat hasil | ✅ |
| 5 | Diklat | HR buka pendaftaran + kuota, pegawai daftar, **HR setuju/tolak**, HR tetapkan peserta & hasil, masuk riwayat | |
| 6 | Mutasi | **HR** usulkan, setujui, dan jalankan; update unit/jabatan + riwayat | |
| 7 | Kenaikan Pangkat & Jabatan | Usulan, persetujuan, SK (hanya di use case) | |
| 8 | Laporan & Dashboard | Rekap pegawai per unit/fakultas/prodi, rekap cuti/absensi/kinerja, neraca kebutuhan pegawai. **Dashboard statistik untuk pimpinan** (agregat, dosen & tendik dipisah) | |
| 9 | Pengumuman | HR buat & kelola, pegawai lihat | |
| 10 | Pengguna & Keamanan | Kelola akun & role, audit log, **login dengan email** (Supabase Auth) agar notifikasi bisa dikirim lewat email | Prasyarat |

\* "Scope sistem" di Analisa Kebutuhan hanya menyebut presensi, cuti/izin, dan penilaian kinerja.

**Kebutuhan non-fungsional:** minimal 100 pengguna aktif bersamaan, presensi hanya dalam radius 100 m
dari titik yang ditentukan, login wajib dengan email & password terenkripsi.

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
| Auth mock sementara (`mock-auth.ts`, login username) | Supabase Auth, login email | Diganti di Fase 1; cookie sesi dikelola `@supabase/ssr`; label form login menjadi "Email" |
| Formatter tanggal di UI memakai `Asia/Jakarta` | Kampus di Amuntai (WITA) | Zona waktu disimpan di `app_settings.timezone` = `Asia/Makassar`; UI ikut menyesuaikan di Fase 1 |

---

## 5. Rencana bertahap

| Fase | Isi | Migrasi |
|---|---|---|
| 0 | Setup Supabase: jalankan migrasi + seed, buat akun superadmin | semua |
| 1 | Login Supabase Auth (ganti mock), RBAC di proxy & menu, kelola akun (superadmin) | `..._core` |
| 2 | Master data (unit kerja, jabatan) + Data Pegawai CRUD + riwayat + dokumen + perbaikan data | `..._core`, `..._storage` |
| 3 | Presensi GPS + verifikasi sidik jari (WebAuthn) + rekap + koreksi HR | `..._attendance` |
| 4 | Cuti & Izin (pengajuan → persetujuan HR → kuota → rekap) | `..._leave` |
| 5 | Penilaian Kinerja | `..._performance_appraisal` |
| 6 | Dashboard statistik pimpinan + laporan HR | fungsi `report_*` |
| 7 | Diklat, Mutasi, Kenaikan Pangkat, Pengumuman | `..._training_mutation_promotion`, `..._announcements` |
| Nanti | Pengiriman notifikasi email, integrasi Keuangan, SIAKAD (BKD), SSO, backup/restore | — |

---

## 6. Keputusan yang sudah diambil

| Tanggal | Topik | Keputusan |
|---|---|---|
| 2 Nov 2026 | Persetujuan | **Hanya HR** (Bagian Kepegawaian) yang menyetujui: cuti/izin, koreksi presensi, penilaian kinerja, diklat, mutasi, kenaikan pangkat. Ini menggantikan peran "atasan" di kedua dokumen |
| 2 Nov 2026 | Atasan & pimpinan | Hanya melihat **dashboard statistik** agregat (dosen & tendik), tanpa akses data per pegawai |
| 2 Nov 2026 | Penilaian kinerja | Diisi dan diverifikasi oleh HR (konflik antar dokumen selesai) |
| 2 Nov 2026 | Login | **Email** + password (Supabase Auth), agar notifikasi bisa dikirim lewat email |
| 2 Nov 2026 | Presensi | **GPS saja + scan sidik jari** di ponsel, dalam **radius 100 m** dari titik. Mesin fingerprint/RFID tidak dipakai |
| 2 Nov 2026 | Backend | Supabase |

## 7. Pertanyaan yang masih terbuka

**Presensi**

1. **Titik koordinat kampus** (latitude, longitude) dan apakah ada lebih dari satu titik (mis. kampus 1 & 2).
2. **Jam kerja dan toleransi terlambat**, dan apakah berbeda untuk dosen dan tendik atau per hari (Jumat/Sabtu).
3. **Scan sidik jari**: browser tidak bisa membaca sidik jari secara langsung. Caranya memakai
   **WebAuthn/passkey**: ponsel meminta sidik jari, lalu server memverifikasi tanda tangan perangkat.
   Konsekuensinya: (a) setiap pegawai mendaftarkan ponselnya sekali, (b) presensi harus lewat server
   aplikasi (Server Action), bukan langsung dari browser ke Supabase. Apakah 1 pegawai hanya boleh
   memakai 1 perangkat terdaftar?
4. **Dosen dengan jadwal mengajar tidak tetap**: apakah wajib presensi harian seperti tendik?

**Cuti & kinerja**

5. Kuota tiap jenis cuti per tahun, dan apakah kuota boleh terlampaui.
6. Cara menghitung hari cuti (hari kerja atau hari kalender, libur nasional).
7. Rumus nilai kinerja dan skala nilai.

**Data master**

8. Kepanjangan **TTU** dan **TTK**, serta daftar lengkap status kepegawaian ("dll.").
9. Jenis unit kerja yang dipakai (fakultas, prodi, bagian, UPT, …).
10. "Neraca kebutuhan pegawai": data apa yang dibandingkan (formasi vs. jumlah pegawai)?
11. Siapa yang termasuk role `leader` (Ketua, Wakil Ketua, Kaprodi, Kabag?) dan apakah mereka melihat
    statistik **seluruh kampus** atau hanya **unitnya sendiri**? Saat ini: seluruh kampus.
