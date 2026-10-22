import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type UiState = {
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      isMobileSidebarOpen: false,
      setMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),
      isSidebarCollapsed: false,
      toggleSidebarCollapsed: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    }),
    {
      name: "kepegawaian-ui",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Only the desktop sidebar preference survives reloads; the mobile drawer always starts closed.
      partialize: (state) => ({ isSidebarCollapsed: state.isSidebarCollapsed }),
      // Rehydrated on mount (see AppSidebar) so server and first client render match.
      skipHydration: true,
    },
  ),
);

// The persist API is not attached during server rendering (no localStorage), so access it defensively.
const uiPersist = (): (typeof useUiStore)["persist"] | undefined => useUiStore.persist;

export function rehydrateUiStore(): void {
  void uiPersist()?.rehydrate();
}

export function subscribeUiStoreHydration(onHydrated: () => void): () => void {
  return uiPersist()?.onFinishHydration(onHydrated) ?? (() => {});
}

export function hasUiStoreHydrated(): boolean {
  return uiPersist()?.hasHydrated() ?? false;
}
