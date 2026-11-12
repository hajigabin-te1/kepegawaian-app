"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  EducationHistoryFormValues,
  PositionHistoryFormValues,
} from "@/features/employee-history/schemas/history-schemas";
import {
  deleteEducationHistory,
  deletePositionHistory,
  listEducationHistories,
  listPositionHistories,
  saveEducationHistory,
  savePositionHistory,
} from "@/features/employee-history/services/history-service";
import type { EducationHistory, HistoryFilters, PositionHistory } from "@/features/employee-history/types/history";

export const historyKeys = {
  all: ["employee-history"] as const,
  positions: () => [...historyKeys.all, "positions"] as const,
  positionList: (filters: HistoryFilters) => [...historyKeys.positions(), filters] as const,
  education: () => [...historyKeys.all, "education"] as const,
  educationList: (filters: HistoryFilters) => [...historyKeys.education(), filters] as const,
};

export function usePositionHistories(filters: HistoryFilters) {
  return useQuery({
    queryKey: historyKeys.positionList(filters),
    queryFn: () => listPositionHistories(filters),
    placeholderData: keepPreviousData,
  });
}

export function useSavePositionHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ existing, values, file }: { existing: PositionHistory | null; values: PositionHistoryFormValues; file: File | null }) =>
      savePositionHistory(existing, values, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: historyKeys.positions() }),
  });
}

export function useDeletePositionHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePositionHistory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: historyKeys.positions() }),
  });
}

export function useEducationHistories(filters: HistoryFilters) {
  return useQuery({
    queryKey: historyKeys.educationList(filters),
    queryFn: () => listEducationHistories(filters),
    placeholderData: keepPreviousData,
  });
}

export function useSaveEducationHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ existing, values, file }: { existing: EducationHistory | null; values: EducationHistoryFormValues; file: File | null }) =>
      saveEducationHistory(existing, values, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: historyKeys.education() }),
  });
}

export function useDeleteEducationHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEducationHistory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: historyKeys.education() }),
  });
}
