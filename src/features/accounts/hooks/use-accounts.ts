"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createAccount, deleteAccount, listAccounts, listLinkableEmployees, listRoles, updateAccount } from "@/features/accounts/services/account-service";
import type { AccountUpdate, NewAccount } from "@/features/accounts/types/accounts";

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

export function useLinkableEmployees(accountId: string) {
  return useQuery({ queryKey: [...accountKeys.all, "linkable-employees", accountId], queryFn: () => listLinkableEmployees(accountId) });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: AccountUpdate }) => updateAccount(id, update),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.list() }),
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (account: NewAccount) => createAccount(account),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.list() }),
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.list() }),
  });
}
