import { routes } from "@/config/routes";

/** Permission codes from public.permissions that the frontend checks. */
export const PERMISSIONS = {
  userManage: "user.manage",
  masterManage: "master.manage",
  employeeView: "employee.view",
  employeeManage: "employee.manage",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

type RouteRule = {
  matches: (pathname: string) => boolean;
  permission: PermissionCode;
};

const startsWith = (prefix: string) => (pathname: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

/** Most specific rules first; the first match decides. Routes without a rule only need a signed-in user. */
const ROUTE_RULES: RouteRule[] = [
  { matches: startsWith(routes.employees.create), permission: PERMISSIONS.employeeManage },
  { matches: (pathname) => /^\/employees\/[^/]+\/edit$/.test(pathname), permission: PERMISSIONS.employeeManage },
  { matches: startsWith(routes.employees.list), permission: PERMISSIONS.employeeView },
  { matches: startsWith("/master"), permission: PERMISSIONS.masterManage },
  { matches: startsWith(routes.accounts), permission: PERMISSIONS.userManage },
];

export function requiredPermissionFor(pathname: string): PermissionCode | null {
  return ROUTE_RULES.find((rule) => rule.matches(pathname))?.permission ?? null;
}
