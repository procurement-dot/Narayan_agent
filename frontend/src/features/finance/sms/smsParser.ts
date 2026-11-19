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
    senderRegex: /HDFCBK|HDFC/i,
    bodyMatchRegex: /\bHDFC(?:\s*Bank)?\b/i,
  },
  {
    name: 'ICICI Bank',
    senderRegex: /ICICIB|ICICI/i,
    bodyMatchRegex: /\bICICI(?:\s*Bank)?\b/i,
  },
  {
    name: 'Axis Bank',
    senderRegex: /AXISBK|AXIS/i,
    bodyMatchRegex: /\bAxis(?:\s*Bank)?\b/i,
  },
  {
    name: 'Kotak Mahindra Bank',
    senderRegex: /KOTAKB|KOTAK/i,
    bodyMatchRegex: /\bKotak(?:\s*Bank|\s*Mahindra)?\b/i,
  },
  {
    name: 'Punjab National Bank',
    senderRegex: /PNBSMS|PUNB|PNB/i,
    bodyMatchRegex: /\b(?:Punjab\s*National\s*Bank|PNB)\b/i,
  },
  {
    name: 'Bank of Baroda',
    senderRegex: /BOBTXN|BARODA|BOB/i,
    bodyMatchRegex: /\b(?:Bank\s*of\s*Baroda|BOB)\b/i,
  },
  {
    name: 'Bank of India',
    senderRegex: /BKIND|BOI/i,
    bodyMatchRegex: /\b(?:Bank\s*of\s*India|BOI)\b/i,
  },
  {
    name: 'Canara Bank',
    senderRegex: /CANBNK|CANARA/i,
    bodyMatchRegex: /\bCanara\s*Bank\b/i,
  },
  {
    name: 'Union Bank of India',
    senderRegex: /UBISMS|UNIONB|UNION/i,
    bodyMatchRegex: /\bUnion\s*Bank(?:\s*of\s*India)?\b/i,
  },
  {
    name: 'Central Bank of India',
    senderRegex: /CENTBK|CBIN/i,
    bodyMatchRegex: /\bCentral\s*Bank(?:\s*of\s*India)?\b/i,
  },
  {
    name: 'IDFC First Bank',
    senderRegex: /IDFCFB|IDFC/i,
    bodyMatchRegex: /\bIDFC\s*FIRST(?:\s*Bank)?\b/i,
  },
  {
    name: 'IndusInd Bank',
    senderRegex: /INDBNK|INDUS/i,
    bodyMatchRegex: /\bIndusInd(?:\s*Bank)?\b/i,
  },
  {
    name: 'Yes Bank',
    senderRegex: /YESBNK|YESB/i,
    bodyMatchRegex: /\bYes\s*Bank\b/i,
  },
  {
    name: 'Federal Bank',
    senderRegex: /FEDBNK|FEDERAL/i,
    bodyMatchRegex: /\bFederal\s*Bank\b/i,
  },
  {
    name: 'Indian Bank',
    senderRegex: /IDBNK|INDIANB/i,
    bodyMatchRegex: /\bIndian\s*Bank\b/i,
  },
  {
    name: 'Saraswat Bank',
    senderRegex: /SRCB|SARASWAT/i,
    bodyMatchRegex: /\bSaraswat\s*Bank\b/i,
  },
  {
    name: 'RBL Bank',
    senderRegex: /RBLBNK|RBL/i,
    bodyMatchRegex: /\bRBL\s*Bank\b/i,
  },
  {
    name: 'AU Small Finance Bank',
    senderRegex: /AUBANK/i,
    bodyMatchRegex: /\bAU\s*Bank\b/i,
  },
];

// Pure third-party commercial/merchant senders that must NEVER be parsed as banks
const EXCLUDED_COMMERCIAL_SENDERS =
  /^(?:[A-Z]{2}-)?(?:CRED|PAYTM|PHONPE|GOOGLE|GPAY|MOBIKW|FREECH|BAJAJF|ZEPTO|SWIGGY|ZOMATO|AMAZON|FLIPKT|MYNTRA|JIO|AIRTEL|VI|DREAM1|RUMMY|LENDING|LOAN|TATAPW|BESCOM|MSEBDC|POLICY|POLICYB)/i;

/**
 * Patterns that identify non-transactional messages such as loan offers,
 * limit upgrades, failed/declined transactions, requests, OTPs, and balance alerts.
 * These are NEVER actual debits or credits.
 */
