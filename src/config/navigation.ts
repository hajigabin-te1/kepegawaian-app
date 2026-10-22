import { LayoutDashboardIcon, UserPlusIcon, UsersIcon, type LucideIcon } from "lucide-react";

import { routes } from "@/config/routes";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const mainNavigation: NavGroup[] = [
  {
    title: "Menu utama",
    items: [{ title: "Dashboard", href: routes.dashboard, icon: LayoutDashboardIcon }],
  },
  {
    title: "Kepegawaian",
    items: [
      { title: "Data Pegawai", href: routes.employees.list, icon: UsersIcon },
      { title: "Tambah Pegawai", href: routes.employees.create, icon: UserPlusIcon },
    ],
  },
];

function matchesPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Returns the most specific navigation item matching the pathname. */
export function findActiveNavItem(pathname: string): NavItem | undefined {
  return mainNavigation
    .flatMap((group) => group.items)
    .filter((item) => matchesPath(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
