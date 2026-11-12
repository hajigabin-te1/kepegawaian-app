"use client";

import { useState } from "react";
import { CalendarHeartIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { todayInCampus } from "@/features/attendance/services/attendance-service";
import { Figure, SectionCard, formatNumber } from "@/features/dashboard/components/stat-parts";
import { useLeaveStats } from "@/features/dashboard/hooks/use-dashboard";
import { CATEGORY_LABELS } from "@/features/dashboard/types/dashboard";
import { downloadCsv } from "@/lib/csv";

export function LeaveTab() {
  const [year, setYear] = useState(Number(todayInCampus().slice(0, 4)));
  const stats = useLeaveStats(year);

  const yearInput = (
    <Input
      type="number"
      value={year}
      min={2000}
      max={2100}
      onChange={(event) => Number(event.target.value) >= 2000 && setYear(Number(event.target.value))}
      aria-label="Tahun"
      className="w-28"
    />
  );

  let content;
  if (stats.isPending) content = <SectionCard title="Cuti dan izin per unit kerja"><TableSkeleton /></SectionCard>;
  else if (stats.isError) content = <SectionCard title="Cuti dan izin per unit kerja"><QueryErrorState error={stats.error} onRetry={() => void stats.refetch()} /></SectionCard>;
  else if (stats.data.length === 0)
    content = (
      <SectionCard title="Cuti dan izin per unit kerja">
        <EmptyState icon={CalendarHeartIcon} title="Belum ada cuti atau izin" description={`Tidak ada pengajuan cuti/izin pada ${year} untuk cakupan Anda.`} />
      </SectionCard>
    );
  else {
    const rows = stats.data;
    const days = (category: "lecturer" | "staff") => rows.filter((r) => r.category === category).reduce((sum, r) => sum + r.approvedDays, 0);
    const pending = rows.reduce((sum, r) => sum + r.pendingRequests, 0);
    content = (
      <div className="space-y-6">
        <SectionCard title={`Ringkasan ${year}`}>
          <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <Figure label="Dosen (hari disetujui)" value={formatNumber(days("lecturer"))} />
            <Figure label="Tenaga kependidikan (hari disetujui)" value={formatNumber(days("staff"))} />
            <Figure label="Menunggu persetujuan" value={`${formatNumber(pending)} pengajuan`} />
          </div>
        </SectionCard>

        <SectionCard
          title="Cuti dan izin per unit kerja"
          onDownload={() =>
            downloadCsv(
              `rekap-cuti-${year}.csv`,
              ["Unit kerja", "Kategori", "Jenis", "Pengajuan disetujui", "Hari disetujui", "Menunggu"],
              rows.map((r) => [r.workUnitName, CATEGORY_LABELS[r.category], r.typeName, r.approvedRequests, r.approvedDays, r.pendingRequests]),
            )
          }
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="pl-6">Unit kerja</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Disetujui</TableHead>
                <TableHead className="text-right">Hari</TableHead>
                <TableHead className="pr-6 text-right">Menunggu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.workUnitName}-${row.category}-${row.typeName}`} className="hover:bg-accent/15">
                  <TableCell className="pl-6 font-medium">{row.workUnitName}</TableCell>
                  <TableCell>{CATEGORY_LABELS[row.category]}</TableCell>
                  <TableCell>{row.typeName}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{row.approvedRequests}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(row.approvedDays)}</TableCell>
                  <TableCell className="pr-6 text-right tabular-nums">{row.pendingRequests}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {yearInput}
      {content}
    </div>
  );
}
