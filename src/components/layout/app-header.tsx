import { Suspense } from "react";

import { AppBrand } from "@/components/layout/app-brand";
import { HeaderBreadcrumb } from "@/components/layout/header-breadcrumb";
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
    <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b bg-card px-4 md:px-6 lg:px-8">
      <MobileSidebar user={user} />
      <div className="lg:hidden">
        <AppBrand />
      </div>
      <div className="hidden lg:block">
        <Suspense>
          <HeaderBreadcrumb />
        </Suspense>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <NotificationMenu />
        <Separator orientation="vertical" className="mx-2 hidden h-6 sm:block" />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
