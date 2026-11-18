import { FinanceAlert, FinanceAsset, FinanceLoan, RecordItem, RetirementParams } from './finance.types';

// Zero dummy data: Assets, Loans, Alerts and Records are 100% dynamic
// from user entries and verified bank SMS scanning.
export const FINANCE_ASSETS: FinanceAsset[] = [];

export const FINANCE_LOANS: FinanceLoan[] = [];

export const FINANCE_ALERTS: FinanceAlert[] = [];

export const FINANCE_RETIREMENT_DEFAULT: RetirementParams = {
  age: 38,
  retire: 58,
  corpus: 35000000,
  sip: 65000,
  returnRate: 12,
  inflation: 6.5,
};

export const FINANCE_RECORDS_CATALOG: Record<string, RecordItem[]> = {
  Accounts: [],
  'Credit cards': [],
  Insurance: [],
  Loans: [],
  Lockers: [],
  Credentials: [],
};

export const RECORD_ICONS: Record<string, string> = {
  Accounts: '🏦',
  'Credit cards': '▤',
  Insurance: '✚',
  Loans: '⌁',
  Lockers: '◫',
  Credentials: '♙',
};
