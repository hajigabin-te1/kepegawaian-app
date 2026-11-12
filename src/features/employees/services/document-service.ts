import { ApiError, fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DocumentFormValues } from "@/features/employees/schemas/history-schemas";
import { DOCUMENT_MAX_BYTES, type EmployeeDocument } from "@/features/employees/types/documents";

const BUCKET = "employee-documents";

export async function listDocuments(employeeId: string): Promise<EmployeeDocument[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("employee_documents")
    .select("id, document_type, title, file_path, created_at")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });
  if (error) throw fromSupabaseError(error);
  return data.map((row) => ({
    id: row.id,
    documentType: row.document_type,
    title: row.title,
    filePath: row.file_path,
    createdAt: row.created_at,
  }));
}

/** Keeps the file name readable but safe for a Storage object key. */
function safeFileName(name: string): string {
  return name.normalize("NFKD").replace(/[^\w.-]+/g, "_").slice(-80);
}

export async function uploadDocument(employeeId: string, file: File, values: DocumentFormValues): Promise<void> {
  if (file.size > DOCUMENT_MAX_BYTES) {
    throw new ApiError("Ukuran berkas maksimal 10 MB.", null, null);
  }
  const supabase = createSupabaseBrowserClient();
  // Object paths start with the employee id, which the Storage policies rely on.
  const path = `${employeeId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (uploadError) throw new ApiError("Berkas gagal diunggah. Silakan coba lagi.", null, uploadError);

  const { error } = await supabase
    .from("employee_documents")
    .insert({ employee_id: employeeId, document_type: values.documentType, title: values.title, file_path: path });
  if (error) {
    // Do not leave an orphan file without its record.
    await supabase.storage.from(BUCKET).remove([path]);
    throw fromSupabaseError(error);
  }
}

export async function deleteDocument(document: EmployeeDocument): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("employee_documents").delete().eq("id", document.id).select("id").single();
  if (error) throw fromSupabaseError(error);
  // The record is gone; a failed file cleanup only leaves an unreachable object.
  await supabase.storage.from(BUCKET).remove([document.filePath]);
}

/** Short-lived link for opening a private file. */
export async function getDocumentUrl(filePath: string): Promise<string> {
  const { data, error } = await createSupabaseBrowserClient().storage.from(BUCKET).createSignedUrl(filePath, 60);
  if (error || !data) throw new ApiError("Berkas tidak dapat dibuka.", null, error);
  return data.signedUrl;
}
