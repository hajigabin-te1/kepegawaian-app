import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal wajib diisi.");

export const leaveRequestSchema = z
  .object({
    typeId: z.string().min(1, "Pilih jenis cuti/izin."),
    startDate: isoDate,
    endDate: isoDate,
    reason: z.string().trim().min(1, "Alasan wajib diisi.").max(500, "Maksimal 500 karakter."),
  })
  .refine((v) => v.endDate >= v.startDate, { path: ["endDate"], message: "Tanggal selesai tidak boleh sebelum tanggal mulai." });

export type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;

export const holidaySchema = z.object({
  date: isoDate,
  name: z.string().trim().min(1, "Nama hari libur wajib diisi.").max(100, "Maksimal 100 karakter."),
});

export type HolidayFormValues = z.infer<typeof holidaySchema>;

export const leaveDecisionSchema = z.object({ note: z.string().trim().max(300, "Maksimal 300 karakter.") });
export type LeaveDecisionFormValues = z.infer<typeof leaveDecisionSchema>;
