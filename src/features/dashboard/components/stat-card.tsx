import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
};

const numberFormatter = new Intl.NumberFormat("id-ID");

export function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <Card size="sm" className="relative transition-colors hover:border-accent">
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/25 text-primary">
            <Icon className="size-4" />
          </span>
        </div>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">{numberFormatter.format(value)}</p>
        <p className="border-t pt-3 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
