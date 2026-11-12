export const DOCUMENT_TYPES = ["SK", "Ijazah", "Sertifikat", "KTP", "KK", "Lainnya"] as const;

export type EmployeeDocument = {
  id: string;
  documentType: string;
  title: string;
  filePath: string;
  createdAt: string;
};

/** Technical limits applied before upload (not business rules). */
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_ACCEPT = "application/pdf,image/jpeg,image/png";
