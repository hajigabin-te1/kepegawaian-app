"use client";

import { useState } from "react";
import { GaugeIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { routes } from "@/config/routes";
import { PeriodSelect, formatScore } from "@/features/performance/components/appraisal-parts";
import { useAppraisalRecap, usePeriods } from "@/features/performance/hooks/use-performance";

const CATEGORY_LABELS = { lecturer: "Dosen", staff: "Tenaga Kependidikan" } as const;

/** Period picker plus the recap table; also used on the statistics dashboard. */
export function AppraisalRecapView() {
  const periods = usePeriods();
  const [chosen, setChosen] = useState("");
  const periodId = chosen || periods.data?.[0]?.id || "";
  const recap = useAppraisalRecap(periodId);

  return (
    <div className="space-y-4">
      {periods.data ? <PeriodSelect periods={periods.data} value={periodId} onChange={setChosen} /> : null}
      <Card className="gap-0 py-0">
        {periods.isPending || (periodId !== "" && recap.isPending) ? (
          <TableSkeleton />
        ) : periods.isError ? (
          <QueryErrorState error={periods.error} onRetry={() => void periods.refetch()} />
        ) : recap.isError ? (
          <QueryErrorState error={recap.error} onRetry={() => void recap.refetch()} />
        ) : !recap.data || recap.data.length === 0 ? (
          <EmptyState icon={GaugeIcon} title="Belum ada nilai terverifikasi" description="Rekap muncul setelah form penilaian diverifikasi pada periode ini." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="pl-6">Unit kerja</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Dinilai</TableHead>
                <TableHead className="text-right">Rata-rata</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Terendah</TableHead>
                <TableHead className="hidden pr-6 text-right sm:table-cell">Tertinggi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recap.data.map((row) => (
                <TableRow key={`${row.workUnitName}-${row.category}`} className="hover:bg-accent/15">
                  <TableCell className="pl-6 font-medium">{row.workUnitName}</TableCell>
                  <TableCell>{CATEGORY_LABELS[row.category]}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.appraisedEmployees}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatScore(row.averageScore)}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{formatScore(row.lowestScore)}</TableCell>
                  <TableCell className="hidden pr-6 text-right tabular-nums sm:table-cell">{formatScore(row.highestScore)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

export function RecapPanel() {
  return (
    <>
      <PageHeader
        title="Rekap Nilai Kinerja"
        description="Rata-rata nilai per unit kerja dan kategori. Hanya form yang sudah diverifikasi yang dihitung."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Penilaian Kinerja" }, { label: "Rekap Nilai" }]}
      />
      <AppraisalRecapView />
    </>
  );
}
