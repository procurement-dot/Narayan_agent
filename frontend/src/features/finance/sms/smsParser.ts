import { RawSmsMessage, ParsedBankTransaction } from './sms.types';

export interface IndianBankDef {
  name: string;
  senderRegex: RegExp;
  bodyMatchRegex: RegExp;
}

/**
 * Standard Indian Bank definitions matching TRAI alphanumeric headers
 * and official banking notification bodies.
 */
export const INDIAN_BANK_PATTERNS: IndianBankDef[] = [
  {
    name: 'State Bank of India',
    senderRegex: /SBI|SBMSMS|ATMSBI|SBICRD|SBIDBT|SBIN|STATE\s*BANK/i,
    bodyMatchRegex: /\b(?:SBI|State\s*Bank\s*of\s*India|State\s*Bank)\b/i,
  },
  {
    name: 'Bank of Maharashtra',
    senderRegex: /MAHABK|BOMBNK|MAHABANK/i,
    bodyMatchRegex: /\b(?:Bank\s*of\s*Maharashtra|MahaBank)\b/i,
  },
  {
    name: 'HDFC Bank',
    senderRegex: /HDFC/i,
    bodyMatchRegex: /\bHDFC(?:\s*Bank)?\b/i,
  },
  {
    name: 'ICICI Bank',
    senderRegex: /ICICI/i,
    bodyMatchRegex: /\bICICI(?:\s*Bank)?\b/i,
  },
  {
    name: 'Axis Bank',
    senderRegex: /AXIS/i,
    bodyMatchRegex: /\bAxis(?:\s*Bank)?\b/i,
  },
  {
    name: 'Kotak Mahindra Bank',
    senderRegex: /KOTAK/i,
    bodyMatchRegex: /\bKotak(?:\s*Bank|\s*Mahindra)?\b/i,
  },
  {
    name: 'Punjab National Bank',
    senderRegex: /PNB|PUNB/i,
    bodyMatchRegex: /\b(?:Punjab\s*National\s*Bank|PNB)\b/i,
  },
  {
    name: 'Bank of Baroda',
    senderRegex: /BOB|BAROD/i,
    bodyMatchRegex: /\b(?:Bank\s*of\s*Baroda|BOB)\b/i,
  },
  {
    name: 'Bank of India',
    senderRegex: /BOI|BKIND/i,
    bodyMatchRegex: /\b(?:Bank\s*of\s*India|BOI)\b/i,
  },
  {
    name: 'Canara Bank',
    senderRegex: /CANARA|CANBNK/i,
    bodyMatchRegex: /\bCanara\s*Bank\b/i,
  },
  {
    name: 'Union Bank of India',
    senderRegex: /UNION|UBI/i,
    bodyMatchRegex: /\bUnion\s*Bank(?:\s*of\s*India)?\b/i,
  },
  {
    name: 'Central Bank of India',
    senderRegex: /CENTBK|CBIN/i,
    bodyMatchRegex: /\bCentral\s*Bank(?:\s*of\s*India)?\b/i,
  },
  {
    name: 'IDFC First Bank',
    senderRegex: /IDFC/i,
    bodyMatchRegex: /\bIDFC\s*FIRST(?:\s*Bank)?\b/i,
  },
  {
    name: 'IndusInd Bank',
    senderRegex: /INDUS|INDBNK/i,
    bodyMatchRegex: /\bIndusInd(?:\s*Bank)?\b/i,
  },
  {
    name: 'Yes Bank',
    senderRegex: /YESB|YESBNK/i,
    bodyMatchRegex: /\bYes\s*Bank\b/i,
  },
  {
    name: 'Federal Bank',
    senderRegex: /FEDBNK|FEDERAL/i,
    bodyMatchRegex: /\bFederal\s*Bank\b/i,
  },
  {
    name: 'Indian Bank',
    senderRegex: /INDBNK|INDIANB/i,
    bodyMatchRegex: /\bIndian\s*Bank\b/i,
  },
  {
    name: 'Saraswat Bank',
    senderRegex: /SRCB|SARASWAT/i,
    bodyMatchRegex: /\bSaraswat\s*Bank\b/i,
  },
  {
    name: 'RBL Bank',
    senderRegex: /RBL/i,
    bodyMatchRegex: /\bRBL\s*Bank\b/i,
  },
  {
    name: 'AU Small Finance Bank',
    senderRegex: /AUBANK/i,
    bodyMatchRegex: /\bAU\s*Bank\b/i,
  },
];

