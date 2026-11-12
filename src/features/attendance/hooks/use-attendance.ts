"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CorrectionFormValues } from "@/features/attendance/schemas/attendance-schemas";
import {
  checkIn,
  checkOut,
  correctAttendance,
  getMyRecordForDate,
  listDailyRecords,
  listEmployeeOptions,
  listMonthlySummary,
  listMyRecords,
} from "@/features/attendance/services/attendance-service";
import type { Coordinates } from "@/features/attendance/types/attendance";

export const attendanceKeys = {
  all: ["attendance"] as const,
  today: (employeeId: string, date: string) => [...attendanceKeys.all, "today", employeeId, date] as const,
  mine: (employeeId: string, month: string) => [...attendanceKeys.all, "mine", employeeId, month] as const,
  daily: (date: string) => [...attendanceKeys.all, "daily", date] as const,
  monthly: (month: string) => [...attendanceKeys.all, "monthly", month] as const,
  employees: () => [...attendanceKeys.all, "employees"] as const,
};

export function useTodayRecord(employeeId: string, date: string) {
  return useQuery({ queryKey: attendanceKeys.today(employeeId, date), queryFn: () => getMyRecordForDate(employeeId, date) });
}

export function useMyRecords(employeeId: string, month: string) {
  return useQuery({ queryKey: attendanceKeys.mine(employeeId, month), queryFn: () => listMyRecords(employeeId, month) });
}

export function useCheckInOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, coords }: { kind: "in" | "out"; coords: Coordinates }) =>
      kind === "in" ? checkIn(coords) : checkOut(coords),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
  });
}

export function useDailyRecords(date: string) {
  return useQuery({ queryKey: attendanceKeys.daily(date), queryFn: () => listDailyRecords(date) });
}

export function useMonthlySummary(month: string) {
  return useQuery({ queryKey: attendanceKeys.monthly(month), queryFn: () => listMonthlySummary(month) });
}

export function useEmployeeOptions() {
  return useQuery({ queryKey: attendanceKeys.employees(), queryFn: listEmployeeOptions, staleTime: 5 * 60_000 });
}

export function useCorrectAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CorrectionFormValues) => correctAttendance(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
  });
}