export const NON_TRANSACTION_PATTERNS = [
  /\b(?:otp|one\s*time\s*password|verification\s*code|security\s*code|secret\s*code)\b/i,
  /\b(?:do\s*not\s*share|never\s*share|is\s*valid\s*for|valid\s*till)\b/i,
  /\b(?:declined|failed|unsuccessful|cancelled|rejected|not\s*processed|could\s*not\s*be\s*processed)\b/i,
  /\b(?:pre-approved|pre\s*approved|loan\s*offer|personal\s*loan|instant\s*loan|apply\s*now|congratulations|reward\s*points)\b/i,
  /\b(?:limit\s*upgrade|card\s*limit|credit\s*limit|available\s*limit|spend\s*limit|cash\s*limit|overdraft\s*limit)\b/i,
  /\b(?:collect\s*request|request\s*received|payment\s*request|mandate\s*created|mandate\s*scheduled|autopay\s*scheduled)\b/i,
  /\b(?:win|prize|contest|rummy|dream11|cashback\s*offer|flat\s*rs|off\s*on)\b/i,
  /\b(?:spend\s*(?:rs|inr|₹)?\s*[\d,]+\s*(?:and|to|get))\b/i,
  /\b(?:daily\s*data|data\s*limit|data\s*pack|validity\s*expired)\b/i,
  /^(?:sbi\s*alert:\s*)?(?:dear\s+customer,?\s*)?(?:your\s+)?(?:clear\s*bal|avl\s*bal|available\s*balance|bal(?:ance)?)\s*(?:for\s+)?(?:a\/c|account)/i,
];

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Extracts the true transaction date written in the SMS text by the bank.
 * E.g. "on 31-Oct-24", "on 02Nov24", "on 13-10-24", "31/10/24 16:45:12".
 * If not present, falls back to the SMS hardware timestamp.
 */
export function extractTransactionDate(text: string, fallbackTimestamp: number): number {
  try {
    const clean = text.replace(/,/g, ' ');

    // 1. "on 31-Oct-24", "on 31-Oct-2024", "dated 02-Nov-24", "on 31 Oct 2024", "31-Oct-2024"
    const p1 = clean.match(/(?:on|dated|date)?\s*([0-9]{1,2})[-/ ]([A-Za-z]{3,9})[-/ ]([0-9]{2,4})\b/i);
    if (p1) {
      const day = parseInt(p1[1], 10);
      const mStr = p1[2].toLowerCase().slice(0, 3);
      let year = parseInt(p1[3], 10);
      if (year < 100) year += 2000;
      const month = MONTH_MAP[mStr];
      if (month !== undefined && day >= 1 && day <= 31 && year >= 2015 && year <= 2030) {
        return new Date(year, month, day, 12, 0, 0).getTime();
      }
    }

    // 2. "on 02Nov24", "on 10Nov24", "07Jun24"
    const p2 = clean.match(/(?:on|dated)?\s*([0-9]{1,2})([A-Za-z]{3})([0-9]{2,4})\b/i);
    if (p2) {
      const day = parseInt(p2[1], 10);
      const mStr = p2[2].toLowerCase().slice(0, 3);
      let year = parseInt(p2[3], 10);
      if (year < 100) year += 2000;
      const month = MONTH_MAP[mStr];
      if (month !== undefined && day >= 1 && day <= 31 && year >= 2015 && year <= 2030) {
        return new Date(year, month, day, 12, 0, 0).getTime();
      }
    }

    // 3. "on 13-10-24", "on 13/10/2024", "31/10/24 14:30"
    const p3 = clean.match(/(?:on|dated)?\s*([0-9]{1,2})[-/]([0-9]{1,2})[-/]([0-9]{2,4})\b/i);
    if (p3) {
      const day = parseInt(p3[1], 10);
      const month = parseInt(p3[2], 10) - 1;
      let year = parseInt(p3[3], 10);
      if (year < 100) year += 2000;
      if (month >= 0 && month <= 11 && day >= 1 && day <= 31 && year >= 2015 && year <= 2030) {
        return new Date(year, month, day, 12, 0, 0).getTime();
      }
    }
  } catch (e) {
    // fallback
  }

  return fallbackTimestamp;
}

/**
 * Checks if a sender address and message body genuinely represent an official Indian bank.
 */
