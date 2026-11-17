import { Platform, PermissionsAndroid, NativeModules } from 'react-native';
import { RawSmsMessage, ParsedBankTransaction, SmsSyncSummary } from './sms.types';
import { parseAllSmsHistory } from './smsParser';
import { useFinanceStore } from '../finance.store';

const { SmsReader } = NativeModules;

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
const SAMPLE_BANK_SMS: RawSmsMessage[] = [
  {
    id: 'mock-sms-1',
    address: 'VK-HDFCBK',
    body: 'Rs 25,000.00 credited to HDFC Bank A/c *0421 on 01-Nov-26 by Rent Payment from Priya Sharma. Avl Bal: INR 1,42,850.00',
    date: Date.now() - 86400000 * 2,
  },
  {
    id: 'mock-sms-2',
    address: 'AD-ICICIB',
    body: 'INR 1,450.00 debited from ICICI Bank Card ending 9012 on 03-Nov-26 at STARBUCKS PUNE. Bal: INR 88,400.00',
    date: Date.now() - 86400000 * 4,
  },
  {
    id: 'mock-sms-3',
    address: 'AX-SBIINB',
    body: 'Sent Rs. 3,200 via UPI from SBI A/c *7789 to swiggy@icici on 05-Nov-26. Clear Bal Rs 64,120.00',
    date: Date.now() - 86400000 * 6,
  },
  {
    id: 'mock-sms-4',
    address: 'CP-AXISBK',
    body: 'Axis Bank Credit Card XX4401 statement generated. Total Amt Due: Rs 14,200.00. Payment Due Date: 24-Nov-2026.',
    date: Date.now() - 86400000 * 8,
  },
  {
    id: 'mock-sms-5',
    address: 'VK-HDFCBK',
    body: 'Salary of Rs 1,85,000.00 credited to your A/c *0421 on 31-Oct-26. Avl Bal: INR 2,12,850.00',
    date: Date.now() - 86400000 * 12,
  },
  {
    id: 'mock-sms-6',
    address: 'VK-HDFCBK',
    body: 'SIP of Rs 25,000.00 debited from HDFC Bank A/c *0421 towards NIPPON INDIA MUTUAL FUND. Bal: INR 1,17,850.00',
    date: Date.now() - 86400000 * 14,
  },
];

/**
 * Fetches all SMS messages from the phone inbox (no 30-day limit).
 */
export async function fetchAllInboxSms(): Promise<RawSmsMessage[]> {
  if (Platform.OS === 'android' && SmsReader && typeof SmsReader.getAllSms === 'function') {
    try {
      // maxCount: -1 tells native module to retrieve ALL available inbox history without any date limit
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
 * Full sync process: reads all SMS, parses bank records, updates Finance Store.
 */
export async function syncAllBankTransactions(): Promise<SmsSyncSummary> {
  const hasPermission = await requestSmsPermission();
  if (!hasPermission) {
    throw new Error('SMS permission was denied. Please allow SMS permission in Android settings.');
  }

  const rawMessages = await fetchAllInboxSms();
  const parsedTransactions = parseAllSmsHistory(rawMessages);

  let totalDebited = 0;
  let totalCredited = 0;
  let debitCount = 0;
  let creditCount = 0;
  let billCount = 0;

  const accountsMap = new Map<string, { mask: string; bank: string; lastBalance?: number }>();

  for (const tx of parsedTransactions) {
    if (tx.type === 'debit') {
      totalDebited += tx.amount;
      debitCount++;
    } else if (tx.type === 'credit') {
      totalCredited += tx.amount;
      creditCount++;
    } else if (tx.type === 'bill') {
      billCount++;
    }

    if (tx.accountMask) {
      const existing = accountsMap.get(tx.accountMask);
      if (!existing || (tx.balance !== undefined && existing.lastBalance === undefined)) {
        accountsMap.set(tx.accountMask, {
          mask: tx.accountMask,
          bank: tx.bankName,
          lastBalance: tx.balance,
        });
      }
    }
  }

  const summary: SmsSyncSummary = {
    totalSmsScanned: rawMessages.length,
    bankSmsCount: parsedTransactions.length,
    debitCount,
    creditCount,
    billCount,
    totalDebited,
    totalCredited,
    accountsFound: Array.from(accountsMap.values()),
    lastSyncTimestamp: Date.now(),
  };

  // Update Finance Store with dynamic sync results
  useFinanceStore.getState().applySmsSyncData(summary, parsedTransactions);

  return summary;
}
