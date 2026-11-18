"use client";

import { FileTextIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkReportList } from "@/features/performance/components/work-report-list";
import { useWorkReports } from "@/features/performance/hooks/use-work-reports";
import { MIN_WORK_REPORTS } from "@/features/performance/types/performance";

/** Read-only work reports of one employee in one period, shown to HR next to the appraisal form. */
export function EmployeeWorkReportsCard({ periodId, employeeId }: { periodId: string; employeeId: string }) {
  const reports = useWorkReports(periodId, employeeId);
  const count = reports.data?.length ?? 0;

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-col gap-2 border-b py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">Laporan Kerja Pegawai</CardTitle>
          <CardDescription>Bahan pertimbangan saat mengisi indikator dan nilai.</CardDescription>
        </div>
        {reports.data ? (
          <Badge variant={count >= MIN_WORK_REPORTS ? "success" : "warning"} className="tabular-nums">
            {count} dari minimal {MIN_WORK_REPORTS} laporan
          </Badge>
        ) : null}
      </CardHeader>
      {reports.isPending ? (
        <Skeleton className="m-6 h-24" />
      ) : reports.isError ? (
        <QueryErrorState error={reports.error} onRetry={() => void reports.refetch()} />
      ) : count === 0 ? (
        <EmptyState icon={FileTextIcon} title="Belum ada laporan kerja" description="Pegawai belum mengirim laporan kerja untuk periode ini." />
      ) : (
        <WorkReportList reports={reports.data} />
      )}
    </Card>
  );
}
