import { create } from 'zustand';
import {
  FinanceAlert,
  FinanceAsset,
  FinanceLoan,
  FinanceTab,
  RecordItem,
  RetirementParams,
} from './finance.types';
import {
  FINANCE_ALERTS,
  FINANCE_ASSETS,
  FINANCE_LOANS,
  FINANCE_RECORDS_CATALOG,
  FINANCE_RETIREMENT_DEFAULT,
} from './finance.mock';
import { ParsedBankTransaction, SmsSyncSummary } from './sms/sms.types';
import { financeApi } from './finance.api';

interface FinanceState {
  currentTab: FinanceTab;
  assets: FinanceAsset[];
  loans: FinanceLoan[];
  alerts: FinanceAlert[];
  retirement: RetirementParams;
  records: Record<string, RecordItem[]>;
  selectedRecordCategory: string | null;

  // SMS Bank Integration State
  smsSyncSummary: SmsSyncSummary | null;
  parsedTransactions: ParsedBankTransaction[];
  isSyncingSms: boolean;
  isLoading: boolean;
  userNetCashFlow: number | null;
  userLiveBalance: number | null;

  setTab: (tab: FinanceTab) => void;
  fetchBackendData: () => Promise<void>;
  setUserNetCashFlow: (amount: number | null) => Promise<void>;
  setUserLiveBalance: (amount: number | null) => Promise<void>;
  addAsset: (asset: FinanceAsset) => Promise<void>;
  updateAssetRentReason: (assetName: string, reason: string) => Promise<void>;
  addLoan: (loan: FinanceLoan) => Promise<void>;
  toggleLoanPaid: (index: number) => Promise<void>;
  updateRetirement: (params: Partial<RetirementParams>) => Promise<void>;
  setSelectedRecordCategory: (cat: string | null) => void;
  attachDocumentToRecord: (cat: string, index: number, docName: string) => Promise<void>;
  setIsSyncingSms: (loading: boolean) => void;
  applySmsSyncData: (summary: SmsSyncSummary, transactions: ParsedBankTransaction[]) => void;
  syncEmailCredits: () => Promise<{ success: boolean; syncedCount: number; credits: ParsedBankTransaction[] } | null>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  currentTab: 'overview',
  assets: FINANCE_ASSETS,
  loans: FINANCE_LOANS,
  alerts: FINANCE_ALERTS,
  retirement: FINANCE_RETIREMENT_DEFAULT,
  records: FINANCE_RECORDS_CATALOG,
  selectedRecordCategory: 'Accounts',

  smsSyncSummary: null,
  parsedTransactions: [],
  isSyncingSms: false,
  isLoading: false,
  userNetCashFlow: null,
  userLiveBalance: null,

  setTab: (tab) => set({ currentTab: tab }),

  setUserLiveBalance: async (amount) => {
    set({ userLiveBalance: amount });
    try {
      await financeApi.createRecord({
        category: 'Preferences',
        title: 'Current Live Bank Balance',
        maskedIdentifier: amount !== null ? `₹${amount}` : 'auto',
        detail: 'User defined live SBI bank balance',
        documentName: 'settings',
      });
    } catch (e) {
      console.warn('[FinanceStore] Failed to save live balance preference:', e);
    }
  },

  setUserNetCashFlow: async (amount) => {
    set({ userNetCashFlow: amount });
    try {
      await financeApi.createRecord({
        category: 'Preferences',
        title: 'Monthly Net Cash Flow',
        maskedIdentifier: amount !== null ? `₹${amount}` : 'auto',
        detail: 'User defined target monthly cash flow',
        documentName: 'settings',
      });
    } catch (e) {
      console.warn('[FinanceStore] Failed to save cash flow preference:', e);
    }
  },

  fetchBackendData: async () => {
    try {
      set({ isLoading: true });
      const [assets, loans, records, retirement, transactions] = await Promise.all([
        financeApi.getAssets().catch(() => null),
        financeApi.getLoans().catch(() => null),
        financeApi.getRecords().catch(() => null),
        financeApi.getRetirement().catch(() => null),
        financeApi.getTransactions('all', 100).catch(() => null),
      ]);

      // Check for user-defined net cash flow & live balance
      let savedUserCashFlow: number | null = null;
      let savedUserLiveBalance: number | null = null;
      if (records && records['Preferences']) {
        const pref = records['Preferences'].find((r: any) => r[0] === 'Monthly Net Cash Flow');
        if (pref && pref[1] && pref[1] !== 'auto') {
          const parsedVal = parseFloat(pref[1].replace(/[₹,]/g, ''));
          if (!isNaN(parsedVal)) {
            savedUserCashFlow = parsedVal;
          }
        }
        const balPref = records['Preferences'].find((r: any) => r[0] === 'Current Live Bank Balance');
        if (balPref && balPref[1] && balPref[1] !== 'auto') {
          const parsedBal = parseFloat(balPref[1].replace(/[₹,]/g, ''));
          if (!isNaN(parsedBal)) {
            savedUserLiveBalance = parsedBal;
          }
        }
      }

      set((state) => ({
        assets: assets && assets.length > 0 ? assets : state.assets,
        loans: loans && loans.length > 0 ? loans : state.loans,
        records: records && Object.keys(records).length > 0 ? records : state.records,
        retirement: retirement ? retirement : state.retirement,
        parsedTransactions: transactions && transactions.length > 0 ? transactions : state.parsedTransactions,
        userNetCashFlow: savedUserCashFlow !== null ? savedUserCashFlow : state.userNetCashFlow,
        userLiveBalance: savedUserLiveBalance !== null ? savedUserLiveBalance : state.userLiveBalance,
        isLoading: false,
      }));
    } catch (e) {
      console.warn('[FinanceStore] Offline fallback active:', e);
      set({ isLoading: false });
    }
  },

