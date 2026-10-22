# Project: Aplikasi Kepegawaian

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Zustand untuk client state
- TanStack Query untuk server state
- Axios untuk HTTP client
- React Hook Form + Zod untuk form validation

## Aturan utama
- API pegawai sudah disediakan. Jangan membuat backend atau database baru.
- Jangan mengarang endpoint, field, response, atau aturan bisnis.
- Jika detail API belum jelas, buat `docs/api-contract.md` berisi pertanyaan dan asumsi, lalu tunggu konfirmasi.
- Kerjakan fitur secara bertahap. Jangan membuat seluruh aplikasi sekaligus.
- Semua pemanggilan API harus melalui service layer.
- Gunakan TanStack Query untuk data server.
- Gunakan Zustand hanya untuk state UI/client.
- Gunakan TypeScript strict dan hindari `any`.
- UI menggunakan bahasa Indonesia.
- Kode, nama variabel, komentar, dan commit message menggunakan English.

## Struktur folder
src/
  app/
  components/
    ui/
    layout/
    common/
  features/
    employees/
      components/
      hooks/
      schemas/
      services/
      types/
    auth/
  lib/
  stores/
  types/
  config/

## Axios
- Buat `src/lib/axios.ts` sebagai Axios instance terpusat.
- Gunakan interceptor untuk base URL, Authorization header, normalisasi error, dan handling 401.
- Jangan hardcode URL API atau credential; gunakan environment variable.

## TanStack Query
- Gunakan query key yang terstruktur.
- Invalidate query setelah create, update, atau delete berhasil.
- Jangan optimistic update kecuali diminta.

## UI
- Gunakan shadcn/ui.
- Sediakan loading skeleton, empty state, error state, dan konfirmasi untuk aksi delete.
- Pastikan responsif dari mobile hingga desktop.
- Gunakan toast untuk feedback aksi pengguna.

## Commands
- Development: `npm run dev`
- Lint: `npm run lint`
- Type check: `npx tsc --noEmit`
- Build: `npm run build`