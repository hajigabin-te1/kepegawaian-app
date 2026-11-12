import { ApiError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ALLOWED_EMPLOYEE_FILE_TYPES,
  EMPLOYEE_FILES_BUCKET,
  MAX_EMPLOYEE_FILE_BYTES,
  type EmployeeFileFolder,
} from "@/features/documents/types/files";

const SIGNED_URL_SECONDS = 60;

/** Returns an Indonesian error message, or null when the file can be uploaded. */
export function validateEmployeeFile(file: File): string | null {
  if (!(ALLOWED_EMPLOYEE_FILE_TYPES as readonly string[]).includes(file.type)) {
    return "Format file harus PDF, JPG, atau PNG.";
  }
  if (file.size > MAX_EMPLOYEE_FILE_BYTES) {
    return "Ukuran file maksimal 5 MB.";
  }
  return null;
}

function safeFileName(name: string): string {
  return name.normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").slice(-80) || "file";
}

/** Uploads under "<employeeId>/<folder>/", the layout the Storage RLS policies expect. Returns the object path. */
export async function uploadEmployeeFile(employeeId: string, folder: EmployeeFileFolder, file: File): Promise<string> {
  const invalid = validateEmployeeFile(file);
  if (invalid) throw new ApiError(invalid, 400, null);

  const path = `${employeeId}/${folder}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error } = await createSupabaseBrowserClient()
    .storage.from(EMPLOYEE_FILES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new ApiError("File gagal diunggah. Silakan coba lagi.", null, error);
  return path;
}

/** Short-lived link for viewing or downloading a private file. */
export async function getEmployeeFileUrl(path: string): Promise<string> {
  const { data, error } = await createSupabaseBrowserClient()
    .storage.from(EMPLOYEE_FILES_BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error) throw new ApiError("File tidak dapat dibuka.", null, error);
  return data.signedUrl;
}

/** Best effort: a leftover object is harmless, so failures are not surfaced. */
export async function removeEmployeeFile(path: string | null): Promise<void> {
  if (!path) return;
  await createSupabaseBrowserClient().storage.from(EMPLOYEE_FILES_BUCKET).remove([path]);
}
