import { create } from "zustand";

/**
 * In-memory token for a third-party API used through `lib/axios.ts` (not integrated yet).
 * The Supabase session does not live here; it is kept in cookies by `@supabase/ssr`.
 */
type AuthState = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  setAccessToken: (accessToken) => set({ accessToken }),
  clearSession: () => set({ accessToken: null }),
}));
