# API Contract — Pertanyaan & Asumsi

Dokumen ini berisi informasi API pegawai yang **harus dikonfirmasi** sebelum
fitur autentikasi dan CRUD pegawai diimplementasikan. Selama belum ada
konfirmasi, tidak ada endpoint, field, atau aturan bisnis yang dikarang di kode.

Status: **Menunggu konfirmasi**

---

## 1. Umum

| # | Pertanyaan | Asumsi sementara |
|---|------------|------------------|
| 1.1 | Berapa base URL API untuk development, staging, dan production? | Diisi lewat `NEXT_PUBLIC_API_BASE_URL`. |
| 1.2 | Apakah ada prefix/versi path (mis. `/api/v1`)? | Prefix ikut dimasukkan ke base URL. |
| 1.3 | Apakah ada dokumentasi resmi (OpenAPI/Swagger/Postman collection)? | — |
| 1.4 | Apakah CORS sudah mengizinkan origin frontend (mis. `http://localhost:3000`)? | Diasumsikan sudah. |
| 1.5 | Format tanggal yang digunakan (ISO 8601 `YYYY-MM-DD`, dengan/tanpa waktu, zona waktu)? | — |
| 1.6 | Apakah ada rate limit atau header khusus yang wajib dikirim? | Tidak ada. |

## 2. Autentikasi

| # | Pertanyaan | Asumsi sementara |
|---|------------|------------------|
| 2.1 | Endpoint login (method + path) dan body request-nya (username/email/NIP + password?). | — |
| 2.2 | Bentuk response login (nama field token, expiry, data user). | — |
| 2.3 | Skema Authorization: `Bearer <token>` di header, atau cookie httpOnly dari server? | `Authorization: Bearer <token>` (sudah disiapkan di `src/lib/axios.ts`). |
| 2.4 | Apakah ada refresh token? Endpoint dan alurnya? | Tidak ada; 401 → hapus sesi & redirect ke `/login`. |
| 2.5 | Endpoint logout? | — |
| 2.6 | Endpoint profil user yang sedang login (mis. untuk nama di header)? | — |
| 2.7 | Di mana token boleh disimpan (memory, localStorage, cookie)? | Saat ini hanya di memory (hilang saat reload). |
| 2.8 | Apakah ada role/permission (mis. admin vs operator) yang membatasi aksi CRUD? | Tidak ada pembatasan role. |

## 3. Data Pegawai

| # | Pertanyaan | Asumsi sementara |
|---|------------|------------------|
| 3.1 | Daftar lengkap field pegawai: nama field, tipe data, nullable atau tidak. | — |
| 3.2 | Field identitas utama: `id` (number/UUID/string)? Apakah NIP unik dan bisa dipakai di URL? | `id` diperlakukan sebagai string di URL. |
| 3.3 | Field mana yang wajib saat create, dan mana yang boleh diubah saat update? | — |
| 3.4 | Aturan validasi per field (panjang, format NIP/NIK, email, nomor HP, tanggal). | — |
| 3.5 | Field enum/pilihan (mis. jenis kelamin, status pegawai, jabatan, unit kerja, golongan): nilai yang valid? Apakah ada endpoint master data untuk opsi tersebut? | — |
| 3.6 | Apakah ada upload file (foto, dokumen)? Format, ukuran maksimal, dan endpoint-nya? | Tidak ada. |
| 3.7 | Field mana yang perlu ditampilkan di tabel daftar vs halaman detail? | — |

## 4. Endpoint CRUD Pegawai

Mohon konfirmasi method, path, request, dan response untuk setiap operasi:

| Operasi | Method & path | Request | Response sukses |
|---------|---------------|---------|-----------------|
| Daftar pegawai | ? | query params? | ? |
| Detail pegawai | ? | — | ? |
| Tambah pegawai | ? | body? (JSON / multipart) | ? (status code, data yang dikembalikan) |
| Ubah pegawai | ? (PUT atau PATCH?) | body? | ? |
| Hapus pegawai | ? | — | ? (soft delete atau hard delete?) |

## 5. Daftar, Pencarian, dan Paginasi

| # | Pertanyaan | Asumsi sementara |
|---|------------|------------------|
| 5.1 | Jenis paginasi: page/limit, offset/limit, atau cursor? Nama query param-nya? | — |
| 5.2 | Bentuk metadata paginasi di response (total, total pages, current page)? | — |
| 5.3 | Apakah ada pencarian? Field apa saja yang dicari dan nama param-nya? | — |
| 5.4 | Filter apa saja yang tersedia (status, unit kerja, jabatan, dll.)? | — |
| 5.5 | Apakah sorting didukung? Nama param dan field yang bisa di-sort? | — |
| 5.6 | Ukuran halaman default dan maksimal? | — |

## 6. Format Response & Error

| # | Pertanyaan | Asumsi sementara |
|---|------------|------------------|
| 6.1 | Apakah response dibungkus envelope (mis. `{ data, message, meta }`) atau langsung data? | — |
| 6.2 | Bentuk body error umum (mis. `{ message, errors }`)? | Jika ada `message` (string), ditampilkan ke pengguna; selain itu pesan umum. |
| 6.3 | Bentuk error validasi (422/400) per field, agar bisa dipetakan ke form? | — |
| 6.4 | Status code yang digunakan: 400, 401, 403, 404, 409 (duplikat NIP?), 422, 500? | — |
| 6.5 | Bahasa pesan error dari server (Indonesia/Inggris)? | — |

## 7. Dashboard

| # | Pertanyaan | Asumsi sementara |
|---|------------|------------------|
| 7.1 | Apakah ada endpoint ringkasan/statistik untuk dashboard? Jika tidak, apa yang perlu ditampilkan? | Dashboard tetap placeholder. |

---

## Riwayat Konfirmasi

| Tanggal | Bagian | Keputusan |
|---------|--------|-----------|
| — | — | — |
