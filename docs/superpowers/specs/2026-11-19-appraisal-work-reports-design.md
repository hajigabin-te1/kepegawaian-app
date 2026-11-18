# Desain: Laporan Kerja Pegawai sebagai Bahan Penilaian Kinerja

Tanggal: 19 November 2026 · Status: menunggu persetujuan

## 1. Maksud dan alasan

Kabag Kepegawaian (HR Admin) ingin menilai siapa yang menjalankan tupoksi dengan baik. Selama ini formulir
penilaian kinerja diisi sepenuhnya oleh HR tanpa masukan dari pegawai. Pegawai kini **melaporkan pekerjaannya
sendiri** selama periode penilaian yang dibuka HR (tahunan atau semester). Isinya **deskripsi pekerjaan** dan
**bukti dokumen**. Laporan ini menjadi **bahan** bagi HR saat mengisi indikator dan nilai pada formulir penilaian
yang sudah ada.

Kabag menyampaikan secara lisan bahwa setiap pegawai mengisi **minimal 3 laporan** per periode, di samping
indikator yang ditentukan HR.

## 2. Tujuan, bukan tujuan, anti-tujuan

**Tujuan**
- Pegawai menambah, mengubah, dan menghapus laporan kerja untuk periode penilaian yang aktif.
- HR membaca laporan dan bukti setiap pegawai langsung di halaman pengisian formulir penilaian.
- HR melihat jumlah laporan setiap pegawai di daftar formulir.

**Bukan tujuan**
- Tidak ada persetujuan atau penolakan per laporan. Keputusan HR tetap tercermin pada nilai formulir.
- Tidak mengubah rumus nilai (`compute_appraisal_score`) dan tidak ada nilai per laporan.
- Tidak menambah periode 3 bulanan. Jenis periode tetap `annual` dan `semester`.
- Tidak ada notifikasi baru.

**Anti-tujuan** (gagal walaupun secara teknis jalan)
- Laporan bisa diubah setelah HR mengirim formulir, sehingga nilai tidak lagi sesuai dengan bahannya.
- Pegawai lain, atau akun tanpa `appraisal.manage`, bisa melihat laporan atau bukti milik orang lain.
- Pimpinan (Ketua, Wakil Ketua, LPM) melihat laporan per pegawai.

## 3. Batasan

- Mengikuti CLAUDE.md: backend Supabase, perubahan skema lewat **migrasi baru**, RLS, service layer, TanStack Query,
  UI berbahasa Indonesia, dan tanpa service role key di frontend.
- Penulisan data penilaian lewat RPC (pola modul penilaian: "All writes ... go through RPCs").
- File bukti: **satu file per laporan, wajib**, PDF/JPG/PNG, **maks. 5 MB**, di bucket privat. Batas juga dipasang
  di level bucket.
- Pegawai harus terhubung ke data pegawai (`employeeId`). Akun yang tidak terhubung melihat empty state seperti
  modul lain.

## 4. Pendekatan yang dipertimbangkan

| Pilihan | Untung | Rugi | Keputusan |
|---|---|---|---|
| Laporan menjadi modul berdiri sendiri dengan status setuju/tolak per laporan | Jejak keputusan per laporan | Duplikasi dengan verifikasi formulir; tidak diminta | Ditolak |
| **Laporan menjadi bahan formulir penilaian yang sudah ada** | Sesuai permintaan Kabag; HR menilai di satu tempat | — | **Dipilih** (Kabag) |
| Laporan terkunci pada tanggal akhir periode | Sederhana | Pegawai masih bisa mengubah laporan setelah HR menilai | Ditolak |
| **Laporan terkunci saat HR mengirim formulir pegawai tersebut** | Nilai selalu sesuai bahannya | Sedikit logika tambahan di database | **Dipilih** (Kabag) |
| Bukti di bucket `employee-documents` (subfolder) | Konfigurasi lebih sedikit | Kebijakan bucket HR dilonggarkan; pemegang `employee.view` ikut bisa membaca | Ditolak |
| **Bukti di bucket privat baru `appraisal-evidence`** | Hak akses terpisah, pola sama dengan `leave-attachments` | Satu bucket baru | **Dipilih** (pengguna) |

