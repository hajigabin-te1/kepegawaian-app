"use client";

import { useState } from "react";
import { CheckIcon, UserCheckIcon, UserMinusIcon, UsersIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { DecisionDialog, type DecisionSubmit } from "@/components/common/decision-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RegistrationStatusBadge } from "@/features/training/components/training-parts";
import { useDecideRegistration, useRegistrations, useSetOutcome } from "@/features/training/hooks/use-training";
import type { Registration, Training } from "@/features/training/types/training";
import { ApiError } from "@/lib/api-error";

type Action = { registration: Registration; kind: "approve" | "reject" | "complete" };

export function ParticipantsDialog({ training, onClose }: { training: Training | null; onClose: () => void }) {
  const registrations = useRegistrations(training?.id ?? "");
  const decide = useDecideRegistration();
  const outcome = useSetOutcome();
  const [action, setAction] = useState<Action | null>(null);

  const rows = registrations.data ?? [];
  const taken = rows.filter((r) => r.status === "selected" || r.status === "completed").length;

  const done = (message: string) => ({
    onSuccess: () => {
      toast.success(message);
      setAction(null);
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : "Tindakan gagal."),
  });

  const submit = ({ note }: DecisionSubmit) => {
    if (!action) return;
    const id = action.registration.id;
    if (action.kind === "complete") outcome.mutate({ id, status: "completed", note }, done("Hasil diklat dicatat dan masuk riwayat pegawai."));
    else decide.mutate({ id, approve: action.kind === "approve", note }, done(action.kind === "approve" ? "Pendaftaran disetujui." : "Pendaftaran ditolak."));
  };

  const select = (registration: Registration, status: "selected" | "not_selected") =>
    outcome.mutate({ id: registration.id, status, note: "" }, { onSuccess: () => toast.success(status === "selected" ? "Ditetapkan sebagai peserta." : "Ditandai tidak terpilih."), onError: (error) => toast.error(error instanceof ApiError ? error.message : "Tindakan gagal.") });

  return (
    <>
      <Dialog open={training !== null} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Peserta: {training?.name}</DialogTitle>
            <DialogDescription>
              Setujui pendaftaran, tetapkan peserta, lalu catat hasil. Peserta terpilih: {taken}
              {training?.quota ? ` dari kuota ${training.quota}` : " (kuota tidak dibatasi)"}.
            </DialogDescription>
          </DialogHeader>
          {registrations.isPending ? (
            <TableSkeleton rows={3} />
          ) : registrations.isError ? (
            <QueryErrorState error={registrations.error} onRetry={() => void registrations.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState icon={UsersIcon} title="Belum ada pendaftar" description="Pendaftaran pegawai akan tampil di sini." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>Pegawai</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Aksi</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell>
                      <p className="font-medium">{registration.employeeName}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">{registration.employeeNumber ?? "—"}</p>
                    </TableCell>
                    <TableCell>
                      <RegistrationStatusBadge status={registration.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        {registration.status === "pending" ? (
                          <>
                            <Button variant="outline" size="sm" onClick={() => setAction({ registration, kind: "reject" })}>
                              <XIcon />
                              Tolak
                            </Button>
                            <Button size="sm" onClick={() => setAction({ registration, kind: "approve" })}>
                              <CheckIcon />
                              Setujui
                            </Button>
                          </>
                        ) : null}
                        {registration.status === "approved" ? (
                          <>
                            <Button variant="outline" size="sm" onClick={() => select(registration, "not_selected")} disabled={outcome.isPending}>
                              <UserMinusIcon />
                              Tidak terpilih
                            </Button>
                            <Button size="sm" onClick={() => select(registration, "selected")} disabled={outcome.isPending}>
                              <UserCheckIcon />
                              Tetapkan peserta
                            </Button>
                          </>
                        ) : null}
                        {registration.status === "selected" ? (
                          <Button size="sm" onClick={() => setAction({ registration, kind: "complete" })}>
                            <CheckIcon />
                            Catat selesai
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      <DecisionDialog
        open={action !== null}
        approve={action?.kind !== "reject"}
        title={action?.kind === "complete" ? "Catat hasil diklat?" : action?.kind === "approve" ? "Setujui pendaftaran?" : "Tolak pendaftaran?"}
        description={
          action?.kind === "complete"
            ? `${action.registration.employeeName} dicatat selesai dan diklat masuk ke riwayat pelatihannya.`
            : `${action?.registration.employeeName ?? "Pegawai"} akan menerima notifikasi.`
        }
        confirmLabel={action?.kind === "complete" ? "Catat selesai" : action?.kind === "approve" ? "Setujui" : "Tolak"}
        pending={decide.isPending || outcome.isPending}
        onSubmit={submit}
        onClose={() => setAction(null)}
      />
    </>
  );
}
