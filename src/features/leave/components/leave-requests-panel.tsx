"use client";

import { useState } from "react";
import { CalendarDaysIcon, CheckIcon, InboxIcon, Loader2Icon, XIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { routes } from "@/config/routes";
import { todayInCampus } from "@/features/attendance/services/attendance-service";
import { AttachmentButton, LeaveStatusBadge, formatDays, formatRange } from "@/features/leave/components/leave-parts";
import { useDecideLeave, useLeaveRecap, useLeaveRequests } from "@/features/leave/hooks/use-leave";
import { leaveDecisionSchema, type LeaveDecisionFormValues } from "@/features/leave/schemas/leave-schemas";
import type { LeaveRequest } from "@/features/leave/types/leave";
import type { RequestStatus } from "@/features/profile-requests/types/profile-requests";
import { ApiError } from "@/lib/api-error";

const FILTERS: { value: RequestStatus | "all"; label: string }[] = [
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
  { value: "all", label: "Semua" },
];

type Decision = { request: LeaveRequest; approve: boolean };

function DecisionDialog({ decision, onClose }: { decision: Decision | null; onClose: () => void }) {
  const decide = useDecideLeave();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<LeaveDecisionFormValues>({ resolver: zodResolver(leaveDecisionSchema), defaultValues: { note: "" } });

  const close = () => {
    reset({ note: "" });
    onClose();
  };

  const onSubmit = ({ note }: LeaveDecisionFormValues) => {
    if (!decision) return;
    if (!decision.approve && note === "") {
      setError("note", { message: "Alasan penolakan wajib diisi." });
      return;
    }
    decide.mutate(
      { id: decision.request.id, approve: decision.approve, note },
      {
        onSuccess: () => {
          toast.success(decision.approve ? "Pengajuan disetujui." : "Pengajuan ditolak.");
          close();
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Keputusan gagal disimpan."),
      },
    );
  };

  const approve = decision?.approve ?? true;
  return (
    <Dialog open={decision !== null} onOpenChange={(open) => !open && !decide.isPending && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{approve ? "Setujui pengajuan?" : "Tolak pengajuan?"}</DialogTitle>
          <DialogDescription>
            {decision ? `${decision.request.employeeName} · ${decision.request.typeName} · ${formatRange(decision.request.startDate, decision.request.endDate)}` : null}
          </DialogDescription>
        </DialogHeader>
        <form id="leave-decision-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-2">
          <Label htmlFor="leave-decision-note">{approve ? "Catatan (opsional)" : "Alasan penolakan"}</Label>
          <Input id="leave-decision-note" aria-invalid={errors.note ? true : undefined} {...register("note")} />
          {errors.note ? <p className="text-sm text-destructive">{errors.note.message}</p> : null}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={decide.isPending}>
            Batal
          </Button>
          <Button type="submit" form="leave-decision-form" variant={approve ? "default" : "destructive"} disabled={decide.isPending}>
            {decide.isPending ? <Loader2Icon className="animate-spin" /> : null}
            {approve ? "Setujui" : "Tolak"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestsTab({ canManage }: { canManage: boolean }) {
  const [status, setStatus] = useState<RequestStatus | "all">("pending");
  const requests = useLeaveRequests(status);
  const [decision, setDecision] = useState<Decision | null>(null);

  return (
    <div className="space-y-4">
      <Tabs value={status} onValueChange={(value) => setStatus(value as RequestStatus | "all")}>
        <TabsList>
          {FILTERS.map((filter) => (
            <TabsTrigger key={filter.value} value={filter.value}>
              {filter.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {requests.isPending ? (
        <Card className="gap-0 py-0">
          <TableSkeleton />
        </Card>
      ) : requests.isError ? (
        <Card>
          <QueryErrorState error={requests.error} onRetry={() => void requests.refetch()} />
        </Card>
      ) : requests.data.length === 0 ? (
        <Card>
          <EmptyState icon={InboxIcon} title="Tidak ada pengajuan" description="Belum ada pengajuan cuti/izin pada filter ini." />
        </Card>
      ) : (
        <Card className="gap-0 py-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="pl-6">Pegawai</TableHead>
                <TableHead>Jenis dan tanggal</TableHead>
                <TableHead className="hidden sm:table-cell">Lama</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.data.map((request) => (
                <TableRow key={request.id} className="hover:bg-accent/15">
                  <TableCell className="pl-6 font-medium">{request.employeeName}</TableCell>
                  <TableCell>
                    <p className="font-medium">{request.typeName}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{formatRange(request.startDate, request.endDate)}</p>
                    <p className="text-xs text-muted-foreground">{request.reason}</p>
                    {request.decisionNote ? <p className="text-xs text-muted-foreground">Catatan: {request.decisionNote}</p> : null}
                  </TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">{formatDays(request.totalDays)}</TableCell>
                  <TableCell>
                    <LeaveStatusBadge status={request.status} />
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex justify-end gap-2">
                      {request.documentPath ? <AttachmentButton path={request.documentPath} /> : null}
                      {canManage && request.status === "pending" ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setDecision({ request, approve: false })}>
                            <XIcon />
                            Tolak
                          </Button>
                          <Button size="sm" onClick={() => setDecision({ request, approve: true })}>
                            <CheckIcon />
                            Setujui
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <DecisionDialog decision={decision} onClose={() => setDecision(null)} />
    </div>
  );
}

function RecapTab() {
  const [year, setYear] = useState(Number(todayInCampus().slice(0, 4)));
  const recap = useLeaveRecap(year);

  return (
    <div className="space-y-4">
      <Input
        type="number"
        value={year}
        min={2000}
        max={2100}
        onChange={(event) => Number(event.target.value) >= 2000 && setYear(Number(event.target.value))}
        aria-label="Tahun"
        className="w-28"
      />
      <Card className="gap-0 py-0">
        {recap.isPending ? (
          <TableSkeleton />
        ) : recap.isError ? (
          <QueryErrorState error={recap.error} onRetry={() => void recap.refetch()} />
        ) : recap.data.length === 0 ? (
          <EmptyState icon={CalendarDaysIcon} title="Belum ada rekap" description={`Belum ada cuti/izin yang disetujui atau menunggu pada ${year}.`} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="pl-6">Pegawai</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead className="text-right">Disetujui</TableHead>
                <TableHead className="text-right">Hari</TableHead>
                <TableHead className="pr-6 text-right">Menunggu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recap.data.map((row) => (
                <TableRow key={`${row.employeeId}-${row.typeName}`} className="hover:bg-accent/15">
                  <TableCell className="pl-6 font-medium">{row.employeeName}</TableCell>
                  <TableCell>{row.typeName}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.approvedRequests}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatDays(row.approvedDays)}</TableCell>
                  <TableCell className="pr-6 text-right tabular-nums">{row.pendingRequests}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

export function LeaveRequestsPanel({ canManage }: { canManage: boolean }) {
  return (
    <>
      <PageHeader
        title="Pengajuan Cuti dan Izin"
        description="Tinjau pengajuan pegawai dan lihat rekap cuti per tahun."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Cuti & Izin" }, { label: "Pengajuan Cuti" }]}
      />
      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Pengajuan</TabsTrigger>
          <TabsTrigger value="recap">Rekap tahunan</TabsTrigger>
        </TabsList>
        <TabsContent value="requests" className="pt-3">
          <RequestsTab canManage={canManage} />
        </TabsContent>
        <TabsContent value="recap" className="pt-3">
          <RecapTab />
        </TabsContent>
      </Tabs>
    </>
  );
}
