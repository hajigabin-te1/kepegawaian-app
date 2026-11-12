import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max, `Maksimal ${max} karakter.`);

export const positionHistorySchema = z
  .object({
    employeeId: z.string().min(1, "Pilih pegawai."),
    positionId: z.string().min(1, "Pilih jabatan."),
    workUnitId: z.string(),
    startDate: z.string().min(1, "Tanggal mulai wajib diisi."),
    endDate: z.string(),
    decreeNumber: optionalText(100),
  })
  .refine((values) => values.endDate === "" || values.endDate >= values.startDate, {
    path: ["endDate"],
    message: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
  });

export type PositionHistoryFormValues = z.infer<typeof positionHistorySchema>;

export const educationHistorySchema = z.object({
  employeeId: z.string().min(1, "Pilih pegawai."),
  educationLevel: z.string().min(1, "Pilih jenjang pendidikan."),
  institution: z.string().trim().min(1, "Nama institusi wajib diisi.").max(150, "Maksimal 150 karakter."),
  major: optionalText(150),
  graduationYear: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || (/^\d{4}$/.test(value) && Number(value) >= 1950 && Number(value) <= new Date().getFullYear() + 1),
      "Tahun lulus tidak valid.",
    ),
});

export type EducationHistoryFormValues = z.infer<typeof educationHistorySchema>;
