import { Badge } from "@/components/ui/badge";
import {
  REGISTRATION_STATUS_LABELS,
  TRAINING_STATUS_LABELS,
  type RegistrationStatus,
  type Training,
  type TrainingStatus,
} from "@/features/training/types/training";

const REGISTRATION_VARIANTS = {
  pending: "warning",
  approved: "accent",
  rejected: "destructive",
  selected: "success",
  not_selected: "secondary",
  completed: "success",
} as const;

const TRAINING_VARIANTS: Record<TrainingStatus, "success" | "secondary" | "accent" | "destructive"> = {
  open: "success",
  closed: "secondary",
  completed: "accent",
  cancelled: "destructive",
};

export function RegistrationStatusBadge({ status }: { status: RegistrationStatus }) {
  return <Badge variant={REGISTRATION_VARIANTS[status]}>{REGISTRATION_STATUS_LABELS[status]}</Badge>;
}

export function TrainingStatusBadge({ status }: { status: TrainingStatus }) {
  return <Badge variant={TRAINING_VARIANTS[status]}>{TRAINING_STATUS_LABELS[status]}</Badge>;
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
export const formatDate = (iso: string) => dateFormatter.format(new Date(`${iso}T00:00:00Z`));

export function formatPeriod(start: string | null, end: string | null): string {
  if (!start && !end) return "Jadwal belum ditentukan";
  if (start && end && start !== end) return `${formatDate(start)} – ${formatDate(end)}`;
  return formatDate((start ?? end) as string);
}

/** Whether employees can apply today (campus date), following the same rule as the database policy. */
export function isRegistrationOpen(training: Training, today: string): boolean {
  if (training.status !== "open") return false;
  if (training.opensOn && today < training.opensOn) return false;
  if (training.closesOn && today > training.closesOn) return false;
  return true;
}