  addAsset: async (newAsset) => {
    // 1. Optimistic local update
    set((state) => ({
      assets: [...state.assets, newAsset],
    }));

    // 2. Sync to Backend
    try {
      await financeApi.createAsset(newAsset);
    } catch (e) {
      console.warn('[FinanceStore] Failed to save asset to backend:', e);
    }
  },

  updateAssetRentReason: async (assetName, reason) => {
    set((state) => ({
      assets: state.assets.map((a) =>
        a.name === assetName ? { ...a, status: reason } : a
      ),
    }));

    try {
      const asset = get().assets.find((a) => a.name === assetName);
      if (asset && (asset as any).id) {
        await financeApi.updateAssetRent((asset as any).id, reason);
      }
    } catch (e) {
      console.warn('[FinanceStore] Failed to update rent status on backend:', e);
    }
  },

  addLoan: async (newLoan) => {
    set((state) => ({
      loans: [...state.loans, newLoan],
    }));

    try {
      await financeApi.createLoan(newLoan);
    } catch (e) {
      console.warn('[FinanceStore] Failed to save loan to backend:', e);
    }
  },

  toggleLoanPaid: async (index) => {
    const loan = get().loans[index];
    set((state) => {
      const updated = [...state.loans];
      if (updated[index]) {
        updated[index] = { ...updated[index], paid: !updated[index].paid };
      }
      return { loans: updated };
    });

    try {
      if (loan && (loan as any).id) {
        await financeApi.toggleLoanPaid((loan as any).id);
      }
    } catch (e) {
      console.warn('[FinanceStore] Failed to toggle loan on backend:', e);
    }
  },

  updateRetirement: async (params) => {
    set((state) => ({
      retirement: { ...state.retirement, ...params },
    }));

    try {
      await financeApi.updateRetirement(params);
    } catch (e) {
      console.warn('[FinanceStore] Failed to update retirement on backend:', e);
    }
  },

  setSelectedRecordCategory: (cat) => set({ selectedRecordCategory: cat }),

  attachDocumentToRecord: async (cat, index, docName) => {
    set((state) => {
      const catList = state.records[cat] ? [...state.records[cat]] : [];
      if (catList[index]) {
        const item = [...catList[index]] as RecordItem;
        item[3] = `${docName} (attached)`;
        catList[index] = item;
      }
      return {
        records: {
          ...state.records,
          [cat]: catList,
        },
      };
    });

    try {
      const item = get().records[cat]?.[index];
      if (item) {
        await financeApi.createRecord({
          category: cat,
          title: item[0],
          maskedIdentifier: item[1],
          detail: item[2],
          documentName: item[3],
        });
      }
    } catch (e) {
      console.warn('[FinanceStore] Failed to sync document to backend:', e);
    }
  },

  setIsSyncingSms: (loading) => set({ isSyncingSms: loading }),

  applySmsSyncData: (summary, transactions) =>
    set((state) => {
      const updatedRecords = { ...state.records };

      // Set verified bank accounts
      const currentAccounts: RecordItem[] = summary.accountsFound.map((acc) => {
        const balStr = acc.lastBalance !== undefined ? `₹${acc.lastBalance.toLocaleString('en-IN')}` : 'Verified';
        return [
          acc.bank,
          acc.mask,
          balStr,
          'SMS Verified',
        ];
      });
      updatedRecords['Accounts'] = currentAccounts;

      // Populate Credit Cards found in SMS (deduplicated)
      const currentCards: RecordItem[] = [];
      for (const tx of transactions) {
        if (/card/i.test(tx.rawBody) && tx.accountMask) {
          const exists = currentCards.some((it) => it[1] === tx.accountMask);
          if (!exists) {
            currentCards.push([
              `${tx.bankName} Card`,
              tx.accountMask,
              tx.dueDate ? `Due ${tx.dueDate}` : 'Active Card',
              'SMS Verified',
            ]);
          }
        }
      }
      updatedRecords['Credit cards'] = currentCards;

      const updatedAlerts = [...state.alerts];
      for (const tx of transactions) {
        if (tx.type === 'bill') {
          const alertTitle = `${tx.bankName} Bill Due: ₹${tx.amount.toLocaleString('en-IN')}`;
          const exists = updatedAlerts.some((al) => al.title.includes(tx.bankName) && al.title.includes(`${tx.amount}`));
          if (!exists) {
            updatedAlerts.unshift({
              title: alertTitle,
              amount: `₹${tx.amount.toLocaleString('en-IN')}`,
              due: tx.dueDate || 'Soon',
              desc: tx.dueDate ? `Due date: ${tx.dueDate}. Auto-detected from bank SMS.` : tx.rawBody.slice(0, 80),
            });
          }
        }
      }

      return {
        smsSyncSummary: summary,
        parsedTransactions: transactions,
        records: updatedRecords,
        alerts: updatedAlerts,
      };
    }),

  syncEmailCredits: async () => {
    try {
      const res = await financeApi.syncEmailCredits();
      if (res && res.credits && res.credits.length > 0) {
        set((state) => {
          const current = [...state.parsedTransactions];
          for (const newTx of res.credits) {
            const exists = current.some(
              (c) => c.id === newTx.id || (c.refId && c.refId === newTx.refId)
            );
            if (!exists) {
              current.unshift(newTx);
            }
          }
          current.sort((a, b) => b.date - a.date);
          return { parsedTransactions: current };
        });
      }
      return res;
    } catch (e) {
      console.warn('[FinanceStore] Failed to sync email credits:', e);
      return null;
    }
  },
}));
