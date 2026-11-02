import { emailRepository } from './email.repository.js';
import { EmailDto, EmailSummaryDto, ProposalDto } from './email.dto.js';

export const emailService = {
  async getSummary(): Promise<EmailSummaryDto> {
    try {
      const emails = await emailRepository.getEmails();
      const requests = emails.filter((e) => e.kind === 'task').length;
      const lowSignal = emails.filter((e) => e.kind === 'noise').length;
      const mergedMeetings = emails.filter((e) => e.kind === 'meeting').length;
      return { requests, lowSignal, mergedMeetings };
    } catch {
      // Default to demo counts if database is not connected yet
      return { requests: 3, lowSignal: 1, mergedMeetings: 2 };
    }
  },

  async listEmails(tab?: string): Promise<EmailDto[]> {
    try {
      const rows = await emailRepository.getEmails(tab);
      return rows.map((r: any) => ({
        id: r.id,
        name: r.from_name || 'Unknown',
        subject: r.subject || '(No Subject)',
        scope: r.scope || 'work',
        time: r.received_at ? new Date(r.received_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '09:08',
        preview: r.preview || '',
        content: r.content || '',
        kind: r.kind || 'task',
        draft: r.draft || '',
        source: 'Gmail · ' + (r.from_name || 'Sender'),
        confidence: r.confidence || 'High',
        status: r.status,
      }));
    } catch {
      return [];
    }
  },

  async saveDraft(emailId: string, userId: string, body: string) {
    return emailRepository.upsertDraft(emailId, userId, body);
  },

  async archiveEmail(emailId: string) {
    return emailRepository.markArchive(emailId);
  },

  async getProposal(emailId: string): Promise<ProposalDto | null> {
    const r = await emailRepository.getProposalByEmailId(emailId);
    if (!r) return null;
    return {
      id: r.id,
      title: r.title,
      type: r.type,
      start: r.start_time,
      end: r.end_time,
      detail: r.detail || '',
      sources: r.sources || [],
      confidence: r.confidence || 'High',
      evidence: r.evidence,
      context: r.context || '',
    };
  },

  async approveProposal(proposalId: string, userId: string, taskData: { title: string; start: string; end: string; detail: string }) {
    return emailRepository.approveProposal(proposalId, userId, taskData);
  },

  async dismissProposal(proposalId: string) {
    return emailRepository.dismissProposal(proposalId);
  },
};
