import { create } from 'zustand';
import { FinanceAlert, FinanceAsset, FinanceLoan, FinanceTab } from './finance.types';
import { FINANCE_ALERTS, FINANCE_ASSETS, FINANCE_LOANS } from './finance.mock';

interface FinanceState {
  currentTab: FinanceTab;
  assets: FinanceAsset[];
  loans: FinanceLoan[];
  alerts: FinanceAlert[];
  selectedAsset: FinanceAsset | null;
  setTab: (tab: FinanceTab) => void;
  selectAsset: (asset: FinanceAsset | null) => void;
  addAsset: (asset: FinanceAsset) => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  currentTab: 'overview',
  assets: FINANCE_ASSETS,
  loans: FINANCE_LOANS,
  alerts: FINANCE_ALERTS,
  selectedAsset: null,

  setTab: (tab) => set({ currentTab: tab }),
  selectAsset: (selectedAsset) => set({ selectedAsset }),
  addAsset: (newAsset) =>
    set((state) => ({
      assets: [...state.assets, newAsset],
    })),
}));
