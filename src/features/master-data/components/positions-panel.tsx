"use client";

import { useState } from "react";
import { BriefcaseIcon, PencilIcon, PlusIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { ActiveStatusBadge } from "@/components/common/status-badge";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { routes } from "@/config/routes";
import { PositionFormDialog } from "@/features/master-data/components/position-form-dialog";
import { usePositions } from "@/features/master-data/hooks/use-master-data";
import type { Position } from "@/features/master-data/types/master-data";

export function PositionsPanel() {
  const positions = usePositions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);

  const rows = positions.data ?? [];

  const openDialog = (position: Position | null) => {
    setEditing(position);
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Jabatan"
        description="Daftar jabatan yang dapat diberikan kepada dosen dan tenaga kependidikan."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Organisasi" }, { label: "Jabatan" }]}
        actions={
          <Button onClick={() => openDialog(null)}>
            <PlusIcon />
            Tambah Jabatan
          </Button>
        }
      />

      <Card className="gap-0 py-0">
        {positions.isPending ? (
          <TableSkeleton />
        ) : positions.isError ? (
          <QueryErrorState error={positions.error} onRetry={() => void positions.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={BriefcaseIcon}
            title="Belum ada jabatan"
            description="Tambahkan jabatan agar bisa dipilih saat mengisi data pegawai."
            action={
              <Button size="sm" onClick={() => openDialog(null)}>
                <PlusIcon />
                Tambah Jabatan
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="pl-6">Nama jabatan</TableHead>
                <TableHead className="hidden sm:table-cell">Jenis</TableHead>
                <TableHead className="hidden sm:table-cell">Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-14 pr-6">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((position) => (
                <TableRow key={position.id} className="hover:bg-accent/15">
                  <TableCell className="pl-6 font-medium">{position.name}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{position.positionType ?? "—"}</TableCell>
                  <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">{position.level ?? "—"}</TableCell>
                  <TableCell>
                    <ActiveStatusBadge isActive={position.isActive} />
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button variant="ghost" size="icon-sm" onClick={() => openDialog(position)} aria-label={`Ubah ${position.name}`}>
                      <PencilIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <PositionFormDialog open={dialogOpen} onOpenChange={setDialogOpen} position={editing} />
    </>
  );
}
