import { create } from 'zustand';

interface AppState {
  collapsed: boolean;
  communityId: number | null;
  setCollapsed: (collapsed: boolean) => void;
  setCommunityId: (id: number | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  collapsed: false,
  communityId: null,
  setCollapsed: (collapsed) => set({ collapsed }),
  setCommunityId: (id) => set({ communityId: id }),
}));