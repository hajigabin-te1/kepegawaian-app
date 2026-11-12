"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2Icon, ChevronDownIcon, ChevronRightIcon, NetworkIcon, PencilIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { useEmployeeStatistics } from "@/features/dashboard/hooks/use-dashboard";
import type { UnitStatistic } from "@/features/dashboard/services/dashboard-service";
import { useWorkUnits } from "@/features/master-data/hooks/use-master-data";
import { WORK_UNIT_TYPE_LABELS, type WorkUnit } from "@/features/master-data/types/master-data";

type UnitCounts = { lecturer: number; staff: number };
type TreeNode = { unit: WorkUnit; children: TreeNode[] };

/** Builds the unit tree from parent_id; units whose parent is missing are treated as roots. */
function buildTree(units: WorkUnit[]): TreeNode[] {
  const nodes = new Map(units.map((unit) => [unit.id, { unit, children: [] as TreeNode[] }]));
  const roots: TreeNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.unit.parentId ? nodes.get(node.unit.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const sort = (list: TreeNode[]) => {
    list.sort((a, b) => a.unit.name.localeCompare(b.unit.name, "id"));
    list.forEach((node) => sort(node.children));
  };
  sort(roots);
  return roots;
}

/** Active employees per unit, split into lecturers and staff. */
function countsByUnit(statistics: UnitStatistic[]): Map<string | null, UnitCounts> {
  const counts = new Map<string | null, UnitCounts>();
  for (const row of statistics) {
    const current = counts.get(row.workUnitId) ?? { lecturer: 0, staff: 0 };
    current[row.category] += row.activeEmployees;
    counts.set(row.workUnitId, current);
  }
  return counts;
}

export function OrganizationStructure() {
  const workUnits = useWorkUnits();
  // Counts are optional: without a statistics scope the tree is still shown.
  const statistics = useEmployeeStatistics();
  const counts = statistics.data ? countsByUnit(statistics.data) : null;
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

  const toggle = (id: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const units = workUnits.data ?? [];
  const tree = buildTree(units);
  const unassigned = counts?.get(null);
  const unassignedTotal = unassigned ? unassigned.lecturer + unassigned.staff : 0;

  return (
    <>
      <PageHeader
        title="Struktur Organisasi"
        description="Susunan unit kerja berdasarkan induk unit, beserta jumlah pegawai aktif."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Organisasi" }, { label: "Struktur Organisasi" }]}
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href={routes.masterData.workUnits} />}>
            <PencilIcon />
            Kelola Unit Kerja
          </Button>
        }
      />

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-lg font-semibold">Bagan unit kerja</CardTitle>
          <CardDescription>
            Induk unit diatur di menu Unit Kerja. Angka menunjukkan pegawai aktif langsung di unit tersebut.
          </CardDescription>
        </CardHeader>
        {workUnits.isPending ? (
          <CardContent className="space-y-3 py-4">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-9 w-full" style={{ marginLeft: `${(index % 3) * 1.5}rem` }} />
            ))}
          </CardContent>
        ) : workUnits.isError ? (
          <QueryErrorState error={workUnits.error} onRetry={() => void workUnits.refetch()} />
        ) : units.length === 0 ? (
          <EmptyState
            icon={NetworkIcon}
            title="Belum ada unit kerja"
            description="Tambahkan unit kerja dan induknya untuk membentuk struktur organisasi."
            action={
              <Button size="sm" nativeButton={false} render={<Link href={routes.masterData.workUnits} />}>
                Buka Unit Kerja
              </Button>
            }
          />
        ) : (
          <CardContent className="py-3">
            <ul role="tree" aria-label="Struktur organisasi">
              {tree.map((node) => (
                <TreeItem key={node.unit.id} node={node} counts={counts} collapsed={collapsed} onToggle={toggle} />
              ))}
            </ul>
            {unassignedTotal > 0 ? (
              <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground tabular-nums">{unassignedTotal}</span> pegawai aktif belum memiliki unit kerja.
              </p>
            ) : null}
          </CardContent>
        )}
      </Card>
    </>
  );
}

type TreeItemProps = {
  node: TreeNode;
  counts: Map<string | null, UnitCounts> | null;
  collapsed: ReadonlySet<string>;
  onToggle: (id: string) => void;
};

function TreeItem({ node, counts, collapsed, onToggle }: TreeItemProps) {
  const { unit, children } = node;
  const hasChildren = children.length > 0;
  const isOpen = hasChildren && !collapsed.has(unit.id);
  const unitCounts = counts?.get(unit.id);

  return (
    <li role="treeitem" aria-expanded={hasChildren ? isOpen : undefined} aria-selected={false}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg py-1.5 pr-2 pl-1 hover:bg-accent/15">
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onToggle(unit.id)}
            aria-label={isOpen ? `Tutup ${unit.name}` : `Buka ${unit.name}`}
          >
            {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </Button>
        ) : (
          <span className="size-7 shrink-0" aria-hidden />
        )}
        <Building2Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1 font-medium">
          {unit.name}
          <Badge variant="outline" className="ml-2 align-middle">
            {WORK_UNIT_TYPE_LABELS[unit.unitType]}
          </Badge>
          {unit.isActive ? null : (
            <Badge variant="secondary" className="ml-1 align-middle">
              Nonaktif
            </Badge>
          )}
        </span>
        {counts ? (
          <span className="text-sm text-muted-foreground tabular-nums">
            {unitCounts ? `${unitCounts.lecturer} dosen · ${unitCounts.staff} tendik` : "Belum ada pegawai"}
          </span>
        ) : null}
      </div>
      {isOpen ? (
        <ul role="group" className="ml-4 border-l pl-3">
          {children.map((child) => (
            <TreeItem key={child.unit.id} node={child} counts={counts} collapsed={collapsed} onToggle={onToggle} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
