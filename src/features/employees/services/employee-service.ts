import { fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DeactivateFormValues, EmployeeFormValues } from "@/features/employees/schemas/employee-schemas";
import {
  EMPLOYEES_PAGE_SIZE,
  type Employee,
  type EmployeeListFilters,
  type EmployeeListItem,
  type EmploymentStatus,
} from "@/features/employees/types/employees";

const LIST_COLUMNS = "id, full_name, employee_number, category, active_status, work_unit:work_units(name), position:positions(name)";
const DETAIL_COLUMNS = `${LIST_COLUMNS}, lecturer_number, national_id_number, birth_place, birth_date, gender, religion, marital_status, address, city, province, postal_code, phone, email, employment_status_code, appointment_date, work_unit_id, position_id, rank_grade, service_years, service_months, deactivation_reason`;

const DUPLICATE_MESSAGE = "NIP, NIDN, atau NIK sudah dipakai pegawai lain.";

const orNull = (value: string) => (value === "" ? null : value);
const intOrNull = (value: string) => (value === "" ? null : Number(value));

function payload(values: EmployeeFormValues) {
  return {
    full_name: values.fullName,
    category: values.category,
    employee_number: orNull(values.employeeNumber),
    lecturer_number: orNull(values.lecturerNumber),
    national_id_number: orNull(values.nationalIdNumber),
    birth_place: orNull(values.birthPlace),
    birth_date: orNull(values.birthDate),
    gender: values.gender === "" ? null : values.gender,
    religion: orNull(values.religion),
    marital_status: values.maritalStatus === "" ? null : values.maritalStatus,
    address: orNull(values.address),
    city: orNull(values.city),
    province: orNull(values.province),
    postal_code: orNull(values.postalCode),
    phone: orNull(values.phone),
    email: orNull(values.email),
    employment_status_code: orNull(values.employmentStatusCode),
    appointment_date: orNull(values.appointmentDate),
    work_unit_id: orNull(values.workUnitId),
    position_id: orNull(values.positionId),
    rank_grade: orNull(values.rankGrade),
    service_years: intOrNull(values.serviceYears),
    service_months: intOrNull(values.serviceMonths),
  };
}

type ListRow = {
  id: string;
  full_name: string;
  employee_number: string | null;
  category: EmployeeListItem["category"];
  active_status: EmployeeListItem["activeStatus"];
  work_unit: { name: string } | null;
  position: { name: string } | null;
};

const toListItem = (row: ListRow): EmployeeListItem => ({
  id: row.id,
  fullName: row.full_name,
  employeeNumber: row.employee_number,
  category: row.category,
  activeStatus: row.active_status,
  workUnitName: row.work_unit?.name ?? null,
  positionName: row.position?.name ?? null,
});

export async function listEmployees(filters: EmployeeListFilters): Promise<{ items: EmployeeListItem[]; total: number }> {
  let query = createSupabaseBrowserClient().from("employees").select(LIST_COLUMNS, { count: "exact" });
  // Strip characters that have meaning inside a PostgREST or() filter / LIKE pattern.
  const term = filters.search.replace(/[,()%*\\]/g, " ").trim();
  if (term) query = query.or(`full_name.ilike.%${term}%,employee_number.ilike.%${term}%`);
  if (filters.category !== "all") query = query.eq("category", filters.category);
  if (filters.status !== "all") query = query.eq("active_status", filters.status);

  const from = (filters.page - 1) * EMPLOYEES_PAGE_SIZE;
  const { data, error, count } = await query.order("full_name").range(from, from + EMPLOYEES_PAGE_SIZE - 1);
  if (error) throw fromSupabaseError(error);
  return { items: data.map(toListItem), total: count ?? 0 };
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const { data, error } = await createSupabaseBrowserClient().from("employees").select(DETAIL_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw fromSupabaseError(error);
  if (!data) return null;
  return {
    ...toListItem(data),
    lecturerNumber: data.lecturer_number,
    nationalIdNumber: data.national_id_number,
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
    employmentStatusCode: data.employment_status_code,
    appointmentDate: data.appointment_date,
    workUnitId: data.work_unit_id,
    positionId: data.position_id,
    rankGrade: data.rank_grade,
    serviceYears: data.service_years,
    serviceMonths: data.service_months,
    deactivationReason: data.deactivation_reason,
  };
}

export async function createEmployee(values: EmployeeFormValues): Promise<string> {
  const { data, error } = await createSupabaseBrowserClient().from("employees").insert(payload(values)).select("id").single();
  if (error) throw fromSupabaseError(error, { "23505": DUPLICATE_MESSAGE });
  return data.id;
}

export async function updateEmployee(id: string, values: EmployeeFormValues): Promise<void> {
  const { error } = await createSupabaseBrowserClient().from("employees").update(payload(values)).eq("id", id).select("id").single();
  if (error) throw fromSupabaseError(error, { "23505": DUPLICATE_MESSAGE });
}

export async function deactivateEmployee(id: string, values: DeactivateFormValues): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from("employees")
    .update({ active_status: values.status, deactivation_reason: values.reason })
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
