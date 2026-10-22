import { z } from "zod";

import type { LoginInput } from "@/features/auth/types/auth";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username wajib diisi."),
  password: z.string().min(1, "Password wajib diisi."),
}) satisfies z.ZodType<LoginInput>;
