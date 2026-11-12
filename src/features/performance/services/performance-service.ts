import { ApiError, fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AppraisalFormValues, PeriodFormValues } from "@/features/performance/schemas/performance-schemas";
import type {
  AppraisalDetail,
  AppraisalListItem,
  AppraisalPeriod,
  AppraisalRecapRow,
  AppraisalStatus,
} from "@/features/performance/types/performance";

const DETAIL_COLUMNS =
  "id, period_id, employee_id, status, performance_score, note, revision_note, period:appraisal_periods(name), employee:employees(full_name), items:appraisal_items(indicator, target, realization, score, sort_order)";

function rpcError(error: { code?: string; message: string }): ApiError {
  const messages: Record<string, string> = {
    "Not allowed to generate appraisals": "Anda tidak memiliki akses untuk membuat form penilaian.",
    "Not allowed to edit appraisals": "Anda tidak memiliki akses untuk mengisi penilaian.",
    "Not allowed to submit appraisals": "Anda tidak memiliki akses untuk mengirim penilaian.",
    "Not allowed to review appraisals": "Anda tidak memiliki akses untuk memverifikasi penilaian.",
    "The appraisal period is not active": "Periode penilaian tidak aktif.",
    "Appraisal not found": "Form penilaian tidak ditemukan.",
    "This appraisal can no longer be edited": "Form ini sudah dikirim dan tidak bisa diubah.",
    "This appraisal has already been submitted": "Form ini sudah dikirim.",
    "Every indicator needs a name": "Setiap indikator harus diberi nama.",
    "Score is outside the allowed scale": "Ada nilai di luar skala yang diizinkan.",
    "Add at least one indicator before submitting": "Tambahkan minimal satu indikator sebelum mengirim.",
    "Every indicator must have a score before submitting": "Semua indikator harus diberi nilai sebelum dikirim.",
    "Only submitted appraisals can be reviewed": "Hanya penilaian yang menunggu verifikasi yang bisa diperiksa.",
    "A reason is required when sending back": "Alasan pengembalian wajib diisi.",
    "Not allowed to view appraisal reports": "Anda tidak memiliki akses ke rekap penilaian.",
  };
  const message = messages[error.message];
  return message ? new ApiError(message, null, error) : fromSupabaseError(error);
}

type PeriodRow = {
  id: string;
  name: string;
  period_type: AppraisalPeriod["periodType"];
  start_date: string;
  end_date: string;
  is_active: boolean;
};

const toPeriod = (row: PeriodRow): AppraisalPeriod => ({
  id: row.id,
  name: row.name,
  periodType: row.period_type,
  startDate: row.start_date,
  endDate: row.end_date,
  isActive: row.is_active,
});

export async function listPeriods(): Promise<AppraisalPeriod[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("appraisal_periods")
    .select("id, name, period_type, start_date, end_date, is_active")
    .order("start_date", { ascending: false });
  if (error) throw fromSupabaseError(error);
  return data.map(toPeriod);
}

export async function savePeriod(id: string | null, values: PeriodFormValues): Promise<void> {
  const payload = {
    name: values.name,
    period_type: values.periodType,
    start_date: values.startDate,
    end_date: values.endDate,
    is_active: values.isActive,
  };
  const supabase = createSupabaseBrowserClient();
  const { error } = id
    ? await supabase.from("appraisal_periods").update(payload).eq("id", id).select("id").single()
    : await supabase.from("appraisal_periods").insert(payload);
  if (error) throw fromSupabaseError(error, { "23505": "Periode dengan nama ini sudah ada." });
}

export async function generateAppraisals(periodId: string): Promise<number> {
  const { data, error } = await createSupabaseBrowserClient().rpc("generate_appraisals", { target_period_id: periodId });
  if (error) throw rpcError(error);
  return data;
}

