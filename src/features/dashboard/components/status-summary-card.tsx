import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/features/dashboard/data/mock-dashboard";

type StatusSummaryCardProps = {
  stats: DashboardStats;
};

const numberFormatter = new Intl.NumberFormat("id-ID");
const percentFormatter = new Intl.NumberFormat("id-ID", { style: "percent", maximumFractionDigits: 1 });

export function StatusSummaryCard({ stats }: StatusSummaryCardProps) {
  const rows = [
    { label: "Aktif", value: stats.activeEmployees, barClass: "bg-primary" },
    { label: "Cuti", value: stats.onLeaveEmployees, barClass: "bg-warning" },
    { label: "Nonaktif", value: stats.inactiveEmployees, barClass: "bg-destructive" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Status Kepegawaian</CardTitle>
        <CardDescription>
          Komposisi {numberFormatter.format(stats.totalEmployees)} pegawai berdasarkan status.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row) => {
          const share = stats.totalEmployees > 0 ? row.value / stats.totalEmployees : 0;
          return (
            <div key={row.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{row.label}</span>
                <span className="text-muted-foreground tabular-nums">
                  {numberFormatter.format(row.value)} · {percentFormatter.format(share)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${row.barClass}`} style={{ width: `${share * 100}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
