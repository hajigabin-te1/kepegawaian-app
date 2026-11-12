import { fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RbacData } from "@/features/roles/types/roles";

export async function getRbacData(): Promise<RbacData> {
  const supabase = createSupabaseBrowserClient();
  const [roles, permissions] = await Promise.all([
    supabase.from("roles").select("id, code, name, role_permissions(permission_id)").order("id"),
    supabase.from("permissions").select("id, code, description").order("id"),
  ]);
  if (roles.error) throw fromSupabaseError(roles.error);
  if (permissions.error) throw fromSupabaseError(permissions.error);
  return {
    roles: roles.data.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      permissionIds: row.role_permissions.map((grant) => grant.permission_id),
    })),
    permissions: permissions.data,
  };
}

/**
 * Applies the difference between the current and the desired permission set of a role.
 * Grants are added before revocations, so a failure never leaves the role with fewer rights than intended.
 */
export async function updateRolePermissions(roleId: number, current: number[], desired: number[]): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const added = desired.filter((id) => !current.includes(id));
  const removed = current.filter((id) => !desired.includes(id));

  if (added.length > 0) {
    const { error } = await supabase
      .from("role_permissions")
      .insert(added.map((permissionId) => ({ role_id: roleId, permission_id: permissionId })));
    if (error) throw fromSupabaseError(error, { "42501": "Anda tidak memiliki izin mengubah hak akses." });
  }
  if (removed.length > 0) {
    const { error } = await supabase.from("role_permissions").delete().eq("role_id", roleId).in("permission_id", removed);
    if (error) throw fromSupabaseError(error, { "42501": "Anda tidak memiliki izin mengubah hak akses." });
  }
}
