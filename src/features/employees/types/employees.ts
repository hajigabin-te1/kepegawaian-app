import type { Database } from "@/types/database";

export type EmployeeCategory = Database["public"]["Enums"]["employee_category"];
export type Gender = Database["public"]["Enums"]["gender"];
export type MaritalStatus = Database["public"]["Enums"]["marital_status"];
export type EmployeeActiveStatus = Database["public"]["Enums"]["employee_active_status"];

export const CATEGORY_LABELS: Record<EmployeeCategory, string> = { lecturer: "Dosen", staff: "Tenaga Kependidikan" };
export const GENDER_LABELS: Record<Gender, string> = { male: "Laki-laki", female: "Perempuan" };
export const MARITAL_LABELS: Record<MaritalStatus, string> = {
  single: "Belum menikah",
  married: "Menikah",
  divorced: "Cerai hidup",
  widowed: "Cerai mati",
};
export const ACTIVE_STATUS_LABELS: Record<EmployeeActiveStatus, string> = {
  active: "Aktif",
  inactive: "Nonaktif",
  retired: "Pensiun",
};

export type EmployeeListItem = {
  id: string;
  fullName: string;
  employeeNumber: string | null;
  category: EmployeeCategory;
  activeStatus: EmployeeActiveStatus;
  workUnitName: string | null;
  positionName: string | null;
};

export type Employee = EmployeeListItem & {
  lecturerNumber: string | null;
  nationalIdNumber: string | null;
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
  employmentStatusCode: string | null;
  appointmentDate: string | null;
  workUnitId: string | null;
  positionId: string | null;
  rankGrade: string | null;
  serviceYears: number | null;
  serviceMonths: number | null;
  deactivationReason: string | null;
};

export type EmploymentStatus = { code: string; name: string };

export type EmployeeListFilters = {
  search: string;
  category: EmployeeCategory | "all";
  status: EmployeeActiveStatus | "all";
  page: number;
};

export const EMPLOYEES_PAGE_SIZE = 10;
