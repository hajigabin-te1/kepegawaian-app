import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfig } from "@/config/env";
import type { Database } from "@/types/database";

/**
 * Refreshes the Supabase session cookies for this request and returns the client,
 * the signed-in user's id (verified JWT claims), and the response carrying the cookies.
 */
export async function updateSession(request: NextRequest) {
  const { url, anonKey } = getSupabaseConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // Do not run code between createServerClient and getClaims: it refreshes the session.
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims.sub === "string" ? data.claims.sub : null;

  return { supabase, userId, getResponse: () => response };
}

/** Builds a redirect that keeps any refreshed auth cookies. */
export function redirectWithCookies(request: NextRequest, source: NextResponse, pathname: string): NextResponse {
  const redirect = NextResponse.redirect(new URL(pathname, request.url));
  for (const cookie of source.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}