export function isBankMessage(address: string, body: string): { isBank: boolean; bankName: string } {
  const cleanAddr = (address || '').trim().toUpperCase();

  // 1. Skip personal 10-14 digit phone numbers
  if (/^\+?[0-9]{10,14}$/.test(cleanAddr)) {
    return { isBank: false, bankName: '' };
  }

  // 2. Reject commercial third-party senders (Swiggy, Zomato, CRED, Paytm, Jio, etc.)
  if (EXCLUDED_COMMERCIAL_SENDERS.test(cleanAddr)) {
    return { isBank: false, bankName: '' };
  }

  // 3. Check sender ID against known Indian banks
  for (const bank of INDIAN_BANK_PATTERNS) {
    if (bank.senderRegex.test(cleanAddr)) {
      return { isBank: true, bankName: bank.name };
    }
  }

  // 4. Check if sender has official UPI / NPCI / Banking tag AND message has bank mention + account mask
  if (/(?:UPI|NPCI|BHIM|BANK|BNK|ALERT|NOTIF)/i.test(cleanAddr)) {
    for (const bank of INDIAN_BANK_PATTERNS) {
      if (bank.bodyMatchRegex.test(body)) {
        return { isBank: true, bankName: bank.name };
      }
    }
  }

  return { isBank: false, bankName: '' };
}

/**
 * Extracts bank account or card ending mask (e.g., "•••• 3098").
 */
