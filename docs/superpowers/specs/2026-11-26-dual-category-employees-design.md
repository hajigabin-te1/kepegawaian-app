# Pegawai rangkap (tendik yang juga dosen) — design

Tanggal: 26 Nov 2026 · Status: menunggu persetujuan

## Intent

Bagian Kepegawaian meminta dosen (tenaga pendidik) dan tendik (tenaga kependidikan) dipisah, termasuk kasus
pegawai tendik yang juga mengajar sebagai dosen. Pemisahan dosen/tendik sudah ada lewat `employees.category`
(`lecturer` / `staff`); yang belum ada adalah **satu pegawai dengan dua kategori**. Perbedaan menu antara dosen
dan tendik ke depan hanya **BKD** (pengajaran, penelitian, pengabdian), yang di luar cakupan dokumen ini.

## Keputusan pengguna (26 Nov 2026)

- Login **tetap satu halaman** untuk semua peran; tidak ada login terpisah dosen/tendik.
- Pegawai rangkap memakai **jam kerja tendik**.
- Penilaian kinerja: pegawai dengan satu kategori mendapat satu form (dosen **atau** tendik); pegawai rangkap
  mendapat **dua form** (dosen **dan** tendik) per periode.
- Model data: **cara 1** — `category` tetap kategori utama, ditambah kolom opsional `additional_category`.
- BKD: data diinput di aplikasi sumbernya (pengajaran di LMS, penelitian & pengabdian di aplikasi PPPM),
  Kepegawaian hanya menarik dan merekap. Dikerjakan setelah LMS/PPPM siap (lihat pertanyaan terbuka).

## Goals

- HR dapat menandai pegawai tendik yang juga dosen.
- Pegawai rangkap otomatis mendapat form penilaian dosen dan tendik saat HR men-generate form periode.
- Statistik penilaian memisahkan nilai per kategori form.

## Non-goals

- Login, role, atau menu terpisah untuk dosen/tendik.
- Menu BKD dan integrasi LMS/PPPM.
- Indikator penilaian yang berbeda per kategori (form tetap diisi bebas oleh HR seperti sekarang).

## Anti-goals

- Total pegawai di statistik pimpinan menjadi dobel karena pegawai rangkap dihitung dua kali.
- Pegawai rangkap kehilangan status "pulang awal" tendik karena terbaca sebagai dosen.

## Approaches

1. **Kategori utama + `additional_category` (dipilih).** Perubahan kecil; presensi, statistik jumlah pegawai,
   dan `report_scopes` tidak berubah karena tetap memakai `category`.
2. Tabel `employee_categories` (banyak kategori, satu ditandai utama). Lebih fleksibel, tetapi semua query yang
   memakai `e.category` (presensi, empat fungsi `report_*`, `can_report_on`) harus ditulis ulang untuk dua
   nilai enum yang tersedia. Ditolak: kerumitan tanpa kebutuhan nyata.

## Design

### Skema (migrasi baru)

- `employees.additional_category public.employee_category null`, dengan check:
  `additional_category is null or (category = 'staff' and additional_category = 'lecturer')`.
  Karena pegawai rangkap memakai jam kerja tendik, kategori utamanya selalu `staff`; dengan begitu
  `check_in`/`check_out` dan `work_schedules` tidak perlu diubah.
- `appraisals.category public.employee_category not null`:
  backfill dari `employees.category`, lalu unique `(period_id, employee_id)` diganti `(period_id, employee_id, category)`.
- `generate_appraisals`: membuat satu form per pegawai aktif untuk `category`, ditambah satu form untuk
  `additional_category` bila terisi; `on conflict (period_id, employee_id, category) do nothing`.
- `report_appraisal_*` (rekap nilai per unit & kategori): kelompokkan dan saring scope memakai `a.category`
  (kategori form), bukan `e.category`. Form dosen milik pegawai rangkap masuk statistik dosen.
- Fungsi `report_*` lain (pegawai, presensi, cuti) tetap memakai `e.category` → pegawai rangkap dihitung
  sekali, sebagai tendik.
- `work_reports_locked`: laporan kerja tetap satu set per pegawai per periode (bahan untuk kedua form).
  Aturan otomatis berubah dari "ada form yang dikirim" menjadi "**semua** form pegawai di periode itu sudah
  `submitted`/`verified`". Kunci manual HR tetap menimpa.

### Frontend

- Form pegawai (`employee-form.tsx`, `employee-schema.ts`): saat kategori = Tendik, tampil checkbox
  "Juga bertugas sebagai dosen" → `additional_category = 'lecturer'`. Ganti kategori ke Dosen mengosongkannya.
- Detail & daftar pegawai: badge kategori menampilkan "Tendik · Dosen" untuk pegawai rangkap.
- Penilaian kinerja (HR): daftar form dan form isian menampilkan kategori form (badge Dosen/Tendik);
  filter kategori memakai kategori form.
- Penilaian saya (pegawai): menampilkan hasil per kategori form bila lebih dari satu.
- `src/types/database.ts` diperbarui dari skema.

### Docs

- `docs/requirements.md` bagian 6 (keputusan) dan 7 (pertanyaan BKD); `docs/database-schema.md`.

## Calls made by Claude (untuk dicek)

- Kategori utama pegawai rangkap dipaksa `staff` lewat check constraint (konsekuensi "jam kerja tendik").
- Statistik jumlah, presensi, dan cuti menghitung pegawai rangkap sebagai tendik saja; statistik penilaian per form.
- Laporan kerja dipakai bersama untuk kedua form; terkunci otomatis setelah semua form dikirim.
- Bila HR menghapus status rangkap setelah form dosen dibuat, form yang sudah ada tidak dihapus otomatis.

## Left to the builder

Nama migrasi, nama komponen kecil, teks badge/label selain yang disebut di atas.
