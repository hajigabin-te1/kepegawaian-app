import { routes } from "@/config/routes";

/** Permission codes from public.permissions that the frontend checks. */
export const PERMISSIONS = {
  userManage: "user.manage",
  masterManage: "master.manage",
  employeeView: "employee.view",
  employeeManage: "employee.manage",
  attendanceView: "attendance.view",
  attendanceManage: "attendance.manage",
  leaveView: "leave.view",
  leaveManage: "leave.manage",
  appraisalManage: "appraisal.manage",
  trainingManage: "training.manage",
  mutationManage: "mutation.manage",
  promotionManage: "promotion.manage",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

type RouteRule = {
  matches: (pathname: string) => boolean;
  permission: PermissionCode;
};

const startsWith = (prefix: string) => (pathname: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

/** Most specific rules first; the first match decides. Routes without a rule only need a signed-in user. */
const ROUTE_RULES: RouteRule[] = [
  { matches: startsWith(routes.attendance.recap), permission: PERMISSIONS.attendanceView },
  { matches: startsWith(routes.training.manage), permission: PERMISSIONS.trainingManage },
  { matches: startsWith(routes.mutations), permission: PERMISSIONS.mutationManage },
  { matches: startsWith(routes.promotions), permission: PERMISSIONS.promotionManage },
  { matches: startsWith(routes.performance.periods), permission: PERMISSIONS.appraisalManage },
  { matches: startsWith(routes.performance.forms), permission: PERMISSIONS.appraisalManage },
  { matches: startsWith(routes.performance.recap), permission: PERMISSIONS.appraisalManage },
  { matches: startsWith(routes.leave.holidays), permission: PERMISSIONS.leaveManage },
  { matches: startsWith(routes.leave.requests), permission: PERMISSIONS.leaveView },
  { matches: startsWith(routes.employees.changeRequests), permission: PERMISSIONS.employeeManage },
  { matches: startsWith(routes.employees.create), permission: PERMISSIONS.employeeManage },
  { matches: (pathname) => /^\/employees\/[^/]+\/edit$/.test(pathname), permission: PERMISSIONS.employeeManage },
  { matches: startsWith(routes.employees.list), permission: PERMISSIONS.employeeView },
  { matches: startsWith("/master"), permission: PERMISSIONS.masterManage },
  { matches: startsWith(routes.accounts), permission: PERMISSIONS.userManage },
];

export function requiredPermissionFor(pathname: string): PermissionCode | null {
  return ROUTE_RULES.find((rule) => rule.matches(pathname))?.permission ?? null;
}
