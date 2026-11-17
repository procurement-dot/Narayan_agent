export type FinanceTab =
  | 'overview'
  | 'assets'
  | 'lending'
  | 'retire'
  | 'reminders'
  | 'records';

export interface FinanceAsset {
  name: string;
  type: string;
  value: number;
  cost: number;
  expectedRent: number;
  receivedRent: number;
  area: string;
  status: string;
}

export interface FinanceLoan {
  name: string;
  principal: number;
  rate: number;
  frequency: string;
  due: string;
  paid: boolean;
}

export interface FinanceAlert {
  title: string;
  amount: string;
  due: string;
  desc: string;
}

export interface RetirementParams {
  age: number;
  retire: number;
  corpus: number;
  sip: number;
  returnRate: number;
  inflation: number;
}

export type RecordItem = [string, string, string, string]; // [name, masked, detail, docType]
