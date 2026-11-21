export interface RawSmsMessage {
  id: string;
  address: string;
  body: string;
  date: number;
  dateSent?: number;
}

export type BankTransactionDirection = 'debit' | 'credit' | 'bill';

export type TransactionCategory =
  | 'salary'
  | 'transport'
  | 'groceries'
  | 'food'
  | 'bills_utilities'
  | 'health'
  | 'shopping'
  | 'income'
  | 'investment'
  | 'transfer'
  | 'refund'
  | 'rent'
  | 'general';

export interface ParsedBankTransaction {
  id: string;
  amount: number; // in Rupees for display
  amountPaise: number; // integer Paise (100 paise = 1 INR)
  type: BankTransactionDirection; // legacy alias
  direction: BankTransactionDirection;
  isExpense: boolean;
  accountMask?: string;
  rawAccountDigits?: string;
  merchant?: string;
  balance?: number;
  balancePaise?: number;
  date: number; // occurred timestamp
  bankName: string;
  rawBody: string;
  dueDate?: string;
  category?: TransactionCategory;
  refId?: string;
  source?: 'sms' | 'email';
  emailId?: string;
}

export interface ParseSmsDropResult {
  drop: true;
  reason: 'personal_number' | 'invalid_sender' | 'no_amount' | 'no_financial_keyword' | 'otp' | 'promo' | 'declined_or_failed' | 'excluded' | 'third_party_receipt';
}

export type ParseSmsResult = ParsedBankTransaction | ParseSmsDropResult;

export interface SmsSyncSummary {
  totalSmsScanned: number;
  bankSmsCount: number;
  debitCount: number;
  creditCount: number;
  billCount: number;
  totalDebited: number;
  totalCredited: number;
  accountsFound: { mask: string; bank: string; lastBalance?: number }[];
  lastSyncTimestamp: number;
}
