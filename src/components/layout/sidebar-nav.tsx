"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

import { findActiveNavItem, mainNavigation } from "@/config/navigation";

type SidebarNavProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const activeHref = findActiveNavItem(pathname)?.href;

  return (
    <nav aria-label="Navigasi utama" className={cn("flex flex-col gap-6 py-5", collapsed ? "px-3" : "px-4")}>
      {mainNavigation.map((group) => (
        <div key={group.title} className="flex flex-col gap-1">
          {collapsed ? (
            <span aria-hidden="true" className="mx-auto mb-1 h-px w-6 bg-sidebar-border" />
          ) : (
            <p className="px-3 pb-1.5 text-xs font-medium text-sidebar-foreground/55">
              {group.title}
            </p>
          )}
          {group.items.map((item) => {
            const active = item.href === activeHref;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.title : undefined}
                aria-label={collapsed ? item.title : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
                  // The active indicator bar sits flush against the sidebar's left edge.
                  collapsed ? "justify-center before:-left-3" : "px-3 before:-left-4",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:inset-y-1.5 before:w-1 before:rounded-r-full before:bg-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
                    active ? "text-sidebar-primary" : "group-hover:text-sidebar-primary",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                {collapsed ? null : <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
