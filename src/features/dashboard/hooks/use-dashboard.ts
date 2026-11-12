"use client";

import { useQuery } from "@tanstack/react-query";

import { getEmployeeStatistics, listRecentEmployees } from "@/features/dashboard/services/dashboard-service";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  employeeStatistics: () => [...dashboardKeys.all, "employee-statistics"] as const,
  recentEmployees: () => [...dashboardKeys.all, "recent-employees"] as const,
};

export function useEmployeeStatistics() {
  return useQuery({ queryKey: dashboardKeys.employeeStatistics(), queryFn: getEmployeeStatistics });
}

export function useRecentEmployees(enabled: boolean) {
  return useQuery({ queryKey: dashboardKeys.recentEmployees(), queryFn: listRecentEmployees, enabled });
}
