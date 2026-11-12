"use client";

import { useState } from "react";
import { CalendarCheckIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { todayInCampus } from "@/features/attendance/services/attendance-service";
import { Figure, SectionCard, formatNumber } from "@/features/dashboard/components/stat-parts";
import { useAttendanceStats } from "@/features/dashboard/hooks/use-dashboard";
import { CATEGORY_LABELS, type AttendanceStatRow, type EmployeeCategory } from "@/features/dashboard/types/dashboard";
import { downloadCsv } from "@/lib/csv";

const percent = (part: number, whole: number) => (whole > 0 ? `${formatNumber((part / whole) * 100)}%` : "—");

function totalsFor(rows: AttendanceStatRow[], category: EmployeeCategory) {
  return rows
    .filter((r) => r.category === category)
    .reduce(
      (sum, r) => ({ present: sum.present + r.daysPresent, late: sum.late + r.daysLate, earlyLeave: sum.earlyLeave + r.daysEarlyLeave }),
      { present: 0, late: 0, earlyLeave: 0 },
    );
}

export function AttendanceTab() {
  const [month, setMonth] = useState(todayInCampus().slice(0, 7));
  const stats = useAttendanceStats(month);

  const monthInput = (
    <Input type="month" value={month} onChange={(event) => event.target.value && setMonth(event.target.value)} aria-label="Bulan" className="w-44" />
  );

  let content;
  if (stats.isPending) content = <SectionCard title="Presensi per unit kerja"><TableSkeleton /></SectionCard>;
  else if (stats.isError) content = <SectionCard title="Presensi per unit kerja"><QueryErrorState error={stats.error} onRetry={() => void stats.refetch()} /></SectionCard>;
  else if (stats.data.length === 0)
    content = (
      <SectionCard title="Presensi per unit kerja">
        <EmptyState icon={CalendarCheckIcon} title="Belum ada presensi" description="Belum ada catatan presensi pada bulan ini untuk cakupan Anda." />
      </SectionCard>
    );
  else {
    const rows = stats.data;
    content = (
      <div className="space-y-6">
        <SectionCard title="Ringkasan bulan ini">
          <div className="grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {(["lecturer", "staff"] as const).map((category) => {
              const t = totalsFor(rows, category);
              return (
                <Figure
                  key={category}
                  label={CATEGORY_LABELS[category]}
                  value={`${formatNumber(t.present)} hari hadir`}
                  detail={`Terlambat ${formatNumber(t.late)} (${percent(t.late, t.present)}) · pulang awal ${formatNumber(t.earlyLeave)}`}
                />
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title="Presensi per unit kerja"
          onDownload={() =>
            downloadCsv(
              `rekap-presensi-${month}.csv`,
              ["Unit kerja", "Kategori", "Pegawai tercatat", "Hari hadir", "Terlambat", "Pulang awal", "Tidak hadir"],
              rows.map((r) => [r.workUnitName, CATEGORY_LABELS[r.category], r.employeesRecorded, r.daysPresent, r.daysLate, r.daysEarlyLeave, r.daysAbsent]),
            )
          }
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="pl-6">Unit kerja</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="hidden text-right md:table-cell">Pegawai</TableHead>
                <TableHead className="text-right">Hadir</TableHead>
                <TableHead className="text-right">Terlambat</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Pulang awal</TableHead>
                <TableHead className="hidden pr-6 text-right sm:table-cell">Tidak hadir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.workUnitName}-${row.category}`} className="hover:bg-accent/15">
                  <TableCell className="pl-6 font-medium">{row.workUnitName}</TableCell>
                  <TableCell>{CATEGORY_LABELS[row.category]}</TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">{row.employeesRecorded}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.daysPresent}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.daysLate}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{row.daysEarlyLeave}</TableCell>
                  <TableCell className="hidden pr-6 text-right tabular-nums sm:table-cell">{row.daysAbsent}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
        <p className="text-xs text-muted-foreground">
          Hari tanpa presensi tidak dicatat otomatis sebagai tidak hadir, jadi kolom Tidak hadir hanya berisi koreksi HR.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {monthInput}
      {content}
    </div>
  );
}
