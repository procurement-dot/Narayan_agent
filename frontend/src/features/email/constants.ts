import { EmailTab } from './types/email.types';

export const EMAIL_TABS: readonly { id: EmailTab; label: string }[] = [
  { id: 'priority', label: 'Needs me' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'all', label: 'All email' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'unwanted', label: 'Unwanted' },
] as const;

export const KIND_ICONS = {
  task: '✉',
  meeting: '▦',
  noise: '◌',
  unwanted: '🗑',
} as const;

export const KIND_LABELS = {
  task: 'Action candidate',
  meeting: 'Meeting candidate',
  noise: 'Low priority',
  unwanted: 'Unwanted promotional',
} as const;

export const TOASTS = {
  draftSaved: 'Draft saved locally; nothing sent.',
  archiveProposed: 'Marked for archiving in demo. No email changed.',
  approved: 'Approved and added to your rolling clock.',
  duplicate: 'Already on your day; duplicate prevented.',
  dismissed: 'Dismissed. Your calendar is unchanged.',
  validationError: 'Please enter a valid title and time range.',
} as const;
