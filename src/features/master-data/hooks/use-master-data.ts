"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { PositionFormValues, WorkUnitFormValues } from "@/features/master-data/schemas/master-data-schemas";
import {
  createPosition,
  createWorkUnit,
  listPositions,
  listWorkUnits,
  updatePosition,
  updateWorkUnit,
} from "@/features/master-data/services/master-data-service";

export const masterDataKeys = {
  all: ["master-data"] as const,
  workUnits: () => [...masterDataKeys.all, "work-units"] as const,
  positions: () => [...masterDataKeys.all, "positions"] as const,
};

export function useWorkUnits() {
  return useQuery({ queryKey: masterDataKeys.workUnits(), queryFn: listWorkUnits });
}

export function useSaveWorkUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string | null; values: WorkUnitFormValues }) =>
      id ? updateWorkUnit(id, values) : createWorkUnit(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: masterDataKeys.workUnits() }),
  });
}

export function usePositions() {
  return useQuery({ queryKey: masterDataKeys.positions(), queryFn: listPositions });
}

export function useSavePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string | null; values: PositionFormValues }) =>
      id ? updatePosition(id, values) : createPosition(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: masterDataKeys.positions() }),
  });
}
