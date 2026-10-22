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
    <Card size="sm">
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted text-primary">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{title}</p>
            <p className="truncate text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">{numberFormatter.format(value)}</p>
      </CardContent>
    </Card>
  );
}
