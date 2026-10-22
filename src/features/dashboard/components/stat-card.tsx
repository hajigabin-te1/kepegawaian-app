import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

import { Card, CardContent } from "@/components/ui/card";

type StatTone = "neutral" | "positive" | "warning";

type StatCardProps = {
  title: string;
  value: number;
  icon: LucideIcon;
  /** Short status chip, e.g. "+6 bulan ini". */
  status: string;
  statusTone?: StatTone;
  description: string;
};

const numberFormatter = new Intl.NumberFormat("id-ID");

const STATUS_TONES: Record<StatTone, string> = {
  neutral: "bg-accent/30 text-accent-foreground",
  positive: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
};

export function StatCard({ title, value, icon: Icon, status, statusTone = "neutral", description }: StatCardProps) {
  return (
    <Card size="sm" className="relative overflow-hidden transition-colors hover:border-accent">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-accent" />
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Icon className="size-5" />
          </span>
          <p className="text-xs leading-snug font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
        </div>
        <div className="flex items-end justify-between gap-2">
          <p className="text-3xl font-semibold tracking-tight tabular-nums">{numberFormatter.format(value)}</p>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium tabular-nums", STATUS_TONES[statusTone])}>
            {status}
          </span>
        </div>
        <p className="border-t pt-3 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
