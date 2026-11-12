"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckIcon, InboxIcon, Loader2Icon, XIcon } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { routes } from "@/config/routes";
import { RequestDiff, RequestStatusBadge } from "@/features/profile-requests/components/request-parts";
import { useDecideRequest, useRequests } from "@/features/profile-requests/hooks/use-profile-requests";
import { decisionSchema, type DecisionFormValues } from "@/features/profile-requests/schemas/profile-request-schemas";
import type { ChangeRequest, RequestStatus } from "@/features/profile-requests/types/profile-requests";
import { ApiError } from "@/lib/api-error";

const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" });

const FILTERS: { value: RequestStatus | "all"; label: string }[] = [
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
  { value: "all", label: "Semua" },
];

type Decision = { request: ChangeRequest; approve: boolean };

function DecisionDialog({ decision, onClose }: { decision: Decision | null; onClose: () => void }) {
  const decide = useDecideRequest();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<DecisionFormValues>({ resolver: zodResolver(decisionSchema), defaultValues: { note: "" } });

  const close = () => {
    reset({ note: "" });
    onClose();
  };

  const onSubmit = ({ note }: DecisionFormValues) => {
    if (!decision) return;
    if (!decision.approve && note === "") {
      setError("note", { message: "Alasan penolakan wajib diisi." });
      return;
    }
    decide.mutate(
      { id: decision.request.id, approve: decision.approve, note },
      {
        onSuccess: () => {
          toast.success(decision.approve ? "Perbaikan disetujui dan data pegawai diperbarui." : "Pengajuan ditolak.");
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
          <DialogTitle>{approve ? "Setujui perbaikan data?" : "Tolak pengajuan?"}</DialogTitle>
          <DialogDescription>
            {approve
              ? `Data ${decision?.request.employeeName ?? "pegawai"} akan langsung diperbarui sesuai pengajuan.`
              : "Pegawai akan menerima notifikasi beserta alasan penolakan."}
          </DialogDescription>
        </DialogHeader>
        <form id="decision-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-2">
          <Label htmlFor="decision-note">{approve ? "Catatan (opsional)" : "Alasan penolakan"}</Label>
          <Input id="decision-note" aria-invalid={errors.note ? true : undefined} {...register("note")} />
          {errors.note ? <p className="text-sm text-destructive">{errors.note.message}</p> : null}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={decide.isPending}>
            Batal
          </Button>
          <Button type="submit" form="decision-form" variant={approve ? "default" : "destructive"} disabled={decide.isPending}>
            {decide.isPending ? <Loader2Icon className="animate-spin" /> : null}
            {approve ? "Setujui" : "Tolak"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ChangeRequestsPanel() {
  const [status, setStatus] = useState<RequestStatus | "all">("pending");
  const requests = useRequests(status);
  const [decision, setDecision] = useState<Decision | null>(null);

  return (
    <>
      <PageHeader
        title="Perbaikan Data Pegawai"
        description="Tinjau pengajuan perbaikan data pribadi dari pegawai. Persetujuan langsung memperbarui data pegawai."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Kepegawaian" }, { label: "Perbaikan Data" }]}
      />

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
          <EmptyState icon={InboxIcon} title="Tidak ada pengajuan" description="Belum ada pengajuan perbaikan data pada filter ini." />
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.data.map((request) => (
            <Card key={request.id} className="gap-0 py-0">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b px-6 py-4">
                <div>
                  <Link href={routes.employees.detail(request.employeeId)} className="font-medium hover:underline">
                    {request.employeeName}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {dateFormatter.format(new Date(request.createdAt))} · {request.reason}
                  </p>
                </div>
                <RequestStatusBadge status={request.status} />
              </div>
              <RequestDiff request={request} />
              {request.reviewNote ? <p className="border-t px-6 py-3 text-sm text-muted-foreground">Catatan: {request.reviewNote}</p> : null}
              {request.status === "pending" ? (
                <div className="flex justify-end gap-2 border-t px-6 py-3">
                  <Button variant="outline" size="sm" onClick={() => setDecision({ request, approve: false })}>
                    <XIcon />
                    Tolak
                  </Button>
                  <Button size="sm" onClick={() => setDecision({ request, approve: true })}>
                    <CheckIcon />
                    Setujui
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <DecisionDialog decision={decision} onClose={() => setDecision(null)} />
    </>
  );
}
