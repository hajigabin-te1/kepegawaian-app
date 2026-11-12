"use client";

import { useState } from "react";
import { CalendarCheckIcon, PencilIcon, PlusIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { routes } from "@/config/routes";
import { AttendanceStatusBadge, formatTime } from "@/features/attendance/components/attendance-format";
import { CorrectionDialog, type CorrectionTarget } from "@/features/attendance/components/correction-dialog";
import { useDailyRecords, useMonthlySummary } from "@/features/attendance/hooks/use-attendance";
import { todayInCampus } from "@/features/attendance/services/attendance-service";

function DailyTable({ date, canManage, onCorrect }: { date: string; canManage: boolean; onCorrect: (target: CorrectionTarget) => void }) {
  const daily = useDailyRecords(date);
  const rows = daily.data ?? [];

  if (daily.isPending) return <TableSkeleton />;
  if (daily.isError) return <QueryErrorState error={daily.error} onRetry={() => void daily.refetch()} />;
  if (rows.length === 0) {
    return <EmptyState icon={CalendarCheckIcon} title="Belum ada presensi" description="Tidak ada pegawai yang presensi pada tanggal ini." />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-secondary hover:bg-secondary">
          <TableHead className="pl-6">Pegawai</TableHead>
          <TableHead>Datang</TableHead>
          <TableHead>Pulang</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden sm:table-cell">Sumber</TableHead>
          {canManage ? (
            <TableHead className="w-14 pr-6">
              <span className="sr-only">Aksi</span>
            </TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id} className="hover:bg-accent/15">
            <TableCell className="pl-6">
              <p className="font-medium">{row.employeeName}</p>
              <p className="text-xs text-muted-foreground tabular-nums">{row.employeeNumber ?? "—"}</p>
            </TableCell>
            <TableCell className="tabular-nums">{formatTime(row.checkInAt)}</TableCell>
            <TableCell className="tabular-nums">{formatTime(row.checkOutAt)}</TableCell>
            <TableCell>
              <AttendanceStatusBadge status={row.status} />
            </TableCell>
            <TableCell className="hidden text-muted-foreground sm:table-cell">{row.source === "gps" ? "GPS" : "Koreksi HR"}</TableCell>
            {canManage ? (
              <TableCell className="pr-6 text-right">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Koreksi presensi ${row.employeeName}`}
                  onClick={() => onCorrect({ employeeId: row.employeeId, date: row.date, record: row })}
                >
                  <PencilIcon />
                </Button>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function MonthlyTable({ month }: { month: string }) {
  const summary = useMonthlySummary(month);
  const rows = summary.data ?? [];

  if (summary.isPending) return <TableSkeleton />;
  if (summary.isError) return <QueryErrorState error={summary.error} onRetry={() => void summary.refetch()} />;
  if (rows.length === 0) {
    return <EmptyState icon={CalendarCheckIcon} title="Belum ada rekap" description="Belum ada data presensi pada bulan ini." />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-secondary hover:bg-secondary">
          <TableHead className="pl-6">Pegawai</TableHead>
          <TableHead className="text-right">Hadir</TableHead>
          <TableHead className="text-right">Terlambat</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Pulang awal</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Tidak hadir</TableHead>
          <TableHead className="hidden text-right md:table-cell">Cuti</TableHead>
          <TableHead className="hidden pr-6 text-right md:table-cell">Izin</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.employeeId} className="hover:bg-accent/15">
            <TableCell className="pl-6">
              <p className="font-medium">{row.employeeName}</p>
              <p className="text-xs text-muted-foreground tabular-nums">{row.employeeNumber ?? "—"}</p>
            </TableCell>
            <TableCell className="text-right tabular-nums">{row.daysPresent}</TableCell>
            <TableCell className="text-right tabular-nums">{row.daysLate}</TableCell>
            <TableCell className="hidden text-right tabular-nums sm:table-cell">{row.daysEarlyLeave}</TableCell>
            <TableCell className="hidden text-right tabular-nums sm:table-cell">{row.daysAbsent}</TableCell>
            <TableCell className="hidden text-right tabular-nums md:table-cell">{row.daysOnLeave}</TableCell>
            <TableCell className="hidden pr-6 text-right tabular-nums md:table-cell">{row.daysOnPermit}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function RecapPanel({ canManage }: { canManage: boolean }) {
  const [date, setDate] = useState(todayInCampus());
  const [month, setMonth] = useState(todayInCampus().slice(0, 7));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [target, setTarget] = useState<CorrectionTarget | null>(null);

  const openCorrection = (next: CorrectionTarget | null) => {
    setTarget(next);
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Rekap Presensi"
        description="Presensi harian dan rekap bulanan seluruh pegawai. Hari tanpa presensi tidak dicatat otomatis sebagai tidak hadir."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Presensi" }, { label: "Rekap Presensi" }]}
        actions={
          canManage ? (
            <Button onClick={() => openCorrection(null)}>
              <PlusIcon />
              Koreksi Presensi
            </Button>
          ) : null
        }
      />

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Harian</TabsTrigger>
          <TabsTrigger value="monthly">Bulanan</TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="space-y-3">
          <Input type="date" value={date} onChange={(event) => event.target.value && setDate(event.target.value)} aria-label="Tanggal" className="w-44" />
          <Card className="gap-0 py-0">
            <DailyTable date={date} canManage={canManage} onCorrect={openCorrection} />
          </Card>
        </TabsContent>
        <TabsContent value="monthly" className="space-y-3">
          <Input type="month" value={month} onChange={(event) => event.target.value && setMonth(event.target.value)} aria-label="Bulan" className="w-44" />
          <Card className="gap-0 py-0">
            <MonthlyTable month={month} />
          </Card>
        </TabsContent>
      </Tabs>

      {canManage ? <CorrectionDialog open={dialogOpen} onOpenChange={setDialogOpen} target={target} /> : null}
    </>
  );
}
