import { fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DeactivateEmployeeValues, EmployeeFormValues } from "@/features/employees/schemas/employee-schema";
import {
  EMPLOYEE_PAGE_SIZE,
  type EmployeeAccount,
  type EmployeeDetail,
  type EmployeeListFilters,
  type EmployeeListResult,
  type EmploymentStatus,
} from "@/features/employees/types/employee";
import type { Database } from "@/types/database";

type EmployeeInsert = Database["public"]["Tables"]["employees"]["Insert"];

const DUPLICATE_NUMBER_MESSAGE = "NIP, NIDN, atau NIK sudah dipakai pegawai lain.";

const LIST_COLUMNS =
  "id, full_name, employee_number, lecturer_number, category, active_status, work_unit:work_units(name), position:positions(name)";

const DETAIL_COLUMNS = `
  id, employee_number, lecturer_number, national_id_number, full_name, birth_place, birth_date, gender, religion,
  marital_status, address, city, province, postal_code, phone, email, category, employment_status_code,
  appointment_date, work_unit_id, position_id, rank_grade, service_years, service_months, active_status,
  deactivation_reason,
  work_unit:work_units(name), position:positions(name), employment_status:employment_statuses(name)
`;

const nullable = (value: string): string | null => (value === "" ? null : value);
const nullableNumber = (value: string): number | null => (value === "" ? null : Number(value));

/** Characters that would break a PostgREST `or=(...)` filter. */
const sanitizeSearch = (value: string): string => value.replace(/[,()*%\\]/g, " ").trim();

function toPayload(values: EmployeeFormValues): EmployeeInsert {
  return {
    full_name: values.fullName,
    category: values.category,
    work_unit_id: values.workUnitId,
    employee_number: nullable(values.employeeNumber),
    lecturer_number: nullable(values.lecturerNumber),
    national_id_number: nullable(values.nationalIdNumber),
    birth_place: nullable(values.birthPlace),
    birth_date: nullable(values.birthDate),
    gender: values.gender === "" ? null : values.gender,
    religion: nullable(values.religion),
    marital_status: values.maritalStatus === "" ? null : values.maritalStatus,
    address: nullable(values.address),
    city: nullable(values.city),
    province: nullable(values.province),
    postal_code: nullable(values.postalCode),
    phone: nullable(values.phone),
    email: nullable(values.email.toLowerCase()),
    employment_status_code: nullable(values.employmentStatusCode),
    appointment_date: nullable(values.appointmentDate),
    position_id: nullable(values.positionId),
    rank_grade: nullable(values.rankGrade),
    service_years: nullableNumber(values.serviceYears),
    service_months: nullableNumber(values.serviceMonths),
  };
}

export async function listEmployees(filters: EmployeeListFilters): Promise<EmployeeListResult> {
  const from = (filters.page - 1) * EMPLOYEE_PAGE_SIZE;
  let query = createSupabaseBrowserClient()
    .from("employees")
    .select(LIST_COLUMNS, { count: "exact" })
    .order("full_name")
    .range(from, from + EMPLOYEE_PAGE_SIZE - 1);

  const search = sanitizeSearch(filters.search);
  if (search) {
    query = query.or(`full_name.ilike.*${search}*,employee_number.ilike.*${search}*,lecturer_number.ilike.*${search}*`);
  }
  if (filters.category !== "all") query = query.eq("category", filters.category);
  if (filters.workUnitId !== "all") query = query.eq("work_unit_id", filters.workUnitId);
  if (filters.activeStatus !== "all") query = query.eq("active_status", filters.activeStatus);

  const { data, error, count } = await query;
  if (error) throw fromSupabaseError(error);

  return {
    total: count ?? 0,
    rows: data.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      employeeNumber: row.employee_number,
      lecturerNumber: row.lecturer_number,
      category: row.category,
      workUnitName: row.work_unit?.name ?? null,
      positionName: row.position?.name ?? null,
      activeStatus: row.active_status,
    })),
  };
}

export async function getEmployee(id: string): Promise<EmployeeDetail> {
  const { data, error } = await createSupabaseBrowserClient().from("employees").select(DETAIL_COLUMNS).eq("id", id).single();
  if (error) throw fromSupabaseError(error);

  return {
    id: data.id,
    employeeNumber: data.employee_number,
    lecturerNumber: data.lecturer_number,
    nationalIdNumber: data.national_id_number,
    fullName: data.full_name,
    birthPlace: data.birth_place,
    birthDate: data.birth_date,
    gender: data.gender,
    religion: data.religion,
    maritalStatus: data.marital_status,
    address: data.address,
    city: data.city,
    province: data.province,
    postalCode: data.postal_code,
    phone: data.phone,
    email: data.email,
    category: data.category,
    employmentStatusCode: data.employment_status_code,
    employmentStatusName: data.employment_status?.name ?? null,
    appointmentDate: data.appointment_date,
    workUnitId: data.work_unit_id,
    workUnitName: data.work_unit?.name ?? null,
    positionId: data.position_id,
    positionName: data.position?.name ?? null,
    rankGrade: data.rank_grade,
    serviceYears: data.service_years,
    serviceMonths: data.service_months,
    activeStatus: data.active_status,
    deactivationReason: data.deactivation_reason,
  };
}

export async function createEmployee(values: EmployeeFormValues): Promise<string> {
  const { data, error } = await createSupabaseBrowserClient().from("employees").insert(toPayload(values)).select("id").single();
  if (error) throw fromSupabaseError(error, { "23505": DUPLICATE_NUMBER_MESSAGE });
  return data.id;
}

export async function updateEmployee(id: string, values: EmployeeFormValues): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from("employees")
    .update(toPayload(values))
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw fromSupabaseError(error, { "23505": DUPLICATE_NUMBER_MESSAGE });
}

export async function deactivateEmployee(id: string, values: DeactivateEmployeeValues): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from("employees")
    .update({ active_status: values.activeStatus, deactivation_reason: values.reason })
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw fromSupabaseError(error);
}

export async function reactivateEmployee(id: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from("employees")
    .update({ active_status: "active", deactivation_reason: null })
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw fromSupabaseError(error);
}

export async function listEmploymentStatuses(): Promise<EmploymentStatus[]> {
  const { data, error } = await createSupabaseBrowserClient().from("employment_statuses").select("code, name").order("code");
  if (error) throw fromSupabaseError(error);
  return data;
}

export async function getEmployeeAccount(employeeId: string): Promise<EmployeeAccount | null> {
  const { data, error } = await createSupabaseBrowserClient().rpc("get_employee_account", { target_employee_id: employeeId });
  if (error) throw fromSupabaseError(error);
  const row = data[0];
  return row ? { userId: row.user_id, email: row.email, isActive: row.is_active, lastSignInAt: row.last_sign_in_at } : null;
}
