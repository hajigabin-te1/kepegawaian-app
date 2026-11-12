# Panduan Kode — Aplikasi Kepegawaian STIA Amuntai

Dokumen ini menjelaskan apa yang sudah dibangun, bagaimana bagian-bagiannya saling terhubung,
dan arti nama-nama variabel, fungsi, dan tipe di kode. Kode tetap memakai bahasa Inggris
(aturan di `CLAUDE.md`); dokumen ini adalah "kamus" dalam bahasa Indonesia.

Status per **11 November 2026** (setelah PR #8 di-merge).

---

## 1. Gambaran besar

Frontend **Next.js 16 (App Router)** dengan **Supabase** sebagai backend (Postgres, Auth, Storage).
Tidak ada API route atau backend lain yang dibuat di repo ini.

| Bagian | Kondisi sekarang |
|---|---|
| Login & sesi | **Sudah jalan.** Supabase Auth dengan email + password. Sesi disimpan di cookie oleh `@supabase/ssr` |
| Proteksi halaman | **Sudah jalan** lewat `src/proxy.ts` dan pengecekan permission di halaman |
| Hak akses (RBAC) | **Sudah jalan.** Menu, route, dan RPC dibatasi berdasarkan permission peran |
| Kelola akun pengguna | **Sudah jalan** (buat, ubah peran, aktif/nonaktif) |
| Master data (unit kerja, jabatan) | **Sudah jalan** (daftar, tambah, ubah) |
| Ganti password | **Sudah jalan** |
| Dashboard | **Statistik asli** dari `report_employee_statistics()` (HR & pimpinan); akun lain melihat panel sambutan |
| Data pegawai (daftar, tambah, detail, ubah, nonaktifkan, buat akun) | **Sudah jalan** (HR, `employee.view` / `employee.manage`) |
| Modul lain (presensi, cuti, kinerja, diklat, mutasi) | Skema SQL sudah ada, UI belum |

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
          ├── employees/...          (placeholder)
          ├── master/work-units, positions
          ├── accounts/
          └── profile/password/
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
    (dashboard)/dashboard/       Dashboard (data contoh) + loading.tsx
    (dashboard)/employees/       Data pegawai (placeholder)
    (dashboard)/master/          Unit kerja dan jabatan (memakai requirePermission)
    (dashboard)/accounts/        Kelola akun pengguna (requirePermission)
    (dashboard)/profile/password/ Ganti password sendiri
  components/
    ui/                          Komponen dasar shadcn/ui. Jarang diubah
    layout/                      Sidebar, header, breadcrumb, menu user, pencarian, notifikasi
    common/                      AppProviders, EmptyState, PlaceholderNotice, QueryErrorState,
                                 TableSkeleton, ActiveStatusBadge
  features/                      Satu folder per modul bisnis
    auth/                        Login, logout, ganti password, baca user yang login
      actions.ts                 Server Action: loginAction, logoutAction, changePasswordAction
      services/auth-service.ts   Logika Supabase Auth + getCurrentUser + requirePermission
      components/                LoginForm, ChangePasswordForm
      schemas/                   Validasi form login dan ganti password
      types/auth.ts              SessionUser, RoleCode, LoginInput
    accounts/                    Kelola akun pengguna (daftar, buat, ubah peran/status)
      services/account-service.ts  listAccounts, listRoles, updateAccount, createAccount
      hooks/use-accounts.ts      useAccounts, useRoles, useUpdateAccount, useCreateAccount
      components/                AccountsPanel, CreateAccountDialog, AccountFormDialog
      schemas/, types/           Validasi dan bentuk data akun
    master-data/                 Unit kerja dan jabatan
      services/master-data-service.ts  listWorkUnits, createWorkUnit, updateWorkUnit, listPositions, ...
      hooks/use-master-data.ts   useWorkUnits, useSaveWorkUnit, usePositions, useSavePosition
      components/                WorkUnitsPanel, PositionsPanel, form dialog masing-masing
      schemas/, types/           Validasi dan bentuk data master
    dashboard/
      data/mock-dashboard.ts     Data contoh dashboard (akan diganti data asli)
      components/                KpiStrip, RecentEmployeesCard, PendingDocumentsCard
    employees/                   Disiapkan untuk CRUD pegawai (saat ini hanya query key)
  lib/
    supabase/client.ts           Supabase untuk browser (createSupabaseBrowserClient)
    supabase/server.ts           Supabase untuk server, memakai cookie (createSupabaseServerClient)
    supabase/proxy.ts            updateSession + redirectWithCookies, dipakai proxy.ts
    api-error.ts                 ApiError, toApiError, fromSupabaseError
    query-client.ts              Pengaturan TanStack Query
    axios.ts                     Klien HTTP untuk API pihak ketiga (belum dipakai)
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
| `user.manage` | Kelola akun pengguna |
| `master.manage` | Kelola unit kerja dan jabatan |
| `employee.view` | Lihat daftar dan detail pegawai |
| `employee.manage` | Tambah dan ubah data pegawai |

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
  - Notifikasi selalu kosong karena belum ada sumber datanya.

---

## 9. Modul yang sudah jalan

### 9.1 Kelola akun (`/accounts`, permission `user.manage`)

- Daftar akun memanggil RPC `list_user_accounts` (berisi email, peran, status, nama pegawai, login terakhir).
- Ubah peran dan status memanggil `updateAccount`, yang mengupdate `user_accounts`.
  Jika mencoba menonaktifkan atau mengubah peran sendiri, database menolak dan pesannya diterjemahkan lewat `fromSupabaseError`.
- Buat akun baru memanggil Edge Function `admin-create-user` dengan `createAccount`.
  Pembuatan lewat function ini wajib karena membuat user Auth butuh secret key yang tidak boleh ada di browser.
  Password sementara dibuat otomatis (`generateTemporaryPassword`).

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

---

## 10. Dashboard

`src/app/(dashboard)/dashboard/page.tsx`:

- **HR dan pimpinan** (`employee.view` atau `report.view`): `EmployeeStatistics`, berisi 4 angka (pegawai aktif,
  dosen aktif, tendik aktif, nonaktif & pensiun) dan tabel sebaran per unit kerja dari `report_employee_statistics()`.
  Cakupan pimpinan mengikuti `report_scopes`. HR juga melihat **Pegawai terbaru** (5 data terakhir).
- **Akun lain** (superadmin, pegawai): `WelcomePanel` sampai modul mereka dibuat.

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
| `employeeQueryKeys` | Query key pegawai: `all`, `lists()`, `list(filters)`, `detail(id)` |
| `EmployeeListFilters` | Bentuk filter daftar pegawai (belum final) |

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
| `mockDashboardStats` / `stats` | Angka ringkasan contoh |
| `mockRecentEmployees` | Daftar pegawai terbaru (contoh) |
| `mockPendingDocuments` | Dokumen menunggu verifikasi (contoh) |
| `employeeNumber` | NIP |
| `status`: `active` / `onLeave` / `inactive` | Aktif / Cuti / Nonaktif |
| `category`: `lecturer` / `staff` | Dosen / Tendik |
| `waitingDays` | Lama dokumen menunggu (hari) |
| `OVERDUE_AFTER_DAYS` | Batas hari sebelum dokumen dianggap terlambat (7) |

---

## 12. Yang belum dikerjakan & catatan penting

- **Menjalankan lokal:** salin `.env.example` menjadi `.env.local` dan isi `NEXT_PUBLIC_SUPABASE_URL` serta `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Next.js tidak membaca `.env.example`.
- **Database harus aktif:** project Supabase harus berstatus aktif, dan migrasi serta seed sudah terpasang (langkah di `docs/database-schema.md`).
- **Berikutnya (Tahap 2 admin HR):** Riwayat Jabatan, Riwayat Pendidikan, Dokumen Pegawai.
- **Pencarian dan notifikasi** baru tampilan saja.
- **`lib/axios.ts` dan `stores/auth-store.ts`** disiapkan untuk API pihak ketiga (Keuangan, SIAKAD). Belum dipakai. Jangan dipakai untuk Supabase.
- **Dokumen lama:** `docs/architecture.md` dan `docs/api-contract.md` masih menjelaskan arsitektur API eksternal. Perlu diperbarui.

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
