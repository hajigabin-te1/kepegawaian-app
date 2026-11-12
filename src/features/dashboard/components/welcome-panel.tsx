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
                <Link href={item.href} className="flex items-center justify-between gap-2 rounded-lg border px-4 py-3 text-sm font-medium hover:bg-accent/15">
                  <span className="flex items-center gap-2">
                    <item.icon className="size-4 text-muted-foreground" />
                    {item.title}
                  </span>
                  <ArrowRightIcon className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
