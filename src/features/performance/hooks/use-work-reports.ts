"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { performanceKeys } from "@/features/performance/hooks/use-performance";
import {
  countWorkReports,
  deleteWorkReport,
  getWorkReportLock,
  listReportedPeriodIds,
  listWorkReports,
  saveWorkReport,
  setWorkReportsLock,
} from "@/features/performance/services/work-report-service";
import type { WorkReport, WorkReportInput } from "@/features/performance/types/performance";

export function useWorkReports(periodId: string, employeeId: string) {
  return useQuery({
    queryKey: performanceKeys.workReports(periodId, employeeId),
    queryFn: () => listWorkReports(periodId, employeeId),
    enabled: periodId !== "" && employeeId !== "",
  });
}

export function useReportedPeriodIds(employeeId: string) {
  return useQuery({ queryKey: performanceKeys.workReportPeriods(employeeId), queryFn: () => listReportedPeriodIds(employeeId) });
}

export function useWorkReportCounts(periodId: string) {
  return useQuery({ queryKey: performanceKeys.workReportCounts(periodId), queryFn: () => countWorkReports(periodId), enabled: periodId !== "" });
}

export function useWorkReportLock(periodId: string, employeeId: string) {
  return useQuery({
    queryKey: performanceKeys.workReportsLocked(periodId, employeeId),
    queryFn: () => getWorkReportLock(periodId, employeeId),
    enabled: periodId !== "" && employeeId !== "",
  });
}

function useInvalidateWorkReports() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      (["work-reports", "work-report-periods", "work-report-counts", "work-reports-locked"] as const).map((segment) =>
        queryClient.invalidateQueries({ queryKey: [...performanceKeys.all, segment] }),
      ),
    );
}

export function useSaveWorkReport() {
  const invalidate = useInvalidateWorkReports();
  return useMutation({
    mutationFn: ({ input, current }: { input: WorkReportInput; current: WorkReport | null }) => saveWorkReport(input, current),
    onSuccess: invalidate,
  });
}

export function useDeleteWorkReport() {
  const invalidate = useInvalidateWorkReports();
  return useMutation({ mutationFn: (id: string) => deleteWorkReport(id), onSuccess: invalidate });
}

export function useSetWorkReportsLock() {
  const invalidate = useInvalidateWorkReports();
  return useMutation({
    mutationFn: ({ periodId, employeeId, locked }: { periodId: string; employeeId: string; locked: boolean | null }) =>
      setWorkReportsLock(periodId, employeeId, locked),
    onSuccess: invalidate,
  });
}
