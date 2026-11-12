import {
  Building2Icon,
  BriefcaseIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  CalendarHeartIcon,
  CalendarOffIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  FilePenLineIcon,
  UserCogIcon,
  UserRoundIcon,
  UserPlusIcon,
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
    items: [
      { title: "Dashboard", href: routes.dashboard, icon: LayoutDashboardIcon },
      { title: "Profil Saya", href: routes.profile.me, icon: UserRoundIcon },
    ],
  },
  {
    title: "Kepegawaian",
    items: [
      { title: "Data Pegawai", href: routes.employees.list, icon: UsersIcon, permission: PERMISSIONS.employeeView },
      { title: "Perbaikan Data", href: routes.employees.changeRequests, icon: FilePenLineIcon, permission: PERMISSIONS.employeeManage },
      { title: "Tambah Pegawai", href: routes.employees.create, icon: UserPlusIcon, permission: PERMISSIONS.employeeManage },
    ],
  },
  {
    title: "Presensi",
    items: [
      { title: "Presensi Saya", href: routes.attendance.me, icon: CalendarCheckIcon },
      { title: "Rekap Presensi", href: routes.attendance.recap, icon: ClipboardListIcon, permission: PERMISSIONS.attendanceView },
    ],
  },
  {
    title: "Cuti & Izin",
    items: [
      { title: "Cuti Saya", href: routes.leave.me, icon: CalendarHeartIcon },
      { title: "Pengajuan Cuti", href: routes.leave.requests, icon: CalendarDaysIcon, permission: PERMISSIONS.leaveView },
      { title: "Hari Libur", href: routes.leave.holidays, icon: CalendarOffIcon, permission: PERMISSIONS.leaveManage },
    ],
  },
  {
    title: "Master data",
    items: [
      { title: "Unit Kerja", href: routes.masterData.workUnits, icon: Building2Icon, permission: PERMISSIONS.masterManage },
      { title: "Jabatan", href: routes.masterData.positions, icon: BriefcaseIcon, permission: PERMISSIONS.masterManage },
    ],
  },
  {
    title: "Administrasi",
    items: [{ title: "Akun Pengguna", href: routes.accounts, icon: UserCogIcon, permission: PERMISSIONS.userManage }],
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
