"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { employeeKeys } from "@/features/employees/hooks/use-employees";
import { decideRequest, listRequests, submitRequest } from "@/features/profile-requests/services/profile-request-service";
import type { ChangeFieldKey, RequestStatus } from "@/features/profile-requests/types/profile-requests";

export const profileRequestKeys = {
  all: ["profile-requests"] as const,
  mine: (employeeId: string) => [...profileRequestKeys.all, "mine", employeeId] as const,
  list: (status: RequestStatus | "all") => [...profileRequestKeys.all, "list", status] as const,
};

export function useMyRequests(employeeId: string) {
  return useQuery({ queryKey: profileRequestKeys.mine(employeeId), queryFn: () => listRequests({ employeeId }) });
}

export function useRequests(status: RequestStatus | "all") {
  return useQuery({ queryKey: profileRequestKeys.list(status), queryFn: () => listRequests({ status }) });
}

export function useSubmitRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ changes, reason }: { changes: Partial<Record<ChangeFieldKey, string>>; reason: string }) => submitRequest(changes, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileRequestKeys.all }),
  });
}

export function useDecideRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve, note }: { id: string; approve: boolean; note: string }) => decideRequest(id, approve, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileRequestKeys.all });
      // Approval changes the employee record itself.
      return queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
}
