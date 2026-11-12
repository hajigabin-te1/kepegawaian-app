import { Badge } from "@/components/ui/badge";
import type { Database } from "@/types/database";

type ProposalStatus = Database["public"]["Enums"]["proposal_status"];

const LABELS: Record<ProposalStatus, string> = { proposed: "Diusulkan", approved: "Disetujui", rejected: "Ditolak", executed: "Dijalankan" };
const VARIANTS = { proposed: "warning", approved: "accent", rejected: "destructive", executed: "success" } as const;

export const PROPOSAL_STATUS_LABELS = LABELS;

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
