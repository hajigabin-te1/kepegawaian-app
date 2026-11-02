import { fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AccountUpdate, Role, UserAccount } from "@/features/accounts/types/accounts";

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
    employeeName: row.employee_name,
    lastSignInAt: row.last_sign_in_at,
  }));
}

export async function listRoles(): Promise<Role[]> {
  const { data, error } = await createSupabaseBrowserClient().from("roles").select("id, code, name").order("id");
  if (error) throw fromSupabaseError(error);
  return data;
}

export async function updateAccount(id: string, update: AccountUpdate): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from("user_accounts")
    .update({ role_id: update.roleId, is_active: update.isActive })
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw fromSupabaseError(error, { self_lockout: SELF_LOCKOUT_MESSAGE });
}
