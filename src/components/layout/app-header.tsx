import { Suspense } from "react";

import { BrandMonogram } from "@/components/layout/app-brand";
import { HeaderBreadcrumb } from "@/components/layout/header-breadcrumb";
import { HeaderSearch } from "@/components/layout/header-search";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { NotificationMenu } from "@/components/layout/notification-menu";
import { UserMenu } from "@/components/layout/user-menu";
import { Separator } from "@/components/ui/separator";
import type { SessionUser } from "@/features/auth/types/auth";

type AppHeaderProps = {
  user: SessionUser;
};

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b bg-card">
      <div className="flex h-20 items-center gap-3 px-4 md:px-6 lg:px-8">
        <MobileSidebar user={user} />
        <BrandMonogram className="size-9 lg:hidden" />
        <Suspense>
          <HeaderBreadcrumb />
        </Suspense>
        <div className="ml-auto hidden flex-1 justify-end md:flex">
          <HeaderSearch />
        </div>
        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <NotificationMenu />
          <Separator orientation="vertical" className="mx-2 hidden h-8 sm:block" />
          <UserMenu user={user} />
        </div>
      </div>
      <div className="border-t px-4 py-2 md:hidden">
        <HeaderSearch />
      </div>
    </header>
  );
}
