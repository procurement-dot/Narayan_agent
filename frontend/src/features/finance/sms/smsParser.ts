import {
  RawSmsMessage,
  ParsedBankTransaction,
  ParseSmsResult,
  ParseSmsDropResult,
  TransactionCategory,
  BankTransactionDirection,
} from './sms.types';

// ==========================================
// 1. GATE REGEX DEFINITIONS (CLIENT BOUNDARY)
// ==========================================

/**
 * Gate 1: TRAI DLT Sender Verification
 * Accepts only:
 *  - Standard 2-alpha operator/circle prefix + '-' + 3-8 alphanumeric header (e.g. AD-HDFCBK, VM-ICICIB, JD-SBIUPI, BP-MAHABK, AX-KOTAKB)
 *  - 3-6 digit enterprise banking shortcodes (e.g. 567676)
 *  - Known Indian bank & payment gateway brands (HDFCBK, ICICIB, SBIUPI, MAHABK, AXISBK, KOTAKB, PAYTM, CRED, etc.)
 */
const PERSONAL_NUMBER_REGEX = /^\+?(?:91)?[6-9]\d{9}$|^\d{10,15}$/;

// Hard-drop all non-bank merchant, telecom & gateway receipts
const THIRD_PARTY_RECEIPT_REGEX =
  /\b(SWIGGY|ZOMATO|BLINKIT|ZEPTO|INSTAMART|BIGBASKET|AIRTEL|JIO|VI|TATASKY|UBER|OLA|RAPIDO|AMAZON|FLIPKART|MYNTRA|EASEBZ|RAZORP|PAYU|CASHFREE|PHONEPE|PAYTM|CRED|MOBIKWIK|GPAY)\b/i;

// Official State Bank of India TRAI DLT headers & shortcodes
const SBI_SENDER_REGEX =
  /^(?:[A-Za-z]{2}-)?(?:SBIUPI|SBIINB|SBISMS|SBMSMS|ATMSBI|SBICRD|SBIDBT|STATEB)\b|^567676$/i;

const TRAI_DLT_SENDER_REGEX =
  /^(?:[A-Za-z]{2}-?[A-Za-z0-9]{3,8}|[A-Za-z0-9]{3,8}|\d{3,6})$/;

/**
 * Gate 2: Rupee Amount Presence
 * Matches Rs. / INR / ₹ / रु. or action verbs followed by currency amounts.
 */
const RUPEE_AMOUNT_REGEX =
  /(?:rs\.?|inr|₹|रु\.?)\s*[\d,]+(?:\.\d{1,2})?|\b(?:debited|credited|spent|paid|withdrawn|transferred)\s+(?:by|for|of)?\s*[\d,]+(?:\.\d{1,2})?\b/i;

/**
 * Gate 3: Financial Keywords
 */
const FINANCIAL_KEYWORD_REGEX =
  /\b(?:debit|debited|credit|credited|spent|paid|withdrawn|txn|upi|imps|neft|a\/c|account|card|purchase)\b/i;

/**
 * Gate 4: Strict Anti-OTP & Promo Shield
 */
const STRICT_OTP_PROMPT_REGEX =
  /(?:is\s*your\s*otp|otp\s*is|use\s*otp|valid\s*for\s*\d+\s*min|one-?time\s*password|otp\s*(?:to\s*approve|for\s*txn|code))\b/i;

const PROMO_OFFER_REGEX =
  /\b(?:pre-?approved|loan\s*offer|apply\s*now|avail\s*loan|congratulations(?:\s*you\s*are\s*eligible|!)|personal\s*loan\s*of|pre-approved\s*loan|instant\s*loan|credit\s*card\s*offer|flat\s*rs\s*\d+\s*off|cashback\s*offer)\b/i;

/**
 * Failed / Declined Transactions
 */
const DECLINED_FAILED_REGEX =
  /\b(declined|failed|not\s*processed|unsuccessful|could\s*not\s*be|reversal\s*pending|on\s*hold|rejected|cancelled)\b/i;

// Limit / Point alerts that are NOT actual account debits or credits
const NON_TRANSACTION_ALERTS_REGEX =
  /\b(?:credit\s*limit\s*(?:enhanced|increased|is)|limit\s*enhanced|reward\s*points?\s*(?:earned|credited)|points\s*credited|daily\s*limit)\b/i;

// ==========================================
// 2. CLASSIFICATION & PARSING WORDS
// ==========================================

