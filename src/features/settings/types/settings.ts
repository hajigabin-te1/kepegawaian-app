import type { EmployeeCategory } from "@/features/employees/types/employee";

export type AttendanceLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
};

export type WorkSchedule = {
  id: string;
  name: string;
  employeeCategory: EmployeeCategory;
  /** "HH:MM" in campus time. */
  checkInTime: string;
  checkOutTime: string;
  lateToleranceMinutes: number;
  flagsEarlyLeave: boolean;
};

export const TIME_ZONE_LABELS: Record<string, string> = {
  "Asia/Jakarta": "WIB (Asia/Jakarta)",
  "Asia/Makassar": "WITA (Asia/Makassar)",
  "Asia/Jayapura": "WIT (Asia/Jayapura)",
};
