import { fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { EmployeeCategory } from "@/features/employees/types/employee";

export type UnitStatistic = {
  workUnitId: string | null;
  workUnitName: string | null;
  category: EmployeeCategory;
  activeEmployees: number;
  inactiveEmployees: number;
  retiredEmployees: number;
};

export type RecentEmployee = {
  id: string;
  fullName: string;
  category: EmployeeCategory;
  workUnitName: string | null;
  createdAt: string;
};

const RECENT_EMPLOYEE_LIMIT = 5;

/** Aggregated employee counts per work unit and category, limited to the caller's report scope. */
export async function getEmployeeStatistics(): Promise<UnitStatistic[]> {
  const { data, error } = await createSupabaseBrowserClient().rpc("report_employee_statistics");
  // P0001: the function rejects accounts without any statistics scope.
  if (error) throw fromSupabaseError(error, { P0001: "Cakupan statistik untuk akun Anda belum diatur. Hubungi admin sistem." });
  return data.map((row) => ({
    workUnitId: row.work_unit_id,
    workUnitName: row.work_unit_name,
    category: row.category,
    activeEmployees: Number(row.active_employees),
    inactiveEmployees: Number(row.inactive_employees),
    retiredEmployees: Number(row.retired_employees),
  }));
}

/** Most recently added employees (needs employee.view through RLS). */
export async function listRecentEmployees(): Promise<RecentEmployee[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("employees")
    .select("id, full_name, category, created_at, work_unit:work_units(name)")
    .order("created_at", { ascending: false })
    .limit(RECENT_EMPLOYEE_LIMIT);
  if (error) throw fromSupabaseError(error);
  return data.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    category: row.category,
    workUnitName: row.work_unit?.name ?? null,
    createdAt: row.created_at,
  }));
}
