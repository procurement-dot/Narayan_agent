import { EmailItem, EmailTab } from '../types/email.types';

export function filterByTab(
  emails: EmailItem[],
  tab: EmailTab,
  mailDrafts: Record<string, string>
): EmailItem[] {
  switch (tab) {
    case 'priority':
      return emails.filter((m) => m.kind !== 'noise');
    case 'meetings':
      return emails.filter((m) => m.kind === 'meeting');
    case 'all':
      return emails;
    case 'low':
      return emails.filter((m) => m.kind === 'noise');
    case 'drafts':
      return emails.filter((m) => Boolean(mailDrafts[m.id]));
    default:
      return emails;
  }
}
