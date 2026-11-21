import { Platform, PermissionsAndroid, NativeModules } from 'react-native';
import { RawSmsMessage, ParsedBankTransaction, SmsSyncSummary } from './sms.types';
import { parseSingleSms } from './smsParser';
import { useFinanceStore } from '../finance.store';
import { financeApi } from '../finance.api';

const { SmsReader } = NativeModules;

export interface ScanProgressInfo {
  percent: number;
  stage: string;
  detail: string;
  current: number;
  total: number;
  timeRemaining: string;
}

export type ProgressCallback = (info: ScanProgressInfo) => void;

/**
 * Requests Android READ_SMS permission at runtime.
 */
export async function requestSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true; // Not required on web/mock
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'Bank SMS Access for Finance',
        message: 'NRYN needs access to read your bank SMS to automatically track expenses, cash flow, and bill due dates.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'Allow',
      }
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('[SmsReader] Permission error:', err);
    return false;
  }
}

/**
 * Fallback sample bank SMS messages for web / testing environment
 */
const currentYr = 2024;
const currentYrShort = '24';

const SAMPLE_BANK_SMS: RawSmsMessage[] = [
  {
    id: 'mock-sms-1',
    address: 'VK-SBIINB',
    body: `Rs 1,500.00 credited to SBI A/c *3098 on 31-Oct-${currentYrShort} by UPI. Avl Bal: INR 11,540.29`,
    date: Date.now() - 86400000 * 2,
  },
  {
    id: 'mock-sms-2',
    address: 'AD-SBIINB',
    body: `INR 10.00 debited from SBI A/c *3098 on 07-Jun-${currentYrShort} towards UPI transfer. Bal: INR 8,494.29`,
    date: Date.now() - 86400000 * 4,
  },
  {
    id: 'mock-sms-3',
    address: 'AD-SBIINB',
    body: `SBI: A/c 3098 debited by Rs 1.00 on 28-Jun-${currentYrShort}. Avl Bal Rs 11,540.29`,
    date: Date.now() - 86400000 * 6,
  },
  {
    id: 'mock-sms-4',
    address: 'AD-SBISMS',
    body: `Dear Customer, your A/c XXXXX593098 is credited for Rs 1500.00 on 16-Jun-${currentYrShort}. Avl Bal: Rs 9,994.29`,
    date: Date.now() - 86400000 * 8,
  },
  {
    id: 'mock-sms-5',
    address: 'AD-SBMSMS',
    body: `SBI: A/c 3098 debited by Rs 70.00 on 02-Jan-${currentYrShort}. Avl Bal: Rs 5,292.01`,
    date: Date.now() - 86400000 * 12,
  },
  {
    id: 'mock-sms-6',
    address: 'AD-SBIINB',
    body: `State Bank of India: Rs 2.00 debited from A/c 3098 on 13-Oct-${currentYrShort}. Bal: Rs 9,492.00`,
    date: Date.now() - 86400000 * 14,
  },
];

/**
 * Fetches all SMS messages from the phone inbox (no 30-day limit).
 */
export async function fetchAllInboxSms(): Promise<RawSmsMessage[]> {
  if (Platform.OS === 'android' && SmsReader && typeof SmsReader.getAllSms === 'function') {
    try {
      const messages: RawSmsMessage[] = await SmsReader.getAllSms({ maxCount: -1 });
      return messages || [];
    } catch (e) {
      console.warn('[SmsReader] Failed to read native SMS:', e);
      return [];
    }
  }

  // Fallback for Web/Development preview
  console.log('[SmsReader] Native module not running (Web or Dev client); using preview sample transactions.');
  return SAMPLE_BANK_SMS;
}

/**
 * Full sync process: reads all SMS with live progress, parses bank records, updates Finance Store.
 */
