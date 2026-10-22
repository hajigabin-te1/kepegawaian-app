"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

import { findActiveNavItem, mainNavigation } from "@/config/navigation";

type SidebarNavProps = {
  onNavigate?: () => void;
};

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const activeHref = findActiveNavItem(pathname)?.href;

  return (
    <nav aria-label="Navigasi utama" className="flex flex-col gap-6 px-3 py-4">
      {mainNavigation.map((group) => (
        <div key={group.title} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-xs font-medium tracking-wide text-sidebar-foreground/60 uppercase">
            {group.title}
          </p>
          {group.items.map((item) => {
            const active = item.href === activeHref;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full before:bg-sidebar-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                )}
              >
                <Icon className={cn("size-4 shrink-0", active && "text-sidebar-primary")} />
                {item.title}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