export function extractAccountMask(text: string): { rawDigits: string; mask: string } | null {
  // 1. Standard account/card patterns (e.g. "A/c 3098", "account ending 3098", "A/C XXXXX593098", "Card ending 1234")
  const regex = /(?:a\/c|acct|acc|account|card)\s*(?:no\.?)?\s*(?:ending\s*(?:with|in)?\s*)?[:\-]?\s*[*xX#.-]*([0-9]{3,16})\b/i;
  const match = text.match(regex);
  if (match && match[1]) {
    const rawDigits = match[1];
    const lastDigits = rawDigits.length >= 4 ? rawDigits.slice(-4) : rawDigits;
    return {
      rawDigits,
      mask: `•••• ${lastDigits}`,
    };
  }

  // 2. Direct ending mask
  const endingMatch = text.match(/\bending\s*(?:with|in)\s*[:\-]?\s*[*xX#.-]*([0-9]{3,16})\b/i);
  if (endingMatch && endingMatch[1]) {
    const rawDigits = endingMatch[1];
    const lastDigits = rawDigits.length >= 4 ? rawDigits.slice(-4) : rawDigits;
    return {
      rawDigits,
      mask: `•••• ${lastDigits}`,
    };
  }

  // 3. Fallback: If message clearly references an account / card
  if (/\b(?:a\/c|account|card|bank\s*transfer)\b/i.test(text)) {
    return {
      rawDigits: '',
      mask: '•••• Primary',
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
 * Extracts clean description (UPI ID, merchant, recipient) from SMS text.
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

  // 6. Clean default based on type
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

  // 2. Sender must be an authorized bank
  const { isBank, bankName } = isBankMessage(sms.address, body);
  if (!isBank) {
    return null;
  }

  // 3. Must have an account or card mask (reject generic promotional bank broadcasts)
  const accountInfo = extractAccountMask(body);
  if (!accountInfo) {
    return null;
  }

  // 4. Determine transaction action & amount with high precision
  let type: 'debit' | 'credit' | 'bill' | null = null;
  let amount: number | null = null;

  // Bill statement check
  if (/(?:statement\s*generated|total\s*amt\s*due|payment\s*due\s*date|bill\s*(?:of|generated|due))/i.test(body)) {
    const billMatch = body.match(
      /(?:total\s*amt\s*due|amt\s*due|bill\s*amount|statement\s*for)\s*[:\-]?\s*(?:INR|Rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i
    ) || body.match(/(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);

    if (billMatch && billMatch[1]) {
      const val = parseFloat(billMatch[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0 && val < 5000000) {
        type = 'bill';
        amount = val;
      }
    }
  }

  if (!type) {
    // 1. Comprehensive Credit matching (handles "credited by/for/with/of", "credit of", "deposited", "received", "refund", "salary", "cash deposit")
    const creditRegex1 =
      /(?:credited(?:\s*(?:by|for|with|of|to|towards|via)?(?:\s+(?:transfer|upi|inward|direct|salary|imps|neft|rtgs|cash|amount|an\s+amount)\s*(?:of)?)?)?|credit(?:\s*(?:by|for|with|of)?(?:\s+(?:transfer|upi|inward|direct|salary|imps|neft|rtgs|cash|amount|an\s+amount)\s*(?:of)?)?)?|deposited(?:\s*(?:in|into|with|by)?)?|deposit\s*(?:of)?|received(?:\s*(?:from|via|in)?)?|refund(?:\s*(?:of|credited)?)?|salary(?:\s*(?:of|credited)?)?|interest(?:\s*(?:of|credited)?)?|cash\s*deposit(?:\s*(?:of)?)?)\s*[:\-]?\s*(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;
    const creditRegex2 =
      /(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)[^.;]*?\b(?:credited|deposited|received|refunded)\b/i;

    // 2. Comprehensive Debit matching (handles "debited by/for/with", "withdrawn", "spent", "paid", "card txn")
    const debitRegex1 =
      /(?:debited(?:\s*(?:by|for|with|of|towards|via)?(?:\s+(?:transfer|upi|imps|neft|rtgs|card|atm|pos|cash|amount|an\s+amount)\s*(?:of)?)?)?|debit(?:\s*(?:by|for|with|of)?(?:\s+(?:transfer|upi|imps|neft|rtgs|card|atm|pos|cash|amount|an\s+amount)\s*(?:of)?)?)?|withdrawn(?:\s*(?:from|via)?)?|withdrawal\s*(?:of)?|spent(?:\s*(?:on|at)?)?|paid(?:\s*(?:to|for)?)?|payment\s*(?:of|to|made)?|transfer\s+to\s*(?:upi|vpa)?|transferred\s+to)\s*[:\-]?\s*(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;
    const debitRegex2 =
      /(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)[^.;]*?\b(?:debited|withdrawn|spent|paid)\b/i;
    const debitCardTxnRegex =
      /(?:txn|transaction)\s*(?:of)?\s*(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)[^.;]*?\b(?:done|spent|on\s+card|at)\b/i;

    const cMatch1 = body.match(creditRegex1);
    const cMatch2 = body.match(creditRegex2);
    const cMatch = cMatch1 || cMatch2;

    const dMatch1 = body.match(debitRegex1);
    const dMatch2 = body.match(debitRegex2);
    const dMatch3 = body.match(debitCardTxnRegex);
    const dMatch = dMatch1 || dMatch2 || dMatch3;

    const isCredit = Boolean(cMatch && cMatch[1]);
    const isDebit = Boolean(dMatch && dMatch[1]);

    if (isCredit && isDebit) {
      // Disambiguate which action directly qualifies the user's account
      if (
        /(?:debited\s*(?:from)?\s*(?:your\s+)?(?:a\/c|acc|account)|(?:a\/c|acc|account)[^.;]*?\bdebited\b)/i.test(
          body
        )
      ) {
        type = 'debit';
        amount = parseFloat(dMatch![1].replace(/,/g, ''));
      } else if (
        /(?:credited\s*(?:to|in|into)?\s*(?:your\s+)?(?:a\/c|acc|account)|(?:a\/c|acc|account)[^.;]*?\bcredited\b)/i.test(
          body
        )
      ) {
        type = 'credit';
        amount = parseFloat(cMatch![1].replace(/,/g, ''));
      } else {
        const creditPos = body.search(/\b(?:credit|credited|deposited|received|deposit|salary|refund)\b/i);
        const debitPos = body.search(/\b(?:debit|debited|withdrawn|spent|paid)\b/i);
        if (creditPos !== -1 && (debitPos === -1 || creditPos < debitPos)) {
          type = 'credit';
          amount = parseFloat(cMatch![1].replace(/,/g, ''));
        } else {
          type = 'debit';
          amount = parseFloat(dMatch![1].replace(/,/g, ''));
        }
      }
    } else if (isCredit && cMatch && cMatch[1]) {
      const val = parseFloat(cMatch[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0 && val < 50000000) {
        type = 'credit';
        amount = val;
      }
    } else if (isDebit && dMatch && dMatch[1]) {
      const val = parseFloat(dMatch[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0 && val < 50000000) {
        type = 'debit';
        amount = val;
      }
    }
  }

  // Pure balance enquiries and non-transactional messages have no valid type or amount -> reject!
  if (!type || !amount) {
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

  const balance = extractBalance(body);
  const merchant = extractCleanDescription(body, type);
  // Extract real transaction date stamped by the bank
  const trueDate = extractTransactionDate(body, sms.date || sms.dateSent || Date.now());

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
    id: sms.id || `sms-${trueDate}-${amount}-${type}`,
    amount,
    type,
    accountMask: accountInfo.mask,
    rawAccountDigits: accountInfo.rawDigits,
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
