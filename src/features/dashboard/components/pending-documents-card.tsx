import { FileClockIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PendingDocument } from "@/features/dashboard/data/mock-dashboard";

/** Documents waiting longer than this are flagged. */
const OVERDUE_AFTER_DAYS = 7;

type PendingDocumentsCardProps = {
  documents: PendingDocument[];
};

export function PendingDocumentsCard({ documents }: PendingDocumentsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Dokumen Menunggu Verifikasi</CardTitle>
        <CardDescription>Berkas terbaru yang perlu diperiksa.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <ul className="divide-y">
          {documents.map((document) => (
            <li key={document.id} className="flex items-center gap-3 px-(--card-spacing) py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                <FileClockIcon className="size-4" />
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium">{document.documentType}</p>
                <p className="truncate text-xs text-muted-foreground">{document.employeeName}</p>
              </div>
              <Badge variant={document.waitingDays > OVERDUE_AFTER_DAYS ? "warning" : "accent"} className="tabular-nums">
                {document.waitingDays} hari
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
