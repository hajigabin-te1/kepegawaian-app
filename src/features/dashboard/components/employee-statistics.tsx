"use client";

import Link from "next/link";
import { Building2Icon, GraduationCapIcon, UserMinusIcon, UsersIcon, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APP_TIME_ZONE } from "@/config/locale";
import { routes } from "@/config/routes";
import { useEmployeeStatistics, useRecentEmployees } from "@/features/dashboard/hooks/use-dashboard";
import type { UnitStatistic } from "@/features/dashboard/services/dashboard-service";
import { CATEGORY_LABELS } from "@/features/employees/types/employee";

const numberFormatter = new Intl.NumberFormat("id-ID");
const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: APP_TIME_ZONE });
const NO_UNIT = "Tanpa unit kerja";

type UnitRow = { key: string; name: string; lecturers: number; staff: number; inactive: number };

function summarize(statistics: UnitStatistic[]) {
  const units = new Map<string, UnitRow>();
  let lecturers = 0;
  let staff = 0;
  let inactive = 0;

  for (const row of statistics) {
    const key = row.workUnitId ?? "none";
    const unit = units.get(key) ?? { key, name: row.workUnitName ?? NO_UNIT, lecturers: 0, staff: 0, inactive: 0 };
    if (row.category === "lecturer") unit.lecturers += row.activeEmployees;
    else unit.staff += row.activeEmployees;
    unit.inactive += row.inactiveEmployees + row.retiredEmployees;
    units.set(key, unit);

    if (row.category === "lecturer") lecturers += row.activeEmployees;
    else staff += row.activeEmployees;
    inactive += row.inactiveEmployees + row.retiredEmployees;
  }

  const unitRows = [...units.values()]
    .filter((unit) => unit.lecturers + unit.staff + unit.inactive > 0)
    .sort((a, b) => b.lecturers + b.staff - (a.lecturers + a.staff) || a.name.localeCompare(b.name, "id"));

  return { lecturers, staff, inactive, active: lecturers + staff, unitRows };
}

function Kpi({ label, value, icon: Icon, note }: { label: string; value: number; icon: LucideIcon; note: string }) {
  return (
    <div className="flex flex-col gap-3 bg-card p-5">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4 text-primary" />
        {label}
      </dt>
      <dd className="text-3xl font-semibold tracking-tight tabular-nums">{numberFormatter.format(value)}</dd>
      <dd className="mt-auto text-xs text-muted-foreground">{note}</dd>
    </div>
  );
}

type EmployeeStatisticsProps = {
  /** HR can open individual employees; leaders only see aggregates. */
  canViewEmployees: boolean;
};

export function EmployeeStatistics({ canViewEmployees }: EmployeeStatisticsProps) {
  const statistics = useEmployeeStatistics();
  const recent = useRecentEmployees(canViewEmployees);

  if (statistics.isPending) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }
  if (statistics.isError) {
    return (
      <Card className="py-0">
        <QueryErrorState error={statistics.error} onRetry={() => void statistics.refetch()} />
      </Card>
    );
  }

  const summary = summarize(statistics.data);

  return (
    <div className="space-y-6">
      <section aria-label="Ringkasan pegawai" className="overflow-hidden rounded-lg border bg-card">
        {/* gap-px over a border-colored background draws the dividers at every breakpoint. */}
        <dl className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Pegawai aktif" value={summary.active} icon={UsersIcon} note="Dosen dan tenaga kependidikan" />
          <Kpi label="Dosen aktif" value={summary.lecturers} icon={GraduationCapIcon} note={CATEGORY_LABELS.lecturer} />
          <Kpi label="Tendik aktif" value={summary.staff} icon={Building2Icon} note={CATEGORY_LABELS.staff} />
          <Kpi label="Nonaktif & pensiun" value={summary.inactive} icon={UserMinusIcon} note="Tidak dihitung sebagai pegawai aktif" />
        </dl>
      </section>

      <div className={canViewEmployees ? "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]" : undefined}>
        <Card className="gap-0 pb-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Sebaran per unit kerja</CardTitle>
            <CardDescription>Jumlah pegawai aktif menurut unit kerja dan kategori.</CardDescription>
          </CardHeader>
          {summary.unitRows.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="Belum ada data pegawai"
              description="Statistik akan muncul setelah data pegawai ditambahkan."
              className="border-t"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="pl-6">Unit kerja</TableHead>
                  <TableHead className="text-right">Dosen</TableHead>
                  <TableHead className="text-right">Tendik</TableHead>
                  <TableHead className="text-right">Total aktif</TableHead>
                  <TableHead className="hidden pr-6 text-right sm:table-cell">Nonaktif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.unitRows.map((unit) => (
                  <TableRow key={unit.key} className="hover:bg-accent/15">
                    <TableCell className="pl-6 font-medium">{unit.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{numberFormatter.format(unit.lecturers)}</TableCell>
                    <TableCell className="text-right tabular-nums">{numberFormatter.format(unit.staff)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{numberFormatter.format(unit.lecturers + unit.staff)}</TableCell>
                    <TableCell className="hidden pr-6 text-right text-muted-foreground tabular-nums sm:table-cell">
                      {numberFormatter.format(unit.inactive)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {canViewEmployees ? (
          <Card size="sm" className="gap-0 pb-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Pegawai terbaru</CardTitle>
              <CardDescription>Terakhir ditambahkan ke sistem.</CardDescription>
            </CardHeader>
            {recent.isPending ? (
              <TableSkeleton rows={4} />
            ) : recent.isError ? (
              <QueryErrorState error={recent.error} onRetry={() => void recent.refetch()} />
            ) : recent.data.length === 0 ? (
              <p className="border-t px-(--card-spacing) py-4 text-sm text-muted-foreground">Belum ada pegawai.</p>
            ) : (
              <ul className="divide-y border-t">
                {recent.data.map((employee) => (
                  <li key={employee.id}>
                    <Link
                      href={routes.employees.detail(employee.id)}
                      className="flex items-center justify-between gap-3 px-(--card-spacing) py-3 transition-colors hover:bg-accent/15"
                    >
                      <span className="min-w-0 leading-tight">
                        <span className="block truncate text-sm font-medium">{employee.fullName}</span>
                        <span className="block truncate text-xs text-muted-foreground">{employee.workUnitName ?? NO_UNIT}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <Badge variant="accent">{employee.category === "lecturer" ? "Dosen" : "Tendik"}</Badge>
                        <span className="text-xs text-muted-foreground tabular-nums">{dateFormatter.format(new Date(employee.createdAt))}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : null}
      </div>
    </div>
  );
}
