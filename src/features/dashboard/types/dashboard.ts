import type { Database } from "@/types/database";

export type EmployeeCategory = Database["public"]["Enums"]["employee_category"];
export type WorkUnitType = Database["public"]["Enums"]["work_unit_type"];

export const CATEGORY_LABELS: Record<EmployeeCategory, string> = { lecturer: "Dosen", staff: "Tenaga Kependidikan" };

/** Headcount of one unit and category (aggregate, never individual rows). */
export type EmployeeStatRow = {
  workUnitId: string | null;
  workUnitName: string;
  unitType: WorkUnitType | null;
  category: EmployeeCategory;
  active: number;
  inactive: number;
  retired: number;
};

export type AttendanceStatRow = {
  workUnitName: string;
  category: EmployeeCategory;
  employeesRecorded: number;
  daysPresent: number;
  daysLate: number;
  daysEarlyLeave: number;
  daysAbsent: number;
};

export type LeaveStatRow = {
  workUnitName: string;
  category: EmployeeCategory;
  typeName: string;
  approvedRequests: number;
  approvedDays: number;
  pendingRequests: number;
};

export type PendingCounts = {
  leave: number | null;
  profileChanges: number | null;
  appraisals: number | null;
};

export type ScopeInfo = {
  /** Human-readable description of what the signed-in leader may see. */
  labels: string[];
  /** True when no scope is configured for a leader account. */
  missing: boolean;
};
