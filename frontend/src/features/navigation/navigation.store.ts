import { create } from 'zustand';
import { SpaceId } from './navigation.types';

interface NavigationState {
  currentSpace: SpaceId;
  previousSpace: SpaceId | null;
  isDockOpen: boolean;
  isChatOpen: boolean;
  navigate: (space: SpaceId) => void;
  goBack: () => void;
  openDock: () => void;
  closeDock: () => void;
  toggleDock: () => void;
  openChat: () => void;
  closeChat: () => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentSpace: 'today',
  previousSpace: null,
  isDockOpen: false,
  isChatOpen: false,

  navigate: (space) =>
    set((state) => ({
      previousSpace: state.currentSpace,
      currentSpace: space,
      isDockOpen: false,
    })),

  goBack: () =>
    set((state) => ({
      currentSpace: state.previousSpace || 'today',
      previousSpace: null,
      isDockOpen: false,
    })),

  openDock: () => set({ isDockOpen: true }),
  closeDock: () => set({ isDockOpen: false }),
  toggleDock: () => set((state) => ({ isDockOpen: !state.isDockOpen })),

  openChat: () => set({ isChatOpen: true }),
  closeChat: () => set({ isChatOpen: false }),
}));
