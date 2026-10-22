import { create } from "zustand";

type UiState = {
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>()((set) => ({
  isMobileSidebarOpen: false,
  setMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),
}));
