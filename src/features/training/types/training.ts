import type { Database } from "@/types/database";

export type TrainingStatus = Database["public"]["Enums"]["training_status"];
export type RegistrationStatus = Database["public"]["Enums"]["training_registration_status"];

export const TRAINING_STATUS_LABELS: Record<TrainingStatus, string> = {
  open: "Dibuka",
  closed: "Ditutup",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  pending: "Menunggu persetujuan",
  approved: "Disetujui",
  rejected: "Ditolak",
  selected: "Peserta",
  not_selected: "Tidak terpilih",
  completed: "Selesai",
};

export type Training = {
  id: string;
  name: string;
  organizer: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  /** Registration window as campus dates (yyyy-MM-dd) or null when open-ended. */
  opensOn: string | null;
  closesOn: string | null;
  quota: number | null;
  status: TrainingStatus;
};

export type Registration = {
  id: string;
  trainingId: string;
  trainingName: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string | null;
  status: RegistrationStatus;
  decisionNote: string | null;
  resultNote: string | null;
  createdAt: string;
};
