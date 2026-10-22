import { LayoutDashboardIcon, UsersIcon, type LucideIcon } from "lucide-react";

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
    title: "Menu Utama",
    items: [
      { title: "Dashboard", href: routes.dashboard, icon: LayoutDashboardIcon },
      { title: "Pegawai", href: routes.employees.list, icon: UsersIcon },
    ],
  },
];
