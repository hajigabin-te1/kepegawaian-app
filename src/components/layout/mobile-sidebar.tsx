"use client";

import { MenuIcon } from "lucide-react";

import { AppBrand } from "@/components/layout/app-brand";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarUser } from "@/components/layout/sidebar-user";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { SessionUser } from "@/features/auth/types/auth";
import { useUiStore } from "@/stores/ui-store";

type MobileSidebarProps = {
  user: SessionUser;
};

/** Drawer navigation for viewports below the `lg` breakpoint. */
export function MobileSidebar({ user }: MobileSidebarProps) {
  const open = useUiStore((state) => state.isMobileSidebarOpen);
  const setOpen = useUiStore((state) => state.setMobileSidebarOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="lg:hidden" />}
        aria-label="Buka menu navigasi"
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-80 gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&_[data-slot=sheet-close]]:text-sidebar-foreground [&_[data-slot=sheet-close]]:hover:bg-sidebar-accent"
      >
        <SheetHeader className="min-h-20 justify-center border-b border-sidebar-border px-5 py-4 pr-12">
          <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
          <AppBrand tone="inverse" />
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
        <SidebarUser user={user} />
      </SheetContent>
    </Sheet>
  );
}
