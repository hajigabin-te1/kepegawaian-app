import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

import { getSupabaseConfig } from "@/config/env";
import type { Database } from "@/types/database";

/** Supabase client for Server Components and Server Actions. Create one per request. */
export async function createSupabaseServerClient() {
  // Session checks compare token expiry with the current time, so they must run at request time
  // (Cache Components would otherwise flag Date.now() during prerendering).
  await connection();
  const { url, anonKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}
