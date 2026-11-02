import { FinanceAlert, FinanceAsset, FinanceLoan } from './finance.types';

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
    name: 'Mutual funds portfolio',
    type: 'Investment funds',
    value: 31000000,
    cost: 19000000,
    expectedRent: 0,
    receivedRent: 0,
    area: 'India',
    status: 'Long-term',
  },
  {
    name: 'Gold & sovereign bonds',
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
  { title: 'Interest collection · Rahul', amount: '₹8,000', due: '2026-11-05', desc: 'Loan interest' },
  { title: 'Car EMI', amount: '₹32,500', due: '2026-11-06', desc: 'Monthly installment' },
  { title: 'GST review', amount: '—', due: '2026-11-10', desc: 'Work tax calendar' },
  { title: 'Vehicle insurance', amount: '₹18,600', due: '2026-11-12', desc: 'Annual premium' },
  { title: 'Health insurance', amount: '₹24,800', due: '2026-12-18', desc: 'Policy renewal' },
];
