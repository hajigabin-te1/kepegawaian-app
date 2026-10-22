import { NextResponse, type NextRequest } from "next/server";

import { routes } from "@/config/routes";
import { getUserBySessionToken } from "@/features/auth/services/mock-auth";
import { SESSION_COOKIE_NAME } from "@/features/auth/services/session";

const PROTECTED_PREFIXES = [routes.dashboard, routes.employees.list];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated =
    getUserBySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value) !== null;

  if (pathname === "/") {
    const target = isAuthenticated ? routes.dashboard : routes.login;
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname === routes.login && isAuthenticated) {
    return NextResponse.redirect(new URL(routes.dashboard, request.url));
  }

  if (isProtectedPath(pathname) && !isAuthenticated) {
    return NextResponse.redirect(new URL(routes.login, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/employees/:path*"],
};
