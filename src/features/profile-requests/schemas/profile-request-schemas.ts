import { z } from "zod";

import { CHANGE_FIELD_KEYS, type ChangeFieldKey } from "@/features/profile-requests/types/profile-requests";

const shape = Object.fromEntries(CHANGE_FIELD_KEYS.map((key) => [key, z.string().trim().max(300, "Maksimal 300 karakter.")])) as Record<
  ChangeFieldKey,
  z.ZodString
>;

export const profileRequestSchema = z
  .object({
    ...shape,
    reason: z.string().trim().min(1, "Alasan perbaikan wajib diisi.").max(500, "Maksimal 500 karakter."),
  })
  .refine((v) => v.email === "" || z.email().safeParse(v.email).success, { path: ["email"], message: "Format email tidak valid." })
  .refine((v) => v.birth_date === "" || /^\d{4}-\d{2}-\d{2}$/.test(v.birth_date), { path: ["birth_date"], message: "Format tanggal tidak valid." })
  .refine((v) => v.full_name !== "", { path: ["full_name"], message: "Nama lengkap tidak boleh kosong." });

export type ProfileRequestFormValues = z.infer<typeof profileRequestSchema>;

export const decisionSchema = z.object({ note: z.string().trim().max(300, "Maksimal 300 karakter.") });
export type DecisionFormValues = z.infer<typeof decisionSchema>;
