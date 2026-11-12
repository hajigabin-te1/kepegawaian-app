import type { Json } from "@/types/database";
import { ApiError, fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  CHANGE_FIELD_KEYS,
  type ChangeFieldKey,
  type ChangeRequest,
  type FieldValues,
  type RequestStatus,
} from "@/features/profile-requests/types/profile-requests";

// Literal select string so the Supabase client can infer the row type. Keep in sync with CHANGE_FIELD_KEYS.
const REQUEST_COLUMNS =
  "id, employee_id, requested_changes, reason, status, review_note, created_at, reviewed_at, employee:employees(full_name, national_id_number, birth_place, birth_date, gender, religion, marital_status, address, city, province, postal_code, phone, email)";

type RawEmployee = Record<string, string | null> | null;

function currentValues(employee: RawEmployee): FieldValues {
  return Object.fromEntries(CHANGE_FIELD_KEYS.map((key) => [key, employee?.[key] ?? ""])) as FieldValues;
}

/** Keeps only known string fields from the stored JSON. */
function requestedValues(json: Json): Partial<FieldValues> {
  if (typeof json !== "object" || json === null || Array.isArray(json)) return {};
  const result: Partial<FieldValues> = {};
  for (const key of CHANGE_FIELD_KEYS) {
    const value = json[key];
    if (typeof value === "string") result[key] = value;
  }
  return result;
}

function rpcError(error: { code?: string; message: string }): ApiError {
  const messages: Record<string, string> = {
    "No employee linked to this account": "Akun Anda belum terhubung dengan data pegawai.",
    "No changes requested": "Tidak ada data yang diubah.",
    "A reason is required": "Alasan perbaikan wajib diisi.",
    "Name cannot be empty": "Nama lengkap tidak boleh kosong.",
    "Not allowed to decide this request": "Anda tidak memiliki akses untuk memutuskan pengajuan ini.",
    "Request not found": "Pengajuan tidak ditemukan.",
    "Request has already been decided": "Pengajuan ini sudah diputuskan.",
    "A reason is required when rejecting": "Alasan penolakan wajib diisi.",
  };
  const message = messages[error.message];
  if (message) return new ApiError(message, null, error);
  if (error.message.startsWith("Unsupported field")) return new ApiError("Ada data yang tidak boleh diajukan perbaikan.", null, error);
  if (error.code === "23505") return new ApiError("NIK sudah dipakai pegawai lain.", null, error);
  if (error.code === "22007" || error.code === "22P02") return new ApiError("Data yang diajukan tidak valid.", null, error);
  return fromSupabaseError(error);
}

export async function listRequests(filter: { employeeId?: string; status?: RequestStatus | "all" }): Promise<ChangeRequest[]> {
  let query = createSupabaseBrowserClient().from("profile_change_requests").select(REQUEST_COLUMNS);
  if (filter.employeeId) query = query.eq("employee_id", filter.employeeId);
  if (filter.status && filter.status !== "all") query = query.eq("status", filter.status);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw fromSupabaseError(error);
  return data.map((row) => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee?.full_name ?? "—",
    requested: requestedValues(row.requested_changes),
    current: currentValues(row.employee as RawEmployee),
    reason: row.reason,
    status: row.status,
    reviewNote: row.review_note,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  }));
}

export async function submitRequest(changes: Partial<Record<ChangeFieldKey, string>>, reason: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().rpc("submit_profile_change_request", { changes, request_reason: reason });
  if (error) throw rpcError(error);
}

export async function decideRequest(id: string, approve: boolean, note: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().rpc("decide_profile_change_request", {
    request_id: id,
    approve,
    note: note === "" ? undefined : note,
  });
  if (error) throw rpcError(error);
}
