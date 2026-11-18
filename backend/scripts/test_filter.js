const testMessages = [
  // Genuine debits (expected: ACCEPTED)
  { body: 'Your a/c no. XXXXX593098 is debited for Rs.2556.00 on 23-Oct-24 and credited to ...', addr: 'AD-SBIINB' },
  { body: 'Paid Rs 2556.00 via PhonePe from SBI A/c 593098 on 23-Oct-24', addr: 'VK-PHONEPE' },
  { body: 'A/c 3098 debited by Rs 2.00 on 13-Oct-24 by transfer to UPI/DR/123. Avl Bal Rs 1500', addr: 'AD-SBIINB' },
  { body: 'A/c 3098 debited by Rs 2.00 on 10-Oct-24 by transfer to UPI/DR/124. Avl Bal Rs 1502', addr: 'AD-SBIINB' },
  { body: 'Paytm: Rs 899.00 paid for utility bill on 17-Aug-24 from A/c ...3098', addr: 'PAYTM' },
  { body: 'Dear SBI User, your A/c ending 3098 debited by Rs.150.00 on 17-Nov-26 by transfer to UPI/DR/432198765432/Store. Avl Bal Rs: 5,420.50 - SBI', addr: 'VK-SBIUPI' },
  { body: 'A/c 3098 debited by Rs 1.00 on 28-Jun-26. Avl Bal: Rs 11,540.29', addr: 'AD-SBIINB' },
  { body: 'A/c 3098 debited by Rs 10.00 on 07-Jun-26. Avl Bal: Rs 8,494.29', addr: 'AD-SBIINB' },

  // Genuine credits (expected: ACCEPTED)
  { body: 'Your A/C XXXXX593098 credited by Rs. 1,500.00 on 31-Oct-24 by transfer from XYZ. Bal Rs 15,400.00', addr: 'AD-SBIINB' },
  { body: 'Your A/C XXXXX593098 credited by Rs. 1,500.00 on 16-Jun-26. Bal Rs 12,000.00', addr: 'AD-SBIINB' },
  { body: 'Rs 5,000.00 received in your A/C ...3098 from UPI/CR/123/Friend on 02-Sept-26', addr: 'VK-SBIUPI' },
  { body: 'Deposit of Rs 10,000.00 in A/c ...3098 on 15-Aug-26', addr: 'AD-SBIINB' },

  // Junk / Promo / Loans that MUST be rejected:
  { body: 'Pre-approved personal loan of Rs 2,00,000 on your SBI Account ...3098. Apply now on YONO.', addr: 'AD-SBIINB' },
  { body: 'Dear Customer, your card limit is upgraded to Rs 2,00,000.', addr: 'AD-SBICRD' },
  { body: 'SBI Alert: Txn of Rs 500 declined on A/c ...3098 due to insufficient balance.', addr: 'AD-SBIINB' },
  { body: 'Your UPI txn of Rs 100 failed. Amount if debited will be refunded.', addr: 'VK-SBIUPI' },
  { body: 'Collect request of Rs 1,500 received from store@upi. Pay using SBI UPI.', addr: 'VK-SBIUPI' },
  { body: 'SBI Alert: Clear Bal for A/c ...3098 is Rs 11,540.00 as on 28-Jun-26.', addr: 'AD-SBIINB' },
  { body: 'Your daily data limit of 1.5 GB has reached 90%. Recharge now.', addr: 'JIO-JIO' },
  { body: 'Your SBI OTP for login is 492019. Do not share with anyone.', addr: 'AD-SBIINB' }
];

const NON_TRANSACTION_PATTERNS = [
  /\b(?:declined|failed|unsuccessful|cancelled|rejected)\b/i,
  /\b(?:pre-approved|eligible|eligibility|loan\s*offer|personal\s*loan|apply\s*now|congratulations|reward\s*points)\b/i,
  /\b(?:collect\s*request|request\s*received|payment\s*request|mandate\s*created|autopay\s*scheduled)\b/i,
  /\b(?:limit\s*upgrade|card\s*limit|credit\s*limit)\b/i,
  /\b(?:win|prize|contest|rummy|dream11|cashback\s*offer|flat\s*rs|off\s*on)\b/i,
  /\b(?:daily\s*data|data\s*limit|data\s*pack|validity\s*expired)\b/i,
  /^(?:sbi\s*alert:\s*)?(?:dear\s+customer,?\s*)?(?:your\s+)?(?:clear\s*bal|avl\s*bal|available\s*balance|bal(?:ance)?)\s*(?:for\s+)?(?:a\/c|account)/i,
  /\b(?:otp|verification code|one time password|secret code)\b/i
];

function filterMessage(text) {
  for (const p of NON_TRANSACTION_PATTERNS) {
    if (p.test(text.trim())) return false;
  }
  return true;
}

testMessages.forEach((m, i) => {
  const valid = filterMessage(m.body);
  console.log(`Msg ${i+1}: ${valid ? 'ACCEPTED' : 'REJECTED'}`);
});
