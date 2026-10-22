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

/** Route-derived breadcrumb shown in the top header. */
export function HeaderBreadcrumb() {
  const pathname = usePathname();
  const activeItem = findActiveNavItem(pathname);
  const isNested = activeItem !== undefined && pathname !== activeItem.href;

  return (
    <Breadcrumb>
      <BreadcrumbList>
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
                <BreadcrumbPage className="font-medium">{activeItem.title}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        ) : null}
        {isNested ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">Detail</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
