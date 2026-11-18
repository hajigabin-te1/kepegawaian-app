import { validateEmployeeFile } from "@/features/documents/services/file-storage";
import type { WorkReport, WorkReportInput } from "@/features/performance/types/performance";
import { ApiError, fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** Private bucket for work report evidence; paths start with the employee id (Storage RLS). */
const EVIDENCE_BUCKET = "appraisal-evidence";
const SIGNED_URL_SECONDS = 60;
const COLUMNS = "id, period_id, employee_id, description, evidence_path, evidence_name, created_at, updated_at";

const RPC_MESSAGES: Record<string, string> = {
  "Your account is not linked to an employee": "Akun Anda belum terhubung ke data pegawai.",
  "Work report not found": "Laporan kerja tidak ditemukan.",
  "Work reports for this period are locked": "Laporan kerja periode ini sudah dikunci karena penilaian sudah dikirim atau periode ditutup.",
  "Description must be 10 to 2000 characters": "Deskripsi harus 10–2000 karakter.",
  "Evidence file is required": "Bukti dokumen wajib diunggah.",
  "Evidence must be stored in your own folder": "File bukti tidak valid. Silakan unggah ulang.",
};

function rpcError(error: { code?: string; message: string }): ApiError {
  const message = RPC_MESSAGES[error.message];
  return message ? new ApiError(message, null, error) : fromSupabaseError(error);
}

type WorkReportRow = {
  id: string;
  period_id: string;
  employee_id: string;
  description: string;
  evidence_path: string;
  evidence_name: string;
  created_at: string;
  updated_at: string;
};

function toWorkReport(row: WorkReportRow): WorkReport {
  return {
    id: row.id,
    periodId: row.period_id,
    employeeId: row.employee_id,
    description: row.description,
    evidencePath: row.evidence_path,
    evidenceName: row.evidence_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listWorkReports(periodId: string, employeeId: string): Promise<WorkReport[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("appraisal_work_reports")
    .select(COLUMNS)
    .eq("period_id", periodId)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: true });
  if (error) throw fromSupabaseError(error);
  return data.map(toWorkReport);
}

/** Periods (ids) in which the employee has at least one report, so closed periods stay viewable. */
export async function listReportedPeriodIds(employeeId: string): Promise<string[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("appraisal_work_reports")
    .select("period_id")
    .eq("employee_id", employeeId);
  if (error) throw fromSupabaseError(error);
  return [...new Set(data.map((row) => row.period_id))];
}

/** Number of reports per employee in a period (HR view). Keyed by employee id. */
export async function countWorkReports(periodId: string): Promise<Record<string, number>> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("appraisal_work_reports")
    .select("employee_id")
    .eq("period_id", periodId);
  if (error) throw fromSupabaseError(error);
  const counts: Record<string, number> = {};
  for (const row of data) counts[row.employee_id] = (counts[row.employee_id] ?? 0) + 1;
  return counts;
}

export async function getWorkReportsLocked(periodId: string, employeeId: string): Promise<boolean> {
  const { data, error } = await createSupabaseBrowserClient().rpc("work_reports_locked", {
    target_period_id: periodId,
    target_employee_id: employeeId,
  });
  if (error) throw rpcError(error);
  return data;
}

function fileExtension(file: File): string {
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/png") return "png";
  return "jpg";
}

async function uploadEvidence(employeeId: string, periodId: string, file: File): Promise<string> {
  const invalid = validateEmployeeFile(file);
  if (invalid) throw new ApiError(invalid, 400, null);
  const path = `${employeeId}/${periodId}/${crypto.randomUUID()}.${fileExtension(file)}`;
  const { error } = await createSupabaseBrowserClient()
    .storage.from(EVIDENCE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new ApiError("Bukti dokumen gagal diunggah. Silakan coba lagi.", null, error);
  return path;
}

/** Best effort: a leftover object is harmless, so failures are not surfaced. */
async function removeEvidence(path: string): Promise<void> {
  await createSupabaseBrowserClient().storage.from(EVIDENCE_BUCKET).remove([path]);
}

/**
 * Uploads the new file (if any), then saves through the RPC. A failed save removes the file it just
 * uploaded; a successful save that replaced the file removes the previous one.
 */
export async function saveWorkReport(input: WorkReportInput, current: WorkReport | null): Promise<void> {
  if (!input.file && !current) throw new ApiError("Bukti dokumen wajib diunggah.", 400, null);

  const uploadedPath = input.file ? await uploadEvidence(input.employeeId, input.periodId, input.file) : null;
  const { error } = await createSupabaseBrowserClient().rpc("save_work_report", {
    target_report_id: input.id,
    target_period_id: input.periodId,
    new_description: input.description,
    new_evidence_path: uploadedPath ?? current?.evidencePath ?? "",
    new_evidence_name: input.file?.name ?? current?.evidenceName ?? "",
  });
  if (error) {
    if (uploadedPath) await removeEvidence(uploadedPath);
    throw rpcError(error);
  }
  if (uploadedPath && current) await removeEvidence(current.evidencePath);
}

export async function deleteWorkReport(id: string): Promise<void> {
  const { data, error } = await createSupabaseBrowserClient().rpc("delete_work_report", { target_report_id: id });
  if (error) throw rpcError(error);
  await removeEvidence(data);
}

/** Short-lived link for opening private evidence. */
export async function getEvidenceUrl(path: string): Promise<string> {
  const { data, error } = await createSupabaseBrowserClient().storage.from(EVIDENCE_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error) throw new ApiError("Bukti dokumen tidak dapat dibuka.", null, error);
  return data.signedUrl;
}
