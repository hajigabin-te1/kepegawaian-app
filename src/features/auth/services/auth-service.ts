import { isAuthApiError } from "@supabase/supabase-js";

import { redirect } from "next/navigation";

import { routes } from "@/config/routes";
import type { PermissionCode } from "@/config/permissions";
import { ApiError } from "@/lib/api-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ROLE_CODES, type LoginInput, type RoleCode, type SessionUser } from "@/features/auth/types/auth";

const INVALID_CREDENTIALS_MESSAGE = "Email atau password salah.";
const ACCOUNT_UNAVAILABLE_MESSAGE = "Akun belum terdaftar di sistem kepegawaian atau sedang nonaktif. Hubungi Bagian Kepegawaian.";
const GENERIC_MESSAGE = "Tidak dapat masuk saat ini. Silakan coba lagi.";
const CHANGE_PASSWORD_FAILED_MESSAGE = "Password gagal diganti. Silakan coba lagi.";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

function isRoleCode(value: string): value is RoleCode {
  return (ROLE_CODES as readonly string[]).includes(value);
}

/** Loads the active account linked to a Supabase Auth user, or null when there is none. */
async function loadSessionUser(supabase: SupabaseServerClient, userId: string, email: string): Promise<SessionUser | null> {
  const { data, error } = await supabase
    .from("user_accounts")
    .select("is_active, employee_id, role:roles(code, name, role_permissions(permission:permissions(code))), employee:employees(full_name)")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new ApiError(GENERIC_MESSAGE, null, error);
  }
  if (!data || !data.is_active || !data.role || !isRoleCode(data.role.code)) {
    return null;
  }

  return {
    id: userId,
    email,
    displayName: data.employee?.full_name ?? data.role.name,
    roleCode: data.role.code,
    roleName: data.role.name,
    employeeId: data.employee_id,
    permissions: data.role.role_permissions.flatMap((grant) => (grant.permission ? [grant.permission.code] : [])),
  };
}

/** Signs in with email + password. Throws ApiError with a user-facing message on failure. */
export async function signInWithEmail(input: LoginInput): Promise<SessionUser> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(input);

  if (error || !data.user) {
    if (error && isAuthApiError(error) && error.code === "invalid_credentials") {
      throw new ApiError(INVALID_CREDENTIALS_MESSAGE, error.status, error);
    }
    if (error && isAuthApiError(error) && error.code === "email_not_confirmed") {
      throw new ApiError("Email belum dikonfirmasi. Hubungi Bagian Kepegawaian.", error.status, error);
    }
    throw new ApiError(GENERIC_MESSAGE, error?.status ?? null, error);
  }

  const user = await loadSessionUser(supabase, data.user.id, data.user.email ?? input.email);
  if (!user) {
    await supabase.auth.signOut();
    throw new ApiError(ACCOUNT_UNAVAILABLE_MESSAGE, 403, null);
  }

  await supabase.rpc("log_audit_event", { event_action: "login", event_entity: "auth", event_entity_id: user.id });
  return user;
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("log_audit_event", { event_action: "logout", event_entity: "auth" });
  await supabase.auth.signOut();
}

/** The signed-in user with an active account, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims || typeof claims.sub !== "string") {
    return null;
  }
  return loadSessionUser(supabase, claims.sub, typeof claims.email === "string" ? claims.email : "");
}

/** Current user, redirecting to login when signed out and to the dashboard when the permission is missing. */
export async function requirePermission(permission: PermissionCode): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`${routes.login}?reason=session`);
  if (!user.permissions.includes(permission)) redirect(routes.dashboard);
  return user;
}

/** Changes the signed-in user's password after re-checking the current one. Throws ApiError on failure. */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError("Sesi Anda berakhir. Silakan masuk kembali.", 401, null);
  }

  const supabase = await createSupabaseServerClient();
  const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (verifyError) {
    if (isAuthApiError(verifyError) && verifyError.code === "invalid_credentials") {
      throw new ApiError("Password lama salah.", verifyError.status, verifyError);
    }
    throw new ApiError(CHANGE_PASSWORD_FAILED_MESSAGE, verifyError.status ?? null, verifyError);
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    if (isAuthApiError(error) && error.code === "same_password") {
      throw new ApiError("Password baru harus berbeda dari password lama.", error.status, error);
    }
    if (isAuthApiError(error) && error.code === "weak_password") {
      throw new ApiError("Password terlalu lemah. Gunakan kombinasi huruf dan angka.", error.status, error);
    }
    throw new ApiError(CHANGE_PASSWORD_FAILED_MESSAGE, error.status ?? null, error);
  }

  await supabase.rpc("log_audit_event", { event_action: "change_password", event_entity: "auth", event_entity_id: user.id });
}
