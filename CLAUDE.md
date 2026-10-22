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

## Design system

### Visual direction
- Style: clean institutional admin dashboard.
- Feel: professional, calm, efficient, trustworthy.
- Avoid: purple-blue gradients, glassmorphism, excessive shadows, decorative 3D illustrations, generic AI SaaS look.
- Prefer: flat surfaces, clear hierarchy, subtle borders, generous whitespace, functional density.

### Colors
Use only these semantic tokens (60-30-10 palette, see docs/design/design-decisions.md). Do not introduce random Tailwind colors such as blue-500, purple-600, or emerald-400 in components.

- Base (60%): #F8F8FF — page background, form background, light sections.
- Primary (30%): navy #191970 — sidebar, primary buttons, active navigation, important headings. Text on navy: #F8F8FF or white.
- Accent (10%): #87CEFA — indicators, focus ring, selected states, subtle borders, badges with navy text. Never use it as text on light backgrounds or as the main button color.
- Surface/card: white.
- Muted: desaturated navy-gray for secondary text and inactive elements.
- Border: subtle navy-gray.
- Success: muted green.
- Warning: amber.
- Danger: restrained red.
- Focus ring: accent color.

### Typography
- UI font: Inter.
- Numeric/table font: tabular numbers.
- Page title: text-2xl font-semibold tracking-tight.
- Section title: text-lg font-semibold.
- Body: text-sm.
- Table text: text-sm.
- Do not use display fonts in dashboard pages.

### Shape and spacing
- Default radius: rounded-lg.
- Cards: border-based, not shadow-heavy.
- Page padding: px-4 md:px-6 lg:px-8.
- Section spacing: space-y-6.
- Table rows: compact but readable.

### Components
- Use shadcn/ui components.
- Use Lucide icons only.
- Buttons: primary for main action, outline for secondary, destructive only for delete.
- Use breadcrumbs for nested pages.
- Use consistent empty states with icon, title, description, and optional action.

## UI quality rules

- Do not create a generic AI-generated SaaS dashboard.
- Do not use purple-to-blue gradients as the main visual identity.
- Do not use glassmorphism unless explicitly requested.
- Do not use decorative 3D illustrations, blobs, mesh gradients, or generic abstract backgrounds.
- Do not use excessive rounded corners, oversized shadows, or neon colors.
- Do not use placeholder charts or fake statistics unless real data and requirements are provided.
- Do not use more than one primary accent color.
- Every screen must have a clear primary action and clear visual hierarchy.
- Prefer functional admin UI over marketing-style landing UI.
- Use real Indonesian labels and realistic employee-related content.
- Avoid repeated identical cards with no informational value.
- Ensure spacing, border radius, font sizes, and icon sizes are consistent.

## Response style
- Be concise.
- Do not explain obvious code.
- After implementation, provide only:
  1. Files created or changed.
  2. How to test.
  3. Open questions or risks.
- Do not repeat the full implementation plan after coding.

## Context efficiency
- Read only files directly relevant to the current task.
- Do not read the entire repository before implementing a small feature.
- Do not regenerate files that already exist unless changes are required.
- Prefer editing existing files over creating duplicate utilities or components.
- Before creating a new component, check whether a similar component already exists.
- Do not print entire files in the response unless asked.
- Summarize completed work briefly.

## Frontend design skill rules

When using the built-in frontend-design skill:

1. `CLAUDE.md` and `docs/design/design-decisions.md` always take priority.
2. Do not change the approved 60-30-10 palette:
   - 60% base: `#F8F8FF`
   - 30% primary: `#191970`
   - 10% accent: `#87CEFA`
3. Use `frontend-design` to improve hierarchy, composition, spacing, typography, interaction states, and avoid generic AI aesthetics.
4. Do not introduce a new primary color, display font, gradient style, or visual identity.
5. This is an internal employee-management dashboard, not a marketing landing page.
6. Motion must be subtle and functional: hover, focus, loading, and state feedback only.
7. Avoid heavy scroll-triggered animations, dramatic transitions, asymmetric experimental layouts, and visual effects that reduce usability.
8. Preserve accessibility, readability, and consistent admin-dashboard density.
9. If the skill suggests a direction that conflicts with `design-decisions.md`, follow `design-decisions.md`.