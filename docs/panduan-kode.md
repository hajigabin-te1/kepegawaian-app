# Panduan Kode — Aplikasi Kepegawaian STIA Amuntai

Dokumen ini menjelaskan apa yang sudah dibangun, bagaimana bagian-bagiannya saling terhubung,
dan arti nama-nama variabel, fungsi, dan tipe di kode. Kode tetap memakai bahasa Inggris
(aturan di `CLAUDE.md`); dokumen ini adalah "kamus" dalam bahasa Indonesia.

Status per **19 November 2026** (setelah PR #11 dan fitur notifikasi).

---

## 1. Gambaran besar

Frontend **Next.js 16 (App Router)** dengan **Supabase** sebagai backend (Postgres, Auth, Storage).
Tidak ada API route atau backend lain yang dibuat di repo ini.

| Bagian | Kondisi sekarang |
|---|---|
| Login & sesi | **Sudah jalan.** Supabase Auth dengan email + password. Sesi disimpan di cookie oleh `@supabase/ssr` |
| Proteksi halaman | **Sudah jalan** lewat `src/proxy.ts` dan pengecekan permission di halaman |
| Hak akses (RBAC) | **Sudah jalan.** Menu, route, dan RPC dibatasi berdasarkan permission peran |
| Kelola akun pengguna | **Sudah jalan** (buat, ubah peran/pegawai/status, hapus, cakupan laporan pimpinan) |
| Peran & hak akses, pengaturan aplikasi | **Sudah jalan** (`/settings/roles`, `/settings/app`) |
| Master data (unit kerja, jabatan, struktur organisasi) | **Sudah jalan** |
| Ganti password | **Sudah jalan** |
| Dashboard | Statistik agregat untuk HR dan pimpinan (tab Pegawai, Presensi, Cuti, Kinerja); akun lain melihat beranda |
| Data pegawai (daftar, tambah, detail, ubah, nonaktifkan, buat akun) | **Sudah jalan** (HR, `employee.view` / `employee.manage`) |
| Riwayat jabatan & pendidikan, dokumen pegawai | **Sudah jalan** (unggah ke Storage privat) |
| Notifikasi (lonceng di header) | **Sudah jalan** (polling 60 detik) |
| Presensi, cuti, kinerja, diklat, mutasi, kenaikan pangkat, pengumuman, perbaikan data | **Kode selesai** (belum diuji end-to-end di Supabase) |

Skema database ada di `supabase/migrations` dan dijelaskan di `docs/database-schema.md`.
Kebutuhan dan rencana fase ada di `docs/requirements.md`.

---

## 2. Alur saat aplikasi dibuka

```
Browser membuka URL
   │
   ▼
src/proxy.ts                  ← "satpam": segarkan sesi, cek login, cek permission route
   │
   ▼
src/app/layout.tsx            ← kerangka HTML + AppProviders (TanStack Query, toast)
   │
   ├── (auth)/layout.tsx      ← kerangka halaman login
   │      └── login/page.tsx
   │
   └── (dashboard)/layout.tsx ← shell setelah login: ambil user → sidebar + header
          ├── dashboard/page.tsx
          ├── loading.tsx, error.tsx ← skeleton dan tampilan gagal untuk semua halaman di bawahnya
          ├── employees/, histories/, documents/
          ├── attendance/, leave/, performance/
          ├── training/, mutations/, promotions/, announcements/
          ├── master/, accounts/, settings/
          └── profile/
```

Folder dengan tanda kurung seperti `(auth)` dan `(dashboard)` adalah **route group**: hanya untuk
mengelompokkan file. Namanya tidak muncul di URL (`/login`, bukan `/(auth)/login`).

---

## 3. Peta folder

```
src/
  proxy.ts                       Proteksi route (pengganti "middleware" di Next.js 16)
  app/                           Halaman. Setiap folder = satu URL
    layout.tsx                   Layout root: font, judul tab, AppProviders
    page.tsx                     URL "/" → redirect ke /dashboard
    globals.css                  Token warna 60-30-10 (#F8F8FF, #191970, #87CEFA)
    (auth)/login/                Halaman login
    (dashboard)/layout.tsx       Shell setelah login: ambil user → sidebar + header
    not-found.tsx                Halaman "alamat tidak dikenal"
    (dashboard)/loading.tsx      Skeleton saat pindah halaman
    (dashboard)/error.tsx        Tampilan saat halaman gagal dimuat
    (dashboard)/dashboard/       Dashboard (statistik atau beranda, sesuai izin) + loading.tsx
    (dashboard)/employees/       Data pegawai (daftar, tambah, [id] detail, [id]/edit, change-requests)
    (dashboard)/histories/       Riwayat jabatan (positions) dan pendidikan (education)
    (dashboard)/documents/       Dokumen pegawai
    (dashboard)/attendance/      Presensi saya + recap (rekap harian/bulanan, koreksi)
    (dashboard)/leave/           Cuti saya + requests (antrean HR) + holidays (hari libur)
    (dashboard)/performance/     Penilaian saya + periods, forms, forms/[id], recap
    (dashboard)/training/        Diklat (daftar & pendaftaran) + manage (kelola HR)
    (dashboard)/mutations/       Usulan mutasi
    (dashboard)/promotions/      Usulan kenaikan pangkat/jabatan
    (dashboard)/announcements/   Pengumuman
    (dashboard)/master/          Unit kerja, jabatan, struktur organisasi
    (dashboard)/accounts/        Kelola akun pengguna
    (dashboard)/settings/        roles (peran & hak akses), app (lokasi presensi, jam kerja)
    (dashboard)/profile/         Profil & pengajuan perbaikan data + password/ (ganti password)
  components/
    ui/                          Komponen dasar shadcn/ui. Jarang diubah
    layout/                      Sidebar, header, breadcrumb, menu user, pencarian, notifikasi,
                                 PageContainer, PageHeader, AppBrand
    common/                      AppProviders, EmptyState, QueryErrorState, TableSkeleton,
                                 ActiveStatusBadge, ProposalStatusBadge, PaginationBar,
                                 ConfirmDeleteDialog, DecisionDialog, SearchableSelect
  features/                      Satu folder per modul bisnis (pola: components, hooks, schemas, services, types)
    auth/                        Login, logout, ganti password, baca user yang login
      actions.ts                 Server Action: loginAction, logoutAction, changePasswordAction
      services/auth-service.ts   Logika Supabase Auth + getCurrentUser + requirePermission
      components/                LoginForm, ChangePasswordForm
      schemas/                   Validasi form login dan ganti password
      types/auth.ts              SessionUser, RoleCode, LoginInput
    accounts/                    Kelola akun pengguna (daftar, buat, ubah, hapus, cakupan laporan)
      services/account-service.ts  listAccounts, updateAccount, createAccount, deleteAccount,
                                 listLinkableEmployees, listReportScopes, addReportScope, deleteReportScope
      hooks/use-accounts.ts      useAccounts, useUpdateAccount, useCreateAccount, useDeleteAccount, useReportScopes, ...
      components/                AccountsPanel, CreateAccountDialog, AccountFormDialog,
                                 DeleteAccountDialog, ReportScopeDialog
      schemas/, types/           Validasi dan bentuk data akun
    roles/                       Peran & hak akses (RolesPanel, getRbacData, updateRolePermissions)
    settings/                    Lokasi presensi dan jam kerja (AppSettingsPanel + dialog masing-masing)
    master-data/                 Unit kerja dan jabatan
      services/master-data-service.ts  listWorkUnits, createWorkUnit, updateWorkUnit, listPositions, ...
      hooks/use-master-data.ts   useWorkUnits, useSaveWorkUnit, usePositions, useSavePosition
      components/                WorkUnitsPanel, PositionsPanel, form dialog masing-masing
      schemas/, types/           Validasi dan bentuk data master
    dashboard/
      services/dashboard-service.ts  Memanggil fungsi report_* (agregat) dan menghitung antrean HR
      hooks/use-dashboard.ts     TanStack Query untuk statistik, cakupan, dan antrean
      components/                StatisticsDashboard (tab Pegawai/Presensi/Cuti/Kinerja), WelcomePanel, PendingActionsCard
    employees/                   CRUD pegawai: EmployeesPanel, EmployeeForm, EmployeeDetailView,
                                 DeactivateEmployeeDialog, EmployeeAccountCard, EmployeeSelect
    employee-history/            Riwayat jabatan dan pendidikan (panel + dialog)
    documents/                   Dokumen pegawai + file-storage.ts (unggah/hapus/signed URL)
    profile-requests/            Pengajuan perbaikan data oleh pegawai dan keputusan HR
    attendance/                  Presensi GPS (CheckInCard), riwayat saya, rekap, koreksi HR
    leave/                       Cuti/izin, saldo kuota, antrean HR, hari libur
    performance/                 Periode, formulir, pengisian, verifikasi, rekap penilaian kinerja
    training/                    Diklat: daftar, pendaftaran, keputusan HR, hasil
    mutation/                    Usulan, keputusan, dan eksekusi mutasi
    promotion/                   Usulan, keputusan, dan eksekusi kenaikan pangkat/jabatan
    announcements/               Pengumuman (draf, terbit, hapus)
    notifications/               Feed notifikasi untuk lonceng di header (tanpa komponen sendiri)
  lib/
    supabase/client.ts           Supabase untuk browser (createSupabaseBrowserClient)
    supabase/server.ts           Supabase untuk server, memakai cookie (createSupabaseServerClient)
    supabase/proxy.ts            updateSession + redirectWithCookies, dipakai proxy.ts
    api-error.ts                 ApiError, toApiError, fromSupabaseError
    query-client.ts              Pengaturan TanStack Query
    axios.ts                     Klien HTTP untuk API pihak ketiga (belum dipakai)
    csv.ts                       downloadCsv() untuk unduhan tabel rekap
    use-debounced-value.ts       useDebouncedValue() untuk input pencarian (default 300 ms)
    utils.ts                     cn() dan getInitials()
  stores/
    ui-store.ts                  State tampilan (Zustand): sidebar diciutkan, drawer mobile
    auth-store.ts                Token di memori untuk Axios (belum dipakai)
  config/
    env.ts                       Membaca environment variable, termasuk konfigurasi Supabase
    routes.ts                    Daftar URL aplikasi
    navigation.ts                Daftar menu sidebar + filter menu berdasarkan permission
    permissions.ts               Kode permission (PERMISSIONS) + aturan route (requiredPermissionFor)
    locale.ts                    APP_TIME_ZONE = "Asia/Makassar" (WITA)
  types/
    database.ts                  Tipe tabel dan RPC Supabase (dipakai client Supabase)

supabase/
  migrations/                    Skema SQL berurutan. Jangan mengedit file yang sudah dijalankan
  functions/admin-create-user/   Edge Function: buat akun Auth dan user_accounts
  functions/admin-delete-user/   Edge Function: hapus akun Auth (khusus superadmin)
  seed.sql                       Data awal: role, permission, status kepegawaian, jenis cuti, jam kerja
```

---

## 4. Pola yang dipakai di setiap modul

Ikuti pola yang sudah ada di `features/accounts` dan `features/master-data`. Alurnya:

```
Halaman (app/)  →  Komponen (components/)  →  Hook (hooks/, TanStack Query)  →  Service (services/)  →  Supabase
```

| Lapisan | Tugas | Aturan |
|---|---|---|
| `app/.../page.tsx` | Route, cek permission (`requirePermission`), susun komponen | Server Component. Jangan ada logika bisnis |
| `components/` | Tampilan dan form | Tidak memanggil Supabase langsung |
| `hooks/` | `useQuery` / `useMutation` | Query key terstruktur. Invalidate setelah create/update/delete |
| `services/` | Satu fungsi per operasi Supabase atau RPC | Semua error dibungkus `fromSupabaseError` menjadi `ApiError` |
| `schemas/` | Validasi Zod untuk form | Dipakai React Hook Form (form) dan Server Action (ulang di server) |
| `types/` | Bentuk data di aplikasi | Dipetakan dari nama kolom snake_case ke camelCase di service |

Catatan:
- **Persetujuan** (cuti, koreksi presensi, penilaian, diklat, mutasi) hanya lewat fungsi RPC, bukan update langsung.
- **Pimpinan** hanya membaca statistik agregat lewat fungsi `report_*`. Jangan tampilkan data per pegawai untuk mereka.
- **Tanggal dan jam** memakai zona waktu kampus `APP_TIME_ZONE` (`Asia/Makassar`).

---

## 5. Login dan sesi (langkah demi langkah)

1. Pengguna membuka `/login`. `LoginForm` memakai `useForm` dengan `loginSchema` (email valid, password wajib).
2. Saat **Masuk** ditekan, `handleSubmit` memvalidasi dulu. Kalau salah, pesan error tampil di bawah field.
3. `loginAction` (`features/auth/actions.ts`) berjalan di server:
   - Memvalidasi ulang dengan `loginSchema`. Data dari browser tidak dipercaya.
   - `signInWithEmail` memanggil `supabase.auth.signInWithPassword`.
     - Salah → "Email atau password salah."
     - Belum dikonfirmasi → "Email belum dikonfirmasi."
   - Login berhasil, tetapi tidak ada baris di `user_accounts` atau `is_active = false` → logout lagi dan pesan
     "Akun belum terdaftar … atau sedang nonaktif."
   - Berhasil → RPC `log_audit_event` mencatat `login` di `audit_logs`, cookie sesi tersimpan, lalu redirect ke `/dashboard`.
4. **Keluar**: `logoutAction` → RPC `log_audit_event` (`logout`) → `signOut` → `/login`.
5. **Ganti password** (`/profile/password`): `changePasswordAction` → `changePassword`.
   Password lama diverifikasi dulu dengan `signInWithPassword`, lalu `updateUser`. Hasilnya dicatat sebagai `change_password`.
6. **Siapa yang login** dibaca `getCurrentUser()`:
   - Klaim JWT (`getClaims`) memberi `sub` dan `email`.
   - Baris `user_accounts` memberi peran dan status aktif.
   - Daftar permission diambil dari `role_permissions`.
   - Nama tampilan diambil dari `employees.full_name`. Kalau akun tidak terhubung ke pegawai, dipakai nama peran.

Cookie sesi dikelola `@supabase/ssr` dan disegarkan otomatis oleh `src/proxy.ts`.

---

## 6. Hak akses (RBAC)

Ada tiga lapis. Semuanya memakai daftar permission dari tabel `permissions` yang terhubung ke peran.

| Lapis | Di mana | Fungsi |
|---|---|---|
| Menu | `config/navigation.ts` (`navigationFor`) | Menu hanya tampil jika peran punya permission |
| Route | `src/proxy.ts` dan `config/permissions.ts` (`requiredPermissionFor`) | Route yang butuh permission dikembalikan ke dashboard jika tidak punya |
| Halaman | `requirePermission(PERMISSIONS.x)` di `page.tsx` | Pengecekan kedua di server. Jika tidak punya izin, redirect ke dashboard |
| Database | Fungsi `has_permission` dan RLS | Lapis terakhir. Data tetap dijaga walaupun UI dilewati |

Permission yang dipakai frontend ada di `PERMISSIONS`:

| Kode | Arti |
|---|---|
| `user.manage` | Kelola akun pengguna (`/accounts`) |
| `role.manage` | Atur hak akses per peran (`/settings/roles`) |
| `settings.manage` | Lokasi presensi dan jam kerja (`/settings/app`) |
| `master.manage` | Unit kerja, jabatan, struktur organisasi (`/master/*`) |
| `employee.view` | Lihat pegawai, riwayat, dokumen (`/employees`, `/histories/*`, `/documents`) |
| `employee.manage` | Tambah/ubah pegawai, riwayat, dokumen; putuskan perbaikan data (`/employees/change-requests`) |
| `attendance.view` | Rekap presensi (`/attendance/recap`) |
| `attendance.manage` | Koreksi presensi di halaman rekap |
| `leave.view` | Daftar pengajuan cuti (`/leave/requests`) |
| `leave.manage` | Putuskan cuti; kelola hari libur (`/leave/holidays`) |
| `appraisal.manage` | Periode, formulir, dan rekap penilaian kinerja (`/performance/periods`, `forms`, `recap`) |
| `training.manage` | Kelola diklat dan pendaftar (`/training/manage`) |
| `mutation.manage` | Usulan dan keputusan mutasi (`/mutations`) |
| `promotion.manage` | Usulan dan keputusan kenaikan (`/promotions`) |
| `report.view` | Dashboard statistik agregat |
| `announcement.manage` | Buat, terbitkan, dan hapus pengumuman (dicek di `announcements/page.tsx`) |

Halaman milik pegawai sendiri (`/attendance`, `/leave`, `/performance`, `/training`, `/profile`, `/announcements`)
cukup login; isinya bergantung pada `employeeId` akun dan RLS.

Peran (`ROLE_CODES`): `superadmin`, `hr_admin`, `chair`, `vice_chair`, `quality_assurance`, `employee`.

**Menambah halaman baru yang butuh izin:** tambahkan aturan di `ROUTE_RULES` (`config/permissions.ts`),
tambahkan path di `PROTECTED_PREFIXES` (`src/proxy.ts`) jika belum ada, tambahkan item di `mainNavigation`
(`config/navigation.ts`), lalu panggil `requirePermission` di `page.tsx`.

---

## 7. Proteksi route (`src/proxy.ts`)

Dijalankan **sebelum** halaman dirender, untuk URL di `config.matcher`.

| Kondisi | Hasil |
|---|---|
| Buka `/` dan sudah login | ke `/dashboard` |
| Buka `/` dan belum login | ke `/login` |
| Buka `/login` dan sudah login (dan akun aktif) | ke `/dashboard` |
| Buka `/login` dengan sesi tetapi akun nonaktif | sesi dihapus, tetap di `/login` |
| Buka route terlindungi dan belum login | ke `/login` |
| Buka route yang butuh permission, tetapi tidak punya | ke `/dashboard` (RPC `has_permission`) |

Lapis kedua ada di `(dashboard)/layout.tsx`: jika `getCurrentUser()` mengembalikan `null`, redirect ke `/login`.

---

## 8. Shell dashboard: sidebar dan header

- **`(dashboard)/layout.tsx`**: `DashboardShell` mengambil `user` lalu meneruskannya ke `AppSidebar` dan `AppHeader`.
  Selama menunggu, `DashboardShellFallback` (kerangka kosong) tampil.
- **`AppSidebar`**: sidebar navy di desktop. Tombol di pojok mengecilkan atau melebarkan sidebar.
  Status ini disimpan di `ui-store.ts` dan diingat setelah reload (localStorage, kunci `kepegawaian-ui`).
  - `hasHydrated` menandakan status sudah dibaca dari localStorage. Animasi lebar baru dinyalakan setelah itu,
    supaya sidebar tidak "melompat" saat halaman dimuat.
- **`SidebarNav`**: menu dari `config/navigation.ts`. `findActiveNavItem` memilih menu yang paling cocok
  dengan URL (`href` terpanjang menang).
- **`SidebarUser`**: avatar, nama, peran, tombol keluar.
- **`MobileSidebar`**: versi drawer untuk layar kecil, dibuka dari tombol ☰ di header.
- **`AppHeader`**: breadcrumb dan judul, pencarian, notifikasi, menu avatar.
  - Pencarian **belum mencari apa pun**. Submit hanya menampilkan toast "Pencarian belum tersedia".
  - Notifikasi (`NotificationMenu`) membaca feed dari `features/notifications` (lihat 9.15).

---

## 9. Modul yang sudah jalan

### 9.1 Kelola akun (`/accounts`, permission `user.manage`)

- Daftar akun memanggil RPC `list_user_accounts` (berisi email, peran, status, nama pegawai, login terakhir).
- Ubah peran dan status memanggil `updateAccount`, yang mengupdate `user_accounts`.
  Jika mencoba menonaktifkan atau mengubah peran sendiri, database menolak dan pesannya diterjemahkan lewat `fromSupabaseError`.
- Buat akun baru memanggil Edge Function `admin-create-user` dengan `createAccount`.
  Pembuatan lewat function ini wajib karena membuat user Auth butuh secret key yang tidak boleh ada di browser.
  Password sementara dibuat otomatis (`generateTemporaryPassword`).
- Hubungkan akun ke pegawai di dialog Ubah Akun (pilihan pegawai bisa dicari, sumbernya RPC `list_linkable_employees`).
- Hapus akun (`DeleteAccountDialog`) memanggil Edge Function `admin-delete-user`.
- Akun pimpinan diberi cakupan laporan (`ReportScopeDialog`, tabel `report_scopes`) yang membatasi hasil fungsi `report_*`.

### 9.2 Master data (`/master/*`, permission `master.manage`)

- Unit kerja: `listWorkUnits`, `createWorkUnit`, `updateWorkUnit`. Punya `unit_type` dan `parent_id` (hierarki).
- Jabatan: `listPositions`, `createPosition`, `updatePosition`. Punya `position_type` dan `level`.
- Form memakai dialog (`WorkUnitFormDialog`, `PositionFormDialog`). Setelah simpan, query terkait di-invalidate.

### 9.3 Data pegawai (`/employees/*`, permission `employee.view` / `employee.manage`)

- Daftar (`EmployeesPanel`): `listEmployees(filters)` dengan pencarian nama/NIP/NIDN (debounce 300 ms),
  filter kategori, unit kerja, status, dan paginasi 20 baris (`EMPLOYEE_PAGE_SIZE`).
- Tambah/ubah (`EmployeeForm`): wajib hanya nama lengkap, kategori, dan unit kerja; NIK 16 digit, kode pos 5 digit.
  Saat menambah, opsi **"Buatkan akun login"** memanggil `admin-create-user` dengan peran Pegawai dan `employeeId`.
- Detail (`EmployeeDetailView`): tab Biodata, Kepegawaian, Akun Login. Status akun dibaca lewat RPC `get_employee_account`.
- Nonaktifkan (`DeactivateEmployeeDialog`): konfirmasi + alasan wajib; status Nonaktif atau Pensiun. Bisa diaktifkan kembali.
  Pegawai tidak pernah dihapus.

### 9.4 Riwayat & dokumen (`/histories/*`, `/documents`, permission `employee.view` / `employee.manage`)

- Modul `features/employee-history` (riwayat jabatan & pendidikan) dan `features/documents` (dokumen pegawai).
- Setiap panel (`PositionHistoryPanel`, `EducationHistoryPanel`, `DocumentsPanel`) dipakai dua kali:
  tanpa `employeeId` = halaman menu (semua pegawai, cari nama, paginasi 20); dengan `employeeId` = tab di Detail Pegawai.
- Tombol tambah/ubah/hapus hanya muncul jika punya `employee.manage` (`canManage`). Hapus selalu lewat `ConfirmDeleteDialog`.
- File (SK, ijazah, dokumen) diunggah lewat `file-storage.ts` ke bucket privat `employee-documents`
  dengan path `<employee_id>/<documents|education|positions>/...`; dibuka dengan signed URL 60 detik (`FileLinkButton`).
  Batas 5 MB dan PDF/JPG/PNG dicek di form (`validateEmployeeFile`) dan di Storage (migrasi `..._employee_document_limits`).
- Mengganti file menghapus file lama; menghapus data menghapus file-nya. Jika simpan data gagal, file yang baru diunggah dihapus lagi.

### 9.5 Struktur Organisasi (`/master/organization`, permission `master.manage`)

- `OrganizationStructure` menyusun pohon dari `work_units.parent_id` (unit dengan induk yang tidak ada dianggap akar).
- Jumlah pegawai aktif per unit (dosen · tendik) diambil dari RPC `report_employee_statistics`; jika akun tidak punya cakupan statistik, pohon tetap tampil tanpa angka.
- Hanya baca. Induk unit diubah di menu Unit Kerja.

### 9.6 Peran & Hak Akses (`/settings/roles`, permission `role.manage`)

- Modul `features/roles`. `getRbacData()` membaca `roles` + `role_permissions` + `permissions`.
- Centang hak akses disimpan sebagai draf per peran; "Simpan Perubahan" memanggil `updateRolePermissions` (tambah dulu, baru hapus).
- Peran superadmin tidak bisa kehilangan `role.manage` dan `user.manage` (dikunci di UI) agar tidak ada yang terkunci di luar sistem.
- Daftar peran dan kode hak akses tetap dari seed; halaman ini hanya mengubah pemetaannya.

### 9.7 Pengaturan Aplikasi (`/settings/app`, permission `settings.manage`)

- Modul `features/settings`: tab **Lokasi Presensi** (`attendance_locations`: tambah, ubah, aktif/nonaktif; tidak dihapus karena dirujuk presensi)
  dan **Jam Kerja** (`work_schedules`: satu per kategori; jam masuk/pulang, toleransi, catat pulang awal).
- Zona waktu (`app_settings.timezone`) hanya ditampilkan, tidak bisa diubah: frontend memakai `APP_TIME_ZONE` yang sama.

### 9.8 Perbaikan data (`/profile`, `/employees/change-requests`)

- Modul `features/profile-requests`. Pegawai melihat profilnya (`ProfilePanel`) dan mengajukan perubahan field tertentu
  (`CHANGE_FIELDS`) lewat RPC `submit_profile_change_request`.
- HR (`employee.manage`) memutuskan di `ChangeRequestsPanel` lewat RPC `decide_profile_change_request`. Data pegawai tidak diubah langsung dari UI pegawai.

### 9.9 Presensi (`/attendance`, `/attendance/recap`)

- Pegawai: `CheckInCard` membaca GPS browser lalu memanggil RPC `check_in` / `check_out`. Radius dicek di database
  terhadap `attendance_locations`; di luar radius tampil "Tidak bisa melakukan presensi". Riwayat sendiri di `MyAttendancePanel`.
- Rekap (`attendance.view`): harian dari `attendance_records`, bulanan dari view `attendance_monthly_summary`, bisa diunduh CSV.
- Koreksi (`attendance.manage`): `CorrectionDialog` → RPC `correct_attendance`; pegawai menerima notifikasi.

### 9.10 Cuti & izin (`/leave`, `/leave/requests`, `/leave/holidays`)

- Pegawai: saldo kuota tahunan (RPC `get_leave_balance`), ajukan (`LeaveRequestDialog` → `submit_leave_request`, lampiran opsional),
  batalkan (`cancel_leave_request`). Jumlah hari tidak menghitung hari Minggu dan hari libur (`public_holidays`); Sabtu dihitung
  (`countLeaveDays` hanya pratinjau, database menghitung ulang lewat `count_leave_days()`).
- HR: antrean di `LeaveRequestsPanel` (`leave.view`), keputusan lewat `decide_leave_request` (`leave.manage`), rekap dari `leave_summary`.
- Hari libur (`leave.manage`): tambah/hapus di `HolidaysPanel`.

### 9.11 Penilaian kinerja (`/performance/*`)

- HR (`appraisal.manage`): kelola periode (`PeriodsPanel`), buat formulir untuk pegawai (RPC `generate_appraisals`),
  pantau formulir (`FormsPanel`), verifikasi (`review_appraisal`), dan rekap per unit (`report_appraisal_by_unit`).
- Pengisian formulir (`AppraisalForm`): simpan draf `save_appraisal`, kirim `submit_appraisal`. Skala nilai maksimum dibaca dari `app_settings` (`getMaxScore`).
- Pegawai melihat penilaiannya di `MyAppraisalsPanel`.

### 9.12 Diklat (`/training`, `/training/manage`)

- Pegawai: lihat diklat yang dibuka dan mendaftar (`applyTraining`, insert ke `training_registrations`; RLS menolak jika pendaftaran ditutup).
- HR (`training.manage`): kelola diklat (`TrainingFormDialog`), putuskan pendaftar (`decide_training_registration`),
  dan catat hasil (`set_training_outcome`; peserta yang selesai otomatis masuk riwayat pelatihan).

### 9.13 Mutasi & kenaikan pangkat (`/mutations`, `/promotions`)

- Alur sama untuk keduanya: **usulan** (insert ke `mutations` / `promotion_proposals`, status `proposed`)
  → **keputusan** HR lewat `DecisionDialog` (RPC `decide_mutation` / `decide_promotion`, `approved` atau `rejected`)
  → **dijalankan** (RPC `execute_mutation` / `execute_promotion`, status `executed`, data pegawai diperbarui).
- Status ditampilkan dengan `ProposalStatusBadge`. Unit/jabatan/pangkat saat ini diambil otomatis dari data pegawai.
- Pilihan pegawai di form usulan memakai `EmployeeSelect` (bisa dicari, hanya pegawai aktif).

### 9.14 Pengumuman (`/announcements`)

- Semua akun membaca pengumuman yang sudah terbit (RLS). Pemegang `announcement.manage` juga melihat draf,
  dan bisa membuat, mengubah, menerbitkan/menarik (`setAnnouncementPublished`), dan menghapus.

### 9.15 Notifikasi (lonceng di header)

- `features/notifications`: `getNotificationFeed` membaca tabel `notifications` milik pengguna (jumlah dibatasi `FEED_LIMIT`),
  diperbarui tiap 60 detik (`POLL_INTERVAL_MS`), bukan realtime. Bisa ditandai dibaca satu per satu atau semua.
- Notifikasi dibuat oleh fungsi database (`notify_employee`, `notify_permission_holders`) saat ada pengajuan atau keputusan.

### 9.16 Pilihan pegawai yang bisa dicari

- Semua dialog yang memilih pegawai memakai `SearchableSelect` (`components/common`, berbasis Combobox shadcn/Base UI):
  pengguna mengetik nama atau NIP, dan hanya 50 hasil teratas yang dirender.
- `EmployeeSelect` (`features/employees`) membungkusnya dengan data `useEmployeeOptions`. Prop `activeOnly` membatasi ke pegawai aktif.
  Dipakai di koreksi presensi, usulan mutasi, usulan kenaikan, unggah dokumen, dan riwayat jabatan/pendidikan.
- Dialog Ubah Akun memakai `SearchableSelect` langsung dengan data `list_linkable_employees` dan opsi "Tidak terhubung".

---

## 10. Dashboard

`src/app/(dashboard)/dashboard/page.tsx` memilih tampilan dari izin `report.view`:

1. **Punya `report.view`** (HR, Ketua, Wakil Ketua, LPM): `StatisticsDashboard`, yaitu statistik **agregat** dosen dan
   tenaga kependidikan dalam empat tab: Pegawai (`EmployeeStatistics`, HR juga melihat pegawai terbaru), Presensi (per bulan), Cuti (per tahun), Kinerja (per periode).
   Data berasal dari fungsi `report_*` yang membatasi hasil sesuai `report_scopes`; tidak ada data per pegawai.
   Tabel presensi, cuti, dan kinerja bisa diunduh sebagai CSV. HR juga melihat kartu **Perlu tindakan** (antrean cuti, perbaikan data, verifikasi nilai).
2. **Lainnya** (pegawai, Superadmin): `WelcomePanel` berisi presensi hari ini (jika akun terhubung ke pegawai) dan pintasan menu.

`loading.tsx` adalah skeleton yang tampil selama halaman disiapkan.

---

## 11. Kamus nama (variabel, fungsi, tipe)

Arti nama yang paling sering muncul. Kalau menemukan nama yang belum ada di sini, tambahkan.

### Umum
| Nama | Arti |
|---|---|
| `cn(...)` | Menggabungkan class Tailwind dan membuang yang kosong |
| `getInitials(name)` | Inisial nama untuk avatar ("Siti Rahmawati" → "SR") |
| `routes` | Daftar URL aplikasi (`routes.dashboard` = `"/dashboard"`) |
| `mainNavigation` | Daftar grup menu sidebar |
| `navigationFor(permissions)` | Menu yang boleh dilihat peran ini |
| `findActiveNavItem(pathname)` | Cari menu yang sedang aktif berdasarkan URL |
| `pathname` | Bagian path dari URL, mis. `/employees/new` |
| `env` | Nilai environment variable yang dibaca di `config/env.ts` |
| `APP_TIME_ZONE` | Zona waktu kampus (`Asia/Makassar`) |

### Error
| Nama | Arti |
|---|---|
| `ApiError` | Error yang sudah dinormalisasi: `message` (Indonesia), `status`, `details` |
| `fromSupabaseError(error, overrides)` | Ubah error Supabase jadi `ApiError`. `overrides` mengganti pesan untuk kode tertentu (mis. `self_lockout`) |
| `toApiError(error)` | Versi umum untuk error apa pun, dipakai Axios |

### Auth
| Nama | Arti |
|---|---|
| `SessionUser` | Data user yang login: `id`, `email`, `displayName`, `roleCode`, `roleName`, `employeeId`, `permissions` |
| `RoleCode` / `ROLE_CODES` | Kode peran yang dikenali aplikasi |
| `LoginInput` | Isi form login: `email`, `password` |
| `signInWithEmail` / `signOut` | Masuk dan keluar lewat Supabase Auth |
| `getCurrentUser()` | User yang sedang login, atau `null` |
| `requirePermission(code)` | Ambil user untuk halaman. Redirect ke login jika belum masuk, ke dashboard jika tidak punya izin |
| `changePassword(current, next)` | Ganti password setelah password lama diverifikasi |
| `createSupabaseServerClient` | Supabase untuk server, dengan cookie (`lib/supabase/server.ts`) |
| `createSupabaseBrowserClient` | Supabase untuk browser (`lib/supabase/client.ts`) |
| `updateSession` | Menyegarkan cookie sesi di proxy (`lib/supabase/proxy.ts`) |
| `loginAction` / `logoutAction` / `changePasswordAction` | Server Action untuk masuk, keluar, dan ganti password |
| `log_audit_event` | RPC untuk mencatat aktivitas ke `audit_logs` |
| `has_permission` | RPC untuk mengecek permission user yang login |
| `PERMISSIONS` | Kode permission yang dipakai frontend (`PERMISSIONS.userManage` = `"user.manage"`) |
| `requiredPermissionFor(pathname)` | Permission yang dibutuhkan sebuah route, atau `null` jika cukup login |

### Akun
| Nama | Arti |
|---|---|
| `UserAccount` | Baris akun: `id`, `email`, `roleCode`, `isActive`, `employeeName`, `lastSignInAt` |
| `NewAccount` / `AccountUpdate` | Data untuk membuat akun / mengubah peran dan status |
| `listAccounts`, `updateAccount`, `createAccount` | Service akun |
| `useAccounts`, `useCreateAccount`, `useUpdateAccount` | Hook TanStack Query untuk akun |
| `accountKeys` | Query key akun |
| `generateTemporaryPassword(length)` | Password sementara acak untuk akun baru |
| `SELF_LOCKOUT_MESSAGE` | Pesan saat mencoba menonaktifkan atau mengubah peran sendiri |

### Master data
| Nama | Arti |
|---|---|
| `WorkUnit` | Unit kerja: `name`, `unitType`, `parentId` (induk di hierarki), `isActive` |
| `Position` | Jabatan: `name`, `positionType`, `level`, `isActive` |
| `WorkUnitFormValues` / `PositionFormValues` | Bentuk data form dari Zod |
| `listWorkUnits`, `createWorkUnit`, `updateWorkUnit`, `listPositions`, ... | Service master data |
| `useWorkUnits`, `useSaveWorkUnit`, `usePositions`, `useSavePosition` | Hook TanStack Query |
| `masterDataKeys` | Query key master data |
| `is_active` / `isActive` | `true` jika data masih dipakai (tidak dihapus, hanya dinonaktifkan) |

### Pegawai
| Nama | Arti |
|---|---|
| `employeeKeys` | Query key pegawai: `all`, `lists()`, `list(filters)`, `detail(id)`, `options()`, `account(id)` |
| `EmployeeListFilters` | Filter daftar pegawai: pencarian, kategori, unit kerja, status, halaman |
| `EMPLOYEE_PAGE_SIZE` | Jumlah baris per halaman daftar pegawai (20) |
| `EmployeeOption` | Satu pilihan pegawai: `id`, `fullName`, `employeeNumber`, `activeStatus` |
| `useEmployeeOptions` | Daftar semua pegawai untuk pilihan (dipakai `EmployeeSelect`) |
| `EmployeeSelect` | Pilihan pegawai yang bisa dicari. `activeOnly` = hanya pegawai aktif |

### Komponen bersama
| Nama | Arti |
|---|---|
| `SearchableSelect` | Dropdown satu pilihan dengan kotak pencarian; `options` berisi `{ value, label }` |
| `ConfirmDeleteDialog` | Konfirmasi sebelum menghapus |
| `DecisionDialog` | Dialog setujui/tolak dengan catatan (dan nomor SK bila perlu) |
| `ProposalStatusBadge` | Label status usulan: Diusulkan, Disetujui, Ditolak, Dijalankan |
| `ActiveStatusBadge` | Label Aktif/Nonaktif |
| `PaginationBar` | Navigasi halaman tabel |
| `PageContainer` / `PageHeader` | Padding halaman / judul, deskripsi, breadcrumb, dan tombol aksi |
| `downloadCsv` | Unduh tabel sebagai CSV (`lib/csv.ts`) |
| `useDebouncedValue` | Menunda nilai input pencarian (default 300 ms) |

### Modul transaksi
| Nama | Arti |
|---|---|
| `attendanceKeys`, `leaveKeys`, `performanceKeys`, `trainingKeys`, `profileRequestKeys`, `notificationKeys` | Query key per modul |
| `todayInCampus()` | Tanggal hari ini menurut zona waktu kampus |
| `Coordinates` | Posisi GPS: `latitude`, `longitude`, `accuracy` |
| `ATTENDANCE_STATUS_LABELS` | Label status presensi |
| `LeaveBalance` | Cuti tahunan: `quota`, `used`, `pending` (menunggu keputusan), `remaining` |
| `countLeaveDays` | Pratinjau jumlah hari cuti di form |
| `AppraisalPeriod` / `AppraisalDetail` | Periode penilaian / satu formulir beserta indikatornya |
| `APPRAISAL_STATUS_LABELS` | Label status penilaian |
| `Training` / `Registration` | Diklat / pendaftaran pegawai pada diklat |
| `Mutation` / `Promotion` | Usulan mutasi / usulan kenaikan |
| `ProposalStatus` | Status usulan: `proposed`, `approved`, `rejected`, `executed` |
| `PROMOTION_TYPE_LABELS` | Jenis kenaikan: pangkat (`rank`) atau jabatan |
| `ChangeRequest` / `CHANGE_FIELDS` | Pengajuan perbaikan data / daftar field yang boleh diajukan |
| `AppNotification` / `NotificationFeed` | Satu notifikasi / daftar notifikasi dan jumlah belum dibaca |

### Tampilan (UI state)
| Nama | Arti |
|---|---|
| `useUiStore` | Penyimpanan state tampilan (Zustand) |
| `isSidebarCollapsed` | `true` jika sidebar desktop sedang diciutkan |
| `toggleSidebarCollapsed` | Ganti status ciut ↔ lebar |
| `isMobileSidebarOpen` | `true` jika drawer menu mobile terbuka |
| `hasHydrated` | `true` jika status sidebar sudah dibaca dari localStorage |
| `active` | `true` jika menu ini halaman yang sedang dibuka |

### Dashboard
| Nama | Arti |
|---|---|
| `report.view` | Izin yang menampilkan dashboard statistik |
| `ScopeInfo` | Cakupan pimpinan dari `report_scopes` (label unit/kategori) |
| `EmployeeStatRow` | Jumlah pegawai per unit dan kategori (aktif, nonaktif, pensiun) |
| `PendingCounts` | Jumlah antrean untuk HR (cuti, perbaikan data, nilai) |
| `CATEGORY_LABELS` | Label kategori pegawai: Dosen / Tendik |
| `employeeNumber` | NIP |

---

## 12. Yang belum dikerjakan & catatan penting

- **Menjalankan lokal:** salin `.env.example` menjadi `.env.local` dan isi `NEXT_PUBLIC_SUPABASE_URL` serta `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Next.js tidak membaca `.env.example`.
- **Database harus aktif:** project Supabase harus berstatus aktif, dan migrasi serta seed sudah terpasang (langkah di `docs/database-schema.md`).
- **Semua fase kode (1–7) selesai.** Berikutnya: uji alur per peran di Supabase, lalu fitur tambahan (lihat `docs/requirements.md` bagian 7).
- **Pencarian** di header baru tampilan saja.
- **Notifikasi** (lihat 9.15) memakai polling 60 detik, bukan realtime. Pengiriman lewat email belum ada.- **`lib/axios.ts` dan `stores/auth-store.ts`** disiapkan untuk API pihak ketiga (Keuangan, SIAKAD). Belum dipakai. Jangan dipakai untuk Supabase.
- **Dokumen lama:** `docs/api-contract.md` adalah arsip pertanyaan untuk API eksternal lama dan tidak lagi berlaku. `docs/architecture.md` sudah mengikuti arsitektur Supabase.
- **Route baru:** setiap route tingkat atas yang baru harus ditambahkan ke `matcher` dan `PROTECTED_PREFIXES` di `src/proxy.ts`, agar sesi tetap disegarkan di halaman itu.
- **Loading & error:** `(dashboard)/loading.tsx` (skeleton saat pindah halaman), `(dashboard)/error.tsx` (halaman gagal dimuat), dan `app/not-found.tsx` (alamat tidak dikenal).

---

## 13. Perintah sehari-hari

| Perintah | Fungsi |
|---|---|
| `npm ci` | Pasang dependency sesuai `package-lock.json` |
| `npm run dev` | Jalankan di `http://localhost:3000` |
| `npx next typegen` | Buat file tipe Next.js (`PageProps`, `LayoutProps`). Jalankan sekali setelah clone baru, sebelum `tsc` |
| `npm run lint` | Cek gaya dan kesalahan umum |
| `npx tsc --noEmit` | Cek tipe TypeScript |
| `npm run build` | Build produksi (cek akhir sebelum PR) |
