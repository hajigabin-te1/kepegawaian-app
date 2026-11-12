import { ApiError, fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { HolidayFormValues, LeaveRequestFormValues } from "@/features/leave/schemas/leave-schemas";
import {
  ATTACHMENT_MAX_BYTES,
  type Holiday,
  type LeaveBalance,
  type LeaveRecapRow,
  type LeaveRequest,
  type LeaveType,
} from "@/features/leave/types/leave";
import type { RequestStatus } from "@/features/profile-requests/types/profile-requests";

const BUCKET = "leave-attachments";
const REQUEST_COLUMNS =
  "id, employee_id, leave_type_id, start_date, end_date, total_days, reason, document_path, status, decision_note, created_at, employee:employees(full_name), type:leave_types(name)";

function rpcError(error: { code?: string; message: string }): ApiError {
  const messages: Record<string, string> = {
    "No employee linked to this account": "Akun Anda belum terhubung dengan data pegawai.",
    "Employee is not active": "Pegawai tidak aktif sehingga tidak dapat mengajukan cuti.",
    "Unknown leave type": "Jenis cuti/izin tidak dikenal.",
    "End date is before start date": "Tanggal selesai tidak boleh sebelum tanggal mulai.",
    "A reason is required": "Alasan wajib diisi.",
    "This leave type is only for female employees": "Jenis cuti ini hanya untuk pegawai perempuan.",
    "Exceeds the maximum duration of this leave type": "Durasi melebihi batas maksimal jenis cuti ini (3 bulan).",
    "A half-day permit must be a single day": "Izin setengah hari harus pada satu hari saja.",
    "The selected dates contain no working days": "Tanggal yang dipilih tidak berisi hari kerja (hari Minggu/tanggal merah tidak dihitung).",
    "A supporting document is required": "Jenis ini wajib melampirkan dokumen pendukung.",
    "Invalid attachment": "Lampiran tidak valid.",
    "Overlaps with another leave request": "Tanggal bertabrakan dengan pengajuan cuti/izin lain yang masih berlaku.",
    "Leave quota exceeded": "Sisa kuota cuti tidak mencukupi.",
    "Only your own pending request can be cancelled": "Hanya pengajuan Anda yang masih menunggu yang bisa dibatalkan.",
    "Not allowed to decide this leave request": "Anda tidak memiliki akses untuk memutuskan pengajuan ini.",
    "Leave request not found": "Pengajuan tidak ditemukan.",
    "Leave request has already been decided": "Pengajuan ini sudah diputuskan.",
    "A reason is required when rejecting": "Alasan penolakan wajib diisi.",
  };
  const message = messages[error.message];
  return message ? new ApiError(message, null, error) : fromSupabaseError(error);
}

export async function listLeaveTypes(): Promise<LeaveType[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("leave_types")
    .select("id, code, name, category, counts_toward_quota, female_only, max_months, requires_document")
    .eq("is_active", true)
    .order("category")
    .order("name");
  if (error) throw fromSupabaseError(error);
  return data.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    countsTowardQuota: row.counts_toward_quota,
    femaleOnly: row.female_only,
    maxMonths: row.max_months,
    requiresDocument: row.requires_document,
  }));
}

export async function getLeaveBalance(employeeId: string, year: number): Promise<LeaveBalance> {
  const { data, error } = await createSupabaseBrowserClient().rpc("get_leave_balance", {
    target_employee_id: employeeId,
    target_year: year,
  });
  if (error) throw rpcError(error);
  const row = data[0];
  if (!row) throw new ApiError("Saldo cuti tidak tersedia.", null, null);
  return { quota: Number(row.quota), used: Number(row.used), pending: Number(row.pending), remaining: Number(row.remaining) };
}

export async function listHolidays(from: string, to: string): Promise<Holiday[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("public_holidays")
    .select("holiday_date, name")
    .gte("holiday_date", from)
    .lte("holiday_date", to)
    .order("holiday_date");
  if (error) throw fromSupabaseError(error);
  return data.map((row) => ({ date: row.holiday_date, name: row.name }));
}

export async function createHoliday(values: HolidayFormValues): Promise<void> {
  const { error } = await createSupabaseBrowserClient().from("public_holidays").insert({ holiday_date: values.date, name: values.name });
  if (error) throw fromSupabaseError(error, { "23505": "Tanggal tersebut sudah terdaftar sebagai hari libur." });
}

