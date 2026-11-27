"use client";

import Link from "next/link";
import { ArrowRightIcon, CheckCircle2Icon } from "lucide-react";

import { QueryErrorState } from "@/components/common/query-error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { usePendingCounts } from "@/features/dashboard/hooks/use-dashboard";

/** Work waiting for HR. Shown only for the areas the user manages. */
export function PendingActionsCard({ permissions }: { permissions: readonly string[] }) {
  const counts = usePendingCounts(permissions);

  const items = counts.data
    ? [
        { label: "Pengajuan cuti/izin menunggu persetujuan", count: counts.data.leave, href: routes.leave.requests },
        { label: "Pengajuan perbaikan data menunggu persetujuan", count: counts.data.profileChanges, href: routes.employees.changeRequests },
        { label: "Penilaian kinerja menunggu verifikasi", count: counts.data.appraisals, href: routes.performance.forms },
      ].filter((item) => item.count !== null)
    : [];
  const waiting = items.filter((item) => (item.count ?? 0) > 0);
  const totalWaiting = waiting.reduce((sum, item) => sum + (item.count ?? 0), 0);

  if (!counts.isPending && !counts.isError && items.length === 0) return null;

  return (
    // The accent edge marks the card only while something is waiting, so it reads as a signal rather than decoration.
    <Card className={totalWaiting > 0 ? "border-l-4 border-l-accent" : undefined}>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-lg font-semibold">Perlu tindakan</CardTitle>
        {totalWaiting > 0 ? <span className="text-sm text-muted-foreground tabular-nums">{totalWaiting} pengajuan menunggu</span> : null}
      </CardHeader>
      <CardContent>
        {counts.isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : counts.isError ? (
          <QueryErrorState error={counts.error} onRetry={() => void counts.refetch()} />
        ) : waiting.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2Icon className="size-4 text-success" />
            Tidak ada pengajuan yang menunggu.
          </p>
        ) : (
          <ul className="divide-y">
            {waiting.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group/item -mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-accent/15 focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none"
                >
                  <span>{item.label}</span>
                  <span className="flex items-center gap-3">
                    <span className="min-w-8 rounded-md bg-primary px-2 py-0.5 text-center text-xs font-semibold text-primary-foreground tabular-nums">
                      {item.count}
                    </span>
                    <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover/item:translate-x-0.5 group-hover/item:text-primary motion-reduce:transition-none" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
