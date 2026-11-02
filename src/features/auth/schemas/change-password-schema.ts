import { z } from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password lama wajib diisi."),
    newPassword: z.string().min(8, "Minimal 8 karakter.").max(72, "Maksimal 72 karakter."),
    confirmPassword: z.string().min(1, "Ulangi password baru."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi tidak sama dengan password baru.",
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ["newPassword"],
    message: "Password baru harus berbeda dari password lama.",
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