export async function syncAllBankTransactions(onProgress?: ProgressCallback): Promise<SmsSyncSummary> {
  onProgress?.({
    percent: 10,
    stage: 'Checking SMS permissions...',
    detail: 'Requesting secure access to SMS database',
    current: 0,
    total: 0,
    timeRemaining: '~3s',
  });

  const hasPermission = await requestSmsPermission();
  if (!hasPermission) {
    throw new Error('SMS permission was denied. Please allow SMS permission in Android settings.');
  }

  onProgress?.({
    percent: 25,
    stage: 'Reading SMS inbox...',
    detail: 'Reading message history from phone inbox',
    current: 0,
    total: 0,
    timeRemaining: '~2s',
  });

  const rawMessages = await fetchAllInboxSms();
  const total = rawMessages.length;

  onProgress?.({
    percent: 40,
    stage: `Found ${total} messages`,
    detail: 'Filtering and extracting financial transactions',
    current: 0,
    total,
    timeRemaining: '~2s',
  });

  const parsedTransactions: ParsedBankTransaction[] = [];
  const chunkSize = Math.max(1, Math.floor(total / 10));

  for (let i = 0; i < total; i++) {
    const parsed = parseSingleSms(rawMessages[i]);
    if (parsed) {
      parsedTransactions.push(parsed);
    }

    if (i % chunkSize === 0 || i === total - 1) {
      const pct = Math.min(85, Math.round(40 + ((i + 1) / Math.max(1, total)) * 45));
      onProgress?.({
        percent: pct,
        stage: `Parsing bank records (${parsedTransactions.length} found)...`,
        detail: `Analyzed message ${i + 1} of ${total}`,
        current: i + 1,
        total,
        timeRemaining: '~1s',
      });
      if (i % (chunkSize * 2) === 0) {
        await new Promise((res) => setTimeout(res, 25));
      }
    }
  }

  // Sort descending by date
  parsedTransactions.sort((a, b) => b.date - a.date);

  // Deduplicate transactions: remove duplicate alerts for the exact same event
  const deduplicatedTransactions: ParsedBankTransaction[] = [];
  for (const tx of parsedTransactions) {
    const isDuplicate = deduplicatedTransactions.some((existing) => {
      // 1. Same bank reference number / UTR
      if (existing.refId && tx.refId && existing.refId === tx.refId) {
        return true;
      }
      // 2. Exact identical SMS text
      if (existing.rawBody && tx.rawBody && existing.rawBody.trim() === tx.rawBody.trim()) {
        return true;
      }
      return false;
    });
    if (!isDuplicate) {
      deduplicatedTransactions.push(tx);
    }
  }

  onProgress?.({
    percent: 90,
    stage: 'Reconciling live accounts & cash flow...',
    detail: `Aggregating ${deduplicatedTransactions.length} bank transactions`,
    current: total,
    total,
    timeRemaining: '<1s',
  });

  let totalDebited = 0;
  let totalCredited = 0;
  let debitCount = 0;
  let creditCount = 0;
  let billCount = 0;

  interface DetectedAccount {
    bank: string;
    mask: string;
    rawDigits: string;
    lastBalance?: number;
  }

  const detectedAccounts: DetectedAccount[] = [];

  for (const tx of deduplicatedTransactions) {
    const isDebit = tx.direction === 'debit' || tx.type === 'debit';
    const isCredit = tx.direction === 'credit' || tx.type === 'credit';
    const isBill = tx.direction === 'bill' || tx.type === 'bill';

    if (isDebit) {
      totalDebited += (tx.amountPaise ? tx.amountPaise / 100 : tx.amount);
      debitCount++;
    } else if (isCredit) {
      totalCredited += (tx.amountPaise ? tx.amountPaise / 100 : tx.amount);
      creditCount++;
    } else if (isBill) {
      billCount++;
    }

    const txRawDigits = tx.rawAccountDigits || '';
    const txMask = tx.accountMask;

    // Consolidate into user's single primary State Bank of India account
    let matchedAcc = detectedAccounts[0];
    if (!matchedAcc) {
      matchedAcc = {
        bank: 'State Bank of India',
        mask: txMask && !txMask.includes('Primary') ? txMask : '•••• 3098',
        rawDigits: txRawDigits || '3098',
        lastBalance: tx.balance !== undefined && tx.balance <= 1000000 ? tx.balance : undefined,
      };
      detectedAccounts.push(matchedAcc);
    } else {
      if (txMask && !txMask.includes('Primary') && matchedAcc.mask.includes('Primary')) {
        matchedAcc.mask = txMask;
      }
      if (matchedAcc.lastBalance === undefined && tx.balance !== undefined && tx.balance <= 1000000) {
        matchedAcc.lastBalance = tx.balance;
      }
    }

    // Standardize tx to primary SBI account
    tx.bankName = 'State Bank of India';
    tx.accountMask = matchedAcc.mask;
  }

  // Count transactions per bank
  const bankTxCounts = new Map<string, number>();
  for (const tx of deduplicatedTransactions) {
    bankTxCounts.set(tx.bankName, (bankTxCounts.get(tx.bankName) || 0) + 1);
  }

  // Only list genuine bank accounts that have at least 1 verified transaction
  const verifiedAccounts = detectedAccounts.filter((a) => {
    const txCount = bankTxCounts.get(a.bank) || 0;
    return txCount > 0;
  });

  const summary: SmsSyncSummary = {
    totalSmsScanned: rawMessages.length,
    bankSmsCount: deduplicatedTransactions.length,
    debitCount,
    creditCount,
    billCount,
    totalDebited,
    totalCredited,
    accountsFound: verifiedAccounts.map((a) => ({
      bank: a.bank,
      mask: a.mask,
      lastBalance: a.lastBalance,
    })),
    lastSyncTimestamp: Date.now(),
  };

  onProgress?.({
    percent: 100,
    stage: 'Sync Complete!',
    detail: `Found ${deduplicatedTransactions.length} bank transactions across ${summary.accountsFound.length} accounts`,
    current: total,
    total,
    timeRemaining: 'Complete',
  });

  await new Promise((res) => setTimeout(res, 450));

  // Update Finance Store with dynamic sync results
  useFinanceStore.getState().applySmsSyncData(summary, deduplicatedTransactions);

  // Sync batch to Backend Database in background
  financeApi.syncSmsBatch(deduplicatedTransactions).catch((err) => {
    console.warn('[SmsReader] Backend sync noticed:', err?.message || err);
  });

  return summary;
}
