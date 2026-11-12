import { ApiError, fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  CATEGORY_LABELS,
  type AttendanceStatRow,
  type EmployeeStatRow,
  type LeaveStatRow,
  type PendingCounts,
  type ScopeInfo,
} from "@/features/dashboard/types/dashboard";

const NO_UNIT = "Tanpa unit kerja";

function reportError(error: { code?: string; message: string }): ApiError {
  if (error.message.startsWith("Not allowed to view")) {
    return new ApiError("Cakupan statistik akun Anda belum diatur. Hubungi Superadmin.", null, error);
  }
  return fromSupabaseError(error);
}

export async function getEmployeeStats(): Promise<EmployeeStatRow[]> {
  const { data, error } = await createSupabaseBrowserClient().rpc("report_employee_statistics");
  if (error) throw reportError(error);
  return data.map((row) => ({
    workUnitId: row.work_unit_id,
    workUnitName: row.work_unit_name ?? NO_UNIT,
    unitType: row.unit_type,
    category: row.category,
    active: Number(row.active_employees),
    inactive: Number(row.inactive_employees),
    retired: Number(row.retired_employees),
  }));
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
