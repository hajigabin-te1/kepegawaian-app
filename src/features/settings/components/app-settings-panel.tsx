"use client";

import { useState } from "react";
import { ClockIcon, MapPinIcon, PencilIcon, PlusIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { ActiveStatusBadge } from "@/components/common/status-badge";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { routes } from "@/config/routes";
import { CATEGORY_LABELS } from "@/features/employees/types/employee";
import { AttendanceLocationDialog } from "@/features/settings/components/attendance-location-dialog";
import { WorkScheduleDialog } from "@/features/settings/components/work-schedule-dialog";
import { useAttendanceLocations, useTimeZoneSetting, useWorkSchedules } from "@/features/settings/hooks/use-settings";
import { TIME_ZONE_LABELS, type AttendanceLocation, type WorkSchedule } from "@/features/settings/types/settings";

const coordinateFormatter = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 6, maximumFractionDigits: 6 });

export function AppSettingsPanel() {
  const timeZone = useTimeZoneSetting();
  const timeZoneLabel = timeZone.data ? (TIME_ZONE_LABELS[timeZone.data] ?? timeZone.data) : "—";

  return (
    <>
      <PageHeader
        title="Pengaturan Aplikasi"
        description="Titik & radius presensi GPS dan jam kerja pegawai."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Pengaturan" }, { label: "Pengaturan Aplikasi" }]}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm">
        <ClockIcon className="size-4 text-muted-foreground" aria-hidden />
        <span className="text-muted-foreground">Zona waktu kampus</span>
        <span className="font-medium">{timeZone.isPending ? "Memuat…" : timeZoneLabel}</span>
        <span className="text-muted-foreground">· dipakai untuk presensi dan seluruh tanggal di aplikasi.</span>
      </div>

      <Tabs defaultValue="locations" className="gap-4">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b">
          <TabsTrigger value="locations">Lokasi Presensi</TabsTrigger>
          <TabsTrigger value="schedules">Jam Kerja</TabsTrigger>
        </TabsList>
        <TabsContent value="locations">
          <LocationsCard />
        </TabsContent>
        <TabsContent value="schedules">
          <SchedulesCard />
        </TabsContent>
      </Tabs>
    </>
  );
}

function LocationsCard() {
  const locations = useAttendanceLocations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AttendanceLocation | null>(null);
  const rows = locations.data ?? [];

  const open = (location: AttendanceLocation | null) => {
    setEditing(location);
    setDialogOpen(true);
  };

  const addButton = (
    <Button size="sm" onClick={() => open(null)}>
      <PlusIcon />
      Tambah Lokasi
    </Button>
  );

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">Lokasi presensi</CardTitle>
          <CardDescription>Di luar radius lokasi aktif, pegawai melihat pesan &ldquo;Tidak bisa melakukan presensi&rdquo;.</CardDescription>
        </div>
        {addButton}
      </CardHeader>
      {locations.isPending ? (
        <TableSkeleton rows={2} />
      ) : locations.isError ? (
        <QueryErrorState error={locations.error} onRetry={() => void locations.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState icon={MapPinIcon} title="Belum ada lokasi presensi" description="Tambahkan titik kampus agar pegawai bisa presensi." action={addButton} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead className="pl-6">Lokasi</TableHead>
              <TableHead className="hidden md:table-cell">Koordinat</TableHead>
              <TableHead>Radius</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="w-16 pr-6">
                <span className="sr-only">Aksi</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((location) => (
              <TableRow key={location.id} className="hover:bg-accent/15">
                <TableCell className="pl-6 font-medium">{location.name}</TableCell>
                <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">
                  {coordinateFormatter.format(location.latitude)}, {coordinateFormatter.format(location.longitude)}
                </TableCell>
                <TableCell className="tabular-nums">{location.radiusMeters} m</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <ActiveStatusBadge isActive={location.isActive} />
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <Button variant="ghost" size="icon-sm" onClick={() => open(location)} aria-label={`Ubah ${location.name}`}>
                    <PencilIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <AttendanceLocationDialog open={dialogOpen} onOpenChange={setDialogOpen} location={editing} />
    </Card>
  );
}

function SchedulesCard() {
  const schedules = useWorkSchedules();
  const [editing, setEditing] = useState<WorkSchedule | null>(null);
  const rows = schedules.data ?? [];

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-lg font-semibold">Jam kerja</CardTitle>
        <CardDescription>Satu jadwal per kategori pegawai, berlaku Senin–Jumat. Hari tanpa presensi dibiarkan kosong.</CardDescription>
      </CardHeader>
      {schedules.isPending ? (
        <TableSkeleton rows={2} />
      ) : schedules.isError ? (
        <QueryErrorState error={schedules.error} onRetry={() => void schedules.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState icon={ClockIcon} title="Belum ada jam kerja" description="Jam kerja dibuat lewat seed database." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead className="pl-6">Kategori</TableHead>
              <TableHead>Jam kerja</TableHead>
              <TableHead className="hidden sm:table-cell">Toleransi</TableHead>
              <TableHead className="hidden md:table-cell">Pulang awal</TableHead>
              <TableHead className="w-16 pr-6">
                <span className="sr-only">Aksi</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((schedule) => (
              <TableRow key={schedule.id} className="hover:bg-accent/15">
                <TableCell className="pl-6">
                  <span className="block font-medium">{CATEGORY_LABELS[schedule.employeeCategory]}</span>
                  <span className="block text-xs text-muted-foreground">{schedule.name}</span>
                </TableCell>
                <TableCell className="tabular-nums">
                  {schedule.checkInTime}–{schedule.checkOutTime}
                </TableCell>
                <TableCell className="hidden tabular-nums sm:table-cell">{schedule.lateToleranceMinutes} menit</TableCell>
                <TableCell className="hidden md:table-cell">
                  {schedule.flagsEarlyLeave ? <Badge variant="accent">Dicatat</Badge> : <Badge variant="secondary">Fleksibel</Badge>}
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditing(schedule)} aria-label={`Ubah ${schedule.name}`}>
                    <PencilIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <WorkScheduleDialog
        schedule={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
    </Card>
  );
}