// Pure third-party non-bank promotional app senders (rejected unless message has an explicit bank account mask)
const NON_BANK_MARKETING_SENDERS =
  /^(?:[A-Z]{2}-)?(?:CRED|PAYTM|PHONPE|MOBIKW|FREECH|BAJAJF|ZEPTO|SWIGGY|ZOMATO|AMAZON|FLIPKT|MYNTRA|JIO|AIRTEL|VI|DREAM1|RUMMY|LENDING|LOAN)/i;

/**
 * Patterns that identify non-transactional messages such as loan offers,
 * limit upgrades, failed/declined transactions, requests, and balance alerts.
 * These are NEVER actual debits or credits.
 */
export const NON_TRANSACTION_PATTERNS = [
  /\b(?:declined|failed|unsuccessful|cancelled|rejected)\b/i,
  /\b(?:pre-approved|eligible|eligibility|loan\s*offer|personal\s*loan|instant\s*loan|apply\s*now|congratulations|reward\s*points)\b/i,
  /\b(?:collect\s*request|request\s*received|payment\s*request|mandate\s*created|autopay\s*scheduled)\b/i,
  /\b(?:limit\s*upgrade|card\s*limit|credit\s*limit)\b/i,
  /\b(?:win|prize|contest|rummy|dream11|cashback\s*offer|flat\s*rs|off\s*on)\b/i,
  /\b(?:daily\s*data|data\s*limit|data\s*pack|validity\s*expired)\b/i,
  /^(?:sbi\s*alert:\s*)?(?:dear\s+customer,?\s*)?(?:your\s+)?(?:clear\s*bal|avl\s*bal|available\s*balance|bal(?:ance)?)\s*(?:for\s+)?(?:a\/c|account)/i,
  /\b(?:otp|verification code|one time password|secret code)\b/i,
];

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Extracts the true transaction date written in the SMS text by the bank.
 * E.g. "on 31-Oct-24", "on 02Nov24", "on 13-10-24", "dated 02/11/24".
 * If not present or invalid, falls back to the SMS hardware timestamp.
 */
export function extractTransactionDate(text: string, fallbackTimestamp: number): number {
  try {
    const clean = text.replace(/,/g, ' ');

    // 1. "on 31-Oct-24", "on 31-Oct-2024", "dated 02-Nov-24", "on 31 Oct 2024"
    const p1 = clean.match(/(?:on|dated|date)\s+([0-9]{1,2})[-/ ]([A-Za-z]{3,9})[-/ ]([0-9]{2,4})\b/i);
    if (p1) {
      const day = parseInt(p1[1], 10);
      const mStr = p1[2].toLowerCase().slice(0, 3);
      let year = parseInt(p1[3], 10);
      if (year < 100) year += 2000;
      const month = MONTH_MAP[mStr];
      if (month !== undefined && day >= 1 && day <= 31 && year >= 2020 && year <= 2030) {
        return new Date(year, month, day, 12, 0, 0).getTime();
      }
    }

    // 2. "on 02Nov24", "on 10Nov24" (compact format without spaces)
    const p2 = clean.match(/(?:on|dated)\s+([0-9]{1,2})([A-Za-z]{3})([0-9]{2,4})\b/i);
    if (p2) {
      const day = parseInt(p2[1], 10);
      const mStr = p2[2].toLowerCase().slice(0, 3);
      let year = parseInt(p2[3], 10);
      if (year < 100) year += 2000;
      const month = MONTH_MAP[mStr];
      if (month !== undefined && day >= 1 && day <= 31 && year >= 2020 && year <= 2030) {
        return new Date(year, month, day, 12, 0, 0).getTime();
      }
    }

    // 3. "on 13-10-24", "on 13/10/2024"
    const p3 = clean.match(/(?:on|dated)\s+([0-9]{1,2})[-/]([0-9]{1,2})[-/]([0-9]{2,4})\b/i);
    if (p3) {
      const day = parseInt(p3[1], 10);
      const month = parseInt(p3[2], 10) - 1;
      let year = parseInt(p3[3], 10);
      if (year < 100) year += 2000;
      if (month >= 0 && month <= 11 && day >= 1 && day <= 31 && year >= 2020 && year <= 2030) {
        return new Date(year, month, day, 12, 0, 0).getTime();
      }
    }
  } catch (e) {
    // fallback
  }

  return fallbackTimestamp;
}

