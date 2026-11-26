# Dual-Category Employees Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let HR mark a tendik employee as also a lecturer, give that employee one appraisal form per category per period, and report appraisal statistics per form category.

**Architecture:** One new migration adds `employees.additional_category` and `appraisals.category`, and replaces `generate_appraisals`, `report_appraisal_by_unit`, and `work_reports_locked`. The frontend reads and writes the new columns through the existing services (`employee-service.ts`, `performance-service.ts`) and shows category badges.

**Tech Stack:** Supabase Postgres (plpgsql, RLS), Next.js App Router, TypeScript strict, React Hook Form + Zod, TanStack Query, shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-11-26-dual-category-employees-design.md`

## Global Constraints

- Schema changes only in a new file under `supabase/migrations/`; never edit applied migrations. After applying through the Supabase MCP, rename the file to the version the database recorded.
- A dual-category employee is always `category = 'staff'`, `additional_category = 'lecturer'` (check constraint).
- Attendance, `report_employee_statistics`, `report_attendance_by_unit`, `report_leave_by_unit`, `can_report_on`, `report_scopes` stay on `employees.category`.
- UI copy in Indonesian; code, comments, commit messages in English. Use existing `CATEGORY_LABELS` (Dosen / Tendik).
- No `any`; services normalize errors with `ApiError` helpers already in each service.
- No test runner exists: DB behavior is verified with SQL through the Supabase MCP inside a transaction that ends in `rollback`; frontend with `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## Review Focus

1. Re-running "Generate form" for a period that already has single-category forms must add only the missing lecturer form for dual employees, never duplicates. (Task 1, check B)
2. A dual employee whose staff form is submitted but lecturer form still draft must keep work reports editable. (Task 1, check C)
3. Employee list filter "Dosen" must include dual employees; "Tendik" includes them too. (Task 2, step 3)
4. Changing category from Tendik to Dosen in the form must clear the checkbox, otherwise the check constraint rejects the save. (Task 2, step 2)
5. The HR forms list must show two rows for a dual employee with distinguishable category badges. (Task 3, step 2)

---

### Task 1: Migration

**Files:**
- Create: `supabase/migrations/<timestamp>_dual_category_employees.sql`
- Modify: `src/types/database.ts` (regenerate via Supabase MCP `generate_typescript_types`)
- Modify: `docs/database-schema.md`

**Interfaces:**
- Produces: column `employees.additional_category employee_category null`; column `appraisals.category employee_category not null`; unique `(period_id, employee_id, category)`; unchanged function signatures for `generate_appraisals(uuid) returns integer`, `report_appraisal_by_unit(uuid)`, `work_reports_locked(uuid, uuid) returns boolean`.

- [ ] **Step 1: Write the migration**
  - `alter table employees add column additional_category ...` + constraint `employees_additional_category_check` per Global Constraints.
  - `alter table appraisals add column category`; backfill `update appraisals a set category = e.category from employees e where e.id = a.employee_id`; `set not null`; drop `appraisals_period_id_employee_id_key`, add `appraisals_period_employee_category_key unique (period_id, employee_id, category)`.
  - `generate_appraisals`: insert from `employees e cross join lateral (values (e.category), (e.additional_category)) c(category) where c.category is not null`, `on conflict (period_id, employee_id, category) do nothing`. Keep permission and active-period checks.
  - `report_appraisal_by_unit`: scope with `can_report_on('appraisal', e.work_unit_id, a.category)` and group by `a.category`.
  - `work_reports_locked`: auto rule becomes "at least one form exists and none has status in (`draft`, `revision_requested`)". Keep the other branches of the 2026-11-21 version unchanged.
- [ ] **Step 2: Apply via Supabase MCP `apply_migration`; rename local file to the recorded version (`list_migrations`).**
- [ ] **Step 3: Verify with SQL (each block in `begin; ... rollback;`, impersonating an HR user via `set_config('request.jwt.claims', ...)` and `set local role authenticated`)**
  - A: setting `category='lecturer', additional_category='lecturer'` → check violation; `category='staff', additional_category='lecturer'` → ok.
  - B: on an active period, mark one employee dual, call `generate_appraisals` twice → that employee has exactly 2 rows (`staff`, `lecturer`); second call returns 0.
  - C: with the staff form `submitted` and lecturer form `draft`, `work_reports_locked(period, employee)` → false; with both `submitted` → true.
  - D: `report_appraisal_by_unit` with both forms `verified` → the employee counted once under each category.
