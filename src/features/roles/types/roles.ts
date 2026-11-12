export type Role = {
  id: number;
  code: string;
  name: string;
  /** Permission ids granted to the role. */
  permissionIds: number[];
};

export type Permission = {
  id: number;
  code: string;
  description: string | null;
};

export type RbacData = {
  roles: Role[];
  permissions: Permission[];
};

/** UI grouping of permission codes by their prefix (the part before the dot). */
export const PERMISSION_GROUPS: { title: string; prefixes: string[] }[] = [
  { title: "Sistem", prefixes: ["user", "role", "settings", "audit"] },
  { title: "Kepegawaian", prefixes: ["master", "employee"] },
  { title: "Presensi", prefixes: ["attendance"] },
  { title: "Cuti & Izin", prefixes: ["leave"] },
  { title: "Penilaian Kinerja", prefixes: ["appraisal"] },
  { title: "Diklat, Mutasi & Kenaikan Pangkat", prefixes: ["training", "mutation", "promotion"] },
  { title: "Pengumuman & Laporan", prefixes: ["announcement", "report"] },
];

/** Superadmin must keep these, otherwise nobody can manage roles or accounts any more. */
export const LOCKED_SUPERADMIN_PERMISSIONS = ["role.manage", "user.manage"] as const;
export const SUPERADMIN_ROLE_CODE = "superadmin";
