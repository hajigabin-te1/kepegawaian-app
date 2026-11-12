import {
  ArrowRightLeftIcon,
  BookOpenCheckIcon,
  BriefcaseIcon,
  Building2Icon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  CalendarHeartIcon,
  CalendarOffIcon,
  CalendarRangeIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  ClipboardPenLineIcon,
  FilePenLineIcon,
  FileTextIcon,
  GaugeIcon,
  GraduationCapIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  MegaphoneIcon,
  NetworkIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  UserCogIcon,
  UserRoundIcon,
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
      { title: "Pengumuman", href: routes.announcements, icon: MegaphoneIcon },
      { title: "Profil Saya", href: routes.profile.me, icon: UserRoundIcon },
    ],
  },
  {
    title: "Kepegawaian",
    items: [
      { title: "Data Pegawai", href: routes.employees.list, icon: UsersIcon, permission: PERMISSIONS.employeeView },
      { title: "Perbaikan Data", href: routes.employees.changeRequests, icon: FilePenLineIcon, permission: PERMISSIONS.employeeManage },
      { title: "Riwayat Jabatan", href: routes.histories.positions, icon: HistoryIcon, permission: PERMISSIONS.employeeView },
      { title: "Riwayat Pendidikan", href: routes.histories.education, icon: GraduationCapIcon, permission: PERMISSIONS.employeeView },
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
    title: "Penilaian Kinerja",
    items: [
      { title: "Penilaian Saya", href: routes.performance.me, icon: ClipboardCheckIcon },
      { title: "Form Penilaian", href: routes.performance.forms, icon: ClipboardPenLineIcon, permission: PERMISSIONS.appraisalManage },
      { title: "Periode Penilaian", href: routes.performance.periods, icon: CalendarRangeIcon, permission: PERMISSIONS.appraisalManage },
      { title: "Rekap Nilai", href: routes.performance.recap, icon: GaugeIcon, permission: PERMISSIONS.appraisalManage },
    ],
  },
  {
    title: "Pengembangan Pegawai",
    items: [
      { title: "Diklat", href: routes.training.me, icon: GraduationCapIcon },
      { title: "Kelola Diklat", href: routes.training.manage, icon: BookOpenCheckIcon, permission: PERMISSIONS.trainingManage },
      { title: "Mutasi", href: routes.mutations, icon: ArrowRightLeftIcon, permission: PERMISSIONS.mutationManage },
      { title: "Kenaikan Pangkat", href: routes.promotions, icon: TrendingUpIcon, permission: PERMISSIONS.promotionManage },
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
