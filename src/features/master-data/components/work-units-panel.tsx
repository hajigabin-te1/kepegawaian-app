"use client";

import { useState } from "react";
import { Building2Icon, PencilIcon, PlusIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { ActiveStatusBadge } from "@/components/common/status-badge";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { routes } from "@/config/routes";
import { WorkUnitFormDialog } from "@/features/master-data/components/work-unit-form-dialog";
import { useWorkUnits } from "@/features/master-data/hooks/use-master-data";
import { WORK_UNIT_TYPE_LABELS, type WorkUnit } from "@/features/master-data/types/master-data";

export function WorkUnitsPanel() {
  const workUnits = useWorkUnits();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WorkUnit | null>(null);

  const units = workUnits.data ?? [];
  const nameById = new Map(units.map((unit) => [unit.id, unit.name]));

  const openDialog = (unit: WorkUnit | null) => {
    setEditing(unit);
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Unit Kerja"
        description="Bidang, program studi, bagian, dan unit lain tempat pegawai bertugas."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Master Data" }, { label: "Unit Kerja" }]}
        actions={
          <Button onClick={() => openDialog(null)}>
            <PlusIcon />
            Tambah Unit Kerja
          </Button>
        }
      />

      <Card className="gap-0 py-0">
        {workUnits.isPending ? (
          <TableSkeleton />
        ) : workUnits.isError ? (
          <QueryErrorState error={workUnits.error} onRetry={() => void workUnits.refetch()} />
        ) : units.length === 0 ? (
          <EmptyState
            icon={Building2Icon}
            title="Belum ada unit kerja"
            description="Tambahkan bidang, program studi, atau bagian untuk mulai mengelompokkan pegawai."
            action={
              <Button size="sm" onClick={() => openDialog(null)}>
                <PlusIcon />
                Tambah Unit Kerja
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="pl-6">Nama unit</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead className="hidden md:table-cell">Induk unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-14 pr-6">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit.id} className="hover:bg-accent/15">
                  <TableCell className="pl-6 font-medium">{unit.name}</TableCell>
                  <TableCell className="text-muted-foreground">{WORK_UNIT_TYPE_LABELS[unit.unitType]}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {unit.parentId ? (nameById.get(unit.parentId) ?? "—") : "—"}
                  </TableCell>
                  <TableCell>
                    <ActiveStatusBadge isActive={unit.isActive} />
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button variant="ghost" size="icon-sm" onClick={() => openDialog(unit)} aria-label={`Ubah ${unit.name}`}>
                      <PencilIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <WorkUnitFormDialog open={dialogOpen} onOpenChange={setDialogOpen} workUnit={editing} allUnits={units} />
    </>
  );
}
