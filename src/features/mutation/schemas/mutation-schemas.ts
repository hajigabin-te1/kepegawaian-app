import { z } from "zod";

export const mutationSchema = z
  .object({
    employeeId: z.string().min(1, "Pilih pegawai."),
    toWorkUnitId: z.string(),
    toPositionId: z.string(),
    effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal berlaku wajib diisi."),
    reason: z.string().trim().max(500, "Maksimal 500 karakter."),
  })
  .refine((v) => v.toWorkUnitId !== "" || v.toPositionId !== "", {
    path: ["toWorkUnitId"],
    message: "Pilih unit kerja baru atau jabatan baru.",
  });

export type MutationFormValues = z.infer<typeof mutationSchema>;
