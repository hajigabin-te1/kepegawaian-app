import { Suspense } from "react";

import { AppBrand } from "@/components/layout/app-brand";
import { SidebarNav } from "@/components/layout/sidebar-nav";

/** Persistent sidebar, visible from the `lg` breakpoint. */
export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <AppBrand />
      </div>
      <div className="flex-1 overflow-y-auto">
        <Suspense>
          <SidebarNav />
        </Suspense>
      </div>
    </aside>
  );
}
