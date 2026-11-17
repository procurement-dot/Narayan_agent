import { db } from '../../db/db.js';
import type { ParsedGmailMessage } from './gmail.service.js';
import type { AiAnalysisResult } from './email.analyzer.js';

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export const emailRepository = {
  async upsertEmailAccount(data: {
    userId: string;
    email: string;
    refreshTokenEnc: string;
  }) {
    const existing = await db.queryOne(
      'SELECT id FROM email_accounts WHERE user_id = $1 AND provider = $2',
      [data.userId, 'gmail']
    );

    if (existing) {
      return db.queryOne(
        `UPDATE email_accounts 
         SET email = $1, refresh_token_enc = $2, status = 'connected', updated_at = NOW() 
         WHERE id = $3 
         RETURNING *`,
        [data.email, data.refreshTokenEnc, existing.id]
      );
    }

    return db.queryOne(
      `INSERT INTO email_accounts (user_id, provider, email, refresh_token_enc, status) 
       VALUES ($1, 'gmail', $2, $3, 'connected') 
       RETURNING *`,
      [data.userId, data.email, data.refreshTokenEnc]
    );
  },

  async emailExists(accountId: string, providerMsgId: string): Promise<boolean> {
    const row = await db.queryOne(
      'SELECT id FROM emails WHERE account_id = $1 AND provider_msg_id = $2',
      [accountId, providerMsgId]
    );
    return Boolean(row);
  },

  async getExistingMessageIds(accountId: string): Promise<Set<string>> {
    const rows = await db.query(
      'SELECT provider_msg_id FROM emails WHERE account_id = $1',
      [accountId]
    );
    return new Set(rows.map((r: any) => r.provider_msg_id));
  },

  async getEmailAccount(userId: string) {
    return db.queryOne(
      `SELECT * FROM email_accounts 
       WHERE user_id = $1 AND provider = 'gmail' AND status = 'connected' 
       ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    );
  },

  async disconnectEmailAccount(userId: string) {
    // 1. Remove proposals tied to this account's emails
    await db.query(
      `DELETE FROM proposals WHERE email_id IN (
         SELECT e.id FROM emails e
         JOIN email_accounts a ON a.id = e.account_id
         WHERE a.user_id = $1 AND a.provider = 'gmail'
       )`,
      [userId]
    );

    // 2. Remove email drafts tied to this account's emails
    await db.query(
      `DELETE FROM email_drafts WHERE email_id IN (
         SELECT e.id FROM emails e
         JOIN email_accounts a ON a.id = e.account_id
         WHERE a.user_id = $1 AND a.provider = 'gmail'
       )`,
      [userId]
    );

    // 3. Remove cached emails
    await db.query(
      `DELETE FROM emails WHERE account_id IN (
         SELECT id FROM email_accounts WHERE user_id = $1 AND provider = 'gmail'
       )`,
      [userId]
    );

    // 4. Mark account disconnected
    return db.query(
      `UPDATE email_accounts 
       SET status = 'disconnected', updated_at = NOW() 
       WHERE user_id = $1 AND provider = 'gmail'`,
      [userId]
    );
  },

  async insertEmailWithAnalysis(
    accountId: string,
    userId: string,
    msg: ParsedGmailMessage,
    analysis: AiAnalysisResult
  ) {
    // 1. Upsert Email record
    const emailRow = await db.queryOne(
      `INSERT INTO emails (
        account_id, provider_msg_id, thread_id, from_name, from_email,
        subject, preview, content, received_at, scope, kind, confidence, draft
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (account_id, provider_msg_id) DO UPDATE SET
        subject = EXCLUDED.subject,
        preview = EXCLUDED.preview,
        content = EXCLUDED.content,
        kind = EXCLUDED.kind,
        confidence = EXCLUDED.confidence,
        draft = EXCLUDED.draft
      RETURNING *`,
      [
        accountId,
        msg.providerMsgId,
        msg.threadId,
        msg.fromName,
        msg.fromEmail,
        msg.subject,
        msg.preview,
        msg.content,
        msg.receivedAt,
        analysis.scope,
        analysis.kind,
        analysis.confidence,
        analysis.draftReply,
      ]
    );

    if (!emailRow) return null;

    // 2. If AI detected a proposal, upsert into proposals table
    if (analysis.proposal) {
      const p = analysis.proposal;
      await db.query(
        `INSERT INTO proposals (
          email_id, user_id, type, title, start_time, end_time, detail, context, evidence, confidence, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
        ON CONFLICT DO NOTHING`,
        [
          emailRow.id,
          userId,
          p.type,
          p.title,
          p.start_time,
          p.end_time,
          p.detail,
          msg.subject,
          p.evidence,
          p.confidence,
        ]
      );
    }

    return emailRow;
  },

  async getEmails(tab?: string) {
    let sql = `
      SELECT 
        e.*,
        d.body as saved_draft,
        p.id as proposal_id
      FROM emails e
      LEFT JOIN email_drafts d ON d.email_id = e.id
      LEFT JOIN proposals p ON p.email_id = e.id AND p.status != 'dismissed'
      WHERE (e.is_archived IS FALSE OR e.is_archived IS NULL)
    `;
    const params: any[] = [];

    if (tab === 'priority') {
      sql += ` AND e.kind != 'noise'`;
    } else if (tab === 'meetings') {
      sql += ` AND e.kind = 'meeting'`;
    } else if (tab === 'low') {
      sql += ` AND e.kind = 'noise'`;
    } else if (tab === 'drafts') {
      sql += ` AND (d.body IS NOT NULL OR (e.draft IS NOT NULL AND e.draft != ''))`;
    }

    sql += ` ORDER BY e.received_at DESC LIMIT 50`;

    return db.query(sql, params);
  },

  async getEmailById(id: string) {
    if (!isUuid(id)) {
      return null;
    }
    return db.queryOne(
      `SELECT e.*, d.body as saved_draft 
       FROM emails e 
       LEFT JOIN email_drafts d ON d.email_id = e.id 
       WHERE e.id = $1`,
      [id]
    );
  },

  async upsertDraft(emailId: string, userId: string, body: string) {
    if (!isUuid(emailId)) {
      return { email_id: emailId, user_id: userId, body };
    }
    return db.queryOne(
      `INSERT INTO email_drafts (email_id, user_id, body, updated_at) 
       VALUES ($1, $2, $3, NOW()) 
       ON CONFLICT (email_id, user_id) DO UPDATE SET 
         body = EXCLUDED.body, 
         updated_at = NOW() 
       RETURNING *`,
      [emailId, userId, body]
    );
  },

  async markArchive(emailId: string) {
    if (!isUuid(emailId)) {
      return { id: emailId, status: 'Archive proposed (demo)' };
    }
    return db.queryOne(
      `UPDATE emails 
       SET status = 'Archive proposed (demo)', is_archived = TRUE 
       WHERE id = $1 
       RETURNING *`,
      [emailId]
    );
  },

  async updateEmailStatus(emailId: string, status: string) {
    if (!isUuid(emailId)) {
      return { id: emailId, status };
    }
    return db.queryOne(
      `UPDATE emails 
       SET status = $1 
       WHERE id = $2 
       RETURNING *`,
      [status, emailId]
    );
  },

  async getProposalByEmailId(idOrEmailId: string) {
    if (!isUuid(idOrEmailId)) {
      return null;
    }
    return db.queryOne(
      `SELECT * FROM proposals 
       WHERE (email_id = $1 OR id = $1) AND status != 'dismissed' 
       ORDER BY created_at DESC LIMIT 1`,
      [idOrEmailId]
    );
  },

  async approveProposal(
    proposalId: string,
    userId: string,
    taskData: { title: string; start: string; end: string; detail: string }
  ) {
    // 1. Enforce duplicate guard
    const existing = await db.queryOne(
      'SELECT id FROM tasks WHERE source_proposal_id = $1',
      [proposalId]
    );

    if (existing) {
      const err = new Error('Already on your day; duplicate prevented.');
      (err as any).statusCode = 409;
      throw err;
    }

    // 2. Insert into tasks table
    const newTask = await db.queryOne(
      `INSERT INTO tasks (user_id, date, title, start_time, end_time, detail, source_proposal_id) 
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        userId,
        taskData.title,
        taskData.start,
        taskData.end,
        taskData.detail,
        proposalId,
      ]
    );

    // 3. Mark proposal as approved in proposals table (if UUID)
    if (isUuid(proposalId)) {
      await db.query(
        `UPDATE proposals SET status = 'approved' WHERE id = $1`,
        [proposalId]
      );
    }

    return newTask;
  },

  async dismissProposal(proposalId: string) {
    if (!isUuid(proposalId)) {
      return { id: proposalId, status: 'dismissed' };
    }
    return db.queryOne(
      `UPDATE proposals SET status = 'dismissed' WHERE id = $1 RETURNING *`,
      [proposalId]
    );
  },

  async getSummary() {
    const counts = await db.queryOne(`
      SELECT 
        COUNT(*) FILTER (WHERE kind = 'task' AND (is_archived IS FALSE OR is_archived IS NULL)) as requests,
        COUNT(*) FILTER (WHERE kind = 'noise' AND (is_archived IS FALSE OR is_archived IS NULL)) as low_signal,
        COUNT(*) FILTER (WHERE kind = 'meeting' AND (is_archived IS FALSE OR is_archived IS NULL)) as merged_meetings
      FROM emails
    `);

    return {
      requests: Number(counts?.requests || 0),
      lowSignal: Number(counts?.low_signal || 0),
      mergedMeetings: Number(counts?.merged_meetings || 0),
    };
  },
};
