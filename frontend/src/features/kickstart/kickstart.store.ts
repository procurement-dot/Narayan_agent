import { create } from 'zustand';
import { KickstartTab } from './kickstart.types';

interface KickstartState {
  currentTab: KickstartTab;
  isPlaying: boolean;
  selectedItemId: string | null;
  setTab: (tab: KickstartTab) => void;
  togglePlay: () => void;
  selectItem: (id: string | null) => void;
}

export const useKickstartStore = create<KickstartState>((set) => ({
  currentTab: 'today',
  isPlaying: false,
  selectedItemId: null,

  setTab: (tab) => set({ currentTab: tab }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  selectItem: (id) => set({ selectedItemId: id }),
}));
