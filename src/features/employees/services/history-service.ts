import type { SupabaseClient } from "@supabase/supabase-js";

import { fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { HistoryFormValues } from "@/features/employees/schemas/history-schemas";
import type { HistoryConfig, HistoryRow } from "@/features/employees/types/histories";

/**
 * The six history tables share one shape, so they go through a single untyped handle.
 * Rows are narrowed to string/number/null below; the column names come from HISTORY_CONFIGS.
 */
function untypedClient(): SupabaseClient {
  return createSupabaseBrowserClient() as unknown as SupabaseClient;
}

type RawRow = Record<string, unknown>;

const toText = (value: unknown) => (value === null || value === undefined ? "" : String(value));

function toRow(config: HistoryConfig, raw: RawRow): HistoryRow {
  return {
    id: String(raw.id),
    values: Object.fromEntries(config.fields.map((field) => [field.key, toText(raw[field.key])])),
  };
}

function toPayload(config: HistoryConfig, values: HistoryFormValues) {
  return Object.fromEntries(
    config.fields.map((field) => {
      const value = (values[field.key] ?? "").trim();
      if (value === "") return [field.key, null];
      return [field.key, field.kind === "year" ? Number(value) : value];
    }),
  );
}

export async function listHistory(config: HistoryConfig, employeeId: string): Promise<HistoryRow[]> {
  const columns = ["id", ...config.fields.map((f) => f.key)].join(", ");
  const { data, error } = await untypedClient()
    .from(config.table)
    .select(columns)
    .eq("employee_id", employeeId)
    .order(config.orderBy, { ascending: false, nullsFirst: false });
  if (error) throw fromSupabaseError(error);
  return ((data ?? []) as unknown as RawRow[]).map((raw) => toRow(config, raw));
}

export async function saveHistory(
  config: HistoryConfig,
  employeeId: string,
  rowId: string | null,
  values: HistoryFormValues,
): Promise<void> {
  const payload = toPayload(config, values);
  const query = rowId
    ? untypedClient().from(config.table).update(payload).eq("id", rowId).select("id").single()
    : untypedClient().from(config.table).insert({ ...payload, employee_id: employeeId }).select("id").single();
  const { error } = await query;
  if (error) throw fromSupabaseError(error);
}

export async function deleteHistory(config: HistoryConfig, rowId: string): Promise<void> {
  const { error } = await untypedClient().from(config.table).delete().eq("id", rowId).select("id").single();
  if (error) throw fromSupabaseError(error);
}
