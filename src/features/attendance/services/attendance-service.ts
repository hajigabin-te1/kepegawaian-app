import { APP_TIME_ZONE, APP_UTC_OFFSET } from "@/config/locale";
import { ApiError, fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CorrectionFormValues } from "@/features/attendance/schemas/attendance-schemas";
import type {
  AttendanceRecord,
  Coordinates,
  DailyAttendanceRow,
  EmployeeOption,
  MonthlySummaryRow,
} from "@/features/attendance/types/attendance";

const RECORD_COLUMNS = "id, employee_id, attendance_date, check_in_at, check_out_at, status, source, note";

type RecordRow = {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  status: AttendanceRecord["status"];
  source: AttendanceRecord["source"];
  note: string | null;
};

const toRecord = (row: RecordRow): AttendanceRecord => ({
  id: row.id,
  employeeId: row.employee_id,
  date: row.attendance_date,
  checkInAt: row.check_in_at,
  checkOutAt: row.check_out_at,
  status: row.status,
  source: row.source,
  note: row.note,
});

/** Today's date (yyyy-MM-dd) in the campus time zone. */
export function todayInCampus(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(new Date());
}

/** Maps messages raised by the check_in/check_out/correct_attendance functions to Indonesian. */
function rpcError(error: { code?: string; message: string }): ApiError {
  const messages: Record<string, string> = {
    "Outside the attendance area": "Tidak bisa melakukan presensi",
    "Already checked in today": "Anda sudah presensi masuk hari ini.",
    "Already checked out today": "Anda sudah presensi pulang hari ini.",
    "No check-in recorded today": "Belum ada presensi masuk hari ini.",
    "No employee linked to this account": "Akun Anda belum terhubung dengan data pegawai.",
    "Employee is not active": "Pegawai tidak aktif sehingga tidak dapat presensi.",
    "Not allowed to correct attendance": "Anda tidak memiliki akses untuk mengoreksi presensi.",
    "A reason is required": "Alasan koreksi wajib diisi.",
  };
  const message = messages[error.message];
  return message ? new ApiError(message, null, error) : fromSupabaseError(error);
}

export async function getMyRecordForDate(employeeId: string, date: string): Promise<AttendanceRecord | null> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("attendance_records")
    .select(RECORD_COLUMNS)
    .eq("employee_id", employeeId)
    .eq("attendance_date", date)
    .maybeSingle();
  if (error) throw fromSupabaseError(error);
  return data ? toRecord(data) : null;
}

/** month = yyyy-MM */
function monthRange(month: string): { from: string; to: string } {
  const [year, mon] = month.split("-").map(Number);
  const next = new Date(Date.UTC(year, mon, 1));
  const pad = (n: number) => String(n).padStart(2, "0");
  return { from: `${month}-01`, to: `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-01` };
}

export async function listMyRecords(employeeId: string, month: string): Promise<AttendanceRecord[]> {
  const { from, to } = monthRange(month);
  const { data, error } = await createSupabaseBrowserClient()
    .from("attendance_records")
    .select(RECORD_COLUMNS)
    .eq("employee_id", employeeId)
    .gte("attendance_date", from)
    .lt("attendance_date", to)
    .order("attendance_date", { ascending: false });
  if (error) throw fromSupabaseError(error);
  return data.map(toRecord);
}

export async function checkIn(coords: Coordinates): Promise<AttendanceRecord> {
  const { data, error } = await createSupabaseBrowserClient().rpc("check_in", {
    lat: coords.latitude,
    lon: coords.longitude,
    accuracy_meters: coords.accuracy ?? undefined,
  });
  if (error) throw rpcError(error);
  return toRecord(data);
}

export async function checkOut(coords: Coordinates): Promise<AttendanceRecord> {
  const { data, error } = await createSupabaseBrowserClient().rpc("check_out", {
    lat: coords.latitude,
    lon: coords.longitude,
    accuracy_meters: coords.accuracy ?? undefined,
  });
  if (error) throw rpcError(error);
  return toRecord(data);
}

export async function listEmployeeOptions(): Promise<EmployeeOption[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("employees")
    .select("id, full_name, employee_number")
    .eq("active_status", "active")
    .order("full_name");
  if (error) throw fromSupabaseError(error);
  return data.map((row) => ({ id: row.id, name: row.full_name, employeeNumber: row.employee_number }));
}

export async function listDailyRecords(date: string): Promise<DailyAttendanceRow[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("attendance_records")
    .select(`${RECORD_COLUMNS}, employee:employees(full_name, employee_number)`)
    .eq("attendance_date", date)
    .order("check_in_at", { ascending: true, nullsFirst: false });
  if (error) throw fromSupabaseError(error);
  return data.map((row) => ({
    ...toRecord(row),
    employeeName: row.employee?.full_name ?? "—",
    employeeNumber: row.employee?.employee_number ?? null,
  }));
}

export async function listMonthlySummary(month: string): Promise<MonthlySummaryRow[]> {
  const supabase = createSupabaseBrowserClient();
  const [summary, employees] = await Promise.all([
    supabase.from("attendance_monthly_summary").select("*").eq("month", `${month}-01`),
    supabase.from("employees").select("id, full_name, employee_number"),
  ]);
  if (summary.error) throw fromSupabaseError(summary.error);
  if (employees.error) throw fromSupabaseError(employees.error);

  const byId = new Map(employees.data.map((e) => [e.id, e]));
  return summary.data
    .flatMap((row) => {
      if (!row.employee_id) return [];
      const employee = byId.get(row.employee_id);
      return [
        {
          employeeId: row.employee_id,
          employeeName: employee?.full_name ?? "—",
          employeeNumber: employee?.employee_number ?? null,
          daysPresent: Number(row.days_present ?? 0),
          daysLate: Number(row.days_late ?? 0),
          daysEarlyLeave: Number(row.days_early_leave ?? 0),
          daysAbsent: Number(row.days_absent ?? 0),
          daysOnLeave: Number(row.days_on_leave ?? 0),
          daysOnPermit: Number(row.days_on_permit ?? 0),
        },
      ];
    })
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName, "id"));
}

const toTimestamp = (date: string, time: string) => (time === "" ? null : `${date}T${time}:00${APP_UTC_OFFSET}`);

export async function correctAttendance(values: CorrectionFormValues): Promise<void> {
  const { error } = await createSupabaseBrowserClient().rpc("correct_attendance", {
    target_employee_id: values.employeeId,
    target_date: values.date,
    corrected_check_in_at: toTimestamp(values.date, values.checkIn) as string,
    corrected_check_out_at: toTimestamp(values.date, values.checkOut) as string,
    corrected_status: values.status,
    correction_reason: values.reason,
  });
  if (error) throw rpcError(error);
}
