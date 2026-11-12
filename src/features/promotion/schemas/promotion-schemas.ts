import { z } from "zod";

export const promotionSchema = z
  .object({
    employeeId: z.string().min(1, "Pilih pegawai."),
    type: z.enum(["rank", "position"]),
    proposedRank: z.string().trim().max(50, "Maksimal 50 karakter."),
    proposedPositionId: z.string(),
    effectiveDate: z.string().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Format tanggal tidak valid."),
    reason: z.string().trim().max(500, "Maksimal 500 karakter."),
  })
  .refine((v) => v.type !== "rank" || v.proposedRank !== "", { path: ["proposedRank"], message: "Pangkat/golongan usulan wajib diisi." })
  .refine((v) => v.type !== "position" || v.proposedPositionId !== "", { path: ["proposedPositionId"], message: "Pilih jabatan usulan." });

export type PromotionFormValues = z.infer<typeof promotionSchema>;
