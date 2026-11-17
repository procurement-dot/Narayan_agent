import { FinanceAlert, FinanceAsset, FinanceLoan, RecordItem, RetirementParams } from './finance.types';

export const FINANCE_ASSETS: FinanceAsset[] = [
  {
    name: 'Powai Naka shop',
    type: 'Commercial property',
    value: 3000000,
    cost: 880000,
    expectedRent: 18000,
    receivedRent: 0,
    area: 'Satara',
    status: 'Rent missing',
  },
  {
    name: 'Pune apartment',
    type: 'Rental real estate',
    value: 9500000,
    cost: 6500000,
    expectedRent: 29000,
    receivedRent: 29000,
    area: 'Pune',
    status: 'Collected',
  },
  {
    name: 'Vadodara land parcel',
    type: 'Land',
    value: 5200000,
    cost: 3900000,
    expectedRent: 0,
    receivedRent: 0,
    area: 'Vadodara',
    status: 'No regular income',
  },
  {
    name: 'Mutual funds',
    type: 'Investment funds',
    value: 31000000,
    cost: 19000000,
    expectedRent: 0,
    receivedRent: 0,
    area: 'India',
    status: 'Long-term',
  },
  {
    name: 'Gold & bonds',
    type: 'Other investment',
    value: 1600000,
    cost: 1150000,
    expectedRent: 0,
    receivedRent: 0,
    area: 'India',
    status: 'Long-term',
  },
];

export const FINANCE_LOANS: FinanceLoan[] = [
  {
    name: 'Rahul (example)',
    principal: 800000,
    rate: 12,
    frequency: 'Monthly',
    due: '2026-11-05',
    paid: false,
  },
  {
    name: 'Business associate (example)',
    principal: 350000,
    rate: 10,
    frequency: 'Quarterly',
    due: '2026-12-01',
    paid: false,
  },
  {
    name: 'Relative (example)',
    principal: 150000,
    rate: 0,
    frequency: 'No interest',
    due: '2027-01-15',
    paid: false,
  },
];

export const FINANCE_ALERTS: FinanceAlert[] = [
  { title: 'HDFC credit card', amount: '₹28,450', due: '2026-11-04', desc: 'Statement payment' },
  { title: 'Vehicle insurance', amount: '₹18,600', due: '2026-11-12', desc: 'Annual premium' },
  { title: 'Car EMI', amount: '₹32,500', due: '2026-11-06', desc: 'Monthly installment' },
  { title: 'Health insurance', amount: '₹24,800', due: '2026-12-18', desc: 'Renewal' },
  { title: 'GST review', amount: '—', due: '2026-11-10', desc: 'Work tax calendar' },
  { title: 'Interest collection · Rahul', amount: '₹8,000', due: '2026-11-05', desc: 'Loan interest' },
];

export const FINANCE_RETIREMENT_DEFAULT: RetirementParams = {
  age: 42,
  retire: 60,
  corpus: 30000000,
  sip: 100000,
  returnRate: 10,
  inflation: 6,
};

export const FINANCE_RECORDS_CATALOG: Record<string, RecordItem[]> = {
  Accounts: [
    ['HDFC Bank · Savings', '•••• 0421', 'HDFC Bank', 'Bank statement · Oct 2026'],
    ['ICICI Bank · Current', '•••• 8560', 'ICICI Bank', 'Current-account letter'],
    ['SBI · Savings', '•••• 3391', 'State Bank of India', 'Bank statement · Sep 2026'],
  ],
  'Credit cards': [
    ['HDFC Infinia', '•••• 2208', 'Due 12 Nov · ₹38,400', 'Card statement · Oct'],
    ['ICICI Sapphiro', '•••• 1182', 'Due 18 Nov · ₹12,800', 'Card statement · Oct'],
    ['Axis Atlas', '•••• 9914', 'Expires 08/29', 'Card image (redacted)'],
  ],
  Insurance: [
    ['Family health cover', 'Policy •••• 3812', 'Renewal 05 Dec 2026', 'Policy PDF'],
    ['Term life insurance', 'Policy •••• 0711', 'Premium due 18 Nov', 'Policy schedule'],
    ['Motor policy', 'Policy •••• 2664', 'Renewal 15 Jan 2027', 'Policy copy'],
  ],
  Loans: [
    ['Car loan', 'Loan •••• 2270', 'EMI ₹28,500 · 5 Nov', 'Loan schedule'],
    ['Property loan', 'Loan •••• 7728', 'EMI ₹46,000 · 10 Nov', 'Sanction letter'],
    ['Personal borrowing', 'Loan •••• 6621', 'Installment 15 Nov', 'Agreement'],
  ],
  Lockers: [
    ['Bank locker', 'Locker ref •••• 114', 'HDFC · Sample branch', 'Locker agreement'],
    ['Joint locker', 'Locker ref •••• 062', 'SBI · Sample branch', 'Nomination form'],
    ['Safe deposit', 'Reference •••• 709', 'Private custody (demo)', 'Inventory list'],
  ],
  Credentials: [
    ['Bank app access', 'Device vault', 'Password not stored in this HTML', 'Secure vault'],
    ['Card PIN', 'Not displayed', 'Never save a PIN here', 'Secure vault'],
    ['Card CVV', 'Not stored', 'CVV is not retained in app', 'Never upload CVV'],
  ],
};

export const RECORD_ICONS: Record<string, string> = {
  Accounts: '🏦',
  'Credit cards': '▤',
  Insurance: '✚',
  Loans: '⌁',
  Lockers: '◫',
  Credentials: '♙',
};
