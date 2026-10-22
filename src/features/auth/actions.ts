"use server";

import { redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { loginSchema } from "@/features/auth/schemas/login-schema";
import { verifyCredentials } from "@/features/auth/services/mock-auth";
import { createSession, deleteSession } from "@/features/auth/services/session";
import type { LoginInput } from "@/features/auth/types/auth";

export type LoginActionResult = {
  error: string;
};

/** Redirects to the dashboard on success; returns an error message otherwise. */
export async function loginAction(input: LoginInput): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Data login tidak valid." };
  }

  const result = await verifyCredentials(parsed.data);
  if (!result) {
    return { error: "Username atau password salah." };
  }

  await createSession(result.sessionToken);
  redirect(routes.dashboard);
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect(routes.login);
}