## 5. Keputusan yang sudah diambil

1. Laporan terhubung ke **periode + pegawai**, bukan ke baris `appraisals`, sehingga pegawai bisa melapor sebelum
   HR menjalankan `generate_appraisals`.
2. Pegawai boleh menambah, mengubah, dan menghapus laporan selama:
   - periode `is_active = true`, dan
   - formulir penilaian pegawai itu untuk periode tersebut **belum** berstatus `submitted` atau `verified`
     (belum ada formulir = boleh).
3. "Minimal 3 laporan" hanya **pengingat**, tidak memblokir apa pun. Pegawai melihat penghitung, misalnya
   "2 dari minimal 3 laporan".
4. HR (`appraisal.manage`) membaca semua laporan dan bukti. Tidak ada setuju/tolak per laporan.
5. Bukti di bucket privat baru `appraisal-evidence`, path diawali `<employee_id>/`.
6. Tulis lewat RPC; aturan kunci dicek di database.
7. Periode tetap tahunan dan semester.

## 6. Bentuk solusi

### 6.1 Database (satu migrasi baru)

**Tabel `appraisal_work_reports`**
- `id` uuid PK, `period_id` → `appraisal_periods` (`on delete restrict`), `employee_id` → `employees` (`on delete cascade`)
- `description` text wajib
- `evidence_path` text wajib (path di bucket), `evidence_name` text wajib (nama file asli untuk tampilan)
- `created_at`, `updated_at` (trigger `set_updated_at`), trigger `audit_row_change`
- Indeks `(period_id, employee_id)`

**Fungsi bantu** `work_reports_locked(period_id, employee_id) returns boolean`: `true` jika periode tidak aktif atau
formulir pegawai pada periode itu berstatus `submitted` atau `verified`.

**RPC** (security definer, `search_path` dikunci, `execute` hanya untuk `authenticated`; ikuti
`..._restrict_function_execute`):
- `save_work_report(target_report_id uuid, target_period_id uuid, new_description text, new_evidence_path text, new_evidence_name text) returns uuid`.
  `target_report_id` null berarti tambah baru. Pemilik selalu `current_employee_id()`. Tolak jika akun tidak
  terhubung ke pegawai, laporan bukan miliknya, terkunci, deskripsi kosong, atau path bukti tidak diawali
  `<employee_id>/`.
- `delete_work_report(target_report_id uuid) returns text`. Mengembalikan `evidence_path` lama supaya klien
  menghapus filenya. Tolak jika bukan miliknya atau terkunci.
- Pesan error memakai kode yang bisa diterjemahkan oleh `fromSupabaseError` (mis. `work_report_locked`).

**RLS**
- select: `employee_id = current_employee_id()` atau `has_permission('appraisal.manage')`.
- Tidak ada policy insert/update/delete langsung; semua lewat RPC.

**Storage**
- Bucket `appraisal-evidence`: privat, `file_size_limit = 5242880`, MIME `application/pdf`, `image/jpeg`, `image/png`.
- select: folder pertama = `current_employee_id()`, atau `has_permission('appraisal.manage')`.
- insert: folder pertama = `current_employee_id()`.
- delete: folder pertama = `current_employee_id()`, dan **tidak ada** laporan terkunci yang `evidence_path`-nya
  sama dengan objek ini. Ini mencegah bukti laporan yang sudah dinilai dihapus lewat request langsung.
- Tidak ada update (mengganti file = unggah baru + hapus lama).

**Tipe**: perbarui `src/types/database.ts` (tabel, RPC baru).

### 6.2 Frontend

Modul tetap di `features/performance` (bagian dari penilaian), dengan file baru sesuai pola:
`services/work-report-service.ts`, `hooks/use-work-reports.ts`, `schemas/work-report-schemas.ts`,
tipe di `types/performance.ts`, dan komponen di bawah.

**Sisi pegawai, halaman `/performance`** (sudah ada, berisi `MyAppraisalsPanel`):
- Bagian baru **"Laporan Kerja"** di atas hasil penilaian.
- Pemilih periode berisi periode aktif (default: periode aktif terbaru). Periode lama yang punya laporan tetap bisa
  dilihat (hanya baca).