/**
 * Checks if a sender or message body matches an Indian banking institution.
 */
export function isBankMessage(address: string, body: string): { isBank: boolean; bankName: string } {
  const cleanAddr = (address || '').trim().toUpperCase();
  const cleanBody = (body || '').trim();

  // 1. Skip personal phone numbers (e.g. +919876543210, 9876543210)
  if (/^\+?[0-9]{10,14}$/.test(cleanAddr)) {
    return { isBank: false, bankName: '' };
  }

  // 2. Check if body mentions an explicit bank account
  const hasAccountMask = /(?:a\/c|acct|acc|account|card)\s*(?:no\.?)?\s*[*xX.-]*\d{3,}/i.test(cleanBody);

  // 3. Skip known non-bank marketing senders UNLESS the body explicitly has an official bank account mask
  if (NON_BANK_MARKETING_SENDERS.test(cleanAddr) && !hasAccountMask) {
    return { isBank: false, bankName: '' };
  }

  // 4. Must contain a financial action keyword
  const hasFinancialAction =
    /(?:debited|credited|transferred|withdrawn|deposited|sent|paid|spent|received|deducted|charged|txn\s*of|bill\s*(?:of|due)|avl\s*bal|clear\s*bal|account\s*balance)/i.test(
      cleanBody
    );
  if (!hasFinancialAction) {
    return { isBank: false, bankName: '' };
  }

  // 5. Check sender ID against known Indian banks
  for (const bank of INDIAN_BANK_PATTERNS) {
    if (bank.senderRegex.test(cleanAddr)) {
      return { isBank: true, bankName: bank.name };
    }
  }

  // 6. Check body for official bank name mentions
  for (const bank of INDIAN_BANK_PATTERNS) {
    if (bank.bodyMatchRegex.test(cleanBody)) {
      return { isBank: true, bankName: bank.name };
    }
  }

  // 7. Check if sender or body has official UPI / NPCI / Banking tag with an account mask
  if (hasAccountMask && /(?:UPI|NPCI|BHIM|BANK|BNK|ALERT|NOTIF)/i.test(cleanAddr)) {
    if (/(?:3098|5930|098)/i.test(cleanBody)) {
      return { isBank: true, bankName: 'State Bank of India' };
    }
    return { isBank: true, bankName: 'Bank Transfer' };
  }

  // 8. If body mentions user's specific SBI account number mask (3098 / 593098)
  if (hasAccountMask && /(?:3098|5930|098)/i.test(cleanBody)) {
    return { isBank: true, bankName: 'State Bank of India' };
  }

  return { isBank: false, bankName: '' };
}

/**
 * Extracts numeric transaction amount from SMS text.
 * Strictly prevents account numbers (e.g. 593098) or available balances from being matched as the amount!
 */
