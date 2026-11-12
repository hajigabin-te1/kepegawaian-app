"use client";

import type { ReactNode } from "react";
import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const numberFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
export const formatNumber = (value: number) => numberFormatter.format(value);

/** Titled table card with an optional CSV download for HR reports. */
export function SectionCard({ title, onDownload, children }: { title: string; onDownload?: () => void; children: ReactNode }) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b py-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {onDownload ? (
          <Button variant="outline" size="sm" onClick={onDownload}>
            <DownloadIcon />
            Unduh CSV
          </Button>
        ) : null}
      </CardHeader>
      {children}
    </Card>
  );
}

/** One figure with its label, used in summary strips. */
export function Figure({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="space-y-1 px-5 py-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

/** Dosen vs. tenaga kependidikan as one stacked bar. */
export function CategoryBar({ lecturers, staff }: { lecturers: number; staff: number }) {
  const total = lecturers + staff;
  const lecturerShare = total > 0 ? (lecturers / total) * 100 : 0;
  return (
    <div className="space-y-2 px-5 pb-4">
      <div className="flex h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`Dosen ${lecturers}, tenaga kependidikan ${staff}`}>
        <div className="bg-primary" style={{ width: `${lecturerShare}%` }} />
        <div className="bg-accent" style={{ width: `${total > 0 ? 100 - lecturerShare : 0}%` }} />
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" />
          Dosen
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-accent" />
          Tenaga kependidikan
        </span>
      </div>
    </div>
  );
}
