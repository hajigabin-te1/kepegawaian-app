"use client";

import { useState } from "react";
import { CalendarCheckIcon, UserXIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { routes } from "@/config/routes";
import { AttendanceStatusBadge, formatDate, formatTime } from "@/features/attendance/components/attendance-format";
import { CheckInCard } from "@/features/attendance/components/check-in-card";
import { useMyRecords } from "@/features/attendance/hooks/use-attendance";
import { todayInCampus } from "@/features/attendance/services/attendance-service";

function HistoryTable({ employeeId }: { employeeId: string }) {
  const [month, setMonth] = useState(todayInCampus().slice(0, 7));
  const records = useMyRecords(employeeId, month);
  const rows = records.data ?? [];

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b py-4">
        <CardTitle className="text-lg font-semibold">Riwayat presensi</CardTitle>
        <Input
          type="month"
          value={month}
          onChange={(event) => event.target.value && setMonth(event.target.value)}
          aria-label="Bulan"
          className="w-40"
        />
      </CardHeader>
      {records.isPending ? (
        <TableSkeleton />
      ) : records.isError ? (
        <QueryErrorState error={records.error} onRetry={() => void records.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState icon={CalendarCheckIcon} title="Belum ada presensi" description="Tidak ada catatan presensi pada bulan ini." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead className="pl-6">Tanggal</TableHead>
              <TableHead>Datang</TableHead>
              <TableHead>Pulang</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden pr-6 sm:table-cell">Keterangan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-accent/15">
                <TableCell className="pl-6 font-medium">{formatDate(row.date)}</TableCell>
                <TableCell className="tabular-nums">{formatTime(row.checkInAt)}</TableCell>
                <TableCell className="tabular-nums">{formatTime(row.checkOutAt)}</TableCell>
                <TableCell>
                  <AttendanceStatusBadge status={row.status} />
                </TableCell>
                <TableCell className="hidden pr-6 text-muted-foreground sm:table-cell">{row.note ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

export function MyAttendancePanel({ employeeId }: { employeeId: string | null }) {
  return (
    <>
      <PageHeader
        title="Presensi Saya"
        description="Catat kehadiran dengan lokasi GPS dan lihat riwayat presensi Anda."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Presensi" }, { label: "Presensi Saya" }]}
      />
      {employeeId ? (
        <>
          <CheckInCard employeeId={employeeId} />
          <HistoryTable employeeId={employeeId} />
        </>
      ) : (
        <Card>
          <EmptyState
            icon={UserXIcon}
            title="Akun belum terhubung ke data pegawai"
            description="Hubungi Bagian Kepegawaian agar akun Anda dikaitkan dengan data pegawai sebelum melakukan presensi."
          />
        </Card>
      )}
    </>
  );
}
