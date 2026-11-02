import { FareAlert, Trip } from './travel.types';

export const TRAVEL_TRIPS: Trip[] = [
  {
    id: 'tr1',
    title: 'Winter Family Break',
    route: 'Pune (PNQ) ➔ Goa (GOI)',
    dates: '24 Dec – 29 Dec 2026',
    status: 'confirmed',
    details: 'Indigo 6E 428 · Lemon Tree Beach Resort · 5 nights',
  },
  {
    id: 'tr2',
    title: 'Sports School Partners Meet',
    route: 'Pune (PNQ) ➔ Delhi (DEL)',
    dates: '20 Nov – 22 Nov 2026',
    status: 'planning',
    details: 'Meeting with academic partners & sports authorities.',
  },
];

export const FARE_ALERTS: FareAlert[] = [
  {
    route: 'PNQ ➔ DEL (20 Nov)',
    currentFare: '₹4,850',
    typicalFare: '₹6,400',
    status: '24% below average · Good time to book',
  },
  {
    route: 'PNQ ➔ BLR (Weekend)',
    currentFare: '₹3,200',
    typicalFare: '₹3,500',
    status: 'Typical pricing',
  },
];
