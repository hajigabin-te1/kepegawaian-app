import { FunctionsHttpError } from "@supabase/supabase-js";

import { ApiError, fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AccountUpdate, LinkableEmployee, NewAccount, Role, UserAccount } from "@/features/accounts/types/accounts";

const EMPLOYEE_TAKEN_MESSAGE = "Pegawai tersebut sudah terhubung dengan akun lain.";
const SELF_LOCKOUT_MESSAGE = "Anda tidak dapat menonaktifkan atau mengubah peran akun Anda sendiri.";

export async function listAccounts(): Promise<UserAccount[]> {
  const { data, error } = await createSupabaseBrowserClient().rpc("list_user_accounts");
  if (error) throw fromSupabaseError(error);
  return data.map((row) => ({
    id: row.id,
    email: row.email,
    roleId: row.role_id,
    roleCode: row.role_code,
    roleName: row.role_name,
    isActive: row.is_active,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    lastSignInAt: row.last_sign_in_at,
  }));
}

export async function listRoles(): Promise<Role[]> {
  const { data, error } = await createSupabaseBrowserClient().from("roles").select("id, code, name").order("id");
  if (error) throw fromSupabaseError(error);
  return data;
}

export async function listLinkableEmployees(accountId: string): Promise<LinkableEmployee[]> {
  const { data, error } = await createSupabaseBrowserClient().rpc("list_linkable_employees", { for_account_id: accountId });
  if (error) throw fromSupabaseError(error);
  return data.map((row) => ({ id: row.id, name: row.full_name, employeeNumber: row.employee_number }));
}

export async function updateAccount(id: string, update: AccountUpdate): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from("user_accounts")
    .update({ role_id: update.roleId, is_active: update.isActive, employee_id: update.employeeId })
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw fromSupabaseError(error, { self_lockout: SELF_LOCKOUT_MESSAGE, "23505": EMPLOYEE_TAKEN_MESSAGE });
}

/** Reads the Indonesian message returned by the admin-create-user Edge Function. */
async function readFunctionError(error: unknown, fallback: string): Promise<ApiError> {
  if (error instanceof FunctionsHttpError) {
    const response = error.context as Response;
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
        ? body.message
        : fallback;
    return new ApiError(message, response.status, body);
  }
  return new ApiError("Tidak dapat terhubung ke server. Periksa koneksi Anda.", null, error);
}

/** Creates a confirmed sign-in account through the admin-create-user Edge Function. */
export async function createAccount(account: NewAccount): Promise<void> {
  const { error } = await createSupabaseBrowserClient().functions.invoke("admin-create-user", {
    body: { email: account.email, password: account.temporaryPassword, roleCode: account.roleCode },
  });
  if (error) throw await readFunctionError(error, "Akun gagal dibuat. Silakan coba lagi.");
}

/** Deletes an account (auth user + account row) through the admin-delete-user Edge Function. */
export async function deleteAccount(id: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().functions.invoke("admin-delete-user", { body: { userId: id } });
  if (error) throw await readFunctionError(error, "Akun gagal dihapus. Silakan coba lagi.");
}
