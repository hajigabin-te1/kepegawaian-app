"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AppraisalFormValues, PeriodFormValues } from "@/features/performance/schemas/performance-schemas";
import {
  generateAppraisals,
  getAppraisal,
  getMaxScore,
  listAppraisals,
  listMyAppraisals,
  listPeriods,
  listRecap,
  reviewAppraisal,
  savePeriod,
  saveAppraisal,
  submitAppraisal,
} from "@/features/performance/services/performance-service";
import type { AppraisalStatus } from "@/features/performance/types/performance";

export const performanceKeys = {
  all: ["performance"] as const,
  periods: () => [...performanceKeys.all, "periods"] as const,
  list: (periodId: string, status: AppraisalStatus | "all") => [...performanceKeys.all, "list", periodId, status] as const,
  detail: (id: string) => [...performanceKeys.all, "detail", id] as const,
  mine: (employeeId: string) => [...performanceKeys.all, "mine", employeeId] as const,
  recap: (periodId: string) => [...performanceKeys.all, "recap", periodId] as const,
  maxScore: () => [...performanceKeys.all, "max-score"] as const,
};

export function usePeriods() {
  return useQuery({ queryKey: performanceKeys.periods(), queryFn: listPeriods });
}

export function useAppraisalList(periodId: string, status: AppraisalStatus | "all") {
  return useQuery({ queryKey: performanceKeys.list(periodId, status), queryFn: () => listAppraisals(periodId, status), enabled: periodId !== "" });
}

export function useAppraisal(id: string) {
  return useQuery({ queryKey: performanceKeys.detail(id), queryFn: () => getAppraisal(id) });
}

export function useMyAppraisals(employeeId: string) {
  return useQuery({ queryKey: performanceKeys.mine(employeeId), queryFn: () => listMyAppraisals(employeeId) });
}

export function useAppraisalRecap(periodId: string) {
  return useQuery({ queryKey: performanceKeys.recap(periodId), queryFn: () => listRecap(periodId), enabled: periodId !== "" });
}

export function useMaxScore() {
  return useQuery({ queryKey: performanceKeys.maxScore(), queryFn: getMaxScore, staleTime: 10 * 60_000 });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: performanceKeys.all });
}

export function useSavePeriod() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, values }: { id: string | null; values: PeriodFormValues }) => savePeriod(id, values),
    onSuccess: invalidate,
  });
}

export function useGenerateAppraisals() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (periodId: string) => generateAppraisals(periodId), onSuccess: invalidate });
}

export function useSaveAppraisal(id: string) {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (values: AppraisalFormValues) => saveAppraisal(id, values), onSuccess: invalidate });
}

export function useSubmitAppraisal(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    // Saves the form first so the submitted score matches what is on screen.
    mutationFn: async (values: AppraisalFormValues) => {
      await saveAppraisal(id, values);
      await submitAppraisal(id);
    },
    onSuccess: invalidate,
  });
}

export function useReviewAppraisal() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, accept, note }: { id: string; accept: boolean; note: string }) => reviewAppraisal(id, accept, note),
    onSuccess: invalidate,
  });
}
