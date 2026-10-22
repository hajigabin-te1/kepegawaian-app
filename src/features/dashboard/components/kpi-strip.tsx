import type { ReactNode } from "react";
import { FileClockIcon, UserCheckIcon, UserPlusIcon, UsersIcon, type LucideIcon } from "lucide-react";
import { cn } from "cn";

import type { DashboardStats } from "@/features/dashboard/data/mock-dashboard";

type KpiTone = "neutral" | "positive" | "warning";

type Kpi = {
  label: string;
  value: number;
  icon: LucideIcon;
  detail: ReactNode;
};

const numberFormatter = new Intl.NumberFormat("id-ID");

const NOTE_TONES: Record<KpiTone, string> = {
  neutral: "text-muted-foreground",
  positive: "text-success",
  warning: "text-warning-foreground",
};

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function KpiNote({ children, tone = "neutral" }: { children: ReactNode; tone?: KpiTone }) {
  return <p className={cn("text-xs font-medium tabular-nums", NOTE_TONES[tone])}>{children}</p>;
}

function toPercent(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0;
}

/** Proportion of active, on-leave, and inactive employees as one stacked bar. */
function StatusBar({ stats }: { stats: DashboardStats }) {
  const segments = [
    { label: "Aktif", value: stats.activeEmployees, className: "bg-primary" },
    { label: "Cuti", value: stats.onLeaveEmployees, className: "bg-accent" },
    { label: "Nonaktif", value: stats.inactiveEmployees, className: "bg-muted-foreground/40" },
  ];

  return (
    <div className="space-y-2">
      <div
        role="img"
        aria-label={segments.map((segment) => `${segment.label} ${segment.value}`).join(", ")}
        className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-muted"
      >
        {segments.map((segment) => (
          <span
            key={segment.label}
            className={segment.className}
            style={{ width: `${toPercent(segment.value, stats.totalEmployees)}%` }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={cn("size-2 rounded-full", segment.className)} />
            {segment.label} <span className="font-medium text-foreground tabular-nums">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type KpiStripProps = {
  stats: DashboardStats;
};

/** Key employee metrics in a single segmented strip rather than separate cards. */
export function KpiStrip({ stats }: KpiStripProps) {
  const newEmployeesDelta = stats.newEmployeesThisMonth - stats.newEmployeesLastMonth;

  const kpis: Kpi[] = [
    {
      label: "Total pegawai",
      value: stats.totalEmployees,
      icon: UsersIcon,
      detail: <KpiNote>Dosen dan tenaga kependidikan</KpiNote>,
    },
    {
      label: "Pegawai aktif",
      value: stats.activeEmployees,
      icon: UserCheckIcon,
      detail: <StatusBar stats={stats} />,
    },
    {
      label: "Pegawai baru bulan ini",
      value: stats.newEmployeesThisMonth,
      icon: UserPlusIcon,
      detail: (
        <KpiNote tone={newEmployeesDelta >= 0 ? "positive" : "warning"}>
          {formatDelta(newEmployeesDelta)} dibanding bulan lalu
        </KpiNote>
      ),
    },
    {
      label: "Dokumen menunggu verifikasi",
      value: stats.pendingDocuments,
      icon: FileClockIcon,
      detail: (
        <KpiNote tone={stats.overdueDocuments > 0 ? "warning" : "neutral"}>
          {stats.overdueDocuments} menunggu lebih dari 7 hari
        </KpiNote>
      ),
    },
  ];

  return (
    <section aria-label="Indikator utama" className="overflow-hidden rounded-lg border bg-card">
      {/* gap-px over a border-colored background draws the dividers at every breakpoint. */}
      <dl className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, detail }) => (
          <div key={label} className="flex flex-col gap-3 bg-card p-5">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className="size-4 text-primary" />
              {label}
            </dt>
            <dd className="text-3xl font-semibold tracking-tight tabular-nums">{numberFormatter.format(value)}</dd>
            <dd className="mt-auto">{detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
