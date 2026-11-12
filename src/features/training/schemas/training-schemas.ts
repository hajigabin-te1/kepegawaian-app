import { z } from "zod";

const optionalDate = z.string().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Format tanggal tidak valid.");

export const trainingSchema = z
  .object({
    name: z.string().trim().min(1, "Nama diklat wajib diisi.").max(200, "Maksimal 200 karakter."),
    organizer: z.string().trim().max(150, "Maksimal 150 karakter."),
    description: z.string().trim().max(2000, "Maksimal 2000 karakter."),
    startDate: optionalDate,
    endDate: optionalDate,
    opensOn: optionalDate,
    closesOn: optionalDate,
    quota: z.string().trim().refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) > 0), "Kuota berupa angka lebih dari 0."),
    status: z.enum(["open", "closed", "completed", "cancelled"]),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, { path: ["endDate"], message: "Tanggal selesai tidak boleh sebelum tanggal mulai." })
  .refine((v) => !v.opensOn || !v.closesOn || v.closesOn >= v.opensOn, { path: ["closesOn"], message: "Penutupan tidak boleh sebelum pembukaan." });

export type TrainingFormValues = z.infer<typeof trainingSchema>;
