export const ATTENDANCE_STATUS_LABELS = {
  present: "Hadir",
  late: "Terlambat",
  early_leave: "Pulang awal",
  late_and_early_leave: "Terlambat & pulang awal",
  absent: "Tidak hadir",
  on_leave: "Cuti",
  on_permit: "Izin",
} as const;

export type AttendanceStatus = keyof typeof ATTENDANCE_STATUS_LABELS;

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  date: string; // yyyy-MM-dd in campus time zone
  checkInAt: string | null;
  checkOutAt: string | null;
  status: AttendanceStatus;
  source: "gps" | "manual";
  note: string | null;
};

export type DailyAttendanceRow = AttendanceRecord & {
  employeeName: string;
  employeeNumber: string | null;
};

export type MonthlySummaryRow = {
  employeeId: string;
  employeeName: string;
  employeeNumber: string | null;
  daysPresent: number;
  daysLate: number;
  daysEarlyLeave: number;
  daysAbsent: number;
  daysOnLeave: number;
  daysOnPermit: number;
};

export type EmployeeOption = { id: string; name: string; employeeNumber: string | null };

export type Coordinates = { latitude: number; longitude: number; accuracy: number | null };
