import { RawSmsMessage, ParsedBankTransaction } from './sms.types';

const INDIAN_BANK_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: 'HDFC Bank', regex: /HDFC/i },
  { name: 'State Bank of India', regex: /SBI|State\s*Bank/i },
  { name: 'ICICI Bank', regex: /ICICI/i },
  { name: 'Axis Bank', regex: /AXIS/i },
  { name: 'Kotak Mahindra Bank', regex: /KOTAK/i },
  { name: 'Punjab National Bank', regex: /PNB|PUNB/i },
  { name: 'Bank of Baroda', regex: /BAROD|BOB/i },
  { name: 'Bank of India', regex: /BOI|BKIND/i },
  { name: 'Canara Bank', regex: /CANARA|CANBNK/i },
  { name: 'Union Bank of India', regex: /UNION/i },
  { name: 'IDFC First Bank', regex: /IDFC/i },
  { name: 'IndusInd Bank', regex: /INDUS/i },
  { name: 'Yes Bank', regex: /YESB/i },
  { name: 'Federal Bank', regex: /FED/i },
  { name: 'Paytm Payments Bank', regex: /PAYTM/i },
  { name: 'CRED', regex: /CRED/i },
  { name: 'Jupiter / Fi', regex: /JUPITER|EPFI/i },
  { name: 'Standard Chartered', regex: /SCB|STAN/i },
  { name: 'HSBC', regex: /HSBC/i },
  { name: 'RBL Bank', regex: /RBL/i },
  { name: 'AU Small Finance Bank', regex: /AUBANK/i },
];

/**
 * Checks if a sender or message body matches a known Indian banking institution or financial alert.
 */
export function isBankMessage(address: string, body: string): { isBank: boolean; bankName: string } {
  const cleanAddr = address ? address.toUpperCase() : '';
  const cleanBody = body || '';

  for (const bank of INDIAN_BANK_PATTERNS) {
    if (bank.regex.test(cleanAddr) || bank.regex.test(cleanBody)) {
      return { isBank: true, bankName: bank.name };
    }
  }

  // Generic fallback: check if address looks like a transactional sender (e.g. XX-XXXXXX) with financial keywords
  if (/(?:debited|credited|avl\s*bal|account\s*balance|spent|card\s*ending)/i.test(cleanBody)) {
    return { isBank: true, bankName: 'Bank / Financial' };
  }

  return { isBank: false, bankName: '' };
}

/**
 * Extracts numeric transaction amount from SMS text.
 */
function extractAmount(text: string): number | null {
  // Matches "Rs 1,500.00", "INR 250", "Rs. 10000", "₹ 4,500"
  const amountMatch = text.match(/(?:(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?))|(?:([\d,]+(?:\.\d{1,2})?)\s*(?:INR|Rs\.?|₹))/i);
  if (amountMatch) {
    const rawVal = amountMatch[1] || amountMatch[2];
    if (rawVal) {
      const cleanVal = parseFloat(rawVal.replace(/,/g, ''));
      if (!isNaN(cleanVal) && cleanVal > 0) {
        return cleanVal;
      }
    }
  }
  return null;
}

/**
 * Extracts bank account or card ending mask (e.g., "•••• 0421")
 */
function extractAccountMask(text: string): string | undefined {
  const match = text.match(/(?:a\/c|acct|acc|account|card|ending)\s*(?:no\.?)?\s*[*xX.-]*(\d{3,4})/i);
  if (match && match[1]) {
    return `•••• ${match[1]}`;
  }
  return undefined;
}

/**
 * Extracts available balance if mentioned in the message
 */
function extractBalance(text: string): number | undefined {
  const balMatch = text.match(/(?:bal(?:ance)?|avail(?:able)?\s*bal|avl\s*bal|clear\s*bal)[^\d]*(?:(?:INR|Rs\.?|₹)\s*)?([\d,]+(?:\.\d{1,2})?)/i);
  if (balMatch && balMatch[1]) {
    const cleanBal = parseFloat(balMatch[1].replace(/,/g, ''));
    if (!isNaN(cleanBal)) {
      return cleanBal;
    }
  }
  return undefined;
}

/**
 * Extracts merchant, beneficiary or VPA
 */
function extractMerchant(text: string): string | undefined {
  const vpaMatch = text.match(/(?:to\s+vpa|vpa)\s+([A-Za-z0-9._-]+@[A-Za-z0-9]+)/i);
  if (vpaMatch && vpaMatch[1]) {
    return vpaMatch[1];
  }

  const toMatch = text.match(/(?:to|at|towards|info)\s+([A-Za-z0-9\s._&-]{3,28})(?:\s+on|\s+ref|\s+dated|\s+bal|\.|$)/i);
  if (toMatch && toMatch[1]) {
    const candidate = toMatch[1].trim();
    if (!/^(?:inr|rs|your|the|a\/c|account)$/i.test(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

/**
 * Parses a single SMS into a structured bank transaction, or returns null if not financial or OTP.
 */
export function parseSingleSms(sms: RawSmsMessage): ParsedBankTransaction | null {
  const body = sms.body || '';

  // Discard pure OTP messages
  if (/\b(?:otp|verification code|one time password|secret code)\b/i.test(body) && !/(?:debited|credited)/i.test(body)) {
    return null;
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
  let type: 'debit' | 'credit' | 'bill' = 'debit';
  if (/(?:bill\s*of|due\s*date|statement\s*for|payment\s*due)/i.test(body)) {
    type = 'bill';
  } else if (/(?:credited|received|deposited|refund|salary|cashback|added\s*to)/i.test(body)) {
    type = 'credit';
  } else if (/(?:debited|spent|paid|withdrawn|purchase|deducted|dr\b)/i.test(body)) {
    type = 'debit';
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

  const accountMask = extractAccountMask(body);
  const balance = extractBalance(body);
  const merchant = extractMerchant(body);

  // Bill due date extraction if applicable
  let dueDate: string | undefined;
  if (type === 'bill') {
    const dueMatch = body.match(/(?:due\s*(?:on|by|date)?)\s*[:\-]?\s*([0-9]{1,2}[-\/ ](?:[A-Za-z]{3,9}|[0-9]{1,2})[-\/ ]?[0-9]{2,4}?)/i);
    if (dueMatch && dueMatch[1]) {
      dueDate = dueMatch[1].trim();
    }
  }

  return {
    id: sms.id || `sms-${sms.date}-${amount}`,
    amount,
    type,
    accountMask,
    merchant,
    balance,
    date: sms.date,
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

  // Sort descending by date (newest first)
  return parsedList.sort((a, b) => b.date - a.date);
}
