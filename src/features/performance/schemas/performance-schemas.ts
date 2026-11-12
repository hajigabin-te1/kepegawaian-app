import { z } from "zod";

export const periodSchema = z
  .object({
    name: z.string().trim().min(1, "Nama periode wajib diisi.").max(100, "Maksimal 100 karakter."),
    periodType: z.enum(["annual", "semester"], "Pilih jenis periode."),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal mulai wajib diisi."),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal selesai wajib diisi."),
    isActive: z.boolean(),
  })
  .refine((v) => v.endDate >= v.startDate, { path: ["endDate"], message: "Tanggal selesai tidak boleh sebelum tanggal mulai." });

export type PeriodFormValues = z.infer<typeof periodSchema>;

/** Form schema for one appraisal; scores must stay inside the configured scale. */
export function appraisalSchema(maxScore: number) {
  return z.object({
    note: z.string().trim().max(1000, "Maksimal 1000 karakter."),
    items: z.array(
      z.object({
        indicator: z.string().trim().min(1, "Indikator wajib diisi.").max(200, "Maksimal 200 karakter."),
        target: z.string().trim().max(200, "Maksimal 200 karakter."),
        realization: z.string().trim().max(200, "Maksimal 200 karakter."),
        score: z
          .string()
          .trim()
          .refine((v) => v === "" || (/^\d+([.,]\d{1,2})?$/.test(v) && Number(v.replace(",", ".")) <= maxScore), `Nilai 0–${maxScore}.`),
      }),
    ),
  });
}

export type AppraisalFormValues = z.infer<ReturnType<typeof appraisalSchema>>;

export const reviewSchema = z.object({ note: z.string().trim().max(300, "Maksimal 300 karakter.") });
export type ReviewFormValues = z.infer<typeof reviewSchema>;
