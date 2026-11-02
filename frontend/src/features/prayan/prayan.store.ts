import { create } from 'zustand';
import { CubingRecord, PrayanMilestone, PrayanTab } from './prayan.types';
import { CUBING_RECORDS, PRAYAN_MILESTONES } from './prayan.mock';

interface PrayanState {
  currentTab: PrayanTab;
  records: CubingRecord[];
  milestones: PrayanMilestone[];
  setTab: (tab: PrayanTab) => void;
}

export const usePrayanStore = create<PrayanState>((set) => ({
  currentTab: 'world',
  records: CUBING_RECORDS,
  milestones: PRAYAN_MILESTONES,

  setTab: (tab) => set({ currentTab: tab }),
}));
