import { Suspense } from "react";

import { AppBrand } from "@/components/layout/app-brand";
import { SidebarNav } from "@/components/layout/sidebar-nav";

/** Persistent sidebar, visible from the `lg` breakpoint. */
export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b px-5">
        <AppBrand />
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <Suspense>
          <SidebarNav />
        </Suspense>
      </div>
    </aside>
  );
}
