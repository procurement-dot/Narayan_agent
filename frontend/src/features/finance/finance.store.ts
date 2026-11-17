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

  setTab: (tab: FinanceTab) => void;
  addAsset: (asset: FinanceAsset) => void;
  updateAssetRentReason: (assetName: string, reason: string) => void;
  addLoan: (loan: FinanceLoan) => void;
  toggleLoanPaid: (index: number) => void;
  updateRetirement: (params: Partial<RetirementParams>) => void;
  setSelectedRecordCategory: (cat: string | null) => void;
  attachDocumentToRecord: (cat: string, index: number, docName: string) => void;
  setIsSyncingSms: (loading: boolean) => void;
  applySmsSyncData: (summary: SmsSyncSummary, transactions: ParsedBankTransaction[]) => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
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

  setTab: (tab) => set({ currentTab: tab }),

  addAsset: (newAsset) =>
    set((state) => ({
      assets: [...state.assets, newAsset],
    })),

  updateAssetRentReason: (assetName, reason) =>
    set((state) => ({
      assets: state.assets.map((a) =>
        a.name === assetName ? { ...a, status: reason } : a
      ),
    })),

  addLoan: (newLoan) =>
    set((state) => ({
      loans: [...state.loans, newLoan],
    })),

  toggleLoanPaid: (index) =>
    set((state) => {
      const updated = [...state.loans];
      if (updated[index]) {
        updated[index] = { ...updated[index], paid: !updated[index].paid };
      }
      return { loans: updated };
    }),

  updateRetirement: (params) =>
    set((state) => ({
      retirement: { ...state.retirement, ...params },
    })),

  setSelectedRecordCategory: (cat) => set({ selectedRecordCategory: cat }),

  attachDocumentToRecord: (cat, index, docName) =>
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
    }),

  setIsSyncingSms: (loading) => set({ isSyncingSms: loading }),

  applySmsSyncData: (summary, transactions) =>
    set((state) => {
      // 1. Update Accounts in Records catalog with detected bank accounts from SMS
      const updatedRecords = { ...state.records };
      const currentAccounts = [...(updatedRecords['Accounts'] || [])];

      for (const acc of summary.accountsFound) {
        const exists = currentAccounts.some((it) => it[1].includes(acc.mask));
        if (!exists) {
          const balStr = acc.lastBalance ? `₹${acc.lastBalance.toLocaleString('en-IN')}` : 'Verified';
          currentAccounts.push([
            acc.bank,
            acc.mask,
            balStr,
            'SMS Verified',
          ]);
        }
      }
      updatedRecords['Accounts'] = currentAccounts;

      // 2. Add any detected bills to Alerts if not already present
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
}));
