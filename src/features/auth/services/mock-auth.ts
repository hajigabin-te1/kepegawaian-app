import type { AuthResult, LoginInput, SessionUser } from "@/features/auth/types/auth";

/**
 * TEMPORARY MOCK AUTHENTICATION — local development only.
 *
 * Replace this module with calls to the real auth API once the contract in
 * docs/api-contract.md (section 2) is confirmed. Callers depend only on
 * `verifyCredentials` and `getUserBySessionToken`, so swapping the
 * implementation does not require changes elsewhere.
 */
const MOCK_USER = {
  username: "admin",
  password: "admin123",
  name: "Administrator",
  role: "admin",
} as const;

const MOCK_SESSION_TOKEN = "mock-session-admin";

function toSessionUser(): SessionUser {
  return { username: MOCK_USER.username, name: MOCK_USER.name, role: MOCK_USER.role };
}

export async function verifyCredentials(input: LoginInput): Promise<AuthResult | null> {
  if (input.username !== MOCK_USER.username || input.password !== MOCK_USER.password) {
    return null;
  }
  return { user: toSessionUser(), sessionToken: MOCK_SESSION_TOKEN };
}

export function getUserBySessionToken(token: string | undefined): SessionUser | null {
  return token === MOCK_SESSION_TOKEN ? toSessionUser() : null;
}
