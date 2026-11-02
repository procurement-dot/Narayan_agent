import { create } from 'zustand';
import { WorkProject, WorkTab } from './work.types';
import { WORK_PROJECTS } from './work.mock';

interface WorkState {
  currentTab: WorkTab;
  projects: WorkProject[];
  selectedProject: WorkProject | null;
  setTab: (tab: WorkTab) => void;
  selectProject: (project: WorkProject | null) => void;
}

export const useWorkStore = create<WorkState>((set) => ({
  currentTab: 'overview',
  projects: WORK_PROJECTS,
  selectedProject: null,

  setTab: (tab) => set({ currentTab: tab }),
  selectProject: (selectedProject) => set({ selectedProject }),
}));
