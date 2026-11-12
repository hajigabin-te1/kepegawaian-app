import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max, `Maksimal ${max} karakter.`);
const optionalDigits = (label: string, length?: number) =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d+$/.test(value), `${label} hanya berisi angka.`)
    .refine((value) => value === "" || length === undefined || value.length === length, `${label} harus ${length} digit.`);
const optionalNumberInRange = (label: string, max: number) =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || (/^\d+$/.test(value) && Number(value) <= max), `${label} berupa angka 0–${max}.`);

/**
 * Employee form. Required: full name, category, work unit (decision 2026-11-12).
 * Inputs stay strings so empty fields map to null in the service layer.
 */
export const employeeFormSchema = z.object({
  fullName: z.string().trim().min(1, "Nama lengkap wajib diisi.").max(150, "Maksimal 150 karakter."),
  category: z.enum(["lecturer", "staff"], "Pilih kategori pegawai."),
  workUnitId: z.string().min(1, "Pilih unit kerja."),
  employeeNumber: optionalDigits("NIP"),
  lecturerNumber: optionalDigits("NIDN"),
  nationalIdNumber: optionalDigits("NIK", 16),
  birthPlace: optionalText(100),
  birthDate: z.string(),
  gender: z.enum(["male", "female", ""]),
  religion: optionalText(50),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed", ""]),
  address: optionalText(300),
  city: optionalText(100),
  province: optionalText(100),
  postalCode: optionalDigits("Kode pos", 5),
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\+?\d{8,15}$/.test(value), "Nomor HP berupa 8–15 angka."),
  email: z.string().trim().refine((value) => value === "" || z.email().safeParse(value).success, "Format email tidak valid."),
  employmentStatusCode: z.string(),
  appointmentDate: z.string(),
  positionId: z.string(),
  rankGrade: optionalText(20),
  serviceYears: optionalNumberInRange("Masa kerja (tahun)", 60),
  serviceMonths: optionalNumberInRange("Masa kerja (bulan)", 11),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

/** Optional sign-in account created together with a new employee. */
export const employeeAccountSchema = z.object({
  createAccount: z.boolean(),
  temporaryPassword: z.string(),
});

export const createEmployeeFormSchema = employeeFormSchema
  .extend(employeeAccountSchema.shape)
  .superRefine((values, context) => {
    if (!values.createAccount) return;
    if (values.email === "") {
      context.addIssue({ code: "custom", path: ["email"], message: "Email wajib diisi untuk membuat akun login." });
    }
    if (values.temporaryPassword.length < 8 || values.temporaryPassword.length > 72) {
      context.addIssue({ code: "custom", path: ["temporaryPassword"], message: "Password sementara 8–72 karakter." });
    }
  });

export type CreateEmployeeFormValues = z.infer<typeof createEmployeeFormSchema>;

export const deactivateEmployeeSchema = z.object({
  activeStatus: z.enum(["inactive", "retired"]),
  reason: z.string().trim().min(1, "Alasan wajib diisi.").max(300, "Maksimal 300 karakter."),
});

export type DeactivateEmployeeValues = z.infer<typeof deactivateEmployeeSchema>;
