import {
  Building2Icon,
  BriefcaseIcon,
  FileTextIcon,
  GraduationCapIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  NetworkIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserCogIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import { PERMISSIONS, type PermissionCode } from "@/config/permissions";
import { routes } from "@/config/routes";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Shown only to users holding this permission; omitted = every signed-in user. */
  permission?: PermissionCode;
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
      { title: "Data Pegawai", href: routes.employees.list, icon: UsersIcon, permission: PERMISSIONS.employeeView },
      { title: "Riwayat Jabatan", href: routes.histories.positions, icon: HistoryIcon, permission: PERMISSIONS.employeeView },
      { title: "Riwayat Pendidikan", href: routes.histories.education, icon: GraduationCapIcon, permission: PERMISSIONS.employeeView },
    ],
  },
  {
    title: "Organisasi",
    items: [
      { title: "Unit Kerja", href: routes.masterData.workUnits, icon: Building2Icon, permission: PERMISSIONS.masterManage },
      { title: "Jabatan", href: routes.masterData.positions, icon: BriefcaseIcon, permission: PERMISSIONS.masterManage },
      { title: "Struktur Organisasi", href: routes.masterData.organization, icon: NetworkIcon, permission: PERMISSIONS.masterManage },
    ],
  },
  {
    title: "Dokumen",
    items: [{ title: "Dokumen Pegawai", href: routes.documents, icon: FileTextIcon, permission: PERMISSIONS.employeeView }],
  },
  {
    title: "Pengaturan",
    items: [
      { title: "Pengguna", href: routes.accounts, icon: UserCogIcon, permission: PERMISSIONS.userManage },
      { title: "Peran & Hak Akses", href: routes.settings.roles, icon: ShieldCheckIcon, permission: PERMISSIONS.roleManage },
      { title: "Pengaturan Aplikasi", href: routes.settings.app, icon: SettingsIcon, permission: PERMISSIONS.settingsManage },
    ],
  },
];

/** Navigation groups the user may see; empty groups are dropped. */
export function navigationFor(permissions: readonly string[]): NavGroup[] {
  return mainNavigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || permissions.includes(item.permission)),
    }))
    .filter((group) => group.items.length > 0);
}

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
