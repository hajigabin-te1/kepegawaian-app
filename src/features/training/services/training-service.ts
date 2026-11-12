import { APP_TIME_ZONE, APP_UTC_OFFSET } from "@/config/locale";
import { ApiError, fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { TrainingFormValues } from "@/features/training/schemas/training-schemas";
import type { Registration, RegistrationStatus, Training } from "@/features/training/types/training";

const TRAINING_COLUMNS = "id, name, organizer, description, start_date, end_date, registration_opens_at, registration_closes_at, quota, status";
const REGISTRATION_COLUMNS =
  "id, training_id, employee_id, status, decision_note, result_note, created_at, training:trainings(name), employee:employees(full_name, employee_number)";

function rpcError(error: { code?: string; message: string }): ApiError {
  const messages: Record<string, string> = {
    "Not allowed to decide this registration": "Anda tidak memiliki akses untuk memutuskan pendaftaran ini.",
    "Not allowed to manage training participants": "Anda tidak memiliki akses untuk mengelola peserta diklat.",
    "Only pending registrations can be decided": "Hanya pendaftaran yang menunggu yang bisa diputuskan.",
    "Registration not found": "Pendaftaran tidak ditemukan.",
    "Only approved registrations can be selected": "Hanya pendaftaran yang disetujui yang bisa ditetapkan sebagai peserta.",
    "Training quota is full": "Kuota peserta diklat sudah penuh.",
    "Only selected participants can be completed": "Hanya peserta yang bisa dicatat selesai.",
  };
  const message = messages[error.message];
  return message ? new ApiError(message, null, error) : fromSupabaseError(error);
}

/** Campus date (yyyy-MM-dd) of a timestamp. */
const toCampusDate = (value: string | null) => (value ? new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(new Date(value)) : null);

type TrainingRow = {
  id: string;
  name: string;
  organizer: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  quota: number | null;
  status: Training["status"];
};

const toTraining = (row: TrainingRow): Training => ({
  id: row.id,
  name: row.name,
  organizer: row.organizer,
  description: row.description,
  startDate: row.start_date,
  endDate: row.end_date,
  opensOn: toCampusDate(row.registration_opens_at),
  closesOn: toCampusDate(row.registration_closes_at),
  quota: row.quota,
  status: row.status,
});

export async function listTrainings(): Promise<Training[]> {
  const { data, error } = await createSupabaseBrowserClient().from("trainings").select(TRAINING_COLUMNS).order("start_date", { ascending: false, nullsFirst: true });
  if (error) throw fromSupabaseError(error);
  return data.map(toTraining);
}

export async function saveTraining(id: string | null, values: TrainingFormValues): Promise<void> {
  const orNull = (v: string) => (v === "" ? null : v);
  const payload = {
    name: values.name,
    organizer: orNull(values.organizer),
    description: orNull(values.description),
    start_date: orNull(values.startDate),
    end_date: orNull(values.endDate),
    // The window covers whole campus days: from the start of the opening day to the end of the closing day.
    registration_opens_at: values.opensOn === "" ? null : `${values.opensOn}T00:00:00${APP_UTC_OFFSET}`,
    registration_closes_at: values.closesOn === "" ? null : `${values.closesOn}T23:59:59${APP_UTC_OFFSET}`,
    quota: values.quota === "" ? null : Number(values.quota),
    status: values.status,
  };
  const supabase = createSupabaseBrowserClient();
  const { error } = id
    ? await supabase.from("trainings").update(payload).eq("id", id).select("id").single()
    : await supabase.from("trainings").insert(payload);
  if (error) throw fromSupabaseError(error);
}

type RegistrationRow = {
  id: string;
  training_id: string;
  employee_id: string;
  status: RegistrationStatus;
  decision_note: string | null;
  result_note: string | null;
  created_at: string;
  training: { name: string } | null;
  employee: { full_name: string; employee_number: string | null } | null;
};

const toRegistration = (row: RegistrationRow): Registration => ({
  id: row.id,
  trainingId: row.training_id,
  trainingName: row.training?.name ?? "—",
  employeeId: row.employee_id,
  employeeName: row.employee?.full_name ?? "—",
  employeeNumber: row.employee?.employee_number ?? null,
  status: row.status,
  decisionNote: row.decision_note,
  resultNote: row.result_note,
  createdAt: row.created_at,
});

export async function listMyRegistrations(employeeId: string): Promise<Registration[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("training_registrations")
    .select(REGISTRATION_COLUMNS)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });
  if (error) throw fromSupabaseError(error);
  return (data as unknown as RegistrationRow[]).map(toRegistration);
}

export async function listRegistrations(trainingId: string): Promise<Registration[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("training_registrations")
    .select(REGISTRATION_COLUMNS)
    .eq("training_id", trainingId)
    .order("created_at");
  if (error) throw fromSupabaseError(error);
  return (data as unknown as RegistrationRow[]).map(toRegistration);
}

export async function applyTraining(trainingId: string, employeeId: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().from("training_registrations").insert({ training_id: trainingId, employee_id: employeeId });
  if (error) {
    throw fromSupabaseError(error, {
      "23505": "Anda sudah mendaftar pada diklat ini.",
      "42501": "Pendaftaran tidak dibuka untuk diklat ini.",
    });
  }
}

export async function decideRegistration(id: string, approve: boolean, note: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().rpc("decide_training_registration", {
    registration_id: id,
    approve,
    note: note === "" ? undefined : note,
  });
  if (error) throw rpcError(error);
}

export async function setOutcome(id: string, status: RegistrationStatus, note: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().rpc("set_training_outcome", {
    registration_id: id,
    new_status: status,
    note: note === "" ? undefined : note,
  });
  if (error) throw rpcError(error);
}
