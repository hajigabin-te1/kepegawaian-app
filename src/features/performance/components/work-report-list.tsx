"use client";

import type { ReactNode } from "react";

import { APP_TIME_ZONE } from "@/config/locale";
import { FileLinkButton } from "@/features/documents/components/file-link-button";
import { getEvidenceUrl } from "@/features/performance/services/work-report-service";
import type { WorkReport } from "@/features/performance/types/performance";

const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: APP_TIME_ZONE });

type WorkReportListProps = {
  reports: WorkReport[];
  /** Per-report actions (owner: edit/delete, HR: delete); omitted for read-only views. */
  renderActions?: (report: WorkReport) => ReactNode;
};

/** Numbered list of work reports with description, evidence link, and date. Shared by employee and HR views. */
export function WorkReportList({ reports, renderActions }: WorkReportListProps) {
  return (
    <ol className="divide-y">
      {reports.map((report, index) => (
        <li key={report.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-start">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium tabular-nums text-secondary-foreground">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm whitespace-pre-line">{report.description}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <FileLinkButton path={report.evidencePath} label={report.evidenceName} resolveUrl={getEvidenceUrl} />
              <span>Dikirim {dateFormatter.format(new Date(report.createdAt))}</span>
              {report.updatedAt !== report.createdAt ? <span>· diubah {dateFormatter.format(new Date(report.updatedAt))}</span> : null}
            </div>
          </div>
          {renderActions ? <div className="flex shrink-0 gap-2 sm:justify-end">{renderActions(report)}</div> : null}
        </li>
      ))}
    </ol>
  );
}
