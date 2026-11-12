export type HistoryType = "education" | "training" | "position" | "rank" | "disciplinary" | "award";

export type HistoryTable =
  | "education_histories"
  | "training_histories"
  | "position_histories"
  | "rank_histories"
  | "disciplinary_histories"
  | "award_histories";

export type HistoryFieldKind = "text" | "date" | "year" | "position" | "workUnit";

export type HistoryField = {
  /** Database column name; also the key in the form values. */
  key: string;
  label: string;
  kind: HistoryFieldKind;
  required?: boolean;
};

export type HistoryConfig = {
  type: HistoryType;
  table: HistoryTable;
  label: string;
  addLabel: string;
  emptyDescription: string;
  fields: HistoryField[];
  /** Column the list is sorted by, newest first. */
  orderBy: string;
};

/** One history row with every field as a string ("" when empty). */
export type HistoryRow = {
  id: string;
  values: Record<string, string>;
};

export const HISTORY_CONFIGS: HistoryConfig[] = [
  {
    type: "education",
    table: "education_histories",
    label: "Pendidikan",
    addLabel: "Tambah Pendidikan",
    emptyDescription: "Belum ada riwayat pendidikan untuk pegawai ini.",
    orderBy: "graduation_year",
    fields: [
      { key: "education_level", label: "Jenjang", kind: "text", required: true },
      { key: "institution", label: "Institusi", kind: "text", required: true },
      { key: "major", label: "Jurusan", kind: "text" },
      { key: "graduation_year", label: "Tahun lulus", kind: "year" },
    ],
  },
  {
    type: "training",
    table: "training_histories",
    label: "Pelatihan",
    addLabel: "Tambah Pelatihan",
    emptyDescription: "Belum ada riwayat pelatihan untuk pegawai ini.",
    orderBy: "start_date",
    fields: [
      { key: "training_name", label: "Nama pelatihan", kind: "text", required: true },
      { key: "organizer", label: "Penyelenggara", kind: "text" },
      { key: "start_date", label: "Tanggal mulai", kind: "date" },
      { key: "end_date", label: "Tanggal selesai", kind: "date" },
    ],
  },
  {
    type: "position",
    table: "position_histories",
    label: "Jabatan",
    addLabel: "Tambah Riwayat Jabatan",
    emptyDescription: "Belum ada riwayat jabatan untuk pegawai ini.",
    orderBy: "start_date",
    fields: [
      { key: "position_id", label: "Jabatan", kind: "position" },
      { key: "work_unit_id", label: "Unit kerja", kind: "workUnit" },
      { key: "start_date", label: "Tanggal mulai", kind: "date", required: true },
      { key: "end_date", label: "Tanggal selesai", kind: "date" },
      { key: "decree_number", label: "Nomor SK", kind: "text" },
    ],
  },
  {
    type: "rank",
    table: "rank_histories",
    label: "Pangkat",
    addLabel: "Tambah Riwayat Pangkat",
    emptyDescription: "Belum ada riwayat pangkat/golongan untuk pegawai ini.",
    orderBy: "effective_date",
    fields: [
      { key: "rank_grade", label: "Pangkat/golongan", kind: "text", required: true },
      { key: "effective_date", label: "Berlaku mulai", kind: "date", required: true },
      { key: "decree_number", label: "Nomor SK", kind: "text" },
    ],
  },
  {
    type: "disciplinary",
    table: "disciplinary_histories",
    label: "Hukuman disiplin",
    addLabel: "Tambah Hukuman Disiplin",
    emptyDescription: "Tidak ada catatan hukuman disiplin untuk pegawai ini.",
    orderBy: "effective_date",
    fields: [
      { key: "sanction_type", label: "Jenis hukuman", kind: "text", required: true },
      { key: "description", label: "Keterangan", kind: "text" },
      { key: "effective_date", label: "Berlaku mulai", kind: "date", required: true },
      { key: "decree_number", label: "Nomor SK", kind: "text" },
    ],
  },
  {
    type: "award",
    table: "award_histories",
    label: "Penghargaan",
    addLabel: "Tambah Penghargaan",
    emptyDescription: "Belum ada riwayat penghargaan untuk pegawai ini.",
    orderBy: "award_date",
    fields: [
      { key: "award_name", label: "Nama penghargaan", kind: "text", required: true },
      { key: "awarded_by", label: "Pemberi", kind: "text" },
      { key: "award_date", label: "Tanggal", kind: "date" },
    ],
  },
];
