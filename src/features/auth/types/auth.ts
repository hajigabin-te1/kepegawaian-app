export const ROLE_CODES = ["superadmin", "hr_admin", "chair", "vice_chair", "quality_assurance", "employee"] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  roleCode: RoleCode;
  roleName: string;
  employeeId: string | null;
  /** Permission codes granted to the user's role (e.g. "master.manage"). */
  permissions: string[];
};

export type LoginInput = {
  email: string;
  password: string;
};
