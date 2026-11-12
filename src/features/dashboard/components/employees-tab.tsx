"use client";

import { UsersIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CategoryBar, Figure, SectionCard, formatNumber } from "@/features/dashboard/components/stat-parts";
import { useEmployeeStats } from "@/features/dashboard/hooks/use-dashboard";
import type { EmployeeStatRow } from "@/features/dashboard/types/dashboard";
import { downloadCsv } from "@/lib/csv";
import { WORK_UNIT_TYPE_LABELS } from "@/features/master-data/types/master-data";

type UnitRow = { key: string; name: string; type: string; lecturers: number; staff: number; inactive: number; retired: number };

/** One row per unit, with lecturers and staff as separate columns. */
function pivot(rows: EmployeeStatRow[]): UnitRow[] {
  const units = new Map<string, UnitRow>();
  for (const row of rows) {
    const key = row.workUnitId ?? "none";
    const unit = units.get(key) ?? {
      key,
      name: row.workUnitName,
      type: row.unitType ? WORK_UNIT_TYPE_LABELS[row.unitType] : "—",
      lecturers: 0,
      staff: 0,
      inactive: 0,
      retired: 0,
    };
    if (row.category === "lecturer") unit.lecturers += row.active;
    else unit.staff += row.active;
    unit.inactive += row.inactive;
    unit.retired += row.retired;
    units.set(key, unit);
  }
  return [...units.values()].sort((a, b) => a.name.localeCompare(b.name, "id"));
}

export function EmployeesTab() {
  const stats = useEmployeeStats();

  if (stats.isPending) return <SectionCard title="Pegawai per unit kerja"><TableSkeleton /></SectionCard>;
  if (stats.isError) return <SectionCard title="Pegawai per unit kerja"><QueryErrorState error={stats.error} onRetry={() => void stats.refetch()} /></SectionCard>;

  const units = pivot(stats.data);
  if (units.length === 0) {
    return (
      <SectionCard title="Pegawai per unit kerja">
        <EmptyState icon={UsersIcon} title="Belum ada data pegawai" description="Data muncul setelah pegawai ditambahkan pada unit kerja dalam cakupan Anda." />
      </SectionCard>
    );
  }

  const total = units.reduce(
    (sum, u) => ({ lecturers: sum.lecturers + u.lecturers, staff: sum.staff + u.staff, inactive: sum.inactive + u.inactive, retired: sum.retired + u.retired }),
    { lecturers: 0, staff: 0, inactive: 0, retired: 0 },
  );

  return (
    <div className="space-y-6">
      <SectionCard title="Pegawai aktif">
        <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Figure label="Dosen" value={formatNumber(total.lecturers)} />
          <Figure label="Tenaga kependidikan" value={formatNumber(total.staff)} />
          <Figure label="Nonaktif dan pensiun" value={formatNumber(total.inactive + total.retired)} detail={`${total.inactive} nonaktif · ${total.retired} pensiun`} />
        </div>
        <CategoryBar lecturers={total.lecturers} staff={total.staff} />
      </SectionCard>

      <SectionCard
        title="Pegawai per unit kerja"
        onDownload={() =>
          downloadCsv("rekap-pegawai.csv", ["Unit kerja", "Jenis unit", "Dosen aktif", "Tendik aktif", "Nonaktif", "Pensiun"], units.map((u) => [u.name, u.type, u.lecturers, u.staff, u.inactive, u.retired]))
        }
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead className="pl-6">Unit kerja</TableHead>
              <TableHead className="hidden sm:table-cell">Jenis</TableHead>
              <TableHead className="text-right">Dosen aktif</TableHead>
              <TableHead className="text-right">Tendik aktif</TableHead>
              <TableHead className="hidden text-right md:table-cell">Nonaktif</TableHead>
              <TableHead className="hidden pr-6 text-right md:table-cell">Pensiun</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.map((unit) => (
              <TableRow key={unit.key} className="hover:bg-accent/15">
                <TableCell className="pl-6 font-medium">{unit.name}</TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{unit.type}</TableCell>
                <TableCell className="text-right tabular-nums">{unit.lecturers}</TableCell>
                <TableCell className="text-right tabular-nums">{unit.staff}</TableCell>
                <TableCell className="hidden text-right tabular-nums md:table-cell">{unit.inactive}</TableCell>
                <TableCell className="hidden pr-6 text-right tabular-nums md:table-cell">{unit.retired}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="pl-6 font-semibold">Total</TableCell>
              <TableCell className="hidden sm:table-cell" />
              <TableCell className="text-right font-semibold tabular-nums">{total.lecturers}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{total.staff}</TableCell>
              <TableCell className="hidden text-right font-semibold tabular-nums md:table-cell">{total.inactive}</TableCell>
              <TableCell className="hidden pr-6 text-right font-semibold tabular-nums md:table-cell">{total.retired}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </SectionCard>
    </div>
  );
}
