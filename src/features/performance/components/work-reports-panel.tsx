"use client";

import { useState } from "react";
import { CalendarOffIcon, FileTextIcon, LockIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PeriodSelect } from "@/features/performance/components/appraisal-parts";
import { WorkReportDialog } from "@/features/performance/components/work-report-dialog";
import { WorkReportList } from "@/features/performance/components/work-report-list";
import { usePeriods } from "@/features/performance/hooks/use-performance";
import {
  useDeleteWorkReport,
  useReportedPeriodIds,
  useWorkReports,
  useWorkReportLock,
} from "@/features/performance/hooks/use-work-reports";
import { MIN_WORK_REPORTS, type AppraisalPeriod, type WorkReport } from "@/features/performance/types/performance";
import { ApiError } from "@/lib/api-error";

type Editing = { report: WorkReport | null } | null;

function ReportCounter({ count, locked }: { count: number; locked: boolean }) {
  const reached = count >= MIN_WORK_REPORTS;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Badge variant={reached ? "success" : "warning"} className="tabular-nums">
        {count} dari minimal {MIN_WORK_REPORTS} laporan
      </Badge>
      {locked ? (
        <Badge variant="secondary">
          <LockIcon />
          Terkunci
        </Badge>
      ) : null}
    </div>
  );
}

function PeriodReports({ period, employeeId }: { period: AppraisalPeriod; employeeId: string }) {
  const reports = useWorkReports(period.id, employeeId);
  const lock = useWorkReportLock(period.id, employeeId);
  const remove = useDeleteWorkReport();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<WorkReport | null>(null);

  // Treat "unknown" as locked so actions never show before the lock state is loaded.
  const isLocked = lock.data?.locked ?? true;

  const confirmDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting.id, {
      onSuccess: () => {
        toast.success("Laporan kerja dihapus.");
        setDeleting(null);
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Laporan kerja gagal dihapus."),
    });
  };

  if (reports.isPending) return <Skeleton className="m-6 h-32" />;
  if (reports.isError) return <QueryErrorState error={reports.error} onRetry={() => void reports.refetch()} />;

  return (
    <>
      <div className="flex flex-col gap-3 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <ReportCounter count={reports.data.length} locked={isLocked} />
        {isLocked ? (
          <p className="text-xs text-muted-foreground">
            {!period.isActive
              ? "Periode ini sudah ditutup."
              : lock.data?.override === true
                ? "Laporan dikunci oleh Bagian Kepegawaian."
                : "Penilaian Anda untuk periode ini sudah dikirim, laporan tidak bisa diubah."}
          </p>
        ) : (
          <Button size="sm" onClick={() => setEditing({ report: null })}>
            <PlusIcon />
            Tambah Laporan
          </Button>
        )}
      </div>

      {reports.data.length === 0 ? (
        <EmptyState
          icon={FileTextIcon}
          title="Belum ada laporan kerja"
          description={
            isLocked
              ? "Tidak ada laporan kerja pada periode ini."
              : `Laporkan pekerjaan Anda selama periode ini beserta bukti dokumennya, minimal ${MIN_WORK_REPORTS} laporan.`
          }
        />
      ) : (
        <WorkReportList
          reports={reports.data}
          renderActions={
            isLocked
              ? undefined
              : (report) => (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setEditing({ report })}>
                      <PencilIcon />
                      Ubah
                    </Button>
                    <Button variant="outline" size="icon-sm" onClick={() => setDeleting(report)} aria-label="Hapus laporan">
                      <Trash2Icon />
                    </Button>
                  </>
                )
          }
        />
      )}

      <WorkReportDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        periodId={period.id}
        periodName={period.name}
        employeeId={employeeId}
        report={editing?.report ?? null}
      />
      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Hapus laporan kerja?"
        description="Laporan dan bukti dokumennya akan dihapus permanen."
        onConfirm={confirmDelete}
        isPending={remove.isPending}
      />
    </>
  );
}

/** Employee's own work reports per appraisal period (input for the HR appraisal). */
export function WorkReportsPanel({ employeeId }: { employeeId: string }) {
  const periods = usePeriods();
  const reportedPeriods = useReportedPeriodIds(employeeId);
  const [chosenPeriod, setChosenPeriod] = useState("");

  const reported = new Set(reportedPeriods.data ?? []);
  // Active periods can take new reports; closed ones stay listed only when they hold reports.
  const options = (periods.data ?? []).filter((p) => p.isActive || reported.has(p.id));
  const period = options.find((p) => p.id === chosenPeriod) ?? options.find((p) => p.isActive) ?? options[0] ?? null;

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">Laporan Kerja</CardTitle>
          <CardDescription>Laporkan pekerjaan sesuai tupoksi beserta buktinya. Laporan menjadi bahan penilaian kinerja Anda.</CardDescription>
        </div>
        {options.length > 1 && period ? <PeriodSelect periods={options} value={period.id} onChange={setChosenPeriod} /> : null}
      </CardHeader>

      {periods.isPending || reportedPeriods.isPending ? (
        <Skeleton className="m-6 h-32" />
      ) : periods.isError ? (
        <QueryErrorState error={periods.error} onRetry={() => void periods.refetch()} />
      ) : reportedPeriods.isError ? (
        <QueryErrorState error={reportedPeriods.error} onRetry={() => void reportedPeriods.refetch()} />
      ) : period ? (
        <>
          {options.length === 1 ? <p className="border-b px-6 py-3 text-sm font-medium">{period.name}</p> : null}
          <PeriodReports key={period.id} period={period} employeeId={employeeId} />
        </>
      ) : (
        <EmptyState
          icon={CalendarOffIcon}
          title="Belum ada periode penilaian yang dibuka"
          description="Laporan kerja bisa diisi setelah Bagian Kepegawaian membuka periode penilaian."
        />
      )}
    </Card>
  );
}
