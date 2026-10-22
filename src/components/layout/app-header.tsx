import type { ReactNode } from "react";

import { AppBrand } from "@/components/layout/app-brand";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";

type AppHeaderProps = {
  userSlot: ReactNode;
};

export function AppHeader({ userSlot }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b bg-card px-4 md:px-6 lg:px-8">
      <MobileSidebar />
      <div className="lg:hidden">
        <AppBrand />
      </div>
      <div className="ml-auto flex items-center gap-2">{userSlot}</div>
    </header>
  );
}
