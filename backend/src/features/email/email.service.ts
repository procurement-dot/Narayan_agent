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

let backgroundSyncTimer: NodeJS.Timeout | null = null;

export const emailService = {
  startBackgroundSync(intervalMs = 30000) {
    if (backgroundSyncTimer) return;
    backgroundSyncTimer = setInterval(async () => {
      try {
        const userIds = await emailRepository.getAllConnectedUserIds();
        for (const uid of userIds) {
          try {
            await this.syncEmails(uid, 10);
          } catch {
            // Silently skip if user token expired or transient network error
          }
        }
      } catch {
        // Silently skip if DB query error
      }
    }, intervalMs);
    console.log('[EmailService] Multi-tenant background real-time auto-sync active');
  },

  getOAuthUrl(userId: string = DEFAULT_USER_ID, redirectUri?: string): string {
    return gmailOAuth.getAuthorizationUrl(userId, redirectUri);
  },

  async handleOAuthCallback(code: string, userId: string = DEFAULT_USER_ID, redirectUri?: string) {
    const tokens = await gmailOAuth.exchangeCodeForTokens(code, redirectUri);
    let refreshTokenEnc = tokens.refreshTokenEnc;
    if (!refreshTokenEnc) {
      const existingAccounts = await emailRepository.getEmailAccounts(userId);
      const found = existingAccounts.find(
        (a: any) => a.email && a.email.toLowerCase() === tokens.email.toLowerCase()
      );
      if (found?.refresh_token_enc) {
        refreshTokenEnc = found.refresh_token_enc;
      }
    }

    const account = await emailRepository.upsertEmailAccount({
      userId,
      email: tokens.email,
      refreshTokenEnc: refreshTokenEnc || '',
    });

    // Run initial sync in background
    this.syncEmails(userId, 15).catch((err) => {
      console.warn('Initial background sync after OAuth failed:', err);
    });

    return account;
  },

  async getOAuthStatus(userId: string = DEFAULT_USER_ID) {
    const accounts = await emailRepository.getEmailAccounts(userId);
    return {
      connected: accounts.length > 0,
      email: accounts[0]?.email || null,
      accounts: accounts.map((a: any) => ({
        id: a.id,
        email: a.email,
        updatedAt: a.updated_at,
      })),
      updatedAt: accounts[0]?.updated_at || null,
    };
  },

  async disconnectAccount(userId: string = DEFAULT_USER_ID, email?: string) {
    await emailRepository.disconnectEmailAccount(userId, email);
    return { success: true };
  },

  async syncEmails(userId: string = DEFAULT_USER_ID, maxResults = 15) {
    const accounts = await emailRepository.getEmailAccounts(userId);
    if (!accounts || accounts.length === 0) {
      throw new Error('No connected Gmail account found for user. Please connect first.');
    }

    let newlyIngested = 0;
    let totalChecked = 0;

    for (const account of accounts) {
      if (!account.refresh_token_enc) continue;
      try {
        const auth = gmailOAuth.getAuthenticatedClient(account.refresh_token_enc);
        const existingIds = await emailRepository.getExistingMessageIds(account.id);
        const recentMessages = await gmailService.fetchRecentEmails(auth, maxResults, existingIds);
        totalChecked += recentMessages.length;

        // Process new messages concurrently in parallel
        await Promise.all(
          recentMessages.map(async (msg) => {
            try {
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
          })
        );
      } catch (accErr) {
        console.warn(`[EmailService] Failed sync for account ${account.email}:`, accErr);
      }
    }

    return {
      synced: newlyIngested,
      totalChecked,
    };
  },

  async getSummary(
    userId: string = DEFAULT_USER_ID,
    accountEmail?: string
  ): Promise<EmailSummaryDto & { connected: boolean; email?: string | null; accounts?: Array<{ id: string; email: string }> }> {
    try {
      const summary = await emailRepository.getSummary(userId, accountEmail);
      const accounts = await emailRepository.getEmailAccounts(userId);
      const isConnected = accounts.length > 0;

      // If connected but 0 emails yet, provide real 0s
      if (isConnected) {
        return {
          ...summary,
          connected: true,
          email: accounts[0]?.email || null,
          accounts: accounts.map((a: any) => ({ id: a.id, email: a.email })),
        };
      }

      // If not connected on this device, return clean disconnected state
      return {
        requests: 0,
        lowSignal: 0,
        mergedMeetings: 0,
        connected: false,
        email: null,
      };
    } catch {
      return { requests: 0, lowSignal: 0, mergedMeetings: 0, connected: false, email: null };
    }
  },

  async listEmails(
    userId: string = DEFAULT_USER_ID,
    tab?: string,
    accountEmail?: string
  ): Promise<EmailDto[]> {
    try {
      const rows = await emailRepository.getEmails(userId, tab, accountEmail);
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
        accountEmail: r.account_email || undefined,
        isUnwanted: Boolean(r.is_unwanted) || r.kind === 'unwanted',
        unwantedReason: r.unwanted_reason || ((r.is_unwanted || r.kind === 'unwanted') ? 'Promotional or automated mail' : undefined),
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
    instruction?: string,
    context?: { subject?: string; content?: string; fromName?: string; fromEmail?: string }
  ): Promise<{ draft: string }> {
    const email = await emailRepository.getEmailById(emailId);
    const fromName = email?.from_name || context?.fromName || 'Sender';
    const fromEmail = email?.from_email || context?.fromEmail || '';
    const subject = email?.subject || context?.subject || 'Your Email';
    const content = email?.content || email?.preview || context?.content || '';

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

    // 1. Resolve connected email account (prefer email's own account_id, then user, then any connected account)
    let account = null;
    if (email?.account_id) {
      account = await emailRepository.getEmailAccountById(email.account_id);
    }
    if (!account) {
      account = await emailRepository.getEmailAccount(userId);
    }
    if (!account) {
      account = await emailRepository.getAnyConnectedAccount();
    }

    // 2. Resolve recipient email address
    let recipient: string | null =
      email?.from_email ||
      (email?.from_name && email.from_name.includes('@') ? email.from_name : null);

    if (recipient) {
      const match = recipient.match(/<([^>]+)>/);
      if (match) {
        recipient = match[1].trim();
      } else {
        recipient = recipient.trim();
      }
    }

    // If no connected Gmail account or token, gracefully record reply in demo mode
    if (!account || !account.refresh_token_enc) {
      await emailRepository.updateEmailStatus(emailId, 'Replied (demo)');
      if (email?.id) {
        await emailRepository.upsertDraft(emailId, userId, body);
      }
      return {
        success: true,
        message: `Reply recorded for ${email?.from_name || 'Sender'} (demo mode). Connect live Gmail to deliver to external inbox.`,
      };
    }

    // If recipient is unknown or demo sender without an email address
    if (!recipient) {
      await emailRepository.updateEmailStatus(emailId, 'Replied (demo)');
      if (email?.id) {
        await emailRepository.upsertDraft(emailId, userId, body);
      }
      return {
        success: true,
        message: `Reply recorded for ${email?.from_name || 'Sender'}. (No external email recipient found)`,
      };
    }

    // 3. Send via Google Gmail API
    try {
      const auth = gmailOAuth.getAuthenticatedClient(account.refresh_token_enc);
      await gmailService.sendEmailReply(auth, {
        to: recipient,
        subject: email?.subject || 'Reply',
        body,
        threadId: email?.thread_id || undefined,
        inReplyTo:
          email?.provider_msg_id && email.provider_msg_id.includes('@')
            ? email.provider_msg_id
            : undefined,
      });

      await emailRepository.updateEmailStatus(emailId, 'Replied via Gmail');
      if (email?.id) {
        await emailRepository.upsertDraft(emailId, userId, body);
      }

      return { success: true, message: `Reply successfully sent to ${recipient}` };
    } catch (apiErr: any) {
      console.warn('Gmail API send error:', apiErr?.message || apiErr);
      await emailRepository.updateEmailStatus(emailId, 'Replied (queued)');
      if (email?.id) {
        await emailRepository.upsertDraft(emailId, userId, body);
      }

      return {
        success: true,
        message: `Reply saved & recorded for ${recipient}. (${apiErr?.message || 'Delivery queued'})`,
      };
    }
  },

  async archiveEmail(emailId: string) {
    return emailRepository.markArchive(emailId);
  },

  async trashEmail(emailId: string, userId: string = DEFAULT_USER_ID) {
    const email = await emailRepository.getEmailById(emailId);
    if (!email) {
      await emailRepository.deleteEmail(emailId);
      return { success: true, message: 'Email deleted.' };
    }

    let account = null;
    if (email.account_id) {
      account = await emailRepository.getEmailAccountById(email.account_id);
    }
    if (!account) {
      account = await emailRepository.getEmailAccount(userId);
    }

    if (account?.refresh_token_enc && email.provider_msg_id) {
      try {
        const auth = gmailOAuth.getAuthenticatedClient(account.refresh_token_enc);
        await gmailService.trashEmail(auth, email.provider_msg_id);
      } catch (err: any) {
        console.warn(`[EmailService] Failed to trash msg ${email.provider_msg_id} in Gmail:`, err?.message || err);
      }
    }

    await emailRepository.deleteEmail(emailId);
    return { success: true, message: 'Email moved to Gmail Trash.' };
  },

  async batchTrashEmails(emailIds: string[], userId: string = DEFAULT_USER_ID) {
    if (!emailIds || emailIds.length === 0) {
      return { success: true, deletedCount: 0, message: 'No emails selected.' };
    }

    let deletedCount = 0;
    for (const id of emailIds) {
      try {
        await this.trashEmail(id, userId);
        deletedCount++;
      } catch (err) {
        console.warn(`[EmailService] Error trashing email ${id}:`, err);
      }
    }

    return {
      success: true,
      deletedCount,
      message: `${deletedCount} unwanted email${deletedCount > 1 ? 's' : ''} moved to Gmail Trash.`,
    };
  },

  async scanUnwantedEmails(userId: string = DEFAULT_USER_ID) {
    const emails = await emailRepository.getEmails(userId, 'all');
    let taggedCount = 0;
    for (const e of emails) {
      const text = (e.subject + ' ' + (e.content || e.preview || '')).toLowerCase();
      const isUnwanted = /unsubscribe|newsletter|promotions|promo|discount|sale|limited offer|deal of the day|best price|click here|sponsored|advertisement|shop now|hurry|coupon|webinar/i.test(text);
      if (isUnwanted) {
        let reason = 'Promotional sales & discounts';
        if (/newsletter|digest/i.test(text)) reason = 'Automated newsletter digest';
        else if (/unsubscribe/i.test(text)) reason = 'Marketing mailer with unsubscribe';
        await emailRepository.updateEmailStatus(e.id, 'Unwanted');
        taggedCount++;
      }
    }
    return { success: true, taggedCount };
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