- [ ] **Step 4: Regenerate `src/types/database.ts`; run `npx tsc --noEmit` → only errors expected from missing `category` in places Tasks 2–3 fix (or none).**
- [ ] **Step 5: Update `docs/database-schema.md` (two columns, new unique key, function behavior). Commit with spec, plan, and `docs/requirements.md`: `Add additional employee category and per-category appraisal forms`.**

### Task 2: Employees UI

**Files:**
- Modify: `src/features/employees/types/employee.ts`, `schemas/employee-schema.ts`, `services/employee-service.ts`, `components/employee-form.tsx`, `components/employee-detail-view.tsx`, `components/employees-panel.tsx`
- Create (only if no shared formatter exists): `formatEmployeeCategories(category: EmployeeCategory, additional: EmployeeCategory | null): string` in `src/features/employees/types/employee.ts` next to `CATEGORY_LABELS` → `"Tendik · Dosen"` or the single label.

**Interfaces:**
- Consumes: `employees.additional_category` from Task 1.
- Produces: `additionalCategory: EmployeeCategory | null` on `EmployeeListItem` and `EmployeeDetail`; form field `alsoLecturer: boolean`.

- [ ] **Step 1: Types + service.** Select `additional_category` in list and detail columns; map to `additionalCategory`; on save send `additional_category: values.category === "staff" && values.alsoLecturer ? "lecturer" : null`.
- [ ] **Step 2: Schema + form.** `alsoLecturer: z.boolean()` (default from `employee?.additionalCategory === "lecturer"`). Under the Kategori select, show a shadcn `Checkbox` "Juga bertugas sebagai dosen" only when `category === "staff"`; when category changes to `lecturer`, `setValue("alsoLecturer", false)`.
- [ ] **Step 3: List filter.** In `listEmployees`, a category filter becomes `.or(\`category.eq.${c},additional_category.eq.${c}\`)`.
- [ ] **Step 4: Display.** List column and detail badge/InfoItem use `formatEmployeeCategories`.
- [ ] **Step 5: Verify.** `npx tsc --noEmit` and `npm run lint` clean; in `npm run dev`: create/edit a Tendik with the checkbox → detail shows "Tendik · Dosen"; switch to Dosen → checkbox hidden and saves; filter Dosen lists the dual employee.
- [ ] **Step 6: Commit `Let HR mark tendik employees who also teach as lecturers`.**

### Task 3: Appraisal UI

**Files:**
- Modify: `src/features/performance/types/performance.ts`, `services/performance-service.ts`, `components/forms-panel.tsx`, `components/appraisal-form.tsx` (or `appraisal-parts.tsx` header), `components/my-appraisals-panel.tsx`

**Interfaces:**
- Consumes: `appraisals.category` from Task 1; `CATEGORY_LABELS` from employees types.
- Produces: `category: EmployeeCategory` on `AppraisalListItem` and `AppraisalDetail`.

- [ ] **Step 1: Types + service.** Add `category` to `listAppraisals` select, `DETAIL_COLUMNS`, `DetailRow`, `toDetail`. Sort list by name then category.
- [ ] **Step 2: Forms list.** Show a category badge per row (`Badge variant="accent"`) so a dual employee's two rows are distinguishable; keep row keys on `id`.
- [ ] **Step 3: Form page + my appraisals.** Show "Penilaian Dosen" / "Penilaian Tendik" next to the period name in the form header and in each card of `my-appraisals-panel.tsx`.
- [ ] **Step 4: Verify.** `npx tsc --noEmit`, `npm run lint`, `npm run build` clean; in dev: generate forms on an active period → dual employee shows two rows; fill/submit one → work reports still editable for that employee; recap shows the verified lecturer form under Dosen.
- [ ] **Step 5: Commit `Show appraisal form category for dual-category employees`.**
