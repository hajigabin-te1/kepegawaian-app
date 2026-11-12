"use client";

import { useState } from "react";
import { ArrowRightIcon, CheckIcon, Loader2Icon, PlayIcon, PlusIcon, TrendingUpIcon, XIcon } from "lucide-react";
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
import { PromotionFormDialog } from "@/features/promotion/components/promotion-form-dialog";
import { useDecidePromotion, useExecutePromotion, usePromotions } from "@/features/promotion/hooks/use-promotions";
import { PROMOTION_TYPE_LABELS, type Promotion, type ProposalStatus } from "@/features/promotion/types/promotion";
import { ApiError } from "@/lib/api-error";

const FILTERS: (ProposalStatus | "all")[] = ["proposed", "approved", "executed", "rejected", "all"];
const dateFormatter = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });

export function PromotionsPanel() {
  const [status, setStatus] = useState<ProposalStatus | "all">("proposed");
  const promotions = usePromotions(status);
  const decide = useDecidePromotion();
  const execute = useExecutePromotion();
  const [formOpen, setFormOpen] = useState(false);
  const [decision, setDecision] = useState<{ promotion: Promotion; approve: boolean } | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);

  const submit = ({ note, decree }: DecisionSubmit) => {
    if (!decision) return;
    decide.mutate(
      { id: decision.promotion.id, approve: decision.approve, note, decree },
      {
        onSuccess: () => {
          toast.success(decision.approve ? "Usulan disetujui." : "Usulan ditolak.");
          setDecision(null);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Keputusan gagal disimpan."),
      },
    );
  };

  const run = (promotion: Promotion) => {
    setExecuting(promotion.id);
    execute.mutate(promotion.id, {
      onSuccess: () => toast.success("Kenaikan dijalankan. Data dan riwayat pegawai diperbarui."),
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Kenaikan gagal dijalankan."),
      onSettled: () => setExecuting(null),
    });
  };

  return (
    <>
      <PageHeader
        title="Kenaikan Pangkat dan Jabatan"
        description="Usulkan, setujui, lalu jalankan. Menjalankan usulan memperbarui data pegawai beserta riwayat pangkat atau jabatannya."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Pengembangan Pegawai" }, { label: "Kenaikan Pangkat" }]}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <PlusIcon />
            Usulkan Kenaikan
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
        {promotions.isPending ? (
          <TableSkeleton />
        ) : promotions.isError ? (
          <QueryErrorState error={promotions.error} onRetry={() => void promotions.refetch()} />
        ) : promotions.data.length === 0 ? (
          <EmptyState icon={TrendingUpIcon} title="Tidak ada usulan" description="Usulan kenaikan pada filter ini akan tampil di sini." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="pl-6">Pegawai</TableHead>
                <TableHead>Usulan</TableHead>
                <TableHead className="hidden sm:table-cell">Berlaku</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.data.map((promotion) => (
                <TableRow key={promotion.id} className="hover:bg-accent/15">
                  <TableCell className="pl-6">
                    <p className="font-medium">{promotion.employeeName}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{promotion.employeeNumber ?? "—"}</p>
                  </TableCell>
                  <TableCell className="space-y-1 text-sm">
                    <p className="text-xs text-muted-foreground">{PROMOTION_TYPE_LABELS[promotion.type]}</p>
                    <span className="flex flex-wrap items-center gap-1">
                      <span className="text-muted-foreground">{(promotion.type === "rank" ? promotion.currentRank : promotion.currentPosition) ?? "—"}</span>
                      <ArrowRightIcon className="size-3.5 text-muted-foreground" />
                      <span className="font-medium">{(promotion.type === "rank" ? promotion.proposedRank : promotion.proposedPosition) ?? "—"}</span>
                    </span>
                    {promotion.reason ? <p className="text-xs text-muted-foreground">{promotion.reason}</p> : null}
                    {promotion.decisionNote ? <p className="text-xs text-muted-foreground">Catatan: {promotion.decisionNote}</p> : null}
                    {promotion.decreeNumber ? <p className="text-xs text-muted-foreground">SK: {promotion.decreeNumber}</p> : null}
                  </TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">
                    {promotion.effectiveDate ? dateFormatter.format(new Date(`${promotion.effectiveDate}T00:00:00Z`)) : "Saat dijalankan"}
                  </TableCell>
                  <TableCell>
                    <ProposalStatusBadge status={promotion.status} />
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex justify-end gap-2">
                      {promotion.status === "proposed" ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setDecision({ promotion, approve: false })}>
                            <XIcon />
                            Tolak
                          </Button>
                          <Button size="sm" onClick={() => setDecision({ promotion, approve: true })}>
                            <CheckIcon />
                            Setujui
                          </Button>
                        </>
                      ) : null}
                      {promotion.status === "approved" ? (
                        <Button size="sm" onClick={() => run(promotion)} disabled={executing === promotion.id}>
                          {executing === promotion.id ? <Loader2Icon className="animate-spin" /> : <PlayIcon />}
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

      <PromotionFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <DecisionDialog
        open={decision !== null}
        approve={decision?.approve ?? true}
        title={decision?.approve ? "Setujui usulan?" : "Tolak usulan?"}
        description={`${decision?.promotion.employeeName ?? "Pegawai"}. ${decision?.approve ? "Setelah disetujui, usulan masih perlu dijalankan." : "Pegawai menerima notifikasi beserta alasan."}`}
        confirmLabel={decision?.approve ? "Setujui" : "Tolak"}
        askDecree
        pending={decide.isPending}
        onSubmit={submit}
        onClose={() => setDecision(null)}
      />
    </>
  );
}
