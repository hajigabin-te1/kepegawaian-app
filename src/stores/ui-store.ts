import { create } from "zustand";

type UiState = {
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
};

export const useUiStore = create<UiState>()((set) => ({
  isMobileSidebarOpen: false,
  setMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),
  isSidebarCollapsed: false,
  toggleSidebarCollapsed: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));