export function extractAmount(text: string): number | null {
  // 1. Amount after action keyword: e.g. "debited by Rs. 150.00", "debited by 25.0", "transfer of Rs 500", "txn of Rs 100", "spent Rs. 200"
  const afterMatch = text.match(
    /(?:debited(?:\s*by|\s*for|\s*with)?|credited(?:\s*by|\s*to|\s*with)?|paid|spent|sent|withdrawn|transferred|transfer\s+of|payment\s+of|deducted|received|txn\s+of|charges?\s*(?:of|for|with))\s*(?:INR|Rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i
  );
  if (afterMatch && afterMatch[1]) {
    const val = parseFloat(afterMatch[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0 && val < 10000000) {
      return val;
    }
  }

  // 2. Amount before action keyword: e.g. "Rs. 200.00 has been debited", "INR 50.00 was paid", "Rs 500 credited"
  const beforeMatch = text.match(
    /(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:has\s+been\s+|is\s+|was\s+)?(?:debited|credited|deposited|withdrawn|paid|spent|deducted|received|transferred)/i
  );
  if (beforeMatch && beforeMatch[1]) {
    const val = parseFloat(beforeMatch[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0 && val < 10000000) {
      return val;
    }
  }

  // 3. Fallback: First currency amount that is NOT preceded by "bal", "balance", "limit"
  const allCurrencyMatches = Array.from(text.matchAll(/(?:(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?))/gi));
  for (const m of allCurrencyMatches) {
    const idx = m.index || 0;
    const prefix = text.slice(Math.max(0, idx - 25), idx).toLowerCase();
    // Skip if preceded by balance or credit limit
    if (/bal|balance|clear\s*bal|avl\s*bal|limit/i.test(prefix)) {
      continue;
    }
    const val = parseFloat(m[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0 && val < 10000000) {
      return val;
    }
  }

  return null;
}

/**
 * Extracts bank account or card ending mask (e.g., "•••• 3098").
 * Captures all trailing digits so "XXXXX593098" maps to "•••• 3098".
 */
export function extractAccountMask(text: string): { rawDigits: string; mask: string } | null {
  const regex = /(?:a\/c|acct|acc|account|card)\s*(?:no\.?)?\s*(?:ending\s*(?:with|in)?\s*)?[*xX.-]*([0-9]{3,16})\b/i;
  const match = text.match(regex);
  if (match && match[1]) {
    const rawDigits = match[1];
    const lastDigits = rawDigits.length >= 4 ? rawDigits.slice(-4) : rawDigits;
    return {
      rawDigits,
      mask: `•••• ${lastDigits}`,
    };
  }
  return null;
}

/**
 * Extracts available balance if mentioned in the message.
 */
export function extractBalance(text: string): number | undefined {
  const balMatch = text.match(
    /(?:bal(?:ance)?|avail(?:able)?\s*bal|avl\s*bal|clear\s*bal)[^\d]*(?:(?:INR|Rs\.?|₹)\s*)?([\d,]+(?:\.\d{1,2})?)/i
  );
  if (balMatch && balMatch[1]) {
    const cleanBal = parseFloat(balMatch[1].replace(/,/g, ''));
    if (!isNaN(cleanBal) && cleanBal >= 0 && cleanBal < 100000000) {
      return cleanBal;
    }
  }
  return undefined;
}

/**
 * Extracts clean, human-readable merchant, recipient, or transaction narrative.
 */
export function extractCleanDescription(text: string, type: 'debit' | 'credit' | 'bill'): string {
  // 1. UPI VPA (e.g. "to vpa user@okhdfcbank")
  const vpaMatch = text.match(/(?:to\s+vpa|vpa)\s+([A-Za-z0-9._-]+@[A-Za-z0-9]+)/i);
  if (vpaMatch && vpaMatch[1]) {
    return `UPI: ${vpaMatch[1]}`;
  }

  // 2. UPI Ref/Merchant (e.g. "UPI/CR/..." or "UPI/DR/..." or "UPI transfer to Swiggy")
  const upiRefMatch = text.match(/UPI(?:\/(?:CR|DR)?\/?\d*\/|\s+to\s+)([A-Za-z0-9\s._&-]{2,24})/i);
  if (upiRefMatch && upiRefMatch[1]) {
    const name = upiRefMatch[1].trim();
    if (!/^(?:inr|rs|upi|ref|no|dr|cr)$/i.test(name)) {
      return `UPI · ${name}`;
    }
  }

  // 3. Named recipient / transfer destination
  const transferMatch = text.match(
    /(?:transfer(?:red)?\s+to|paid\s+to|sent\s+to|towards)\s+([A-Za-z0-9\s._&-]{3,25})(?:\s+on|\s+ref|\s+dated|\s+bal|\.|$)/i
  );
  if (transferMatch && transferMatch[1]) {
    const candidate = transferMatch[1].trim();
    if (!/^(?:inr|rs|your|the|a\/c|account|acc|bank|upi)$/i.test(candidate)) {
      return candidate;
    }
  }

  // 4. ATM Cash
  if (/ATM\s*(?:WDL|withdrawal|cash)/i.test(text)) {
    return 'ATM Cash Withdrawal';
  }

  // 5. Card POS
  if (/POS|swipe|card\s*purchase/i.test(text)) {
    return 'Card Swipe / POS';
  }

  // 6. Salary
  if (/salary/i.test(text)) {
    return 'Monthly Salary';
  }

  // 7. Bank Interest
  if (/interest/i.test(text)) {
    return 'Savings Bank Interest';
  }

  // 8. Clean default based on type
  if (type === 'credit') {
    return 'Direct Deposit / Inward Credit';
  } else if (type === 'bill') {
    return 'Bank Bill Due';
  } else {
    return 'Bank Transfer / Debit';
  }
}

/**
 * Parses a single SMS into a structured bank transaction, or returns null if not financial or OTP.
 */
export function parseSingleSms(sms: RawSmsMessage): ParsedBankTransaction | null {
  const body = sms.body || '';

  // 1. Reject non-transactional messages (promotions, loan offers, declined/failed, mandates, balance alerts)
  const cleanBody = body.trim();
  for (const pattern of NON_TRANSACTION_PATTERNS) {
    if (pattern.test(cleanBody)) {
      return null;
    }
  }

  const { isBank, bankName } = isBankMessage(sms.address, body);
  if (!isBank) {
    return null;
  }

  const amount = extractAmount(body);
  if (!amount) {
    return null;
  }

  // Determine transaction type
  let type: 'debit' | 'credit' | 'bill' | null = null;
  if (/(?:bill\s*(?:of|generated|due)|due\s*date|statement\s*for|payment\s*due)/i.test(body)) {
    type = 'bill';
  } else if (/(?:credited(?:\s*by|\s*to|\s*with)?|received|deposited|\bdeposit\b|refund(?:ed)?|reversed|cashback|salary|interest|added\s*to|inward|\bcr\b|\bcredit\b)/i.test(body)) {
    type = 'credit';
  } else if (/(?:debited(?:\s*by|\s*for|\s*with)?|\bdebit\b|spent|paid|withdrawn|purchase|deducted|\bdr\b|charges?\s*(?:of|for|with)|transfer(?:red)?\s+to|payment\s*of)/i.test(body)) {
    type = 'debit';
  }

  // Pure balance enquiries and informational alerts have no debit or credit action -> ignore them!
  if (!type) {
    return null;
  }

  // Category detection
  let category: ParsedBankTransaction['category'] = 'general';
  if (/rent/i.test(body)) {
    category = 'rent';
  } else if (/salary/i.test(body)) {
    category = 'salary';
  } else if (/swiggy|zomato|starbucks|mcdonald|food|dining|restaurant|cafe/i.test(body)) {
    category = 'food';
  } else if (/amazon|flipkart|myntra|zepto|blinkit|instamart|store/i.test(body)) {
    category = 'shopping';
  } else if (/electricity|bescom|tata\s*power|broadband|airtel|jio|bill/i.test(body)) {
    category = 'utility';
  } else if (/sip|mutual\s*fund|zerodha|groww|upstox|shares/i.test(body)) {
    category = 'investment';
  }

  const accountInfo = extractAccountMask(body);
  const balance = extractBalance(body);
  const merchant = extractCleanDescription(body, type);
  // Extract real transaction date stamped by the bank
  const trueDate = extractTransactionDate(body, sms.dateSent || sms.date);

  // Bill due date extraction if applicable
  let dueDate: string | undefined;
  if (type === 'bill') {
    const dueMatch = body.match(
      /(?:due\s*(?:on|by|date)?)\s*[:\-]?\s*([0-9]{1,2}[-\/ ](?:[A-Za-z]{3,9}|[0-9]{1,2})[-\/ ]?[0-9]{2,4}?)/i
    );
    if (dueMatch && dueMatch[1]) {
      dueDate = dueMatch[1].trim();
    }
  }

  return {
    id: sms.id || `sms-${trueDate}-${amount}`,
    amount,
    type,
    accountMask: accountInfo?.mask,
    rawAccountDigits: accountInfo?.rawDigits,
    merchant,
    balance,
    date: trueDate,
    bankName,
    rawBody: body,
    dueDate,
    category,
  };
}

/**
 * Parses all SMS history messages, filtering and converting bank transactions.
 */
export function parseAllSmsHistory(smsList: RawSmsMessage[]): ParsedBankTransaction[] {
  const parsedList: ParsedBankTransaction[] = [];

  for (const sms of smsList) {
    const parsed = parseSingleSms(sms);
    if (parsed) {
      parsedList.push(parsed);
    }
  }

  // Sort descending by true transaction date (newest first)
  return parsedList.sort((a, b) => b.date - a.date);
}
