export interface RawSmsMessage {
  id: string;
  address: string;
  body: string;
  date: number;
  dateSent?: number;
}

export interface ParsedBankTransaction {
  id: string;
  amount: number;
  type: 'debit' | 'credit' | 'bill';
  accountMask?: string;
  merchant?: string;
  balance?: number;
  date: number;
  bankName: string;
  rawBody: string;
  dueDate?: string;
  category?: 'rent' | 'salary' | 'transfer' | 'food' | 'shopping' | 'utility' | 'investment' | 'general';
  rawAccountDigits?: string;
}

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
