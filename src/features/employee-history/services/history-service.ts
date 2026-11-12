import { fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { removeEmployeeFile, uploadEmployeeFile } from "@/features/documents/services/file-storage";
import type {
  EducationHistoryFormValues,
  PositionHistoryFormValues,
} from "@/features/employee-history/schemas/history-schemas";
import {
  HISTORY_PAGE_SIZE,
  type EducationHistory,
  type HistoryFilters,
  type HistoryPage,
  type PositionHistory,
} from "@/features/employee-history/types/history";

const nullable = (value: string): string | null => (value === "" ? null : value);
/** Characters that would break a PostgREST filter value. */
const sanitizeSearch = (value: string): string => value.replace(/[,()*%\\]/g, " ").trim();

const POSITION_COLUMNS = `id, employee_id, position_id, work_unit_id, start_date, end_date, decree_number, decree_path,
  employee:employees!inner(full_name, employee_number), position:positions(name), work_unit:work_units(name)`;
const EDUCATION_COLUMNS = `id, employee_id, education_level, institution, major, graduation_year, certificate_path,
  employee:employees!inner(full_name, employee_number)`;

export async function listPositionHistories(filters: HistoryFilters): Promise<HistoryPage<PositionHistory>> {
  const from = (filters.page - 1) * HISTORY_PAGE_SIZE;
  let query = createSupabaseBrowserClient()
    .from("position_histories")
    .select(POSITION_COLUMNS, { count: "exact" })
    .order("start_date", { ascending: false })
    .range(from, from + HISTORY_PAGE_SIZE - 1);
  if (filters.employeeId) query = query.eq("employee_id", filters.employeeId);
  const search = sanitizeSearch(filters.search);
  if (search) query = query.ilike("employee.full_name", `%${search}%`);

  const { data, error, count } = await query;
  if (error) throw fromSupabaseError(error);
  return {
    total: count ?? 0,
    rows: data.map((row) => ({
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee.full_name,
      employeeNumber: row.employee.employee_number,
      positionId: row.position_id,
      positionName: row.position?.name ?? null,
      workUnitId: row.work_unit_id,
      workUnitName: row.work_unit?.name ?? null,
      startDate: row.start_date,
      endDate: row.end_date,
      decreeNumber: row.decree_number,
      decreePath: row.decree_path,
    })),
  };
}

/** Creates or updates a position history entry; a newly picked SK file replaces the old one. */
export async function savePositionHistory(
  existing: PositionHistory | null,
  values: PositionHistoryFormValues,
  file: File | null,
): Promise<void> {
  const uploadedPath = file ? await uploadEmployeeFile(values.employeeId, "positions", file) : null;
  const payload = {
    employee_id: values.employeeId,
    position_id: values.positionId,
    work_unit_id: nullable(values.workUnitId),
    start_date: values.startDate,
    end_date: nullable(values.endDate),
    decree_number: nullable(values.decreeNumber),
    decree_path: uploadedPath ?? existing?.decreePath ?? null,
  };

  const supabase = createSupabaseBrowserClient();
  const { error } = existing
    ? await supabase.from("position_histories").update(payload).eq("id", existing.id).select("id").single()
    : await supabase.from("position_histories").insert(payload).select("id").single();
  if (error) {
    await removeEmployeeFile(uploadedPath);
    throw fromSupabaseError(error);
  }
  if (uploadedPath && existing?.decreePath) await removeEmployeeFile(existing.decreePath);
}

export async function deletePositionHistory(entry: PositionHistory): Promise<void> {
  const { error } = await createSupabaseBrowserClient().from("position_histories").delete().eq("id", entry.id).select("id").single();
  if (error) throw fromSupabaseError(error);
  await removeEmployeeFile(entry.decreePath);
}

export async function listEducationHistories(filters: HistoryFilters): Promise<HistoryPage<EducationHistory>> {
  const from = (filters.page - 1) * HISTORY_PAGE_SIZE;
  let query = createSupabaseBrowserClient()
    .from("education_histories")
    .select(EDUCATION_COLUMNS, { count: "exact" })
    .order("graduation_year", { ascending: false, nullsFirst: false })
    .range(from, from + HISTORY_PAGE_SIZE - 1);
  if (filters.employeeId) query = query.eq("employee_id", filters.employeeId);
  const search = sanitizeSearch(filters.search);
  if (search) query = query.ilike("employee.full_name", `%${search}%`);

  const { data, error, count } = await query;
  if (error) throw fromSupabaseError(error);
  return {
    total: count ?? 0,
    rows: data.map((row) => ({
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee.full_name,
      employeeNumber: row.employee.employee_number,
      educationLevel: row.education_level,
      institution: row.institution,
      major: row.major,
      graduationYear: row.graduation_year,
      certificatePath: row.certificate_path,
    })),
  };
}

/** Creates or updates an education entry; a newly picked ijazah file replaces the old one. */
export async function saveEducationHistory(
  existing: EducationHistory | null,
  values: EducationHistoryFormValues,
  file: File | null,
): Promise<void> {
  const uploadedPath = file ? await uploadEmployeeFile(values.employeeId, "education", file) : null;
  const payload = {
    employee_id: values.employeeId,
    education_level: values.educationLevel,
    institution: values.institution,
    major: nullable(values.major),
    graduation_year: values.graduationYear === "" ? null : Number(values.graduationYear),
    certificate_path: uploadedPath ?? existing?.certificatePath ?? null,
  };

  const supabase = createSupabaseBrowserClient();
  const { error } = existing
    ? await supabase.from("education_histories").update(payload).eq("id", existing.id).select("id").single()
    : await supabase.from("education_histories").insert(payload).select("id").single();
  if (error) {
    await removeEmployeeFile(uploadedPath);
    throw fromSupabaseError(error);
  }
  if (uploadedPath && existing?.certificatePath) await removeEmployeeFile(existing.certificatePath);
}

export async function deleteEducationHistory(entry: EducationHistory): Promise<void> {
  const { error } = await createSupabaseBrowserClient().from("education_histories").delete().eq("id", entry.id).select("id").single();
  if (error) throw fromSupabaseError(error);
  await removeEmployeeFile(entry.certificatePath);
}
