/** Jenis dokumen kepegawaian (Analisa Kebutuhan: SK, ijazah, sertifikat, dokumen kepegawaian lainnya). */
export const DOCUMENT_TYPES = ["SK", "Ijazah", "Sertifikat", "Lainnya"] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export type EmployeeDocument = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string | null;
  documentType: string;
  title: string;
  filePath: string;
  createdAt: string;
};

export type DocumentFilters = {
  employeeId: string | null;
  search: string;
  documentType: string;
  page: number;
};

export type DocumentPage = {
  rows: EmployeeDocument[];
  total: number;
};

export const DOCUMENT_PAGE_SIZE = 20;
export const ALL_DOCUMENT_TYPES = "all";
