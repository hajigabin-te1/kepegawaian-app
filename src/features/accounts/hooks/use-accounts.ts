"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listAccounts, listRoles, updateAccount } from "@/features/accounts/services/account-service";
import type { AccountUpdate } from "@/features/accounts/types/accounts";

export const accountKeys = {
  all: ["accounts"] as const,
  list: () => [...accountKeys.all, "list"] as const,
  roles: () => [...accountKeys.all, "roles"] as const,
};

export function useAccounts() {
  return useQuery({ queryKey: accountKeys.list(), queryFn: listAccounts });
}

export function useRoles() {
  return useQuery({ queryKey: accountKeys.roles(), queryFn: listRoles, staleTime: 5 * 60_000 });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: AccountUpdate }) => updateAccount(id, update),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.list() }),
  });
}