export async function listAppraisals(periodId: string, status: AppraisalStatus | "all"): Promise<AppraisalListItem[]> {
  let query = createSupabaseBrowserClient()
    .from("appraisals")
    .select("id, employee_id, status, performance_score, employee:employees(full_name, employee_number, work_unit:work_units(name))")
    .eq("period_id", periodId);
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw fromSupabaseError(error);
  return data
    .map((row) => ({
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee?.full_name ?? "—",
      employeeNumber: row.employee?.employee_number ?? null,
      workUnitName: row.employee?.work_unit?.name ?? null,
      status: row.status,
      score: row.performance_score === null ? null : Number(row.performance_score),
    }))
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName, "id"));
}

type DetailRow = {
  id: string;
  period_id: string;
  employee_id: string;
  status: AppraisalStatus;
  performance_score: number | null;
  note: string | null;
  revision_note: string | null;
  period: { name: string } | null;
  employee: { full_name: string } | null;
  items: { indicator: string; target: string | null; realization: string | null; score: number | null; sort_order: number }[];
};

const toDetail = (row: DetailRow): AppraisalDetail => ({
  id: row.id,
  periodId: row.period_id,
  periodName: row.period?.name ?? "—",
  employeeId: row.employee_id,
  employeeName: row.employee?.full_name ?? "—",
  status: row.status,
  score: row.performance_score === null ? null : Number(row.performance_score),
  note: row.note ?? "",
  revisionNote: row.revision_note,
  items: [...row.items]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => ({
      indicator: item.indicator,
      target: item.target ?? "",
      realization: item.realization ?? "",
      score: item.score === null ? "" : String(Number(item.score)),
    })),
});

export async function getAppraisal(id: string): Promise<AppraisalDetail | null> {
  const { data, error } = await createSupabaseBrowserClient().from("appraisals").select(DETAIL_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw fromSupabaseError(error);
  return data ? toDetail(data as unknown as DetailRow) : null;
}

/** The employee's own results; RLS only returns verified forms. */
export async function listMyAppraisals(employeeId: string): Promise<AppraisalDetail[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("appraisals")
    .select(DETAIL_COLUMNS)
    .eq("employee_id", employeeId)
    .order("verified_at", { ascending: false });
  if (error) throw fromSupabaseError(error);
  return (data as unknown as DetailRow[]).map(toDetail);
}

export async function getMaxScore(): Promise<number> {
  const { data, error } = await createSupabaseBrowserClient().from("app_settings").select("value").eq("key", "appraisal_max_score").maybeSingle();
  if (error) throw fromSupabaseError(error);
  const value = typeof data?.value === "number" ? data.value : Number(data?.value);
  return Number.isFinite(value) && value > 0 ? value : 100;
}

export async function saveAppraisal(id: string, values: AppraisalFormValues): Promise<void> {
  const items = values.items.map((item) => ({
    indicator: item.indicator,
    target: item.target,
    realization: item.realization,
    score: item.score === "" ? "" : item.score.replace(",", "."),
  }));
  const { error } = await createSupabaseBrowserClient().rpc("save_appraisal", { target_appraisal_id: id, new_note: values.note, items });
  if (error) throw rpcError(error);
}

export async function submitAppraisal(id: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().rpc("submit_appraisal", { target_appraisal_id: id });
  if (error) throw rpcError(error);
}

export async function reviewAppraisal(id: string, accept: boolean, note: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().rpc("review_appraisal", {
    target_appraisal_id: id,
    accept,
    note: note === "" ? undefined : note,
  });
  if (error) throw rpcError(error);
}

export async function listRecap(periodId: string): Promise<AppraisalRecapRow[]> {
  const { data, error } = await createSupabaseBrowserClient().rpc("report_appraisal_by_unit", { target_period_id: periodId });
  if (error) throw rpcError(error);
  return data
    .map((row) => ({
      workUnitName: row.work_unit_name ?? "Tanpa unit kerja",
      category: row.category,
      appraisedEmployees: Number(row.appraised_employees),
      averageScore: Number(row.average_score),
      lowestScore: Number(row.lowest_score),
      highestScore: Number(row.highest_score),
    }))
    .sort((a, b) => a.workUnitName.localeCompare(b.workUnitName, "id"));
}
