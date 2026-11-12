import { z } from "zod";

import { ATTENDANCE_STATUS_LABELS, type AttendanceStatus } from "@/features/attendance/types/attendance";

const statuses = Object.keys(ATTENDANCE_STATUS_LABELS) as [AttendanceStatus, ...AttendanceStatus[]];
const timeOrEmpty = z.string().refine((value) => value === "" || /^\d{2}:\d{2}$/.test(value), "Format jam tidak valid.");

export const correctionSchema = z
  .object({
    employeeId: z.string().min(1, "Pilih pegawai."),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal wajib diisi."),
    checkIn: timeOrEmpty,
    checkOut: timeOrEmpty,
    status: z.enum(statuses, "Pilih status."),
    reason: z.string().trim().min(1, "Alasan koreksi wajib diisi.").max(500, "Maksimal 500 karakter."),
  })
  .refine((v) => v.checkIn === "" || v.checkOut === "" || v.checkOut >= v.checkIn, {
    path: ["checkOut"],
    message: "Jam pulang tidak boleh sebelum jam datang.",
  });

export type CorrectionFormValues = z.infer<typeof correctionSchema>;
