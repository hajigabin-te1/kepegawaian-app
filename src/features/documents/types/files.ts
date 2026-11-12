/** Private bucket for employee files: documents, SK, ijazah (limits enforced by Storage as well). */
export const EMPLOYEE_FILES_BUCKET = "employee-documents";

export const MAX_EMPLOYEE_FILE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_EMPLOYEE_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;

export const EMPLOYEE_FILE_ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

export type EmployeeFileFolder = "documents" | "education" | "positions";
