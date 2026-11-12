import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];

export type EmployeeCategory = Enums["employee_category"];
export type EmployeeActiveStatus = Enums["employee_active_status"];
export type Gender = Enums["gender"];
export type MaritalStatus = Enums["marital_status"];

/** Row shown in the employee list. */
export type EmployeeListItem = {
  id: string;
  fullName: string;
  employeeNumber: string | null;
  lecturerNumber: string | null;
  category: EmployeeCategory;
  workUnitName: string | null;
  positionName: string | null;
  activeStatus: EmployeeActiveStatus;
};

/** Full employee record for the detail and edit pages. */
export type EmployeeDetail = {
  id: string;
  employeeNumber: string | null;
  lecturerNumber: string | null;
  nationalIdNumber: string | null;
  fullName: string;
  birthPlace: string | null;
  birthDate: string | null;
  gender: Gender | null;
  religion: string | null;
  maritalStatus: MaritalStatus | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  category: EmployeeCategory;
  employmentStatusCode: string | null;
  employmentStatusName: string | null;
  appointmentDate: string | null;
  workUnitId: string | null;
  workUnitName: string | null;
  positionId: string | null;
  positionName: string | null;
  rankGrade: string | null;
  serviceYears: number | null;
  serviceMonths: number | null;
  activeStatus: EmployeeActiveStatus;
  deactivationReason: string | null;
};

export type EmployeeListFilters = {
  search: string;
  category: EmployeeCategory | "all";
  workUnitId: string | "all";
  activeStatus: EmployeeActiveStatus | "all";
  page: number;
};

export type EmployeeListResult = {
  rows: EmployeeListItem[];
  total: number;
};

export type EmployeeAccount = {
  userId: string;
  email: string;
  isActive: boolean;
  lastSignInAt: string | null;
};

export type EmploymentStatus = {
  code: string;
  name: string;
};

export const EMPLOYEE_PAGE_SIZE = 20;

export const CATEGORY_LABELS: Record<EmployeeCategory, string> = {
  lecturer: "Dosen",
  staff: "Tenaga Kependidikan",
};

export const ACTIVE_STATUS_LABELS: Record<EmployeeActiveStatus, string> = {
  active: "Aktif",
  inactive: "Nonaktif",
  retired: "Pensiun",
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Laki-laki",
  female: "Perempuan",
};

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  single: "Belum menikah",
  married: "Menikah",
  divorced: "Cerai hidup",
  widowed: "Cerai mati",
};

/** Religions recognised in Indonesian civil records (Dukcapil). */
export const RELIGION_OPTIONS = [
  "Islam",
  "Kristen",
  "Katolik",
  "Hindu",
  "Buddha",
  "Khonghucu",
  "Kepercayaan terhadap Tuhan YME",
] as const;

/** Minimal employee data for pickers. */
export type EmployeeOption = {
  id: string;
  fullName: string;
  employeeNumber: string | null;
  activeStatus: EmployeeActiveStatus;
};
