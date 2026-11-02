import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseConfig } from "@/config/env";
import type { Database } from "@/types/database";

/** Supabase client for Client Components (uses the same auth cookies as the server). */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient<Database>(url, anonKey);
}