- Penghitung "N dari minimal 3 laporan". Badge "Terkunci" jika formulir sudah dikirim atau periode tidak aktif.
- Daftar laporan: deskripsi (dipotong, bisa dibuka), nama file + tombol buka (signed URL 60 detik), tanggal dibuat,
  aksi ubah/hapus (disembunyikan saat terkunci). Hapus memakai `ConfirmDeleteDialog`.
- Tombol utama **"Tambah Laporan"** → dialog: Deskripsi pekerjaan (textarea, wajib) dan Bukti dokumen (wajib saat
  tambah; opsional saat ubah = tetap file lama). Validasi file memakai `validateEmployeeFile` atau padanannya.
- Urutan simpan: unggah file → RPC → jika RPC gagal, hapus file yang baru diunggah. Saat mengganti file, file lama
  dihapus setelah RPC berhasil. Saat menghapus laporan, file dihapus setelah RPC berhasil.
- Empty state: "Belum ada laporan kerja" + ajakan menambah. Akun tanpa `employeeId`: empty state yang sudah ada.

Sketsa:
```
Laporan Kerja                     [Periode: Semester Ganjil 2026 ▾]  [+ Tambah Laporan]
2 dari minimal 3 laporan
┌───────────────────────────────────────────────────────────────────────────┐
│ Menyusun laporan BKD prodi Administrasi Publik ...   bukti-bkd.pdf ↗  ✎ 🗑 │
│ 12 Okt 2026                                                               │
├───────────────────────────────────────────────────────────────────────────┤
│ Menjadi panitia PKKMB 2026 ...                       sk-panitia.pdf ↗ ✎ 🗑 │
└───────────────────────────────────────────────────────────────────────────┘
```

**Sisi HR**
- `/performance/forms/[id]` (`AppraisalFormPage`): kartu **"Laporan Kerja Pegawai (N)"** di samping/di atas editor
  indikator. Hanya baca: deskripsi lengkap, tombol buka bukti, tanggal. Tampil untuk semua status formulir.
- `/performance/forms` (`FormsPanel`): kolom **"Laporan"** berisi jumlah laporan per pegawai pada periode itu.
  Jumlah di bawah 3 ditandai warna peringatan (token warning, bukan warna baru).

**Query key**: `performanceKeys.workReports(periodId, employeeId)` dan `performanceKeys.workReportCounts(periodId)`.
Invalidate keduanya setelah simpan/hapus.

### 6.3 Dokumentasi
- `docs/requirements.md`: tambahkan keputusan (bagian 6) dan perbarui baris modul Penilaian Kinerja (bagian 3).
- `docs/database-schema.md` dan `docs/panduan-kode.md` (§9.11): tambah tabel, RPC, bucket, dan alur.

## 7. Diserahkan ke pembangun (keputusan saya, boleh dikoreksi)

- Panjang deskripsi **10–2000 karakter**.
- Nama file di Storage: `<employee_id>/<period_id>/<uuid acak>.<ekstensi>`; nama asli disimpan di `evidence_name`.
- Tanggal laporan = `created_at`; tidak ada field tanggal kegiatan (tidak diminta).
- Penghitung di daftar formulir dihitung dengan satu query agregat dari `appraisal_work_reports` per periode,
  bukan per baris.
- Status `revision_requested` **tidak** mengunci laporan, karena formulir kembali ke HR untuk diperbaiki.

## 8. Pengujian

- Pegawai A tidak bisa membaca laporan atau bukti pegawai B (RLS dan Storage).
- Laporan tidak bisa ditambah, diubah, atau dihapus setelah formulir `submitted` atau `verified`, atau saat periode
  nonaktif. Uji lewat RPC langsung dan lewat UI.
- File bukti laporan yang terkunci tidak bisa dihapus lewat Storage API langsung.
- File > 5 MB atau bertipe lain ditolak di form dan di bucket.
- HR melihat laporan dan jumlahnya; akun pimpinan tidak bisa membaca tabel ini.
- `npx tsc --noEmit`, `npm run lint`, `npm run build`.
