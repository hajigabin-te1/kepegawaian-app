import { create } from "zustand";

/**
 * Client-side session state.
 * Token storage strategy (memory, localStorage, or httpOnly cookie) is still
 * pending confirmation, so the token is kept in memory only for now.
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
