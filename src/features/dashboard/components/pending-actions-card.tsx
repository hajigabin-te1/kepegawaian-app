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

  if (!counts.isPending && !counts.isError && items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Perlu tindakan</CardTitle>
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
                <Link href={item.href} className="flex items-center justify-between gap-4 py-2.5 text-sm hover:text-primary">
                  <span>{item.label}</span>
                  <span className="flex items-center gap-2 font-semibold tabular-nums">
                    {item.count}
                    <ArrowRightIcon className="size-4 text-muted-foreground" />
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
