import { EmailItem, EmailTab } from '../types/email.types';

export function filterByTab(
  emails: EmailItem[],
  tab: EmailTab,
  mailDrafts: Record<string, string>
): EmailItem[] {
  switch (tab) {
    case 'priority':
      return emails.filter((m) => m.kind !== 'noise' && m.kind !== 'unwanted' && !m.isUnwanted);
    case 'meetings':
      return emails.filter((m) => m.kind === 'meeting');
    case 'all':
      return emails;
    case 'low':
      return emails.filter((m) => m.kind === 'noise');
    case 'drafts':
      return emails.filter((m) => Boolean(mailDrafts[m.id]) || Boolean(m.draft));
    case 'unwanted':
      return emails.filter(
        (m) =>
          m.isUnwanted ||
          m.kind === 'unwanted' ||
          (m.kind === 'noise' &&
            /unsubscribe|newsletter|promotions|promo|discount|sale|offer|deal|shop|replit|retention/i.test(
              m.subject + ' ' + m.preview + ' ' + m.name
            ))
      );
    default:
      return emails;
  }
}
