"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getRbacData, updateRolePermissions } from "@/features/roles/services/role-service";

export const roleKeys = {
  all: ["roles"] as const,
  rbac: () => [...roleKeys.all, "rbac"] as const,
};

export function useRbacData() {
  return useQuery({ queryKey: roleKeys.rbac(), queryFn: getRbacData });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, current, desired }: { roleId: number; current: number[]; desired: number[] }) =>
      updateRolePermissions(roleId, current, desired),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.rbac() }),
  });
}
