"use client";

import { ChevronLeftIcon } from "lucide-react";
import { cn } from "cn";

import { AppBrand } from "@/components/layout/app-brand";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarUser } from "@/components/layout/sidebar-user";
import type { SessionUser } from "@/features/auth/types/auth";
import { useUiStore } from "@/stores/ui-store";

type AppSidebarProps = {
  user: SessionUser;
};

/** Persistent, collapsible navy sidebar, visible from the `lg` breakpoint. */
export function AppSidebar({ user }: AppSidebarProps) {
  const collapsed = useUiStore((state) => state.isSidebarCollapsed);
  const toggleCollapsed = useUiStore((state) => state.toggleSidebarCollapsed);

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "sticky top-0 z-30 hidden h-svh shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out lg:flex",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <div className={cn("flex min-h-20 items-center border-b border-sidebar-border py-4", collapsed ? "justify-center px-3" : "px-5")}>
        <AppBrand tone="inverse" compact={collapsed} />
      </div>

      {/* Toggle sits on the sidebar edge and follows its width. */}
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
        aria-expanded={!collapsed}
        title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
        className="absolute top-7 -right-3.5 z-40 flex size-7 items-center justify-center rounded-full border-2 border-background bg-sidebar-primary text-sidebar-primary-foreground transition-colors hover:bg-card focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none"
      >
        <ChevronLeftIcon className={cn("size-4 transition-transform duration-200", collapsed && "rotate-180")} />
      </button>

      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <SidebarNav collapsed={collapsed} />
      </div>

      <SidebarUser user={user} collapsed={collapsed} />
    </aside>
  );
}
