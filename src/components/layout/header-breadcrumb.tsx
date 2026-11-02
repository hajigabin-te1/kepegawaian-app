"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { findActiveNavItem } from "@/config/navigation";
import { routes } from "@/config/routes";

/** Pages reachable from the user menu rather than the sidebar. */
const STANDALONE_PAGE_TITLES: Record<string, string> = {
  [routes.profile.password]: "Ganti Password",
};

/** Route-derived breadcrumb and current section title shown in the top header. */
export function HeaderBreadcrumb() {
  const pathname = usePathname();
  const standaloneTitle = STANDALONE_PAGE_TITLES[pathname];
  const activeItem = findActiveNavItem(pathname);
  const isNested = activeItem !== undefined && pathname !== activeItem.href;
  const title = standaloneTitle ?? (isNested ? "Detail" : (activeItem?.title ?? "Beranda"));

  return (
    <div className="min-w-0 leading-tight">
      <Breadcrumb>
        <BreadcrumbList className="gap-1 text-xs">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={routes.dashboard} />}>Beranda</BreadcrumbLink>
          </BreadcrumbItem>
          {activeItem ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isNested ? (
                  <BreadcrumbLink render={<Link href={activeItem.href} />}>{activeItem.title}</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="text-muted-foreground">{activeItem.title}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </>
          ) : null}
          {standaloneTitle ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-muted-foreground">{standaloneTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : null}
          {isNested ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-muted-foreground">Detail</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : null}
        </BreadcrumbList>
      </Breadcrumb>
      <p className="mt-0.5 truncate text-lg font-semibold tracking-tight">{title}</p>
    </div>
  );
}
