"use client";

import { GraduationCapIcon, Loader2Icon, UserXIcon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { routes } from "@/config/routes";
import { todayInCampus } from "@/features/attendance/services/attendance-service";
import { RegistrationStatusBadge, formatDate, formatPeriod, isRegistrationOpen } from "@/features/training/components/training-parts";
import { useApplyTraining, useMyRegistrations, useTrainings } from "@/features/training/hooks/use-training";
import { ApiError } from "@/lib/api-error";

function MyTraining({ employeeId }: { employeeId: string }) {
  const trainings = useTrainings();
  const registrations = useMyRegistrations(employeeId);
  const apply = useApplyTraining(employeeId);
  const today = todayInCampus();

  const registered = new Set((registrations.data ?? []).map((r) => r.trainingId));
  const open = (trainings.data ?? []).filter((t) => isRegistrationOpen(t, today));

  const onApply = (trainingId: string) =>
    apply.mutate(trainingId, {
      onSuccess: () => toast.success("Pendaftaran terkirim. Menunggu persetujuan Bagian Kepegawaian."),
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Pendaftaran gagal."),
    });

  return (
    <>
      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-lg font-semibold">Diklat yang dibuka</CardTitle>
        </CardHeader>
        {trainings.isPending ? (
          <TableSkeleton rows={3} />
        ) : trainings.isError ? (
          <QueryErrorState error={trainings.error} onRetry={() => void trainings.refetch()} />
        ) : open.length === 0 ? (
          <EmptyState icon={GraduationCapIcon} title="Belum ada pendaftaran dibuka" description="Diklat yang membuka pendaftaran akan tampil di sini." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="pl-6">Diklat</TableHead>
                <TableHead className="hidden md:table-cell">Jadwal</TableHead>
                <TableHead className="hidden sm:table-cell">Pendaftaran s.d.</TableHead>
                <TableHead className="pr-6">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {open.map((training) => (
                <TableRow key={training.id} className="hover:bg-accent/15">
                  <TableCell className="pl-6">
                    <p className="font-medium">{training.name}</p>
                    <p className="text-xs text-muted-foreground">{training.organizer ?? "Penyelenggara belum diisi"}</p>
                    {training.description ? <p className="text-xs text-muted-foreground">{training.description}</p> : null}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">{formatPeriod(training.startDate, training.endDate)}</TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">{training.closesOn ? formatDate(training.closesOn) : "—"}</TableCell>
                  <TableCell className="pr-6 text-right">
                    {registered.has(training.id) ? (
                      <span className="text-sm text-muted-foreground">Sudah mendaftar</span>
                    ) : (
                      <Button size="sm" onClick={() => onApply(training.id)} disabled={apply.isPending}>
                        {apply.isPending ? <Loader2Icon className="animate-spin" /> : null}
                        Daftar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-lg font-semibold">Pendaftaran saya</CardTitle>
        </CardHeader>
        {registrations.isPending ? (
          <TableSkeleton rows={3} />
        ) : registrations.isError ? (
          <QueryErrorState error={registrations.error} onRetry={() => void registrations.refetch()} />
        ) : registrations.data.length === 0 ? (
          <EmptyState icon={GraduationCapIcon} title="Belum ada pendaftaran" description="Diklat yang Anda daftar akan tampil di sini beserta statusnya." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="pl-6">Diklat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden pr-6 sm:table-cell">Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.data.map((registration) => (
                <TableRow key={registration.id} className="hover:bg-accent/15">
                  <TableCell className="pl-6 font-medium">{registration.trainingName}</TableCell>
                  <TableCell>
                    <RegistrationStatusBadge status={registration.status} />
                  </TableCell>
                  <TableCell className="hidden pr-6 text-muted-foreground sm:table-cell">{registration.resultNote ?? registration.decisionNote ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}

export function TrainingPanel({ employeeId }: { employeeId: string | null }) {
  return (
    <>
      <PageHeader
        title="Diklat"
        description="Daftar diklat yang dibuka dan pantau status pendaftaran Anda. Diklat yang selesai masuk ke riwayat pelatihan Anda."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Pengembangan Pegawai" }, { label: "Diklat" }]}
      />
      {employeeId ? (
        <MyTraining employeeId={employeeId} />
      ) : (
        <Card>
          <EmptyState icon={UserXIcon} title="Akun belum terhubung ke data pegawai" description="Hubungi Bagian Kepegawaian agar akun Anda dikaitkan dengan data pegawai." />
        </Card>
      )}
    </>
  );
}
