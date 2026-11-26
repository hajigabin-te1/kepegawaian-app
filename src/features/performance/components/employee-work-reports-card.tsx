"use client";

import { useState } from "react";
import { FileTextIcon, Loader2Icon, LockIcon, LockOpenIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkReportList } from "@/features/performance/components/work-report-list";
import {
  useDeleteWorkReport,
  useSetWorkReportsLock,
  useWorkReportLock,
  useWorkReports,
} from "@/features/performance/hooks/use-work-reports";
import { MIN_WORK_REPORTS, type WorkReport, type WorkReportLock } from "@/features/performance/types/performance";
import { ApiError } from "@/lib/api-error";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function LockBadge({ lock }: { lock: WorkReportLock }) {
  const source = lock.override === null ? "otomatis" : "manual";
  return lock.locked ? (
    <Badge variant="secondary">
      <LockIcon />
      Terkunci ({source})
    </Badge>
  ) : (
    <Badge variant="outline">
      <LockOpenIcon />
      Terbuka ({source})
    </Badge>
  );
}

/** HR lock controls: lock/unlock overrides the automatic rule; "Ikuti otomatis" clears the override. */
function LockControls({ periodId, employeeId, lock }: { periodId: string; employeeId: string; lock: WorkReportLock }) {
  const setLock = useSetWorkReportsLock();
  const [pendingValue, setPendingValue] = useState<boolean | null | undefined>();

  const apply = (locked: boolean | null, success: string) => {
    setPendingValue(locked);
    setLock.mutate(
      { periodId, employeeId, locked },
      {
        onSuccess: () => toast.success(success),
        onError: (error) => toast.error(errorMessage(error, "Status kunci laporan gagal diubah.")),
        onSettled: () => setPendingValue(undefined),
      },
    );
  };
  const spinner = (value: boolean | null) => (setLock.isPending && pendingValue === value ? <Loader2Icon className="animate-spin" /> : null);

  return (
    <div className="flex flex-wrap gap-2">
      {lock.override !== null ? (
        <Button variant="ghost" size="sm" disabled={setLock.isPending} onClick={() => apply(null, "Kunci laporan kembali mengikuti status form.")}>
          {spinner(null) ?? <RotateCcwIcon />}
          Ikuti otomatis
        </Button>
      ) : null}
      {lock.locked ? (
        <Button variant="outline" size="sm" disabled={setLock.isPending} onClick={() => apply(false, "Laporan kerja dibuka, pegawai bisa mengubahnya.")}>
          {spinner(false) ?? <LockOpenIcon />}
          Buka kunci
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled={setLock.isPending} onClick={() => apply(true, "Laporan kerja dikunci.")}>
          {spinner(true) ?? <LockIcon />}
          Kunci
        </Button>
      )}
    </div>
  );
}

/** Work reports of one employee in one period, shown to HR next to the appraisal form. HR can delete and lock/unlock. */
export function EmployeeWorkReportsCard({ periodId, employeeId }: { periodId: string; employeeId: string }) {
  const reports = useWorkReports(periodId, employeeId);
  const lock = useWorkReportLock(periodId, employeeId);
  const remove = useDeleteWorkReport();
  const [deleting, setDeleting] = useState<WorkReport | null>(null);
  const count = reports.data?.length ?? 0;

  const confirmDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting.id, {
      onSuccess: () => {
        toast.success("Laporan kerja dihapus.");
        setDeleting(null);
      },
      onError: (error) => toast.error(errorMessage(error, "Laporan kerja gagal dihapus.")),
    });
  };

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">Laporan Kerja Pegawai</CardTitle>
          <CardDescription>Bahan pertimbangan saat mengisi indikator dan nilai.</CardDescription>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {reports.data ? (
              <Badge variant={count >= MIN_WORK_REPORTS ? "success" : "warning"} className="tabular-nums">
                {count} dari minimal {MIN_WORK_REPORTS} laporan
              </Badge>
            ) : null}
            {lock.data ? <LockBadge lock={lock.data} /> : null}
          </div>
        </div>
        {lock.data ? <LockControls periodId={periodId} employeeId={employeeId} lock={lock.data} /> : null}
      </CardHeader>
      {reports.isPending ? (
        <Skeleton className="m-6 h-24" />
      ) : reports.isError ? (
        <QueryErrorState error={reports.error} onRetry={() => void reports.refetch()} />
      ) : count === 0 ? (
        <EmptyState icon={FileTextIcon} title="Belum ada laporan kerja" description="Pegawai belum mengirim laporan kerja untuk periode ini." />
      ) : (
        <WorkReportList
          reports={reports.data}
          renderActions={(report) => (
            <Button
              variant="outline"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleting(report)}
              aria-label="Hapus laporan"
            >
              <Trash2Icon />
            </Button>
          )}
        />
      )}

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Hapus laporan kerja pegawai?"
        description="Laporan dan bukti dokumennya akan dihapus permanen. Pegawai tidak bisa memulihkannya."
        onConfirm={confirmDelete}
        isPending={remove.isPending}
      />
    </Card>
  );
}
