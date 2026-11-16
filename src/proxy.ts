import type { NextRequest } from "next/server";

import { requiredPermissionFor } from "@/config/permissions";
import { routes } from "@/config/routes";
import { redirectWithCookies, updateSession } from "@/lib/supabase/proxy";

// Keep in sync with `config.matcher` below (the matcher must be a static literal).
const PROTECTED_PREFIXES = [
  routes.dashboard,
  routes.employees.list,
  "/histories",
  routes.documents,
  "/master",
  routes.accounts,
  "/settings",
  "/profile",
  routes.attendance.me,
  routes.leave.me,
  routes.performance.me,
  routes.training.me,
  routes.mutations,
  routes.promotions,
  routes.announcements,
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabase, userId, getResponse } = await updateSession(request);

  if (pathname === "/") {
    return redirectWithCookies(request, getResponse(), userId ? routes.dashboard : routes.login);
  }

  if (pathname === routes.login && userId) {
    // Signed in to Supabase but without an active account (e.g. deactivated): end the session and stay on login.
    const { data: account } = await supabase.from("user_accounts").select("is_active").eq("id", userId).maybeSingle();
    if (!account?.is_active) {
      await supabase.auth.signOut();
      return getResponse();
    }
    return redirectWithCookies(request, getResponse(), routes.dashboard);
  }

  if (isProtectedPath(pathname) && !userId) {
    return redirectWithCookies(request, getResponse(), routes.login);
  }

  // Role-based access: pages that need a permission send other users back to the dashboard.
  const permission = requiredPermissionFor(pathname);
  if (permission && userId) {
    const { data: allowed } = await supabase.rpc("has_permission", { permission_code: permission });
    if (!allowed) {
      return redirectWithCookies(request, getResponse(), routes.dashboard);
    }
  }

  return getResponse();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/employees/:path*",
    "/histories/:path*",
    "/documents/:path*",
    "/master/:path*",
    "/accounts/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/attendance/:path*",
    "/leave/:path*",
    "/performance/:path*",
    "/training/:path*",
    "/mutations/:path*",
    "/promotions/:path*",
    "/announcements/:path*",
  ],
};
