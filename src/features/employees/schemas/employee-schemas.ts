import { z } from "zod";

const text = (max: number) => z.string().trim().max(max, `Maksimal ${max} karakter.`);
const optionalDate = z.string().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Format tanggal tidak valid.");
const optionalInt = (max: number, label: string) =>
  z.string().trim().refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) <= max), `${label} berupa angka 0–${max}.`);

export const employeeSchema = z.object({
  fullName: text(150).min(1, "Nama lengkap wajib diisi."),
  category: z.enum(["lecturer", "staff"], "Pilih kategori pegawai."),
  employeeNumber: text(30),
  lecturerNumber: text(30),
  nationalIdNumber: text(30),
  birthPlace: text(100),
  birthDate: optionalDate,
  gender: z.enum(["", "male", "female"]),
  religion: text(50),
  maritalStatus: z.enum(["", "single", "married", "divorced", "widowed"]),
  address: text(300),
  city: text(100),
  province: text(100),
  postalCode: text(10),
  phone: text(30),
  email: z.string().trim().refine((v) => v === "" || z.email().safeParse(v).success, "Format email tidak valid."),
  employmentStatusCode: z.string(),
  appointmentDate: optionalDate,
  workUnitId: z.string(),
  positionId: z.string(),
  rankGrade: text(50),
  serviceYears: optionalInt(60, "Masa kerja (tahun)"),
  serviceMonths: optionalInt(11, "Masa kerja (bulan)"),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

export const deactivateSchema = z.object({
  status: z.enum(["inactive", "retired"]),
  reason: z.string().trim().min(1, "Alasan wajib diisi.").max(300, "Maksimal 300 karakter."),
});

export type DeactivateFormValues = z.infer<typeof deactivateSchema>;
