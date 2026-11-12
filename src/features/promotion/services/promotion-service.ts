import { ApiError, fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PromotionFormValues } from "@/features/promotion/schemas/promotion-schemas";
import type { Promotion, ProposalStatus } from "@/features/promotion/types/promotion";

const COLUMNS =
  "id, promotion_type, current_rank_grade, proposed_rank_grade, effective_date, reason, status, decision_note, decree_number, employee:employees(full_name, employee_number), current_position:positions!promotion_proposals_current_position_id_fkey(name), proposed_position:positions!promotion_proposals_proposed_position_id_fkey(name)";

function rpcError(error: { code?: string; message: string }): ApiError {
  const messages: Record<string, string> = {
    "Not allowed to decide promotions": "Anda tidak memiliki akses untuk memutuskan usulan ini.",
    "Not allowed to execute promotions": "Anda tidak memiliki akses untuk menjalankan kenaikan.",
    "Only proposed items can be decided": "Hanya usulan yang masih berstatus Diusulkan yang bisa diputuskan.",
    "Only approved promotions can be executed": "Hanya usulan yang disetujui yang bisa dijalankan.",
    "A reason is required when rejecting": "Alasan penolakan wajib diisi.",
  };
  const message = messages[error.message];
  return message ? new ApiError(message, null, error) : fromSupabaseError(error);
}

export async function listPromotions(status: ProposalStatus | "all"): Promise<Promotion[]> {
  let query = createSupabaseBrowserClient().from("promotion_proposals").select(COLUMNS);
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw fromSupabaseError(error);
  return data.map((row) => ({
    id: row.id,
    employeeName: row.employee?.full_name ?? "—",
    employeeNumber: row.employee?.employee_number ?? null,
    type: row.promotion_type,
    currentRank: row.current_rank_grade,
    proposedRank: row.proposed_rank_grade,
    currentPosition: row.current_position?.name ?? null,
    proposedPosition: row.proposed_position?.name ?? null,
    effectiveDate: row.effective_date,
    reason: row.reason,
    status: row.status,
    decisionNote: row.decision_note,
    decreeNumber: row.decree_number,
  }));
}

/** The current rank/position are filled in by the database from the employee record. */
export async function proposePromotion(values: PromotionFormValues): Promise<void> {
  const { error } = await createSupabaseBrowserClient().from("promotion_proposals").insert({
    employee_id: values.employeeId,
    promotion_type: values.type,
    proposed_rank_grade: values.type === "rank" ? values.proposedRank : null,
    proposed_position_id: values.type === "position" ? values.proposedPositionId : null,
    effective_date: values.effectiveDate === "" ? null : values.effectiveDate,
    reason: values.reason === "" ? null : values.reason,
  });
  if (error) throw fromSupabaseError(error);
}

export async function decidePromotion(id: string, approve: boolean, note: string, decree: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().rpc("decide_promotion", {
    promotion_id: id,
    approve,
    note: note === "" ? undefined : note,
    decree: decree === "" ? undefined : decree,
  });
  if (error) throw rpcError(error);
}

export async function executePromotion(id: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().rpc("execute_promotion", { promotion_id: id });
  if (error) throw rpcError(error);
}
