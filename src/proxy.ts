import type { NextRequest } from "next/server";

import { routes } from "@/config/routes";
import { redirectWithCookies, updateSession } from "@/lib/supabase/proxy";

const PROTECTED_PREFIXES = [routes.dashboard, routes.employees.list];

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

  return getResponse();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/employees/:path*"],
};
