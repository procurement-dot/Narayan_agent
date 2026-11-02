export interface EmailDto {
  id: string;
  name: string;
  subject: string;
  scope: 'work' | 'personal';
  time: string;
  preview: string;
  content: string;
  kind: 'task' | 'meeting' | 'noise';
  draft: string;
  source: string;
  confidence: 'High' | 'Medium' | 'Low';
  status?: string;
}

export interface ProposalDto {
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

export interface EmailSummaryDto {
  requests: number;
  lowSignal: number;
  mergedMeetings: number;
}
