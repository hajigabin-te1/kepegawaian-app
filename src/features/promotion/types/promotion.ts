import type { Database } from "@/types/database";

export type PromotionType = Database["public"]["Enums"]["promotion_type"];
export type ProposalStatus = Database["public"]["Enums"]["proposal_status"];

export const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = { rank: "Kenaikan pangkat", position: "Kenaikan jabatan" };

export type Promotion = {
  id: string;
  employeeName: string;
  employeeNumber: string | null;
  type: PromotionType;
  currentRank: string | null;
  proposedRank: string | null;
  currentPosition: string | null;
  proposedPosition: string | null;
  effectiveDate: string | null;
  reason: string | null;
  status: ProposalStatus;
  decisionNote: string | null;
  decreeNumber: string | null;
};
