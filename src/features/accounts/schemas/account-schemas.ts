import { z } from "zod";

export const newAccountSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi.").pipe(z.email("Format email tidak valid.")),
  roleCode: z.string().min(1, "Pilih peran."),
  temporaryPassword: z.string().min(8, "Minimal 8 karakter.").max(72, "Maksimal 72 karakter."),
});

export type NewAccountFormValues = z.infer<typeof newAccountSchema>;

// Unambiguous characters only (no 0/O, 1/l/I) so the password can be read out or typed.
const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function generateTemporaryPassword(length = 12): string {
  const values = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(values, (value) => PASSWORD_ALPHABET[value % PASSWORD_ALPHABET.length]).join("");
}

export const reportScopeSchema = z.object({
  workUnitId: z.string(),
  category: z.enum(["all", "lecturer", "staff"]),
  reports: z.array(z.enum(["employees", "attendance", "leave", "appraisal"])).min(1, "Pilih minimal satu jenis laporan."),
});

export type ReportScopeFormValues = z.infer<typeof reportScopeSchema>;
