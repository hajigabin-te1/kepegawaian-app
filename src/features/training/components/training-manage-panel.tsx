"use client";

import { useState } from "react";
import { GraduationCapIcon, PencilIcon, PlusIcon, UsersIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { routes } from "@/config/routes";
import { ParticipantsDialog } from "@/features/training/components/participants-dialog";
import { TrainingFormDialog } from "@/features/training/components/training-form-dialog";
import { TrainingStatusBadge, formatDate, formatPeriod } from "@/features/training/components/training-parts";
import { useTrainings } from "@/features/training/hooks/use-training";
import type { Training } from "@/features/training/types/training";

export function TrainingManagePanel() {
  const trainings = useTrainings();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Training | null>(null);
  const [participants, setParticipants] = useState<Training | null>(null);

  const openForm = (training: Training | null) => {
    setEditing(training);
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Kelola Diklat"
        description="Buka pendaftaran diklat, setujui pendaftar, tetapkan peserta, dan catat hasil."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Pengembangan Pegawai" }, { label: "Kelola Diklat" }]}
        actions={
          <Button onClick={() => openForm(null)}>
            <PlusIcon />
            Tambah Diklat
          </Button>
        }
      />

      <Card className="gap-0 py-0">
        {trainings.isPending ? (
          <TableSkeleton />
        ) : trainings.isError ? (
          <QueryErrorState error={trainings.error} onRetry={() => void trainings.refetch()} />
        ) : trainings.data.length === 0 ? (
          <EmptyState
            icon={GraduationCapIcon}
            title="Belum ada diklat"
            description="Tambahkan diklat dan buka pendaftaran agar pegawai bisa mendaftar."
            action={
              <Button size="sm" onClick={() => openForm(null)}>
                <PlusIcon />
                Tambah Diklat
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="pl-6">Diklat</TableHead>
                <TableHead className="hidden md:table-cell">Jadwal</TableHead>
                <TableHead className="hidden sm:table-cell">Pendaftaran</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Kuota</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainings.data.map((training) => (
                <TableRow key={training.id} className="hover:bg-accent/15">
                  <TableCell className="pl-6">
                    <p className="font-medium">{training.name}</p>
                    <p className="text-xs text-muted-foreground">{training.organizer ?? "—"}</p>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">{formatPeriod(training.startDate, training.endDate)}</TableCell>
                  <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                    {training.opensOn || training.closesOn
                      ? `${training.opensOn ? formatDate(training.opensOn) : "…"} – ${training.closesOn ? formatDate(training.closesOn) : "…"}`
                      : "Tanpa batas"}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{training.quota ?? "—"}</TableCell>
                  <TableCell>
                    <TrainingStatusBadge status={training.status} />
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setParticipants(training)}>
                        <UsersIcon />
                        Peserta
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`Ubah ${training.name}`} onClick={() => openForm(training)}>
                        <PencilIcon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <TrainingFormDialog open={formOpen} onOpenChange={setFormOpen} training={editing} />
      <ParticipantsDialog training={participants} onClose={() => setParticipants(null)} />
    </>
  );
}
