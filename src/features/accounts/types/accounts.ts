export type UserAccount = {
  id: string;
  email: string;
  roleId: number;
  roleCode: string;
  roleName: string;
  isActive: boolean;
  employeeId: string | null;
  employeeName: string | null;
  lastSignInAt: string | null;
};

export type Role = {
  id: number;
  code: string;
  name: string;
};

export type NewAccount = {
  email: string;
  roleCode: string;
  temporaryPassword: string;
  /** Links the account to an employee record (required when HR creates the account). */
  employeeId?: string;
};

export type LinkableEmployee = { id: string; name: string; employeeNumber: string | null };

export type AccountUpdate = {
  roleId: number;
  employeeId: string | null;
  isActive: boolean;
};

/** Roles that read statistics through report_scopes. */
export const LEADER_ROLE_CODES = ["chair", "vice_chair", "quality_assurance"] as const;

export const REPORT_LABELS = {
  employees: "Pegawai",
  attendance: "Presensi",
  leave: "Cuti",
  appraisal: "Kinerja",
} as const;

export type ReportKey = keyof typeof REPORT_LABELS;

export type ReportScope = {
  id: string;
  /** null = whole campus */
  workUnitId: string | null;
  workUnitName: string | null;
  /** null = lecturers and staff */
  category: "lecturer" | "staff" | null;
  reports: ReportKey[];
};

export type NewReportScope = {
  workUnitId: string | null;
  category: "lecturer" | "staff" | null;
  reports: ReportKey[];
};
