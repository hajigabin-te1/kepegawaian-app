import { z } from "zod";

import type { HistoryConfig, HistoryField } from "@/features/employees/types/histories";

function fieldSchema(field: HistoryField): z.ZodType<string> {
  const base = z.string().trim().max(300, "Maksimal 300 karakter.");
  const checked =
    field.kind === "date"
      ? base.refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Format tanggal tidak valid.")
      : field.kind === "year"
        ? base.refine((v) => v === "" || /^(19|20)\d{2}$/.test(v), "Tahun 4 digit, mis. 2015.")
        : base;
  return field.required ? checked.refine((v) => v !== "", `${field.label} wajib diisi.`) : checked;
}

/** Zod schema built from a history config. All values are strings. */
export function historySchema(config: HistoryConfig) {
  const shape = Object.fromEntries(config.fields.map((field) => [field.key, fieldSchema(field)]));
  const hasRange = config.fields.some((f) => f.key === "start_date") && config.fields.some((f) => f.key === "end_date");
  const schema = z.object(shape);
  return hasRange
    ? schema.refine((v) => !v.start_date || !v.end_date || v.end_date >= v.start_date, {
        path: ["end_date"],
        message: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
      })
    : schema;
}

export type HistoryFormValues = Record<string, string>;

export const documentSchema = z.object({
  documentType: z.string().min(1, "Pilih jenis dokumen."),
  title: z.string().trim().min(1, "Judul wajib diisi.").max(150, "Maksimal 150 karakter."),
});

export type DocumentFormValues = z.infer<typeof documentSchema>;
