"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { employeeQueryKeys } from "@/features/employees/hooks/employee-query-keys";
import type { PromotionFormValues } from "@/features/promotion/schemas/promotion-schemas";
import { decidePromotion, executePromotion, listPromotions, proposePromotion } from "@/features/promotion/services/promotion-service";
import type { ProposalStatus } from "@/features/promotion/types/promotion";

const key = ["promotions"] as const;

export function usePromotions(status: ProposalStatus | "all") {
  return useQuery({ queryKey: [...key, status], queryFn: () => listPromotions(status) });
}

export function useProposePromotion() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (values: PromotionFormValues) => proposePromotion(values), onSuccess: () => queryClient.invalidateQueries({ queryKey: key }) });
}

export function useDecidePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve, note, decree }: { id: string; approve: boolean; note: string; decree: string }) => decidePromotion(id, approve, note, decree),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useExecutePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => executePromotion(id),
    // Execution changes the employee's rank/position and history.
    onSuccess: () => Promise.all([queryClient.invalidateQueries({ queryKey: key }), queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all })]),
  });
}
