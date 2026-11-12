import { fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DocumentFormValues } from "@/features/documents/schemas/document-schema";
import { removeEmployeeFile, uploadEmployeeFile } from "@/features/documents/services/file-storage";
import {
  ALL_DOCUMENT_TYPES,
  DOCUMENT_PAGE_SIZE,
  type DocumentFilters,
  type DocumentPage,
  type EmployeeDocument,
} from "@/features/documents/types/documents";

/** Characters that would break a PostgREST filter value. */
const sanitizeSearch = (value: string): string => value.replace(/[,()*%\\]/g, " ").trim();

export async function listDocuments(filters: DocumentFilters): Promise<DocumentPage> {
  const from = (filters.page - 1) * DOCUMENT_PAGE_SIZE;
  let query = createSupabaseBrowserClient()
    .from("employee_documents")
    .select("id, employee_id, document_type, title, file_path, created_at, employee:employees!inner(full_name, employee_number)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, from + DOCUMENT_PAGE_SIZE - 1);
  if (filters.employeeId) query = query.eq("employee_id", filters.employeeId);
  if (filters.documentType !== ALL_DOCUMENT_TYPES) query = query.eq("document_type", filters.documentType);
  const search = sanitizeSearch(filters.search);
  if (search) query = query.ilike("employee.full_name", `%${search}%`);

  const { data, error, count } = await query;
  if (error) throw fromSupabaseError(error);
  return {
    total: count ?? 0,
    rows: data.map((row) => ({
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee.full_name,
      employeeNumber: row.employee.employee_number,
      documentType: row.document_type,
      title: row.title,
      filePath: row.file_path,
      createdAt: row.created_at,
    })),
  };
}

/** Uploads the file, then records it; the file is removed again if the record cannot be saved. */
export async function uploadDocument(values: DocumentFormValues, file: File): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const path = await uploadEmployeeFile(values.employeeId, "documents", file);
  const { data: sessionData } = await supabase.auth.getSession();
  const { error } = await supabase
    .from("employee_documents")
    .insert({
      employee_id: values.employeeId,
      document_type: values.documentType,
      title: values.title,
      file_path: path,
      uploaded_by: sessionData.session?.user.id ?? null,
    })
    .select("id")
    .single();
  if (error) {
    await removeEmployeeFile(path);
    throw fromSupabaseError(error);
  }
}

export async function deleteDocument(document: EmployeeDocument): Promise<void> {
  const { error } = await createSupabaseBrowserClient().from("employee_documents").delete().eq("id", document.id).select("id").single();
  if (error) throw fromSupabaseError(error);
  await removeEmployeeFile(document.filePath);
}
