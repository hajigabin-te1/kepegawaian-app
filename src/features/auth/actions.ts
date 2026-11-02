"use server";

import { redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { changePasswordSchema, type ChangePasswordInput } from "@/features/auth/schemas/change-password-schema";
import { loginSchema } from "@/features/auth/schemas/login-schema";
import { changePassword, signInWithEmail, signOut } from "@/features/auth/services/auth-service";
import type { LoginInput } from "@/features/auth/types/auth";
import { ApiError } from "@/lib/api-error";

export type LoginActionResult = {
  error: string;
};

/** Redirects to the dashboard on success; returns an error message otherwise. */
export async function loginAction(input: LoginInput): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Data login tidak valid." };
  }

  try {
    await signInWithEmail(parsed.data);
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Tidak dapat masuk saat ini. Silakan coba lagi." };
  }

  redirect(routes.dashboard);
}

export async function logoutAction(): Promise<void> {
  await signOut();
  redirect(routes.login);
}

export type ChangePasswordActionResult = { ok: true } | { ok: false; error: string };

export async function changePasswordAction(input: ChangePasswordInput): Promise<ChangePasswordActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Data tidak valid." };
  }

  try {
    await changePassword(parsed.data.currentPassword, parsed.data.newPassword);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof ApiError ? error.message : "Password gagal diganti. Silakan coba lagi." };
  }
}
