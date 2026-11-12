import { Badge } from "@/components/ui/badge";
import { APP_TIME_ZONE } from "@/config/locale";
import { ATTENDANCE_STATUS_LABELS, type AttendanceStatus } from "@/features/attendance/types/attendance";

const STATUS_VARIANTS: Record<AttendanceStatus, "success" | "warning" | "destructive" | "accent" | "secondary"> = {
  present: "success",
  late: "warning",
  early_leave: "warning",
  late_and_early_leave: "warning",
  absent: "destructive",
  on_leave: "accent",
  on_permit: "accent",
};

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{ATTENDANCE_STATUS_LABELS[status]}</Badge>;
}

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: APP_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Time of day in campus time (WITA), or an em dash when missing. */
export function formatTime(value: string | null): string {
  return value ? timeFormatter.format(new Date(value)) : "—";
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** yyyy-MM-dd → "Senin, 2 November 2026". */
export function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

/** Time of day in campus time as HH:mm, for <input type="time">. */
export function toTimeInput(value: string | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", { timeZone: APP_TIME_ZONE, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}
