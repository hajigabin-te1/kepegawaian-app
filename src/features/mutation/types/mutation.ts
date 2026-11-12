import type { Database } from "@/types/database";

export type ProposalStatus = Database["public"]["Enums"]["proposal_status"];

export type Mutation = {
  id: string;
  employeeName: string;
  employeeNumber: string | null;
  fromUnit: string | null;
  toUnit: string | null;
  fromPosition: string | null;
  toPosition: string | null;
  effectiveDate: string;
  reason: string | null;
  status: ProposalStatus;
  decisionNote: string | null;
  decreeNumber: string | null;
};
