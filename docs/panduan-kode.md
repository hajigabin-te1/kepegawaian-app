# Panduan Kode — Aplikasi Kepegawaian STIA Amuntai

Dokumen ini menjelaskan apa saja yang sudah dibangun, bagaimana bagian-bagiannya saling terhubung,
dan arti nama-nama variabel/fungsi di kode. Kode tetap memakai bahasa Inggris (aturan di `CLAUDE.md`);
dokumen inilah "kamus"-nya dalam bahasa Indonesia.

Status per 2 November 2026 (setelah PR #1–#5 di-merge ke `main`).

---

## 1. Gambaran besar

Aplikasi ini **frontend saja** (Next.js 16, App Router). Tidak ada backend atau database.
API pegawai yang asli belum dikonfirmasi, jadi:

| Bagian | Kondisi sekarang |
|---|---|
| Login & sesi | **Supabase Auth**: login dengan email + password, sesi di cookie yang dikelola `@supabase/ssr` |
| Proteksi halaman | **Sudah jalan** lewat `src/proxy.ts` |
| Tampilan (sidebar, header, login, dashboard) | **Sudah jadi** |
| Dashboard | Isinya **data contoh** (`mock-dashboard.ts`) |
| Halaman pegawai (daftar, tambah, detail, ubah) | Masih **placeholder** |
| Database | **Supabase** (skema di `supabase/migrations`, penjelasan di `docs/database-schema.md`) |
| TanStack Query | Sudah disiapkan, belum dipakai (dipakai mulai modul data pegawai) |

Daftar pertanyaan ke tim API ada di `docs/api-contract.md`.

---

## 2. Alur saat aplikasi dibuka

```
Browser membuka URL
   │
   ▼
src/proxy.ts                 ← "satpam": cek cookie sesi, arahkan ke /login atau /dashboard
   │
   ▼
src/app/layout.tsx           ← kerangka HTML paling luar + AppProviders (TanStack Query, toast)
   │
   ├── (auth)/layout.tsx     ← kerangka halaman login
   │      └── login/page.tsx
   │
   └── (dashboard)/layout.tsx ← kerangka setelah login: sidebar + header
          ├── dashboard/page.tsx
          └── employees/...   (placeholder)
```

Folder dengan tanda kurung seperti `(auth)` dan `(dashboard)` adalah **route group**: hanya untuk
mengelompokkan file. Namanya tidak muncul di URL (`/login`, bukan `/(auth)/login`).

---

## 3. Peta folder

```
src/
  proxy.ts                     Proteksi route (pengganti "middleware" di Next.js 16)
  app/                         Halaman (setiap folder = satu URL)
    layout.tsx                 Layout root: font, judul tab, AppProviders
    page.tsx                   URL "/" → redirect ke /dashboard
    globals.css                Token warna 60-30-10 (#F8F8FF, #191970, #87CEFA)
    (auth)/login/page.tsx      Halaman login (split layout)
    (dashboard)/layout.tsx     Shell setelah login: ambil sesi → sidebar + header
    (dashboard)/dashboard/     Dashboard + loading.tsx (skeleton)
    (dashboard)/employees/     Halaman pegawai (masih placeholder)
  components/
    ui/                        Komponen dasar shadcn/ui (Button, Card, Table, dst.). Jarang diubah.
    layout/                    Sidebar, header, breadcrumb, menu user, pencarian, notifikasi
    common/                    Komponen umum: AppProviders, EmptyState, PlaceholderNotice
  features/
    auth/                      Semua hal tentang login
      types/auth.ts            Bentuk data: SessionUser, LoginInput, AuthResult
      schemas/login-schema.ts  Aturan validasi form login (Zod)
      services/auth-service.ts Login/logout Supabase + baca akun yang sedang login (getCurrentUser)
      actions.ts               Server Action: loginAction, logoutAction
      components/login-form.tsx Form login (React Hook Form)
    dashboard/
      data/mock-dashboard.ts   Data contoh dashboard
      components/              KpiStrip, RecentEmployeesCard, PendingDocumentsCard
    employees/                 Disiapkan untuk CRUD pegawai (baru berisi query key)
  lib/
    axios.ts                   Klien HTTP terpusat (base URL, token, error, 401)
    api-error.ts               Bentuk error yang seragam (ApiError)
    query-client.ts            Pengaturan TanStack Query
    utils.ts                   cn() (gabung class) + getInitials() (inisial nama)
  stores/
    ui-store.ts                State tampilan (Zustand): sidebar diciutkan / drawer mobile
    auth-store.ts              Token di memori untuk Axios (API pihak ketiga; belum dipakai)
  config/
    env.ts                     Membaca environment variable
    routes.ts                  Daftar URL aplikasi
    navigation.ts              Daftar menu sidebar
```

---

## 4. Alur login (langkah demi langkah)

1. Pengguna membuka `/login` → `src/app/(auth)/login/page.tsx` menampilkan `LoginForm`.
2. `LoginForm` (`features/auth/components/login-form.tsx`):
   - `useForm(...)` membuat form dengan aturan dari `loginSchema` (email valid & password wajib diisi).
   - Saat tombol **Masuk** ditekan, `handleSubmit(onSubmit)` memvalidasi dulu. Kalau salah, pesan
     error muncul di bawah field dan `onSubmit` tidak dijalankan.
   - `onSubmit` memanggil `loginAction(values)`.
3. `loginAction` (`features/auth/actions.ts`) berjalan **di server**:
   - Memvalidasi ulang dengan `loginSchema.safeParse` (jangan percaya data dari browser).
   - `signInWithEmail` (`auth-service.ts`) memanggil `supabase.auth.signInWithPassword`.
     Salah → "Email atau password salah." (Alert merah).
   - Login berhasil, tetapi akunnya tidak ada di `user_accounts` atau nonaktif → langsung logout lagi,
     pesan "Akun belum terdaftar … atau sedang nonaktif".
   - Berhasil → kejadian `login` dicatat di `audit_logs`, cookie sesi Supabase tersimpan, lalu `redirect("/dashboard")`.
4. Logout: tombol di bawah sidebar atau menu avatar → `logoutAction` → `signOut` → `/login`.
5. Siapa yang sedang login dibaca `getCurrentUser()`: klaim JWT Supabase → baris `user_accounts`
   (role, status aktif) → nama dari `employees` (kalau akun terhubung ke pegawai), atau nama role.

Cookie sesi dikelola `@supabase/ssr` dan disegarkan otomatis oleh `src/proxy.ts`.

---

## 5. Proteksi halaman (`src/proxy.ts`)

Dijalankan **sebelum** halaman dirender, hanya untuk URL di `config.matcher`
(`/`, `/login`, `/dashboard/...`, `/employees/...`).

| Kondisi | Hasil |
|---|---|
| Buka `/` dan sudah login | ke `/dashboard` |
| Buka `/` dan belum login | ke `/login` |
| Buka `/login` dan sudah login | ke `/dashboard` |
| Buka `/dashboard` atau `/employees/...` dan belum login | ke `/login` |

Lapisan kedua: `(dashboard)/layout.tsx` juga memanggil `getSession()`. Kalau sesi tidak ada,
halaman tetap di-redirect ke `/login`.

---

## 6. Shell dashboard: sidebar & header

- **`(dashboard)/layout.tsx`**: `DashboardShell` mengambil `user` dari cookie, lalu meneruskannya ke
  `AppSidebar` dan `AppHeader`. Selama menunggu, `DashboardShellFallback` (kerangka kosong) yang tampil.
- **`AppSidebar`**: sidebar navy desktop. Tombol di pojok mengecilkan/memperlebar sidebar.
  Status ini disimpan di `ui-store.ts` dan **diingat setelah reload** (localStorage, kunci `kepegawaian-ui`).
  - `hasHydrated` = apakah status tersimpan sudah dibaca dari localStorage. Animasi lebar baru dinyalakan
    setelah itu, supaya sidebar tidak "melompat" saat halaman dimuat.
- **`SidebarNav`**: daftar menu dari `config/navigation.ts`. `findActiveNavItem` mencari menu yang
  paling cocok dengan URL sekarang (yang `href`-nya paling panjang menang), lalu menu itu diberi
  latar lebih terang + bar biru muda di kiri.
- **`SidebarUser`**: avatar, nama, peran, tombol keluar.
- **`MobileSidebar`**: versi drawer (laci) untuk layar kecil, dibuka dari tombol ☰ di header.
- **`AppHeader`**: breadcrumb + judul (`HeaderBreadcrumb`), pencarian (`HeaderSearch`),
  notifikasi (`NotificationMenu`), menu avatar (`UserMenu`).
  - Pencarian **belum mencari apa pun**. Submit hanya menampilkan toast "Pencarian belum tersedia",
    karena endpoint pencarian belum ada.
  - Notifikasi selalu kosong karena belum ada API-nya.

---

## 7. Dashboard

`src/app/(dashboard)/dashboard/page.tsx` menyusun tiga bagian, semuanya dari data contoh
`features/dashboard/data/mock-dashboard.ts`:

1. **Judul + tanggal + label "Data contoh"**, dengan tombol *Data Pegawai* dan *Tambah Pegawai*.
2. **`KpiStrip`**: 4 indikator dalam satu strip:
   total pegawai, pegawai aktif (dengan bar proporsi aktif/cuti/nonaktif),
   pegawai baru bulan ini (dibanding bulan lalu), dokumen menunggu verifikasi.
3. **`RecentEmployeesCard`**: tabel pegawai terbaru dengan filter status (Semua/Aktif/Cuti/Nonaktif).
   Filter hanya menyaring data contoh di browser (`useState`).
4. **`PendingDocumentsCard`**: daftar dokumen yang menunggu, diberi warna kuning jika lebih dari 7 hari.

`loading.tsx` adalah skeleton yang otomatis tampil selama halaman disiapkan.

---

## 8. Kamus nama (variabel, fungsi, tipe)

Arti nama-nama yang paling sering muncul. Kalau menemukan nama yang belum ada di sini, tambahkan.

### Umum
| Nama | Arti |
|---|---|
| `cn(...)` | Menggabungkan beberapa class Tailwind jadi satu string, membuang yang kosong |
| `getInitials(name)` | Ambil inisial nama untuk avatar ("Siti Rahmawati" → "SR") |
| `routes` | Daftar URL aplikasi (`routes.dashboard` = `"/dashboard"`) |
| `mainNavigation` | Daftar grup menu sidebar |
| `findActiveNavItem(pathname)` | Cari menu yang sedang aktif berdasarkan URL |
| `pathname` | Bagian path dari URL sekarang, mis. `/employees/new` |
| `href` | Alamat tujuan sebuah link |
| `env` | Nilai dari environment variable (`.env`) |
| `...Formatter` | Pemformat angka/tanggal gaya Indonesia (`Intl`) |

### Auth (login)
| Nama | Arti |
|---|---|
| `SessionUser` | Data pengguna yang sedang login: `email`, `displayName`, `roleCode`, `roleName`, `employeeId` |
| `RoleCode` | Kode peran: `superadmin`, `hr_admin`, `chair`, `vice_chair`, `quality_assurance`, `employee` |
| `LoginInput` | Isi form login: `email`, `password` |
| `loginSchema` | Aturan validasi form login |
| `signInWithEmail` / `signOut` | Masuk / keluar lewat Supabase Auth |
| `getCurrentUser` | Data akun yang sedang login (atau `null`) |
| `createSupabaseServerClient` | Client Supabase untuk kode server (`lib/supabase/server.ts`) |
| `updateSession` | Menyegarkan cookie sesi di proxy (`lib/supabase/proxy.ts`) |
| `loginAction` / `logoutAction` | Aksi server untuk masuk / keluar |
| `isPasswordVisible` | `true` jika password sedang ditampilkan (ikon mata) |
| `register` | Menghubungkan sebuah input ke React Hook Form |
| `handleSubmit` | Validasi dulu, baru panggil `onSubmit` |
| `errors` | Pesan error per field (`errors.email`, `errors.root` untuk error umum) |
| `isSubmitting` | `true` selama proses login berjalan (tombol jadi "Memproses...") |

### Tampilan (UI state)
| Nama | Arti |
|---|---|
| `useUiStore` | Penyimpanan state tampilan (Zustand) |
| `isSidebarCollapsed` / `collapsed` | `true` jika sidebar desktop sedang diciutkan |
| `toggleSidebarCollapsed` | Ganti status ciut ↔ lebar |
| `isMobileSidebarOpen` | `true` jika laci menu mobile sedang terbuka |
| `hasHydrated` | `true` jika status sidebar sudah dibaca dari localStorage |
| `active` | `true` jika menu ini halaman yang sedang dibuka |
| `isLoggingOut` | `true` selama proses keluar berjalan |

### Dashboard
| Nama | Arti |
|---|---|
| `mockDashboardStats` / `stats` | Angka ringkasan contoh (total, aktif, cuti, dst.) |
| `mockRecentEmployees` | Daftar pegawai terbaru (contoh) |
| `mockPendingDocuments` | Daftar dokumen yang menunggu verifikasi (contoh) |
| `employeeNumber` | NIP |
| `status`: `active` / `onLeave` / `inactive` | Aktif / Cuti / Nonaktif |
| `category`: `lecturer` / `staff` | Dosen / Tendik (tenaga kependidikan) |
| `joinedAt` | Tanggal masuk |
| `waitingDays` | Lama dokumen menunggu (hari) |
| `OVERDUE_AFTER_DAYS` | Batas hari sebelum dokumen dianggap terlambat (7) |
| `newEmployeesDelta` | Selisih pegawai baru bulan ini dibanding bulan lalu |
| `filter` / `setFilter` | Filter status yang dipilih di tabel |
| `kpis` | Daftar 4 indikator di `KpiStrip` |

---

## 9. Yang belum dikerjakan & catatan penting

- **Menjalankan lokal:** salin `.env.example` menjadi `.env.local` (Next.js tidak membaca `.env.example`).
- **Dashboard** masih memakai data contoh; data asli dari Supabase menyusul per modul.
- **Halaman pegawai** (daftar/tambah/detail/ubah) masih placeholder. Ini fase berikutnya (lihat `docs/requirements.md`).
- **Hak akses (RBAC):** menu disaring dari `permissions` milik peran (`config/navigation.ts`), proxy memblokir
  halaman yang butuh izin (`config/permissions.ts`), dan halaman memanggil `requirePermission(...)`.
- **Pembuatan akun baru:** halaman Akun Pengguna → "Tambah Akun" memanggil Edge Function `admin-create-user`
  (`supabase/functions/`), karena membuat user Supabase Auth butuh secret key yang tidak boleh ada di browser.
- **Pencarian & notifikasi** baru tampilan saja.

---

## 10. Perintah sehari-hari

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan di `http://localhost:3000` |
| `npm run lint` | Cek gaya & kesalahan umum |
| `npx tsc --noEmit` | Cek tipe TypeScript |
| `npm run build` | Build produksi (cek akhir sebelum PR) |
