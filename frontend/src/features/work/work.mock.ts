import { WorkKpi, WorkProject } from './work.types';

export const WORK_PROJECTS: WorkProject[] = [
  {
    id: 'akc',
    name: 'Athletics Kids Cup',
    subtitle: 'School qualifiers, operations and sponsorship',
    tag: 'KinderSports',
    progress: 58,
    next: 'Review event rollout and partner dependencies',
    tasks: ['School outreach plan', 'Venue / staffing review', 'Sponsor follow-ups'],
  },
  {
    id: 'manjalpur',
    name: 'Manjalpur Sports School',
    subtitle: 'Academic partner, admissions and infrastructure',
    tag: 'Education',
    progress: 36,
    next: 'Confirm academic partnership responsibilities',
    tasks: ['Partner RFP', 'Space readiness', 'Admissions approach'],
  },
  {
    id: 'chessone',
    name: 'ChessOne',
    subtitle: 'Learning, games, coach and community',
    tag: 'Product',
    progress: 44,
    next: 'Review MVP navigation and AI-coach behavior',
    tasks: ['Onboarding walkthrough', 'Coach commentary', 'Parent reports'],
  },
  {
    id: 'nryn',
    name: 'NRYN',
    subtitle: 'Local intelligence across daily life',
    tag: 'Personal AI',
    progress: 28,
    next: 'Validate privacy boundaries and approvals',
    tasks: ['Daily timeline', 'Two WhatsApp contexts', 'Local document memory'],
  },
];

export const WORK_KPIS: WorkKpi[] = [
  { label: 'Receivables', value: '₹14.8 L', detail: '3 invoices overdue' },
  { label: 'Active Pipeline', value: '₹42.5 L', detail: '8 institutional deals' },
  { label: 'Team Attendance', value: '18 / 20', detail: '90% present today' },
  { label: 'Open EA Loops', value: '4 signals', detail: '2 emails, 2 WhatsApp' },
];
