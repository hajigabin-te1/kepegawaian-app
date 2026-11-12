"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { employeeQueryKeys } from "@/features/employees/hooks/employee-query-keys";
import type { MutationFormValues } from "@/features/mutation/schemas/mutation-schemas";
import { decideMutation, executeMutation, listMutations, proposeMutation } from "@/features/mutation/services/mutation-service";
import type { ProposalStatus } from "@/features/mutation/types/mutation";

const key = ["mutations"] as const;

export function useMutations(status: ProposalStatus | "all") {
  return useQuery({ queryKey: [...key, status], queryFn: () => listMutations(status) });
}

export function useProposeMutation() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (values: MutationFormValues) => proposeMutation(values), onSuccess: () => queryClient.invalidateQueries({ queryKey: key }) });
}

export function useDecideMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve, note, decree }: { id: string; approve: boolean; note: string; decree: string }) => decideMutation(id, approve, note, decree),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useExecuteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => executeMutation(id),
    // Execution changes the employee's unit/position and history.
    onSuccess: () => Promise.all([queryClient.invalidateQueries({ queryKey: key }), queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all })]),
  });
}
