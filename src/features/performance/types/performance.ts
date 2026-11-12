import type { Database } from "@/types/database";

export type AppraisalStatus = Database["public"]["Enums"]["appraisal_status"];
export type PeriodType = Database["public"]["Enums"]["appraisal_period_type"];

export const APPRAISAL_STATUS_LABELS: Record<AppraisalStatus, string> = {
  draft: "Draf",
  submitted: "Menunggu verifikasi",
  revision_requested: "Perlu revisi",
  verified: "Terverifikasi",
};

export const PERIOD_TYPE_LABELS: Record<PeriodType, string> = { annual: "Tahunan", semester: "Semester" };

export type AppraisalPeriod = {
  id: string;
  name: string;
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

export type AppraisalItem = {
  indicator: string;
  target: string;
  realization: string;
  /** Empty string while not scored yet. */
  score: string;
};

export type AppraisalListItem = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string | null;
  workUnitName: string | null;
  status: AppraisalStatus;
  score: number | null;
};

export type AppraisalDetail = {
  id: string;
  periodId: string;
  periodName: string;
  employeeId: string;
  employeeName: string;
  status: AppraisalStatus;
  score: number | null;
  note: string;
  revisionNote: string | null;
  items: AppraisalItem[];
};

export type AppraisalRecapRow = {
  workUnitName: string;
  category: "lecturer" | "staff";
  appraisedEmployees: number;
  averageScore: number;
  lowestScore: number;
  highestScore: number;
};
