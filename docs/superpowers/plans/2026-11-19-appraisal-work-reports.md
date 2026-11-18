# Laporan Kerja Pegawai — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pegawai mengisi laporan kerja (deskripsi + bukti) per periode penilaian aktif; HR membacanya sebagai bahan formulir penilaian.

**Architecture:** Satu migrasi baru (tabel, fungsi kunci, dua RPC, RLS, bucket `appraisal-evidence` + policy Storage). Frontend di `features/performance`: service + hooks + schema + komponen pegawai (`/performance`) dan komponen HR (halaman form + kolom di daftar form).

**Tech Stack:** Supabase (Postgres, Storage), Next.js App Router, TanStack Query, React Hook Form + Zod, shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-11-19-appraisal-work-reports-design.md`

## Global Constraints

- File bukti: wajib, satu per laporan, `application/pdf`, `image/jpeg`, `image/png`, maks. 5242880 byte.
- Deskripsi 10–2000 karakter (trim).
- Terkunci jika periode `is_active = false` atau formulir pegawai pada periode itu berstatus `submitted`/`verified`.
- Pengingat "minimal 3" tidak memblokir.
- Pesan error database berbahasa Inggris, diterjemahkan di service (`rpcError`), UI berbahasa Indonesia.
- Tidak ada test runner di repo: verifikasi = `npx tsc --noEmit`, `npm run lint`, `npm run build`, dan skenario manual di §8 spec setelah migrasi dijalankan.

## Review Focus

- Pegawai memanggil RPC dengan `target_report_id` milik pegawai lain → ditolak ("Work report not found").
- Path bukti di luar folder sendiri (`<employee lain>/...`) → ditolak RPC dan Storage.
- Hapus file bukti laporan terkunci lewat Storage API langsung → ditolak policy delete.
- RPC gagal setelah unggah → file baru dihapus kembali (tidak menumpuk file yatim).
- Akun tanpa `employeeId` atau tanpa periode aktif → empty state, tombol tambah tidak tampil.

---

### Task 1: Migrasi database + tipe

**Files:**
- Create: `supabase/migrations/20261118184714_appraisal_work_reports.sql`
- Modify: `src/types/database.ts` (tabel `appraisal_work_reports`, fungsi `save_work_report`, `delete_work_report`, `work_reports_locked`)

**Interfaces — Produces:**
- `save_work_report(target_report_id uuid, target_period_id uuid, new_description text, new_evidence_path text, new_evidence_name text) returns uuid`
- `delete_work_report(target_report_id uuid) returns text` (path bukti lama)
- `work_reports_locked(target_period_id uuid, target_employee_id uuid) returns boolean`
- Pesan error: `Your account is not linked to an employee`, `Work report not found`, `Work reports for this period are locked`, `Description must be 10 to 2000 characters`, `Evidence file is required`, `Evidence must be stored in your own folder`.

- [ ] Tulis migrasi sesuai §6.1 spec (security definer, `search_path = ''`, revoke/grant seperti `..._appraisal_rules`).
- [ ] Tambah tipe ke `database.ts`.
- [ ] `npx tsc --noEmit` lulus. Commit.

### Task 2: Service, hooks, schema

**Files:**
- Create: `src/features/performance/services/work-report-service.ts`, `src/features/performance/hooks/use-work-reports.ts`, `src/features/performance/schemas/work-report-schemas.ts`
- Modify: `src/features/performance/types/performance.ts`

**Interfaces — Produces:**
- Tipe `WorkReport = { id; periodId; employeeId; description; evidencePath; evidenceName; createdAt; updatedAt }`, konstanta `MIN_WORK_REPORTS = 3`.
- `listWorkReports(periodId, employeeId): Promise<WorkReport[]>`, `countWorkReports(periodId): Promise<Record<string, number>>` (key = employeeId), `getWorkReportsLocked(periodId, employeeId): Promise<boolean>`, `saveWorkReport({ id, periodId, employeeId, description, file }): Promise<void>`, `deleteWorkReport(report: WorkReport): Promise<void>`, `getEvidenceUrl(path): Promise<string>`.
- Hooks: `useWorkReports`, `useWorkReportCounts`, `useWorkReportsLocked`, `useSaveWorkReport`, `useDeleteWorkReport`; key `performanceKeys.workReports(periodId, employeeId)`, `workReportCounts(periodId)`, `workReportsLocked(periodId, employeeId)` (di bawah `performanceKeys.all`).
- `workReportSchema` (description) → `WorkReportFormValues`.

- [ ] Implementasi; urutan simpan: unggah → RPC → bila gagal hapus file baru; file lama dihapus setelah RPC sukses.
- [ ] `npx tsc --noEmit` lulus. Commit.

### Task 3: UI pegawai

**Files:**
- Create: `src/features/performance/components/work-reports-panel.tsx`, `src/features/performance/components/work-report-dialog.tsx`, `src/features/performance/components/evidence-link-button.tsx`
- Modify: `src/features/performance/components/my-appraisals-panel.tsx` (render `WorkReportsPanel` di atas hasil; judul halaman "Penilaian Kinerja Saya")

- [ ] Panel: pemilih periode (aktif + yang punya laporan), penghitung, badge Terkunci, daftar, tambah/ubah/hapus (`ConfirmDeleteDialog`), skeleton/empty/error state.
- [ ] Lint + tsc. Commit.

### Task 4: UI HR + dokumentasi

**Files:**
- Create: `src/features/performance/components/employee-work-reports-card.tsx`
- Modify: `appraisal-form.tsx` (kartu di `AppraisalFormPage`), `forms-panel.tsx` (kolom "Laporan"), `docs/requirements.md`, `docs/database-schema.md`, `docs/panduan-kode.md`

- [ ] Implementasi, lalu `npm run lint`, `npx tsc --noEmit`, `npm run build`. Commit.
