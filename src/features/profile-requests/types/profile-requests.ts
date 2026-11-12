import { GENDER_LABELS, MARITAL_STATUS_LABELS } from "@/features/employees/types/employee";

export type ChangeFieldKind = "text" | "date" | "gender" | "marital";

export type ChangeField = {
  /** Column in public.employees; must match profile_change_fields() in the database. */
  key: ChangeFieldKey;
  label: string;
  kind: ChangeFieldKind;
};

export const CHANGE_FIELD_KEYS = [
  "full_name",
  "national_id_number",
  "birth_place",
  "birth_date",
  "gender",
  "religion",
  "marital_status",
  "address",
  "city",
  "province",
  "postal_code",
  "phone",
  "email",
] as const;

export type ChangeFieldKey = (typeof CHANGE_FIELD_KEYS)[number];

export const CHANGE_FIELDS: ChangeField[] = [
  { key: "full_name", label: "Nama lengkap", kind: "text" },
  { key: "national_id_number", label: "NIK", kind: "text" },
  { key: "birth_place", label: "Tempat lahir", kind: "text" },
  { key: "birth_date", label: "Tanggal lahir", kind: "date" },
  { key: "gender", label: "Jenis kelamin", kind: "gender" },
  { key: "religion", label: "Agama", kind: "text" },
  { key: "marital_status", label: "Status pernikahan", kind: "marital" },
  { key: "address", label: "Alamat", kind: "text" },
  { key: "city", label: "Kota/Kabupaten", kind: "text" },
  { key: "province", label: "Provinsi", kind: "text" },
  { key: "postal_code", label: "Kode pos", kind: "text" },
  { key: "phone", label: "No. HP", kind: "text" },
  { key: "email", label: "Email", kind: "text" },
];

export type FieldValues = Record<ChangeFieldKey, string>;

export type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};

export type ChangeRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  /** Only the fields the employee asked to change. */
  requested: Partial<FieldValues>;
  /** The employee's data right now (for comparison while the request is pending). */
  current: FieldValues;
  reason: string;
  status: RequestStatus;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });

export function formatFieldValue(field: ChangeField, value: string | undefined): string {
  if (!value) return "—";
  if (field.kind === "date") return dateFormatter.format(new Date(`${value}T00:00:00Z`));
  if (field.kind === "gender") return GENDER_LABELS[value as keyof typeof GENDER_LABELS] ?? value;
  if (field.kind === "marital") return MARITAL_STATUS_LABELS[value as keyof typeof MARITAL_STATUS_LABELS] ?? value;
  return value;
}
