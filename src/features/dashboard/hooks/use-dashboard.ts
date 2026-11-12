"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getAttendanceStats,
  getEmployeeStatistics,
  getLeaveStats,
  getPendingCounts,
  getScopeInfo,
  listRecentEmployees,
} from "@/features/dashboard/services/dashboard-service";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  employeeStatistics: () => [...dashboardKeys.all, "employee-statistics"] as const,
  recentEmployees: () => [...dashboardKeys.all, "recent-employees"] as const,
  attendance: (month: string) => [...dashboardKeys.all, "attendance", month] as const,
  leave: (year: number) => [...dashboardKeys.all, "leave", year] as const,
  scope: (userId: string) => [...dashboardKeys.all, "scope", userId] as const,
  pending: () => [...dashboardKeys.all, "pending"] as const,
};

export function useEmployeeStatistics() {
  return useQuery({ queryKey: dashboardKeys.employeeStatistics(), queryFn: getEmployeeStatistics });
}

export function useRecentEmployees(enabled: boolean) {
  return useQuery({ queryKey: dashboardKeys.recentEmployees(), queryFn: listRecentEmployees, enabled });
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
