"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AttendanceLocationFormValues, WorkScheduleFormValues } from "@/features/settings/schemas/settings-schemas";
import {
  getTimeZoneSetting,
  listAttendanceLocations,
  listWorkSchedules,
  saveAttendanceLocation,
  updateWorkSchedule,
} from "@/features/settings/services/settings-service";

export const settingsKeys = {
  all: ["settings"] as const,
  timeZone: () => [...settingsKeys.all, "time-zone"] as const,
  locations: () => [...settingsKeys.all, "attendance-locations"] as const,
  schedules: () => [...settingsKeys.all, "work-schedules"] as const,
};

export function useTimeZoneSetting() {
  return useQuery({ queryKey: settingsKeys.timeZone(), queryFn: getTimeZoneSetting });
}

export function useAttendanceLocations() {
  return useQuery({ queryKey: settingsKeys.locations(), queryFn: listAttendanceLocations });
}

export function useSaveAttendanceLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string | null; values: AttendanceLocationFormValues }) => saveAttendanceLocation(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.locations() }),
  });
}

export function useWorkSchedules() {
  return useQuery({ queryKey: settingsKeys.schedules(), queryFn: listWorkSchedules });
}

export function useUpdateWorkSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: WorkScheduleFormValues }) => updateWorkSchedule(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.schedules() }),
  });
}
