"use client";

import { ClipboardCheckIcon, UserXIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { routes } from "@/config/routes";
import { formatScore } from "@/features/performance/components/appraisal-parts";
import { useMyAppraisals } from "@/features/performance/hooks/use-performance";

function MyAppraisals({ employeeId }: { employeeId: string }) {
  const appraisals = useMyAppraisals(employeeId);

  if (appraisals.isPending) return <Skeleton className="h-48 w-full" />;
  if (appraisals.isError) return <QueryErrorState error={appraisals.error} onRetry={() => void appraisals.refetch()} />;
  if (appraisals.data.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardCheckIcon}
          title="Belum ada hasil penilaian"
          description="Hasil penilaian kinerja Anda tampil di sini setelah diverifikasi Bagian Kepegawaian."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {appraisals.data.map((appraisal) => (
        <Card key={appraisal.id} className="gap-0 py-0">
          <CardHeader className="flex flex-row items-center justify-between gap-4 border-b py-4">
            <CardTitle className="text-lg font-semibold">{appraisal.periodName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Nilai akhir: <span className="text-lg font-semibold tabular-nums text-foreground">{formatScore(appraisal.score)}</span>
            </p>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="pl-6">Indikator</TableHead>
                <TableHead className="hidden sm:table-cell">Target</TableHead>
                <TableHead className="hidden sm:table-cell">Realisasi</TableHead>
                <TableHead className="pr-6 text-right">Nilai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appraisal.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="pl-6 font-medium">{item.indicator}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{item.target || "—"}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{item.realization || "—"}</TableCell>
                  <TableCell className="pr-6 text-right tabular-nums">{item.score || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {appraisal.note ? (
            <CardContent className="border-t py-3 text-sm text-muted-foreground">Catatan: {appraisal.note}</CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

export function MyAppraisalsPanel({ employeeId }: { employeeId: string | null }) {
  return (
    <>
      <PageHeader
        title="Penilaian Saya"
        description="Hasil penilaian kinerja Anda yang sudah diverifikasi."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Penilaian Kinerja" }, { label: "Penilaian Saya" }]}
      />
      {employeeId ? (
        <MyAppraisals employeeId={employeeId} />
      ) : (
        <Card>
          <EmptyState
            icon={UserXIcon}
            title="Akun belum terhubung ke data pegawai"
            description="Hubungi Bagian Kepegawaian agar akun Anda dikaitkan dengan data pegawai."
          />
        </Card>
      )}
    </>
  );
}
