import { fromSupabaseError } from "@/lib/api-error";
import { ApiError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { EmployeeCategory } from "@/features/employees/types/employee";
import {
  CATEGORY_LABELS,
  type AttendanceStatRow,
  type LeaveStatRow,
  type PendingCounts,
  type ScopeInfo,
} from "@/features/dashboard/types/dashboard";

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

const NO_UNIT = "Tanpa unit kerja";

function reportError(error: { code?: string; message: string }): ApiError {
  if (error.message.startsWith("Not allowed to view")) {
    return new ApiError("Cakupan statistik akun Anda belum diatur. Hubungi Superadmin.", null, error);
  }
  return fromSupabaseError(error);
}

/** month = yyyy-MM */
export async function getAttendanceStats(month: string): Promise<AttendanceStatRow[]> {
  const { data, error } = await createSupabaseBrowserClient().rpc("report_attendance_by_unit", { target_month: `${month}-01` });
  if (error) throw reportError(error);
  return data
    .map((row) => ({
      workUnitName: row.work_unit_name ?? NO_UNIT,
      category: row.category,
      employeesRecorded: Number(row.employees_recorded),
      daysPresent: Number(row.days_present),
      daysLate: Number(row.days_late),
      daysEarlyLeave: Number(row.days_early_leave),
      daysAbsent: Number(row.days_absent),
    }))
    .sort((a, b) => a.workUnitName.localeCompare(b.workUnitName, "id") || a.category.localeCompare(b.category));
}

export async function getLeaveStats(year: number): Promise<LeaveStatRow[]> {
  const { data, error } = await createSupabaseBrowserClient().rpc("report_leave_by_unit", { target_year: year });
  if (error) throw reportError(error);
  return data
    .map((row) => ({
      workUnitName: row.work_unit_name ?? NO_UNIT,
      category: row.category,
      typeName: row.leave_type_name,
      approvedRequests: Number(row.approved_requests),
      approvedDays: Number(row.approved_days),
      pendingRequests: Number(row.pending_requests),
    }))
    .sort((a, b) => a.workUnitName.localeCompare(b.workUnitName, "id") || a.category.localeCompare(b.category) || a.typeName.localeCompare(b.typeName, "id"));
}

/** What the signed-in leader's report_scopes allow, as readable labels. */
export async function getScopeInfo(userId: string): Promise<ScopeInfo> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("report_scopes")
    .select("employee_category, unit:work_units(name)")
    .eq("user_id", userId);
  if (error) throw fromSupabaseError(error);
  const labels = data.map((scope) => {
    const unit = scope.unit?.name ?? "Seluruh kampus";
    return scope.employee_category ? `${unit} (${CATEGORY_LABELS[scope.employee_category]})` : unit;
  });
  return { labels, missing: labels.length === 0 };
}

/** Number of items waiting for HR, limited to the areas the user may manage. */
export async function getPendingCounts(permissions: readonly string[]): Promise<PendingCounts> {
  const supabase = createSupabaseBrowserClient();
  const count = async (promise: PromiseLike<{ count: number | null; error: { code?: string; message: string } | null }>) => {
    const { count: value, error } = await promise;
    if (error) throw fromSupabaseError(error);
    return value ?? 0;
  };
  const [leave, profileChanges, appraisals] = await Promise.all([
    permissions.includes("leave.manage")
      ? count(supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("status", "pending"))
      : null,
    permissions.includes("employee.manage")
      ? count(supabase.from("profile_change_requests").select("id", { count: "exact", head: true }).eq("status", "pending"))
      : null,
    permissions.includes("appraisal.manage")
      ? count(supabase.from("appraisals").select("id", { count: "exact", head: true }).eq("status", "submitted"))
      : null,
  ]);
  return { leave, profileChanges, appraisals };
}
