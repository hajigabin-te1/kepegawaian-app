export type HistoryEmployee = {
  employeeId: string;
  employeeName: string;
  employeeNumber: string | null;
};

export type PositionHistory = HistoryEmployee & {
  id: string;
  positionId: string | null;
  positionName: string | null;
  workUnitId: string | null;
  workUnitName: string | null;
  startDate: string;
  endDate: string | null;
  decreeNumber: string | null;
  decreePath: string | null;
};

export type EducationHistory = HistoryEmployee & {
  id: string;
  educationLevel: string;
  institution: string;
  major: string | null;
  graduationYear: number | null;
  certificatePath: string | null;
};

/** `employeeId` set = one employee's history (detail tab); null = every employee (menu page). */
export type HistoryFilters = {
  employeeId: string | null;
  search: string;
  page: number;
};

export type HistoryPage<Row> = {
  rows: Row[];
  total: number;
};

export const HISTORY_PAGE_SIZE = 20;

/** Jenjang pendidikan formal di Indonesia. */
export const EDUCATION_LEVELS = ["SD", "SMP", "SMA/SMK", "D1", "D2", "D3", "D4", "S1", "S2", "S3"] as const;
