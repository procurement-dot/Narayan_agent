import { emailRepository } from './email.repository.js';
import { gmailOAuth } from './gmail.oauth.js';
import { gmailService } from './gmail.service.js';
import { emailAnalyzer } from './email.analyzer.js';
import { EmailDto, EmailSummaryDto, ProposalDto } from './email.dto.js';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

function formatDisplayTime(dateInput: Date | string | null): string {
  if (!dateInput) return '09:00';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '09:00';

  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  // Format as e.g. "2 Nov"
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export const emailService = {
  getOAuthUrl(userId: string = DEFAULT_USER_ID): string {
    return gmailOAuth.getAuthorizationUrl(userId);
  },

  async handleOAuthCallback(code: string, userId: string = DEFAULT_USER_ID) {
    const tokens = await gmailOAuth.exchangeCodeForTokens(code);
    const account = await emailRepository.upsertEmailAccount({
      userId,
      email: tokens.email,
      refreshTokenEnc: tokens.refreshTokenEnc,
    });

    // Run initial sync in background
    this.syncEmails(userId, 15).catch((err) => {
      console.warn('Initial background sync after OAuth failed:', err);
    });

    return account;
  },

  async getOAuthStatus(userId: string = DEFAULT_USER_ID) {
    const account = await emailRepository.getEmailAccount(userId);
    return {
      connected: Boolean(account && account.refresh_token_enc),
      email: account?.email || null,
      updatedAt: account?.updated_at || null,
    };
  },

  async disconnectAccount(userId: string = DEFAULT_USER_ID) {
    await emailRepository.disconnectEmailAccount(userId);
    return { success: true };
  },

  async syncEmails(userId: string = DEFAULT_USER_ID, maxResults = 15) {
    const account = await emailRepository.getEmailAccount(userId);
    if (!account || !account.refresh_token_enc) {
      throw new Error('No connected Gmail account found for user. Please connect first.');
    }

    const auth = gmailOAuth.getAuthenticatedClient(account.refresh_token_enc);
    const recentMessages = await gmailService.fetchRecentEmails(auth, maxResults);

    let newlyIngested = 0;
    for (const msg of recentMessages) {
      try {
        const alreadyExists = await emailRepository.emailExists(account.id, msg.providerMsgId);
        if (alreadyExists) {
          continue;
        }

        // Run Gemini 3.5 Flash intelligence analysis
        const analysis = await emailAnalyzer.analyzeEmail({
          fromName: msg.fromName,
          fromEmail: msg.fromEmail,
          subject: msg.subject,
          content: msg.content,
        });

        await emailRepository.insertEmailWithAnalysis(
          account.id,
          userId,
          msg,
          analysis
        );
        newlyIngested++;
      } catch (itemErr) {
        console.warn(`Failed to process message ${msg.providerMsgId}:`, itemErr);
      }
    }

    return {
      synced: newlyIngested,
      totalChecked: recentMessages.length,
    };
  },

  async getSummary(userId: string = DEFAULT_USER_ID): Promise<EmailSummaryDto & { connected: boolean; email?: string | null }> {
    try {
      const summary = await emailRepository.getSummary();
      const account = await emailRepository.getEmailAccount(userId);
      const isConnected = Boolean(account && account.refresh_token_enc);

      // If connected but 0 emails yet, provide real 0s
      if (isConnected) {
        return {
          ...summary,
          connected: true,
          email: account?.email || null,
        };
      }

      // If not connected yet and no emails in DB, show initial demo counts for UI preview
      if (summary.requests === 0 && summary.lowSignal === 0 && summary.mergedMeetings === 0) {
        return { requests: 3, lowSignal: 1, mergedMeetings: 2, connected: false, email: null };
      }

      return {
        ...summary,
        connected: false,
        email: null,
      };
    } catch {
      return { requests: 3, lowSignal: 1, mergedMeetings: 2, connected: false, email: null };
    }
  },

  async listEmails(tab?: string): Promise<EmailDto[]> {
    try {
      const rows = await emailRepository.getEmails(tab);
      return rows.map((r: any) => ({
        id: r.id,
        name: r.from_name || 'Unknown',
        subject: r.subject || '(No Subject)',
        scope: (r.scope as any) || 'work',
        time: formatDisplayTime(r.received_at),
        preview: r.preview || '',
        content: r.content || r.preview || '',
        kind: (r.kind as any) || 'task',
        draft: r.saved_draft || r.draft || '',
        source: 'Gmail · ' + (r.from_name || 'Sender'),
        confidence: (r.confidence as any) || 'High',
        status: r.status,
        proposalId: r.proposal_id || undefined,
      }));
    } catch (err) {
      console.error('Failed to list emails:', err);
      return [];
    }
  },

  async saveDraft(emailId: string, userId: string = DEFAULT_USER_ID, body: string) {
    return emailRepository.upsertDraft(emailId, userId, body);
  },

  async generateDraft(
    emailId: string,
    userId: string = DEFAULT_USER_ID,
    instruction?: string
  ): Promise<{ draft: string }> {
    const email = await emailRepository.getEmailById(emailId);
    const fromName = email?.from_name || 'Sender';
    const fromEmail = email?.from_email || '';
    const subject = email?.subject || 'Your Email';
    const content = email?.content || email?.preview || '';

    const draft = await emailAnalyzer.generateDraftReply({
      fromName,
      fromEmail,
      subject,
      content,
      instruction,
    });

    if (email) {
      await emailRepository.upsertDraft(emailId, userId, draft);
    }

    return { draft };
  },

  async sendReply(
    emailId: string,
    userId: string = DEFAULT_USER_ID,
    body: string
  ): Promise<{ success: boolean; message: string }> {
    const email = await emailRepository.getEmailById(emailId);
    const account = await emailRepository.getEmailAccount(userId);

    if (!account || !account.refresh_token_enc) {
      throw new Error('Gmail account not connected. Please connect your Gmail first.');
    }

    const recipient = email?.from_email || email?.from_name;
    if (!recipient) {
      throw new Error('Recipient email address could not be resolved from this email.');
    }

    const auth = gmailOAuth.getAuthenticatedClient(account.refresh_token_enc);
    await gmailService.sendEmailReply(auth, {
      to: recipient,
      subject: email?.subject || 'Reply',
      body,
      threadId: email?.thread_id || undefined,
      inReplyTo: email?.provider_msg_id || undefined,
    });

    await emailRepository.updateEmailStatus(emailId, 'Replied via Gmail');

    return { success: true, message: `Reply successfully sent to ${recipient}` };
  },

  async archiveEmail(emailId: string) {
    return emailRepository.markArchive(emailId);
  },

  async getProposal(idOrEmailId: string): Promise<ProposalDto | null> {
    const r = await emailRepository.getProposalByEmailId(idOrEmailId);
    if (!r) return null;
    return {
      id: r.id,
      title: r.title,
      type: r.type,
      start: r.start_time,
      end: r.end_time,
      detail: r.detail || '',
      sources: r.sources || ['Gmail message'],
      confidence: r.confidence || 'High',
      evidence: r.evidence || '',
      context: r.context || '',
    };
  },

  async approveProposal(
    proposalId: string,
    userId: string = DEFAULT_USER_ID,
    taskData: { title: string; start: string; end: string; detail: string }
  ) {
    return emailRepository.approveProposal(proposalId, userId, taskData);
  },

  async dismissProposal(proposalId: string) {
    return emailRepository.dismissProposal(proposalId);
  },
};
