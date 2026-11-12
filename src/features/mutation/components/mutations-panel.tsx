"use client";

import { useState } from "react";
import { ArrowRightIcon, ArrowRightLeftIcon, CheckIcon, Loader2Icon, PlayIcon, PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { DecisionDialog, type DecisionSubmit } from "@/components/common/decision-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { PROPOSAL_STATUS_LABELS, ProposalStatusBadge } from "@/components/common/proposal-status-badge";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { routes } from "@/config/routes";
import { MutationFormDialog } from "@/features/mutation/components/mutation-form-dialog";
import { useDecideMutation, useExecuteMutation, useMutations } from "@/features/mutation/hooks/use-mutations";
import type { Mutation, ProposalStatus } from "@/features/mutation/types/mutation";
import { ApiError } from "@/lib/api-error";

const dateFormatter = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
const FILTERS: (ProposalStatus | "all")[] = ["proposed", "approved", "executed", "rejected", "all"];

function Change({ from, to }: { from: string | null; to: string | null }) {
  if (!to) return <span className="text-muted-foreground">Tidak berubah</span>;
  return (
    <span className="flex flex-wrap items-center gap-1">
      <span className="text-muted-foreground">{from ?? "—"}</span>
      <ArrowRightIcon className="size-3.5 text-muted-foreground" />
      <span className="font-medium">{to}</span>
    </span>
  );
}

export function MutationsPanel() {
  const [status, setStatus] = useState<ProposalStatus | "all">("proposed");
  const mutations = useMutations(status);
  const decide = useDecideMutation();
  const execute = useExecuteMutation();
  const [formOpen, setFormOpen] = useState(false);
  const [decision, setDecision] = useState<{ mutation: Mutation; approve: boolean } | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);

  const submit = ({ note, decree }: DecisionSubmit) => {
    if (!decision) return;
    decide.mutate(
      { id: decision.mutation.id, approve: decision.approve, note, decree },
      {
        onSuccess: () => {
          toast.success(decision.approve ? "Usulan disetujui." : "Usulan ditolak.");
          setDecision(null);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Keputusan gagal disimpan."),
      },
    );
  };

  const run = (mutation: Mutation) => {
    setExecuting(mutation.id);
    execute.mutate(mutation.id, {
      onSuccess: () => toast.success("Mutasi dijalankan. Unit/jabatan dan riwayat pegawai diperbarui."),
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Mutasi gagal dijalankan."),
      onSettled: () => setExecuting(null),
    });
  };

  return (
    <>
      <PageHeader
        title="Mutasi Pegawai"
        description="Usulkan, setujui, lalu jalankan mutasi. Menjalankan mutasi memperbarui unit kerja, jabatan, dan riwayat jabatan pegawai."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Pengembangan Pegawai" }, { label: "Mutasi" }]}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <PlusIcon />
            Usulkan Mutasi
          </Button>
        }
      />

      <Tabs value={status} onValueChange={(value) => setStatus(value as ProposalStatus | "all")}>
        <TabsList>
          {FILTERS.map((value) => (
            <TabsTrigger key={value} value={value}>
              {value === "all" ? "Semua" : PROPOSAL_STATUS_LABELS[value]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="gap-0 py-0">
        {mutations.isPending ? (
          <TableSkeleton />
        ) : mutations.isError ? (
          <QueryErrorState error={mutations.error} onRetry={() => void mutations.refetch()} />
        ) : mutations.data.length === 0 ? (
          <EmptyState icon={ArrowRightLeftIcon} title="Tidak ada usulan mutasi" description="Usulan mutasi pada filter ini akan tampil di sini." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="pl-6">Pegawai</TableHead>
                <TableHead>Perubahan</TableHead>
                <TableHead className="hidden sm:table-cell">Berlaku</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mutations.data.map((mutation) => (
                <TableRow key={mutation.id} className="hover:bg-accent/15">
                  <TableCell className="pl-6">
                    <p className="font-medium">{mutation.employeeName}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{mutation.employeeNumber ?? "—"}</p>
                  </TableCell>
                  <TableCell className="space-y-1 text-sm">
                    <div>
                      <span className="mr-1 text-xs text-muted-foreground">Unit:</span>
                      <Change from={mutation.fromUnit} to={mutation.toUnit} />
                    </div>
                    <div>
                      <span className="mr-1 text-xs text-muted-foreground">Jabatan:</span>
                      <Change from={mutation.fromPosition} to={mutation.toPosition} />
                    </div>
                    {mutation.reason ? <p className="text-xs text-muted-foreground">{mutation.reason}</p> : null}
                    {mutation.decisionNote ? <p className="text-xs text-muted-foreground">Catatan: {mutation.decisionNote}</p> : null}
                    {mutation.decreeNumber ? <p className="text-xs text-muted-foreground">SK: {mutation.decreeNumber}</p> : null}
                  </TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">{dateFormatter.format(new Date(`${mutation.effectiveDate}T00:00:00Z`))}</TableCell>
                  <TableCell>
                    <ProposalStatusBadge status={mutation.status} />
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex justify-end gap-2">
                      {mutation.status === "proposed" ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setDecision({ mutation, approve: false })}>
                            <XIcon />
                            Tolak
                          </Button>
                          <Button size="sm" onClick={() => setDecision({ mutation, approve: true })}>
                            <CheckIcon />
                            Setujui
                          </Button>
                        </>
                      ) : null}
                      {mutation.status === "approved" ? (
                        <Button size="sm" onClick={() => run(mutation)} disabled={executing === mutation.id}>
                          {executing === mutation.id ? <Loader2Icon className="animate-spin" /> : <PlayIcon />}
                          Jalankan
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <MutationFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <DecisionDialog
        open={decision !== null}
        approve={decision?.approve ?? true}
        title={decision?.approve ? "Setujui usulan mutasi?" : "Tolak usulan mutasi?"}
        description={`${decision?.mutation.employeeName ?? "Pegawai"}. ${decision?.approve ? "Setelah disetujui, mutasi masih perlu dijalankan." : "Pegawai menerima notifikasi beserta alasan."}`}
        confirmLabel={decision?.approve ? "Setujui" : "Tolak"}
        askDecree
        pending={decide.isPending}
        onSubmit={submit}
        onClose={() => setDecision(null)}
      />
    </>
  );
}
