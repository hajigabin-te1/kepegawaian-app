"use client";

import { useState } from "react";
import { CalendarHeartIcon, Loader2Icon, PlusIcon, UserXIcon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { routes } from "@/config/routes";
import { todayInCampus } from "@/features/attendance/services/attendance-service";
import { LeaveStatusBadge, formatDays, formatRange } from "@/features/leave/components/leave-parts";
import { LeaveRequestDialog } from "@/features/leave/components/leave-request-dialog";
import { useCancelLeave, useLeaveBalance, useMyLeaveRequests } from "@/features/leave/hooks/use-leave";
import type { LeaveRequest } from "@/features/leave/types/leave";
import { ApiError } from "@/lib/api-error";

function Stat({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={emphasis ? "text-2xl font-semibold tabular-nums" : "text-lg font-medium tabular-nums"}>{value}</dd>
    </div>
  );
}

function MyLeave({ employeeId }: { employeeId: string }) {
  const year = Number(todayInCampus().slice(0, 4));
  const balance = useLeaveBalance(employeeId, year);
  const requests = useMyLeaveRequests(employeeId);
  const cancel = useCancelLeave();
  const [open, setOpen] = useState(false);
  const [cancelling, setCancelling] = useState<LeaveRequest | null>(null);

  const rows = requests.data ?? [];

  const confirmCancel = () => {
    if (!cancelling) return;
    cancel.mutate(cancelling.id, {
      onSuccess: () => {
        toast.success("Pengajuan dibatalkan.");
        setCancelling(null);
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Pengajuan gagal dibatalkan."),
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold">Kuota cuti {year}</CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}>
            <PlusIcon />
            Ajukan Cuti/Izin
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {balance.isPending ? (
            <Skeleton className="h-14 w-full" />
          ) : balance.isError ? (
            <QueryErrorState error={balance.error} onRetry={() => void balance.refetch()} />
          ) : (
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Kuota umum" value={formatDays(balance.data.quota)} />
              <Stat label="Terpakai" value={formatDays(balance.data.used)} />
              <Stat label="Menunggu persetujuan" value={formatDays(balance.data.pending)} />
              <Stat label="Sisa" value={formatDays(balance.data.remaining)} emphasis />
            </dl>
          )}
          <p className="text-xs text-muted-foreground">
            Hari Minggu dan tanggal merah tidak dihitung. Cuti melahirkan (maksimal 3 bulan) dan sakit berkepanjangan berada di luar kuota umum.
          </p>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-lg font-semibold">Riwayat pengajuan</CardTitle>
        </CardHeader>
        {requests.isPending ? (
          <TableSkeleton rows={3} />
        ) : requests.isError ? (
          <QueryErrorState error={requests.error} onRetry={() => void requests.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState icon={CalendarHeartIcon} title="Belum ada pengajuan" description="Pengajuan cuti dan izin Anda akan tampil di sini." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="pl-6">Jenis</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="hidden sm:table-cell">Lama</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 pr-6">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((request) => (
                <TableRow key={request.id} className="hover:bg-accent/15">
                  <TableCell className="pl-6">
                    <p className="font-medium">{request.typeName}</p>
                    <p className="text-xs text-muted-foreground">{request.reason}</p>
                    {request.decisionNote ? <p className="text-xs text-muted-foreground">Catatan Kepegawaian: {request.decisionNote}</p> : null}
                  </TableCell>
                  <TableCell className="tabular-nums">{formatRange(request.startDate, request.endDate)}</TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">{formatDays(request.totalDays)}</TableCell>
                  <TableCell>
                    <LeaveStatusBadge status={request.status} />
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    {request.status === "pending" ? (
                      <Button variant="outline" size="sm" onClick={() => setCancelling(request)}>
                        Batalkan
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <LeaveRequestDialog employeeId={employeeId} balance={balance.data} open={open} onOpenChange={setOpen} />

      <Dialog open={cancelling !== null} onOpenChange={(next) => !cancel.isPending && !next && setCancelling(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan pengajuan?</DialogTitle>
            <DialogDescription>
              {cancelling ? `${cancelling.typeName}, ${formatRange(cancelling.startDate, cancelling.endDate)}` : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelling(null)} disabled={cancel.isPending}>
              Kembali
            </Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={cancel.isPending}>
              {cancel.isPending ? <Loader2Icon className="animate-spin" /> : null}
              Batalkan pengajuan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function MyLeavePanel({ employeeId }: { employeeId: string | null }) {
  return (
    <>
      <PageHeader
        title="Cuti Saya"
        description="Ajukan cuti atau izin, lihat sisa kuota, dan pantau status persetujuan."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Cuti & Izin" }, { label: "Cuti Saya" }]}
      />
      {employeeId ? (
        <MyLeave employeeId={employeeId} />
      ) : (
        <Card>
          <EmptyState
            icon={UserXIcon}
            title="Akun belum terhubung ke data pegawai"
            description="Hubungi Bagian Kepegawaian agar akun Anda dikaitkan dengan data pegawai sebelum mengajukan cuti."
          />
        </Card>
      )}
    </>
  );
}
