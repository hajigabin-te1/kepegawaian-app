# SIMPEG STIA Amuntai

Sistem informasi kepegawaian untuk dosen dan tenaga kependidikan STIA Amuntai: data pegawai,
presensi web berbasis GPS, cuti dan izin, penilaian kinerja, diklat, mutasi, kenaikan pangkat,
pengumuman, dan dashboard statistik pimpinan.

Frontend Next.js (App Router) dengan Supabase (Postgres, Auth, Storage) sebagai backend.
Repo ini tidak berisi backend atau API route lain.

## Menjalankan di lokal

Prasyarat: Node.js 20 atau lebih baru, dan sebuah project Supabase yang migrasi serta seed-nya
sudah terpasang (langkahnya di [`docs/database-schema.md`](docs/database-schema.md)).

```bash
npm ci
cp .env.example .env.local   # lalu isi URL dan key Supabase
npx next typegen             # sekali setelah clone, sebelum tsc
npm run dev                  # http://localhost:3000
```

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server development |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Cek tipe |
| `npm run build` | Build produksi |

## Dokumentasi

| Dokumen | Isi |
|---|---|
| [`docs/requirements.md`](docs/requirements.md) | Kebutuhan sistem, fase pengerjaan, keputusan, dan pertanyaan terbuka |
| [`docs/architecture.md`](docs/architecture.md) | Ringkasan arsitektur dan lapisan kode |
| [`docs/panduan-kode.md`](docs/panduan-kode.md) | Panduan kode lengkap dan kamus nama |
| [`docs/database-schema.md`](docs/database-schema.md) | Skema, RLS, Edge Function, dan cara memasang di Supabase |
| [`docs/design/design-decisions.md`](docs/design/design-decisions.md) | Keputusan desain dan palet warna |
| [`CLAUDE.md`](CLAUDE.md) | Aturan pengerjaan proyek |
