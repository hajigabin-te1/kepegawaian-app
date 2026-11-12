import { z } from "zod";

const decimal = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi.`)
    .refine((value) => /^-?\d+(\.\d+)?$/.test(value), `${label} harus berupa angka desimal, mis. -2.422180.`)
    .refine((value) => Number(value) >= min && Number(value) <= max, `${label} harus di antara ${min} dan ${max}.`);

export const attendanceLocationSchema = z.object({
  name: z.string().trim().min(1, "Nama lokasi wajib diisi.").max(150, "Maksimal 150 karakter."),
  latitude: decimal("Latitude", -90, 90),
  longitude: decimal("Longitude", -180, 180),
  radiusMeters: z
    .string()
    .trim()
    .regex(/^\d+$/, "Radius harus bilangan bulat dalam meter.")
    .refine((value) => Number(value) >= 1 && Number(value) <= 5000, "Radius antara 1 dan 5000 meter."),
  isActive: z.boolean(),
});

export type AttendanceLocationFormValues = z.infer<typeof attendanceLocationSchema>;

const time = (label: string) => z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, `${label} wajib diisi (JJ:MM).`);

export const workScheduleSchema = z
  .object({
    checkInTime: time("Jam masuk"),
    checkOutTime: time("Jam pulang"),
    lateToleranceMinutes: z
      .string()
      .trim()
      .regex(/^\d+$/, "Toleransi harus bilangan bulat dalam menit.")
      .refine((value) => Number(value) <= 240, "Toleransi maksimal 240 menit."),
    flagsEarlyLeave: z.boolean(),
  })
  .refine((values) => values.checkOutTime > values.checkInTime, {
    path: ["checkOutTime"],
    message: "Jam pulang harus setelah jam masuk.",
  });

export type WorkScheduleFormValues = z.infer<typeof workScheduleSchema>;
