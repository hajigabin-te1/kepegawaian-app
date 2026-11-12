import type { RequestStatus } from "@/features/profile-requests/types/profile-requests";

export type LeaveType = {
  id: string;
  code: string;
  name: string;
  category: "leave" | "permit";
  /** false for maternity and long-term sick leave: they do not use the general yearly quota. */
  countsTowardQuota: boolean;
  femaleOnly: boolean;
  maxMonths: number | null;
  requiresDocument: boolean;
};

export type LeaveRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  typeId: string;
  typeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  documentPath: string | null;
  status: RequestStatus;
  decisionNote: string | null;
  createdAt: string;
};

export type LeaveBalance = {
  quota: number;
  used: number;
  pending: number;
  remaining: number;
};

export type Holiday = { date: string; name: string };

export type LeaveRecapRow = {
  employeeId: string;
  employeeName: string;
  typeName: string;
  approvedRequests: number;
  approvedDays: number;
  pendingRequests: number;
};

/** Optional supporting file, e.g. a doctor's note. */
export const ATTACHMENT_ACCEPT = "application/pdf,image/jpeg,image/png";
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
