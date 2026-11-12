import { ApiError, fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { MutationFormValues } from "@/features/mutation/schemas/mutation-schemas";
import type { Mutation, ProposalStatus } from "@/features/mutation/types/mutation";

const COLUMNS =
  "id, effective_date, reason, status, decision_note, decree_number, employee:employees(full_name, employee_number), from_unit:work_units!mutations_from_work_unit_id_fkey(name), to_unit:work_units!mutations_to_work_unit_id_fkey(name), from_position:positions!mutations_from_position_id_fkey(name), to_position:positions!mutations_to_position_id_fkey(name)";

function rpcError(error: { code?: string; message: string }): ApiError {
  const messages: Record<string, string> = {
    "Not allowed to decide mutations": "Anda tidak memiliki akses untuk memutuskan mutasi.",
    "Not allowed to execute mutations": "Anda tidak memiliki akses untuk menjalankan mutasi.",
    "Only proposed items can be decided": "Hanya usulan yang masih berstatus Diusulkan yang bisa diputuskan.",
    "Only approved mutations can be executed": "Hanya mutasi yang disetujui yang bisa dijalankan.",
    "A reason is required when rejecting": "Alasan penolakan wajib diisi.",
  };
  const message = messages[error.message];
  return message ? new ApiError(message, null, error) : fromSupabaseError(error);
}

export async function listMutations(status: ProposalStatus | "all"): Promise<Mutation[]> {
  let query = createSupabaseBrowserClient().from("mutations").select(COLUMNS);
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw fromSupabaseError(error);
  return data.map((row) => ({
    id: row.id,
    employeeName: row.employee?.full_name ?? "—",
    employeeNumber: row.employee?.employee_number ?? null,
    fromUnit: row.from_unit?.name ?? null,
    toUnit: row.to_unit?.name ?? null,
    fromPosition: row.from_position?.name ?? null,
    toPosition: row.to_position?.name ?? null,
    effectiveDate: row.effective_date,
    reason: row.reason,
    status: row.status,
    decisionNote: row.decision_note,
    decreeNumber: row.decree_number,
  }));
}

/** The current unit and position are filled in by the database from the employee record. */
export async function proposeMutation(values: MutationFormValues): Promise<void> {
  const { error } = await createSupabaseBrowserClient().from("mutations").insert({
    employee_id: values.employeeId,
    to_work_unit_id: values.toWorkUnitId === "" ? null : values.toWorkUnitId,
    to_position_id: values.toPositionId === "" ? null : values.toPositionId,
    effective_date: values.effectiveDate,
    reason: values.reason === "" ? null : values.reason,
  });
  if (error) throw fromSupabaseError(error);
}

export async function decideMutation(id: string, approve: boolean, note: string, decree: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().rpc("decide_mutation", {
    mutation_id: id,
    approve,
    note: note === "" ? undefined : note,
    decree: decree === "" ? undefined : decree,
  });
  if (error) throw rpcError(error);
}

export async function executeMutation(id: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().rpc("execute_mutation", { mutation_id: id });
  if (error) throw rpcError(error);
}
