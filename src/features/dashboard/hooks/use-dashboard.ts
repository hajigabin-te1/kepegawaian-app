"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getAttendanceStats,
  getEmployeeStats,
  getLeaveStats,
  getPendingCounts,
  getScopeInfo,
} from "@/features/dashboard/services/dashboard-service";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  employees: () => [...dashboardKeys.all, "employees"] as const,
  attendance: (month: string) => [...dashboardKeys.all, "attendance", month] as const,
  leave: (year: number) => [...dashboardKeys.all, "leave", year] as const,
  scope: (userId: string) => [...dashboardKeys.all, "scope", userId] as const,
  pending: () => [...dashboardKeys.all, "pending"] as const,
};

export function useEmployeeStats() {
  return useQuery({ queryKey: dashboardKeys.employees(), queryFn: getEmployeeStats });
}

export function useAttendanceStats(month: string) {
  return useQuery({ queryKey: dashboardKeys.attendance(month), queryFn: () => getAttendanceStats(month) });
}

export function useLeaveStats(year: number) {
  return useQuery({ queryKey: dashboardKeys.leave(year), queryFn: () => getLeaveStats(year) });
}

export function useScopeInfo(userId: string, enabled: boolean) {
  return useQuery({ queryKey: dashboardKeys.scope(userId), queryFn: () => getScopeInfo(userId), enabled });
}

export function usePendingCounts(permissions: readonly string[]) {
  return useQuery({ queryKey: [...dashboardKeys.pending(), permissions.join(",")], queryFn: () => getPendingCounts(permissions) });
}