export async function deleteHoliday(date: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().from("public_holidays").delete().eq("holiday_date", date).select("holiday_date").single();
  if (error) throw fromSupabaseError(error);
}

export async function listLeaveRequests(filter: { employeeId?: string; status?: RequestStatus | "all" }): Promise<LeaveRequest[]> {
  let query = createSupabaseBrowserClient().from("leave_requests").select(REQUEST_COLUMNS);
  if (filter.employeeId) query = query.eq("employee_id", filter.employeeId);
  if (filter.status && filter.status !== "all") query = query.eq("status", filter.status);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw fromSupabaseError(error);
  return data.map((row) => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee?.full_name ?? "—",
    typeId: row.leave_type_id,
    typeName: row.type?.name ?? "—",
    startDate: row.start_date,
    endDate: row.end_date,
    totalDays: Number(row.total_days),
    reason: row.reason,
    documentPath: row.document_path,
    status: row.status,
    decisionNote: row.decision_note,
    createdAt: row.created_at,
  }));
}

/** Keeps the file name readable but safe for a Storage object key. */
const safeFileName = (name: string) => name.normalize("NFKD").replace(/[^\w.-]+/g, "_").slice(-80);

export async function submitLeaveRequest(employeeId: string, values: LeaveRequestFormValues, file: File | null): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  let path: string | undefined;
  if (file) {
    if (file.size > ATTACHMENT_MAX_BYTES) throw new ApiError("Ukuran lampiran maksimal 10 MB.", null, null);
    // Object paths start with the employee id, which the Storage policy checks.
    path = `${employeeId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (uploadError) throw new ApiError("Lampiran gagal diunggah. Silakan coba lagi.", null, uploadError);
  }

  const { error } = await supabase.rpc("submit_leave_request", {
    request_type_id: values.typeId,
    request_start: values.startDate,
    request_end: values.endDate,
    request_reason: values.reason,
    attachment_path: path,
  });
  if (error) {
    if (path) await supabase.storage.from(BUCKET).remove([path]);
    throw rpcError(error);
  }
}

export async function cancelLeaveRequest(id: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().rpc("cancel_leave_request", { request_id: id });
  if (error) throw rpcError(error);
}

export async function decideLeaveRequest(id: string, approve: boolean, note: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().rpc("decide_leave_request", {
    request_id: id,
    approve,
    note: note === "" ? undefined : note,
  });
  if (error) throw rpcError(error);
}

export async function getAttachmentUrl(path: string): Promise<string> {
  const { data, error } = await createSupabaseBrowserClient().storage.from(BUCKET).createSignedUrl(path, 60);
  if (error || !data) throw new ApiError("Lampiran tidak dapat dibuka.", null, error);
  return data.signedUrl;
}

export async function listLeaveRecap(year: number): Promise<LeaveRecapRow[]> {
  const supabase = createSupabaseBrowserClient();
  const [summary, employees, types] = await Promise.all([
    supabase.from("leave_summary").select("employee_id, leave_type_id, approved_requests, approved_days, pending_requests").eq("year", year),
    supabase.from("employees").select("id, full_name"),
    supabase.from("leave_types").select("id, name"),
  ]);
  if (summary.error) throw fromSupabaseError(summary.error);
  if (employees.error) throw fromSupabaseError(employees.error);
  if (types.error) throw fromSupabaseError(types.error);

  const employeeNames = new Map(employees.data.map((e) => [e.id, e.full_name]));
  const typeNames = new Map(types.data.map((t) => [t.id, t.name]));
  return summary.data
    .flatMap((row) =>
      row.employee_id && row.leave_type_id
        ? [
            {
              employeeId: row.employee_id,
              employeeName: employeeNames.get(row.employee_id) ?? "—",
              typeName: typeNames.get(row.leave_type_id) ?? "—",
              approvedRequests: Number(row.approved_requests ?? 0),
              approvedDays: Number(row.approved_days ?? 0),
              pendingRequests: Number(row.pending_requests ?? 0),
            },
          ]
        : [],
    )
    .filter((row) => row.approvedRequests > 0 || row.pendingRequests > 0)
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName, "id") || a.typeName.localeCompare(b.typeName, "id"));
}