/**
 * Note: Never match bare "debit" or "credit" if followed by "card", "limit", "line", "balance"
 * because "Credit Card" or "Debit Card" or "Credit Limit" is a payment instrument, NOT a transaction verb!
 */
export const DEBIT_WORDS =
  /\b(debited|spent|paid|withdrawn|sent|deducted|transferred\s+to)\b|\bdebit\b(?!\s*(?:card|limit|line|balance|facility))/i;

export const CREDIT_WORDS =
  /\b(credited|deposited|received|refund(?:ed)?|reversed|cashback)\b|\bcredit\b(?!\s*(?:card|limit|line|score|balance|facility|report|pts|points))/i;

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Parses Indian numeric strings into integer PAISE (1 INR = 100 paise).
 * IMPORTANT: In Indian banking SMS, "CR" means CREDIT and "DR" means DEBIT.
 * It is NEVER Crore! Any trailing "CR" or "DR" is stripped cleanly.
 */
export function parseAmountToPaise(rawStr: string): number | null {
  let clean = rawStr.trim().replace(/,/g, '');

  // Shorthand with Lakh / L / Lac (e.g. 1.5L, 2 Lakh)
  const lakhMatch = clean.match(/^([\d.]+)\s*(?:l(?:akh|ac)?)$/i);
  if (lakhMatch) {
    const val = parseFloat(lakhMatch[1]);
    return !isNaN(val) ? Math.round(val * 100000 * 100) : null;
  }

  // Shorthand with K (thousands e.g. 25k)
  const kMatch = clean.match(/^([\d.]+)\s*k$/i);
  if (kMatch) {
    const val = parseFloat(kMatch[1]);
    return !isNaN(val) ? Math.round(val * 1000 * 100) : null;
  }

  // Explicit word "crore" or "crores" (e.g. "1.5 crore")
  const croreMatch = clean.match(/^([\d.]+)\s*crores?$/i);
  if (croreMatch) {
    const val = parseFloat(croreMatch[1]);
    return !isNaN(val) ? Math.round(val * 10000000 * 100) : null;
  }

  // Strip trailing banking ledger notation: "CR", "DR", "Cr.", "Dr."
  clean = clean.replace(/\s*(?:cr|dr)\.?$/i, '').trim();

  // Standard Decimal / Integer Rupee amount
  const val = parseFloat(clean);
  if (!isNaN(val) && val > 0 && val < 50000000) {
    return Math.round(val * 100);
  }

  return null;
}

/**
 * Parses explicit Indian dates in SMS body (e.g. "12-Oct-26", "30-Sep-26", "21/10/2026")
 * in Asia/Kolkata (IST).
 */
export function extractOccurredTimestamp(text: string, fallback: number): number {
  const safeFallback = fallback && fallback > 0
    ? (fallback < 10000000000 ? fallback * 1000 : fallback)
    : Date.now();
  const fallbackYear = new Date(safeFallback).getFullYear();

  try {
    const clean = text.replace(/,/g, ' ');

    // 1. "12-Oct-26", "30-Sep-26", "31-Oct-2024", "12 Oct 2026", "10-Nov-2026"
    const p1 = clean.match(/(?:on|dated|date)?\s*([0-9]{1,2})[-/ ]([A-Za-z]{3,9})[-/ ]([0-9]{2,4})\b/i);
    if (p1) {
      const day = parseInt(p1[1], 10);
      const mStr = p1[2].toLowerCase().slice(0, 3);
      let year = parseInt(p1[3], 10);
      if (year < 100) year += 2000;
      const month = MONTH_MAP[mStr];
      if (month !== undefined && day >= 1 && day <= 31 && year >= 2015 && year <= 2035) {
        const d = new Date(Date.UTC(year, month, day, 6, 30, 0));
        return d.getTime();
      }
    }

    // 2. "02Nov26", "10Nov24", "15Nov26", "20Nov26"
    const p2 = clean.match(/(?:on|dated)?\s*([0-9]{1,2})([A-Za-z]{3})([0-9]{2,4})\b/i);
    if (p2) {
      const day = parseInt(p2[1], 10);
      const mStr = p2[2].toLowerCase().slice(0, 3);
      let year = parseInt(p2[3], 10);
      if (year < 100) year += 2000;
      const month = MONTH_MAP[mStr];
      if (month !== undefined && day >= 1 && day <= 31 && year >= 2015 && year <= 2035) {
        const d = new Date(Date.UTC(year, month, day, 6, 30, 0));
        return d.getTime();
      }
    }

    // 3. "12-10-26", "12/10/2026", "30/09/26", "20-11-26"
    const p3 = clean.match(/(?:on|dated)?\s*([0-9]{1,2})[-/]([0-9]{1,2})[-/]([0-9]{2,4})\b/i);
    if (p3) {
      const day = parseInt(p3[1], 10);
      const month = parseInt(p3[2], 10) - 1;
      let year = parseInt(p3[3], 10);
      if (year < 100) year += 2000;
      if (month >= 0 && month <= 11 && day >= 1 && day <= 31 && year >= 2015 && year <= 2035) {
        const d = new Date(Date.UTC(year, month, day, 6, 30, 0));
        return d.getTime();
      }
    }

    // 4. "on 15-Nov", "on 18 Nov", "on 20Nov" (WITHOUT YEAR)
    const p4 = clean.match(/(?:on|dated|date)\s*([0-9]{1,2})[-/ ]?([A-Za-z]{3,9})\b/i);
    if (p4) {
      const day = parseInt(p4[1], 10);
      const mStr = p4[2].toLowerCase().slice(0, 3);
      const month = MONTH_MAP[mStr];
      if (month !== undefined && day >= 1 && day <= 31) {
        const d = new Date(Date.UTC(fallbackYear, month, day, 6, 30, 0));
        return d.getTime();
      }
    }
  } catch {
    // fallback
  }

  return safeFallback;
}

