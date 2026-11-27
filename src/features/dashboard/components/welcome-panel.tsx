"use client";

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { navigationFor } from "@/config/navigation";
import { routes } from "@/config/routes";
import { CheckInCard } from "@/features/attendance/components/check-in-card";
import { PendingActionsCard } from "@/features/dashboard/components/pending-actions-card";
import type { SessionUser } from "@/features/auth/types/auth";

/** Home for accounts without statistics access: today's attendance and shortcuts to their menus. */
export function WelcomePanel({ user }: { user: SessionUser }) {
  const links = navigationFor(user.permissions)
    .flatMap((group) => group.items)
    .filter((item) => item.href !== routes.dashboard);
  const hasPending = ["leave.manage", "employee.manage", "appraisal.manage"].some((p) => user.permissions.includes(p));

  return (
    <>
      <PageHeader title={`Selamat datang, ${user.displayName}`} description={user.roleName} />
      {user.employeeId ? <CheckInCard employeeId={user.employeeId} /> : null}
      {hasPending ? <PendingActionsCard permissions={user.permissions} /> : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Menu Anda</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group/menu flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5 text-sm font-medium transition-colors hover:border-accent hover:bg-accent/10 focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                      <item.icon className="size-4" />
                    </span>
                    <span className="truncate">{item.title}</span>
                  </span>
                  <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/menu:translate-x-0.5 group-hover/menu:text-primary motion-reduce:transition-none" />
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
