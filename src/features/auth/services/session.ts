import { cookies } from "next/headers";

import { getUserBySessionToken } from "@/features/auth/services/mock-auth";
import type { SessionUser } from "@/features/auth/types/auth";

export const SESSION_COOKIE_NAME = "kp_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export async function createSession(sessionToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  return getUserBySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}