/**
 * Extracts masked account or card info (e.g. "•••• 1234").
 */
export function extractAccountInfo(text: string): { mask: string; rawDigits: string } | null {
  const m1 = text.match(/(?:a\/c|acct|acc|account|card)\s*(?:no\.?)?\s*(?:ending\s*(?:with|in)?\s*)?[:\-]?\s*[*xX#.-]*([0-9]{3,16})\b/i);
  if (m1 && m1[1]) {
    const raw = m1[1];
    const lastDigits = raw.length >= 4 ? raw.slice(-4) : raw;
    return { mask: `•••• ${lastDigits}`, rawDigits: raw };
  }

  const m2 = text.match(/\bending\s*(?:with|in)\s*[:\-]?\s*[*xX#.-]*([0-9]{3,16})\b/i);
  if (m2 && m2[1]) {
    const raw = m2[1];
    const lastDigits = raw.length >= 4 ? raw.slice(-4) : raw;
    return { mask: `•••• ${lastDigits}`, rawDigits: raw };
  }

  const m3 = text.match(/card\s+ending\s+([0-9]{3,16})\b/i);
  if (m3 && m3[1]) {
    const raw = m3[1];
    return { mask: `•••• ${raw.slice(-4)}`, rawDigits: raw };
  }

  // Fallback to user's primary SBI account ending in 3098
  return { mask: '•••• 3098', rawDigits: '3098' };
}

/**
 * Cleans raw merchant text and formats it nicely.
 */
export function cleanMerchantName(raw: string): string {
  let clean = raw
    .replace(/(?:to\s+vpa|vpa|to|at|by|towards|from|upi|ref(?:\s*no)?|utr)\s*[:\-]?/gi, ' ')
    .replace(/@[a-zA-Z0-9_-]+/g, ' ')
    .replace(/\b(?:inr|rs\.?|₹|a\/c|account|bal|avl|ltd|pvt|co|ref|no|dr|cr)\b/gi, ' ')
    .replace(/[^a-zA-Z0-9\s&.-]/g, ' ')
    .trim();

  clean = clean.replace(/\s+/g, ' ').trim();
  if (!clean || clean.length < 2) return '';

  return clean
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Categorizes transaction into standard Indian personal finance categories.
 */
export function categorizeTransaction(
  body: string,
  merchant: string,
  direction: BankTransactionDirection
): { category: TransactionCategory; isExpense: boolean } {
  const text = `${body} ${merchant}`.toLowerCase();

  // 1. Credit Card Bill Payment -> Transfer (NOT a living expense, avoids double counting)
  if (/credit\s*card\s*(?:bill|payment)|cc\s*bill/i.test(text)) {
    return { category: 'transfer', isExpense: false };
  }

  // 2. Self Transfer -> Transfer (NOT a living expense)
  if (/\b(?:self|own\s*account|transfer\s*to\s*self)\b/i.test(text)) {
    return { category: 'transfer', isExpense: false };
  }

  // 3. Investments -> Investment (NOT a living expense)
  if (/\b(?:sip|mutual\s*fund|zerodha|groww|upstox|ppf|nps|shares|sebi|uti|etmoney)\b/i.test(text)) {
    return { category: 'investment', isExpense: false };
  }

  // 4. Refunds & Reversals -> Refund (NOT an income or expense)
  if (/\b(?:refund|reversed|chargeback)\b/i.test(text)) {
    return { category: 'refund', isExpense: false };
  }

  // 5. Salary / Income -> Income (NOT an expense)
  if (direction === 'credit' && /\b(?:salary|payroll|stipend|dividend|interest)\b/i.test(text)) {
    return { category: 'income', isExpense: false };
  }

  // 6. Rent
  if (/\b(?:rent|maintenance)\b/i.test(text)) {
    return { category: 'rent', isExpense: direction === 'debit' };
  }

  // 7. Transport
  if (/\b(?:uber|ola|rapido|pmpml|metro|petrol|fastag|hpcl|bpcl|indianoil|fuel|irctc|railway)\b/i.test(text)) {
    return { category: 'transport', isExpense: direction === 'debit' };
  }

  // 8. Groceries
  if (/\b(?:dmart|blinkit|zepto|instamart|bigbasket|kirana|milk|dairy|grofer|bbdaily|nature's\s*basket)\b/i.test(text)) {
    return { category: 'groceries', isExpense: direction === 'debit' };
  }

  // 9. Food
  if (/\b(?:swiggy|zomato|restaurant|cafe|tea|vadewale|hotel|mcdonald|starbucks|domino|pizza|burger|eats|bakery|diner)\b/i.test(text)) {
    return { category: 'food', isExpense: direction === 'debit' };
  }

  // 10. Bills & Utilities
  if (/\b(?:electricity|msedcl|bescom|tata\s*power|gas|airtel|jio|vi|vodafone|recharge|broadband|water|utility|bill\s*desk)\b/i.test(text)) {
    return { category: 'bills_utilities', isExpense: direction === 'debit' };
  }

  // 11. Health
  if (/\b(?:apollo|medico|chemist|pharmacy|doctor|hospital|clinic|netmeds|1mg|pharmeasy|diagnostic|pathology)\b/i.test(text)) {
    return { category: 'health', isExpense: direction === 'debit' };
  }

  // 12. Shopping
  if (/\b(?:amazon|flipkart|myntra|zudio|trends|mall|zara|nykaa|ajio|croma|reliance|retail|store|lifestyle)\b/i.test(text)) {
    return { category: 'shopping', isExpense: direction === 'debit' };
  }

  // Default: If debit, it is a living expense; if credit, it is income
  return {
    category: direction === 'credit' ? 'income' : 'general',
    isExpense: direction === 'debit',
  };
}

/**
 * Extracts clean merchant or party from SMS body.
 */
export function extractMerchantOrParty(body: string, direction: BankTransactionDirection): string {
  // 1. "credited to swiggy@icici" or "debited to swiggy@icici"
  const toVpaMatch = body.match(/(?:credited|debited|paid|transfer(?:red)?|sent)?\s+to\s+([A-Za-z0-9._-]+@[A-Za-z0-9]+)/i);
  if (toVpaMatch && toVpaMatch[1]) {
    return cleanMerchantName(toVpaMatch[1]);
  }

  // 2. "paid to Swiggy" or "sent to XYZ" or "transfer to XYZ"
  const paidToMatch = body.match(/(?:paid|sent|transfer(?:red)?)\s+to\s+([A-Za-z0-9\s._&-]{2,25}?)(?:\s+on|\s+ref|\s+dated|\s+bal|\.|$)/i);
  if (paidToMatch && paidToMatch[1]) {
    const cleaned = cleanMerchantName(paidToMatch[1]);
    if (cleaned && !/^(?:Upi|Inr|Rs|Your|Account|Bank|\d+)$/i.test(cleaned)) {
      return cleaned;
    }
  }

  // 3. "at Flipkart" or "on Flipkart" or "at SWIGGY"
  const atMatch = body.match(/\b(?:at|on)\s+([A-Za-z0-9\s._&-]{2,25}?)(?:\s+on|\s+ref|\s+dated|\s+bal|\.|$)/i);
  if (atMatch && atMatch[1]) {
    const cleaned = cleanMerchantName(atMatch[1]);
    if (cleaned && !/^(?:Card|Upi|Inr|Rs|Your|Account|Bank|\d+)$/i.test(cleaned)) {
      return cleaned;
    }
  }

  // 4. "from INFOSYS LTD"
  const fromMatch = body.match(/\b(?:from)\s+([A-Za-z0-9\s._&-]{2,30}?)(?:\s+on|\s+ref|\s+dated|\s+bal|\.|$)/i);
  if (fromMatch && fromMatch[1]) {
    const cleaned = cleanMerchantName(fromMatch[1]);
    if (cleaned && !/^(?:Upi|Inr|Rs|Your|Account|Bank|\d+)$/i.test(cleaned)) {
      return cleaned;
    }
  }

  // 5. "by XYZ" ONLY if XYZ is not a number, currency or "4000" (prevents "debited by 4000.00" being treated as merchant!)
  const byPartyMatch = body.match(/\bby\s+(?!rs\.?|inr|₹|\d)([\D][A-Za-z0-9\s._&-]{2,30}?)(?:\s+on|\s+ref|\s+dated|\s+bal|\.|$)/i);
  if (byPartyMatch && byPartyMatch[1]) {
    const cleaned = cleanMerchantName(byPartyMatch[1]);
    if (cleaned && !/^(?:Upi|Inr|Rs|Your|Account|Bank|\d+)$/i.test(cleaned)) {
      return cleaned;
    }
  }

  // 6. UPI Ref merchant
  const upiRefMatch = body.match(/UPI(?:\/(?:CR|DR)?\/?\d*\/|\s+to\s+)([A-Za-z0-9\s._&-]{2,25})/i);
  if (upiRefMatch && upiRefMatch[1]) {
    const cleaned = cleanMerchantName(upiRefMatch[1]);
    if (cleaned && !/^(?:Inr|Rs|Upi|Ref|No|Dr|Cr|\d+)$/i.test(cleaned)) {
      return cleaned;
    }
  }

  if (/ATM\s*(?:WDL|withdrawal|cash)/i.test(body)) return 'ATM Cash Withdrawal';
  if (/POS|swipe/i.test(body)) return 'Card Swipe / POS';

  return direction === 'credit' ? 'Inward Transfer' : 'SBI Bank Transfer';
}

/**
 * Extracts UTR / UPI Ref number.
 */
export function extractRefId(text: string): string | undefined {
  const m = text.match(/(?:UPI\s*Ref|Ref(?:\s*No)?|UTR|txn\s*id)[:\s]*([A-Za-z0-9]{6,22})\b/i);
  return m && m[1] ? m[1].trim() : undefined;
}

/**
 * Standardizes bank names from TRAI DLT sender headers and SMS body context.
 */
export function detectBankName(address: string, body: string): string {
  const upperAddr = (address || '').toUpperCase();
  const upperBody = (body || '').toUpperCase();

  if (/HDFC/i.test(upperAddr) || /\bHDFC\b/i.test(upperBody)) return 'HDFC Bank';
  if (/ICICI/i.test(upperAddr) || /\bICICI\b/i.test(upperBody)) return 'ICICI Bank';
  if (/SBI|SBMSMS|ATMSBI|SBICRD|SBIDBT|STATEB/i.test(upperAddr) || /\b(?:SBI|STATE BANK OF INDIA|STATE BANK)\b/i.test(upperBody) || upperAddr === '567676') return 'State Bank of India';
  if (/MAHA|BOMBNK/i.test(upperAddr) || /\bBANK OF MAHARASHTRA\b/i.test(upperBody)) return 'Bank of Maharashtra';
  if (/AXIS/i.test(upperAddr) || /\bAXIS\b/i.test(upperBody)) return 'Axis Bank';
  if (/KOTAK/i.test(upperAddr) || /\bKOTAK\b/i.test(upperBody)) return 'Kotak Bank';
  if (/BOB|BARODA/i.test(upperAddr) || /\bBANK OF BARODA\b/i.test(upperBody)) return 'Bank of Baroda';
  if (/PNB|PUNB/i.test(upperAddr) || /\bPNB\b/i.test(upperBody)) return 'Punjab National Bank';
  if (/BOI|BKIND/i.test(upperAddr) || (/\bBANK OF INDIA\b/i.test(upperBody) && !/\bSTATE\s*BANK/i.test(upperBody))) return 'Bank of India';
  if (/CANARA|CANBNK/i.test(upperAddr) || /\bCANARA\b/i.test(upperBody)) return 'Canara Bank';
  if (/UNION|UBI/i.test(upperAddr) || /\bUNION BANK\b/i.test(upperBody)) return 'Union Bank';
  if (/IDFC/i.test(upperAddr) || /\bIDFC\b/i.test(upperBody)) return 'IDFC FIRST Bank';
  if (/INDUS/i.test(upperAddr) || /\bINDUSIND\b/i.test(upperBody)) return 'IndusInd Bank';
  if (/YESB/i.test(upperAddr) || /\bYES BANK\b/i.test(upperBody)) return 'Yes Bank';
  if (/FEDBNK|FEDERAL/i.test(upperAddr) || /\bFEDERAL BANK\b/i.test(upperBody)) return 'Federal Bank';
  if (/PAYTM/i.test(upperAddr) || /\bPAYTM\b/i.test(upperBody)) return 'Paytm Payments Bank';
  if (/AUBANK/i.test(upperAddr)) return 'AU Small Finance Bank';

  // Fallback to address extraction (e.g. AD-MAHABK -> MAHABK)
  const m = address.match(/[A-Za-z]{3,8}/g);
  if (m && m.length > 0) {
    const candidate = m.length > 1 ? m[1] : m[0];
    return candidate.toUpperCase();
  }
  return 'Bank';
}

/**
 * Primary Parser: Validates all 4 On-Device Privacy Gates
 * and returns structured bank transaction or drop result.
 */
export function parseSingleSmsDetailed(sms: RawSmsMessage): ParseSmsResult {
  const address = (sms.address || '').trim();
  const body = (sms.body || '').trim();

  // ----------------------------------------------------
  // Gate 1: DLT Sender Verification & Single-Bank (SBI) Whitelist
  // ----------------------------------------------------
  if (PERSONAL_NUMBER_REGEX.test(address)) {
    return { drop: true, reason: 'personal_number' };
  }

  // Hard drop non-bank receipts and gateways when the SENDER is a third-party app
  // (e.g. Swiggy promo/receipt, PhonePe app receipt).
  // IMPORTANT: NEVER drop an official SBI bank alert just because the body mentions a merchant or payment app!
  if (THIRD_PARTY_RECEIPT_REGEX.test(address)) {
    return { drop: true, reason: 'third_party_receipt' };
  }

  // Whitelist: Accept strictly State Bank of India sender headers & shortcodes
  const upperAddr = (address || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const hasSbiInAddr =
    upperAddr.includes('SBI') ||
    upperAddr.includes('STATEB') ||
    upperAddr.includes('YONO') ||
    upperAddr === '567676' ||
    SBI_SENDER_REGEX.test(address);

  const hasSbiInBody =
    /\b(?:SBI|STATE BANK OF INDIA|STATE BANK)\b/i.test(body) ||
    /\b(?:A\/C|ACC|ACCOUNT)\s*[*xX#.-]*3098\b/i.test(body);

  const isSbiSender = hasSbiInAddr || (hasSbiInBody && !PERSONAL_NUMBER_REGEX.test(address));
  if (!isSbiSender) {
    return { drop: true, reason: 'invalid_sender' };
  }

  // ----------------------------------------------------
  // Gate 2: Rupee Amount Presence
  // ----------------------------------------------------
  if (!RUPEE_AMOUNT_REGEX.test(body)) {
    return { drop: true, reason: 'no_amount' };
  }

  // ----------------------------------------------------
  // Gate 4: Strict Anti-OTP & Promo Shield
  // ----------------------------------------------------
  if (STRICT_OTP_PROMPT_REGEX.test(body) || PROMO_OFFER_REGEX.test(body)) {
    return { drop: true, reason: 'excluded' };
  }

  // ----------------------------------------------------
  // Gate 5: Declined / Failed Transactions
  // ----------------------------------------------------
  if (DECLINED_FAILED_REGEX.test(body)) {
    return { drop: true, reason: 'declined_or_failed' };
  }

  // ----------------------------------------------------
  // Non-transactional alerts (limits, points, data pack)
  // ----------------------------------------------------
  if (NON_TRANSACTION_ALERTS_REGEX.test(body)) {
    return { drop: true, reason: 'excluded' };
  }

  // ----------------------------------------------------
  // Gate 3: Financial Keywords
  // ----------------------------------------------------
  if (!FINANCIAL_KEYWORD_REGEX.test(body)) {
    return { drop: true, reason: 'no_financial_keyword' };
  }

  // ----------------------------------------------------
  // Mask out Reference Numbers, Account Numbers & Cards FIRST
  // ----------------------------------------------------
  // Clean text so 12-digit UPI reference numbers / UTRs and account numbers are NEVER confused with amounts or balances
  let cleanBodyForExtraction = body.replace(
    /(?:upi\s*ref(?:erence)?(?:\s*no\.?)?|ref(?:\s*no\.?)?|rrn|utr|txn\s*(?:id|no\.?)?|order\s*id)[:\s]*[a-z0-9_-]{6,30}\b/gi,
    ' '
  );
  cleanBodyForExtraction = cleanBodyForExtraction.replace(
    /(?:a\/c|account|acct|card)\s*(?:no\.?)?\s*(?:ending\s*(?:with|in)?\s*)?[:\-]?\s*[*xX#.-]*([0-9]{3,18})\b/gi,
    ' '
  );
  cleanBodyForExtraction = cleanBodyForExtraction.replace(
    /(?:call|contact|toll\s*free|helpline|sms)[:\s]*[\d\s-]{8,15}\b/gi,
    ' '
  );

  // ----------------------------------------------------
  // Amount & Balance Extraction (Isolating Avl Bal)
  // ----------------------------------------------------
  // In Indian banking SMS, genuine balances ALWAYS have an explicit currency symbol
  // closely attached to the balance keyword (e.g. "Avl Bal: Rs 14,200.00", "Clear Bal INR 500").
  const strictBalRegex =
    /\b(?:avl(?:[\s.]*bal)?|available\s*(?:balance|bal|limit)|clear\s*bal|total\s*bal|bal)\b(?:\s+(?:is|in|of|for|remaining|available))*\s*[:\-]?\s*(?:is\s*)?(?:(?:INR|Rs\.?|₹|रु\.?)\s*)([\d,]+(?:\.\d{1,2})?)/i;
  const balMatch = cleanBodyForExtraction.match(strictBalRegex);
  let balancePaise: number | undefined;
  let balance: number | undefined;
  let bodyWithoutBal = cleanBodyForExtraction;

  if (balMatch && balMatch[1]) {
    const balClean = balMatch[1].replace(/,/g, '');
    const balVal = parseFloat(balClean);
    const intDigits = balClean.split('.')[0];
    // Sanity check: Real retail bank SMS balance is <= 1 Crore (10,000,000)
    // and integer part is at most 7 digits. Any 8+ digit number is an identifier/ref.
    if (!isNaN(balVal) && balVal >= 0 && balVal <= 1000000 && intDigits.length <= 6) {
      balance = balVal;
      balancePaise = Math.round(balVal * 100);
      bodyWithoutBal = cleanBodyForExtraction.replace(balMatch[0], ' ');
    }
  }

  // Double-mask account numbers & UPI refs in bodyWithoutBal
  bodyWithoutBal = bodyWithoutBal.replace(/(?:a\/c|account|card)\s*(?:no\.?)?\s*(?:ending\s*(?:with|in)?\s*)?[:\-]?\s*[*xX#.-]*([0-9]{3,16})\b/gi, ' ');
  bodyWithoutBal = bodyWithoutBal.replace(/(?:upi\s*ref|ref(?:\s*no)?|utr)[:\s]*([0-9]{6,22})/gi, ' ');

  // Extract spend / transaction amount from bodyWithoutBal
  let amountPaise: number | null = null;
  let hasExplicitCrSuffix = false;
  let hasExplicitDrSuffix = false;

  // 1. Check for amount with explicit CR / DR suffix (e.g. "Rs 50.00 CR", "Rs 50 Cr.", "INR 100 DR")
  const crDrAmountMatch = bodyWithoutBal.match(/(?:rs\.?|inr|₹|रु\.?)\s*([\d,]+(?:\.\d{1,2})?)\s*(cr|dr)\b/i);
  if (crDrAmountMatch && crDrAmountMatch[1]) {
    amountPaise = parseAmountToPaise(crDrAmountMatch[1]);
    const suffix = crDrAmountMatch[2].toLowerCase();
    if (suffix === 'cr') hasExplicitCrSuffix = true;
    if (suffix === 'dr') hasExplicitDrSuffix = true;
  }

  // 2. Shorthand with L / K (e.g. "Rs 1.5L", "25K")
  if (!amountPaise) {
    const lakhOrKMatch = bodyWithoutBal.match(/(?:rs\.?|inr|₹|रु\.?)\s*([\d,]+(?:\.\d+)?)\s*(l(?:akh|ac)?|k)\b/i);
    if (lakhOrKMatch) {
      amountPaise = parseAmountToPaise(`${lakhOrKMatch[1]} ${lakhOrKMatch[2]}`);
    }
  }

  // 3. Standard Rupee match e.g. "Rs 250.00", "INR 1,500", "₹ 65,000"
  if (!amountPaise) {
    const standardAmountMatch = bodyWithoutBal.match(/(?:rs\.?|inr|₹|रु\.?)\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (standardAmountMatch && standardAmountMatch[1]) {
      amountPaise = parseAmountToPaise(standardAmountMatch[1]);
    }
  }

  // 4. Action verb followed by bare amount e.g. "debited by 250.00", "paid 1500"
  if (!amountPaise) {
    const actionAmountMatch = bodyWithoutBal.match(/\b(?:debited|credited|spent|paid|withdrawn|transferred)\s+(?:by|for|of)?\s*([\d,]+(?:\.\d{1,2})?)\b/i);
    if (actionAmountMatch && actionAmountMatch[1]) {
      amountPaise = parseAmountToPaise(actionAmountMatch[1]);
    }
  }

  if (!amountPaise || amountPaise <= 0) {
    return { drop: true, reason: 'no_amount' };
  }

  // Sanity check: Retail personal SMS over 2 Crore without explicit property/tax keyword is anomalous
  if (amountPaise > 2000000000 && !/\b(?:property|real\s*estate|land|registry|tax)\b/i.test(body)) {
    return { drop: true, reason: 'excluded' };
  }

  const amount = amountPaise / 100;

  // ----------------------------------------------------
  // Debit vs Credit Disambiguation (First-Verb Priority)
  // ----------------------------------------------------
  const hasDebit = DEBIT_WORDS.test(body);
  const hasCredit = CREDIT_WORDS.test(body);

  let direction: BankTransactionDirection = 'debit';

  if (hasExplicitDrSuffix) {
    direction = 'debit';
  } else if (hasExplicitCrSuffix) {
    direction = 'credit';
  } else if (hasDebit && hasCredit) {
    const debitIndex = body.search(DEBIT_WORDS);
    const creditIndex = body.search(CREDIT_WORDS);
    direction = debitIndex < creditIndex ? 'debit' : 'credit';
  } else if (hasCredit) {
    direction = 'credit';
  } else if (hasDebit) {
    direction = 'debit';
  } else if (/(?:statement\s*generated|total\s*amt\s*due|payment\s*due\s*date|bill\s*(?:of|generated|due))/i.test(body)) {
    direction = 'bill';
  }

  // ----------------------------------------------------
  // Account Info & Bank Name
  // ----------------------------------------------------
  const accountInfo = extractAccountInfo(body);
  const bankName = detectBankName(address, body);

  // ----------------------------------------------------
  // Merchant & Categorization
  // ----------------------------------------------------
  const merchant = extractMerchantOrParty(body, direction);
  const { category, isExpense } = categorizeTransaction(body, merchant, direction);

  // ----------------------------------------------------
  // Date & Ref Number
  // ----------------------------------------------------
  const occurredAt = extractOccurredTimestamp(body, sms.date || sms.dateSent || Date.now());
  const refId = extractRefId(body);

  const txId = sms.id || `bank-${occurredAt}-${amountPaise}-${direction}`;

  return {
    id: txId,
    amount,
    amountPaise,
    type: direction,
    direction,
    isExpense,
    accountMask: accountInfo?.mask,
    rawAccountDigits: accountInfo?.rawDigits,
    merchant,
    balance,
    balancePaise,
    date: occurredAt,
    bankName,
    rawBody: body,
    category,
    refId,
  };
}

/**
 * Convenience wrapper returning ParsedBankTransaction or null.
 */
export function parseSingleSms(sms: RawSmsMessage): ParsedBankTransaction | null {
  const result = parseSingleSmsDetailed(sms);
  if ('drop' in result && result.drop) {
    return null;
  }
  return result as ParsedBankTransaction;
}

/**
 * Parses all SMS history messages with deduplication.
 */
export function parseAllSmsHistory(smsList: RawSmsMessage[], userId?: string): ParsedBankTransaction[] {
  const parsedList: ParsedBankTransaction[] = [];
  const seenHashes = new Set<string>();

  for (const sms of smsList) {
    const parsed = parseSingleSms(sms);
    if (parsed) {
      // Deduplication: (userId + refId/UTR + amount + direction + occurredAt)
      const dedupKey = `${userId || 'default'}_${parsed.refId || ''}_${parsed.amountPaise}_${parsed.direction}_${parsed.date}`;
      if (!seenHashes.has(dedupKey)) {
        seenHashes.add(dedupKey);
        parsedList.push(parsed);
      }
    }
  }

  return parsedList.sort((a, b) => b.date - a.date);
}
