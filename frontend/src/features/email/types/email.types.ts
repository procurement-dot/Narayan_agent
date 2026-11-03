export type EmailKind = 'task' | 'meeting' | 'noise';

export type EmailTab = 'priority' | 'meetings' | 'all' | 'low' | 'drafts';

export interface EmailItem {
  id: string;
  name: string;
  subject: string;
  scope: 'work' | 'personal';
  time: string;
  preview: string;
  content: string;
  kind: EmailKind;
  draft: string;
  source: string;
  confidence: 'High' | 'Medium' | 'Low';
  status?: string;
  proposalId?: string;
}

export interface ProposalItem {
  id: string;
  title: string;
  type: 'task' | 'meeting';
  start: string;
  end: string;
  detail: string;
  sources: string[];
  confidence: 'High' | 'Medium' | 'Low';
  evidence: string;
  context: string;
}

export interface CalendarTask {
  id: string;
  date: string;
  title: string;
  start: string;
  end: string;
  detail: string;
  linked: string;
  sourceId?: string;
}
