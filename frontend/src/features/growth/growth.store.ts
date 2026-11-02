import { create } from 'zustand';
import { GrowthTab, SkillPath } from './growth.types';
import { SKILL_PATHS } from './growth.mock';

interface GrowthState {
  currentTab: GrowthTab;
  paths: SkillPath[];
  selectedPath: SkillPath | null;
  setTab: (tab: GrowthTab) => void;
  selectPath: (path: SkillPath | null) => void;
}

export const useGrowthStore = create<GrowthState>((set) => ({
  currentTab: 'paths',
  paths: SKILL_PATHS,
  selectedPath: null,

  setTab: (tab) => set({ currentTab: tab }),
  selectPath: (selectedPath) => set({ selectedPath }),
}));
