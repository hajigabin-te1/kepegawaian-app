import { Suspense } from "react";

import { AppBrand } from "@/components/layout/app-brand";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarUser } from "@/components/layout/sidebar-user";
import type { SessionUser } from "@/features/auth/types/auth";

type AppSidebarProps = {
  user: SessionUser;
};

/** Persistent navy sidebar, visible from the `lg` breakpoint. */
export function AppSidebar({ user }: AppSidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <AppBrand tone="inverse" />
      </div>
      <div className="flex-1 overflow-y-auto">
        <Suspense>
          <SidebarNav />
        </Suspense>
      </div>
      <SidebarUser user={user} />
    </aside>
  );
}
