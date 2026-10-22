"use client";

import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
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
  const toggleLabel = collapsed ? "Perluas sidebar" : "Ciutkan sidebar";
  const ToggleIcon = collapsed ? PanelLeftOpenIcon : PanelLeftCloseIcon;

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "sticky top-0 z-30 hidden h-svh shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <div className={cn("flex min-h-20 items-center border-b border-sidebar-border py-4", collapsed ? "justify-center px-3" : "px-5")}>
        <AppBrand tone="inverse" compact={collapsed} />
      </div>

      {/* Toggle sits on the corner where the brand row meets the sidebar edge, clear of the monogram in both widths. */}
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={toggleLabel}
        aria-expanded={!collapsed}
        title={toggleLabel}
        className="group/toggle absolute top-[62px] -right-[18px] z-40 flex size-9 items-center justify-center rounded-lg border border-border bg-card text-primary shadow-xs transition-colors hover:border-accent hover:bg-secondary focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none active:bg-accent/30"
      >
        <ToggleIcon className="size-[18px] transition-transform duration-150 group-hover/toggle:-translate-x-px motion-reduce:transition-none" />
      </button>

      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <SidebarNav collapsed={collapsed} />
      </div>

      <SidebarUser user={user} collapsed={collapsed} />
    </aside>
  );
}
