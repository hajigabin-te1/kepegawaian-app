import { z } from "zod";

import type { LoginInput } from "@/features/auth/types/auth";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi.").pipe(z.email("Format email tidak valid.")),
  password: z.string().min(1, "Password wajib diisi."),
}) satisfies z.ZodType<LoginInput>;
