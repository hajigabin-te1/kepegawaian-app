"use client";

import { MenuIcon } from "lucide-react";

import { AppBrand } from "@/components/layout/app-brand";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useUiStore } from "@/stores/ui-store";

/** Drawer navigation for viewports below the `lg` breakpoint. */
export function MobileSidebar() {
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
      <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="h-14 justify-center border-b">
          <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
          <AppBrand />
        </SheetHeader>
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
