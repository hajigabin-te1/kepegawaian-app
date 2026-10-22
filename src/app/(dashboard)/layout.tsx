import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { getSession } from "@/features/auth/services/session";

async function SessionUserMenu() {
  const user = await getSession();
  // The proxy already guards these routes; this is a second line of defense.
  if (!user) redirect(routes.login);
  return <UserMenu user={user} />;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-1">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          userSlot={
            <Suspense fallback={<Skeleton className="h-10 w-40" />}>
              <SessionUserMenu />
            </Suspense>
          }
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
