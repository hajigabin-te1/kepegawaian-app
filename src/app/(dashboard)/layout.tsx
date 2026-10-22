import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { getSession } from "@/features/auth/services/session";

async function DashboardShell({ children }: { children: ReactNode }) {
  const user = await getSession();
  // The proxy already guards these routes; this is a second line of defense.
  if (!user) redirect(routes.login);

  return (
    <div className="flex min-h-svh flex-1">
      <AppSidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader user={user} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

function DashboardShellFallback() {
  return (
    <div className="flex min-h-svh flex-1">
      <div className="hidden w-64 shrink-0 bg-sidebar lg:block" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center border-b bg-card px-4 md:px-6 lg:px-8">
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<DashboardShellFallback />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
