import { fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AttendanceLocationFormValues, WorkScheduleFormValues } from "@/features/settings/schemas/settings-schemas";
import type { AttendanceLocation, WorkSchedule } from "@/features/settings/types/settings";

const NO_PERMISSION = { "42501": "Anda tidak memiliki izin mengubah pengaturan." };

export async function getTimeZoneSetting(): Promise<string | null> {
  const { data, error } = await createSupabaseBrowserClient().from("app_settings").select("value").eq("key", "timezone").maybeSingle();
  if (error) throw fromSupabaseError(error);
  return typeof data?.value === "string" ? data.value : null;
}

export async function listAttendanceLocations(): Promise<AttendanceLocation[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("attendance_locations")
    .select("id, name, latitude, longitude, radius_meters, is_active")
    .order("name");
  if (error) throw fromSupabaseError(error);
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    radiusMeters: row.radius_meters,
    isActive: row.is_active,
  }));
}

export async function saveAttendanceLocation(id: string | null, values: AttendanceLocationFormValues): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const payload = {
    name: values.name,
    latitude: Number(values.latitude),
    longitude: Number(values.longitude),
    radius_meters: Number(values.radiusMeters),
    is_active: values.isActive,
  };
  const { error } = id
    ? await supabase.from("attendance_locations").update(payload).eq("id", id).select("id").single()
    : await supabase.from("attendance_locations").insert(payload).select("id").single();
  if (error) throw fromSupabaseError(error, NO_PERMISSION);
}

export async function listWorkSchedules(): Promise<WorkSchedule[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("work_schedules")
    .select("id, name, employee_category, check_in_time, check_out_time, late_tolerance_minutes, flags_early_leave")
    .order("employee_category");
  if (error) throw fromSupabaseError(error);
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    employeeCategory: row.employee_category,
    checkInTime: row.check_in_time.slice(0, 5),
    checkOutTime: row.check_out_time.slice(0, 5),
    lateToleranceMinutes: row.late_tolerance_minutes,
    flagsEarlyLeave: row.flags_early_leave,
  }));
}

export async function updateWorkSchedule(id: string, values: WorkScheduleFormValues): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from("work_schedules")
    .update({
      check_in_time: values.checkInTime,
      check_out_time: values.checkOutTime,
      late_tolerance_minutes: Number(values.lateToleranceMinutes),
      flags_early_leave: values.flagsEarlyLeave,
    })
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw fromSupabaseError(error, NO_PERMISSION);
}
