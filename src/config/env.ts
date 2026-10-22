/**
 * Centralized access to public environment variables.
 * Values are read at build time, so they must be referenced explicitly.
 */
export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  apiTimeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 15000),
} as const;
