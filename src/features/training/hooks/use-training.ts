"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { TrainingFormValues } from "@/features/training/schemas/training-schemas";
import {
  applyTraining,
  decideRegistration,
  listMyRegistrations,
  listRegistrations,
  listTrainings,
  saveTraining,
  setOutcome,
} from "@/features/training/services/training-service";
import type { RegistrationStatus } from "@/features/training/types/training";

export const trainingKeys = {
  all: ["training"] as const,
  list: () => [...trainingKeys.all, "list"] as const,
  mine: (employeeId: string) => [...trainingKeys.all, "mine", employeeId] as const,
  registrations: (trainingId: string) => [...trainingKeys.all, "registrations", trainingId] as const,
};

export function useTrainings() {
  return useQuery({ queryKey: trainingKeys.list(), queryFn: listTrainings });
}

export function useMyRegistrations(employeeId: string) {
  return useQuery({ queryKey: trainingKeys.mine(employeeId), queryFn: () => listMyRegistrations(employeeId) });
}

export function useRegistrations(trainingId: string) {
  return useQuery({ queryKey: trainingKeys.registrations(trainingId), queryFn: () => listRegistrations(trainingId), enabled: trainingId !== "" });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: trainingKeys.all });
}

export function useSaveTraining() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, values }: { id: string | null; values: TrainingFormValues }) => saveTraining(id, values),
    onSuccess: invalidate,
  });
}

export function useApplyTraining(employeeId: string) {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (trainingId: string) => applyTraining(trainingId, employeeId), onSuccess: invalidate });
}

export function useDecideRegistration() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, approve, note }: { id: string; approve: boolean; note: string }) => decideRegistration(id, approve, note),
    onSuccess: invalidate,
  });
}

export function useSetOutcome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: RegistrationStatus; note: string }) => setOutcome(id, status, note),
    // Completing a training also writes the employee's training history.
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
