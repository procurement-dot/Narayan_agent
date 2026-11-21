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
      'SELECT id FROM email_accounts WHERE user_id = $1 AND provider = $2 AND LOWER(email) = LOWER($3)',
      [data.userId, 'gmail', data.email]
    );

    if (existing) {
      return db.queryOne(
        `UPDATE email_accounts 
         SET refresh_token_enc = $1, status = 'connected', updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [data.refreshTokenEnc, existing.id]
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

  async getEmailAccountById(id: string) {
    return db.queryOne(
      `SELECT * FROM email_accounts 
       WHERE id = $1 AND provider = 'gmail' AND status = 'connected'`,
      [id]
    );
  },

  async getAnyConnectedAccount() {
    return db.queryOne(
      `SELECT * FROM email_accounts 
       WHERE provider = 'gmail' AND status = 'connected' AND refresh_token_enc IS NOT NULL 
       ORDER BY updated_at DESC LIMIT 1`
    );
  },

  async getEmailAccounts(userId: string) {
    return db.query(
      `SELECT * FROM email_accounts 
       WHERE user_id = $1 AND provider = 'gmail' AND status = 'connected' 
       ORDER BY created_at ASC`,
      [userId]
    );
  },

  async disconnectEmailAccount(userId: string, email?: string) {
    if (email) {
      const account = await db.queryOne(
        `SELECT id FROM email_accounts WHERE user_id = $1 AND provider = 'gmail' AND LOWER(email) = LOWER($2)`,
        [userId, email]
      );
      if (account) {
        await db.query(`DELETE FROM proposals WHERE email_id IN (SELECT id FROM emails WHERE account_id = $1)`, [account.id]);
        await db.query(`DELETE FROM email_drafts WHERE email_id IN (SELECT id FROM emails WHERE account_id = $1)`, [account.id]);
        await db.query(`DELETE FROM emails WHERE account_id = $1`, [account.id]);
        return db.query(
          `UPDATE email_accounts SET status = 'disconnected', updated_at = NOW() WHERE id = $1`,
          [account.id]
        );
      }
      return;
    }

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
    const isUnwanted = Boolean(analysis.isUnwanted) || analysis.kind === 'unwanted';
    const unwantedReason = analysis.unwantedReason || (isUnwanted ? 'Promotional or automated mail' : null);

    // 1. Upsert Email record
    const emailRow = await db.queryOne(
      `INSERT INTO emails (
        account_id, provider_msg_id, thread_id, from_name, from_email,
        subject, preview, content, received_at, scope, kind, confidence, draft,
        is_unwanted, unwanted_reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (account_id, provider_msg_id) DO UPDATE SET
        subject = EXCLUDED.subject,
        preview = EXCLUDED.preview,
        content = EXCLUDED.content,
        kind = EXCLUDED.kind,
        confidence = EXCLUDED.confidence,
        draft = EXCLUDED.draft,
        is_unwanted = EXCLUDED.is_unwanted,
        unwanted_reason = EXCLUDED.unwanted_reason
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
        isUnwanted,
        unwantedReason,
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

  async getEmails(userId: string, tab?: string, accountEmail?: string) {
    let sql = `
      SELECT 
        e.*,
        a.email as account_email,
        (
          SELECT d.body FROM email_drafts d 
          WHERE d.email_id = e.id AND d.user_id = $1 
          ORDER BY d.updated_at DESC LIMIT 1
        ) as saved_draft,
        (
          SELECT p.id FROM proposals p 
          WHERE p.email_id = e.id AND p.status != 'dismissed' AND p.user_id = $1 
          ORDER BY p.created_at DESC LIMIT 1
        ) as proposal_id
      FROM emails e
      JOIN email_accounts a ON a.id = e.account_id
      WHERE a.user_id = $1 AND (e.is_archived IS FALSE OR e.is_archived IS NULL)
    `;
    const params: any[] = [userId];

    if (accountEmail && accountEmail !== 'all') {
      params.push(accountEmail);
      sql += ` AND LOWER(a.email) = LOWER($${params.length})`;
    }

    if (tab === 'priority') {
      sql += ` AND e.kind != 'noise' AND (e.is_unwanted IS FALSE OR e.is_unwanted IS NULL)`;
    } else if (tab === 'meetings') {
      sql += ` AND e.kind = 'meeting'`;
    } else if (tab === 'low') {
      sql += ` AND e.kind = 'noise'`;
    } else if (tab === 'unwanted') {
      sql += ` AND (e.is_unwanted IS TRUE OR e.kind = 'unwanted' OR e.kind = 'noise')`;
    } else if (tab === 'drafts') {
      sql += ` AND (EXISTS (SELECT 1 FROM email_drafts d WHERE d.email_id = e.id AND d.user_id = $1) OR (e.draft IS NOT NULL AND e.draft != ''))`;
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

  async getAllConnectedUserIds(): Promise<string[]> {
    const rows = await db.query(
      `SELECT DISTINCT user_id FROM email_accounts WHERE status = 'connected' AND provider = 'gmail'`
    );
    return rows.map((r: any) => r.user_id);
  },

  async deleteEmail(id: string) {
    if (!isUuid(id)) {
      return { id };
    }
    await db.query(`DELETE FROM proposals WHERE email_id = $1`, [id]);
    await db.query(`DELETE FROM email_drafts WHERE email_id = $1`, [id]);
    return db.queryOne(`DELETE FROM emails WHERE id = $1 RETURNING *`, [id]);
  },

  async deleteEmails(ids: string[]) {
    const validIds = ids.filter(isUuid);
    if (validIds.length === 0) return [];
    await db.query(`DELETE FROM proposals WHERE email_id = ANY($1::uuid[])`, [validIds]);
    await db.query(`DELETE FROM email_drafts WHERE email_id = ANY($1::uuid[])`, [validIds]);
    return db.query(`DELETE FROM emails WHERE id = ANY($1::uuid[]) RETURNING *`, [validIds]);
  },

  async getSummary(userId: string, accountEmail?: string) {
    let sql = `SELECT 
        COUNT(*) FILTER (WHERE e.kind = 'task' AND (e.is_archived IS FALSE OR e.is_archived IS NULL)) as requests,
        COUNT(*) FILTER (WHERE e.kind = 'noise' AND (e.is_archived IS FALSE OR e.is_archived IS NULL)) as low_signal,
        COUNT(*) FILTER (WHERE e.kind = 'meeting' AND (e.is_archived IS FALSE OR e.is_archived IS NULL)) as merged_meetings,
        COUNT(*) FILTER (WHERE (e.is_unwanted IS TRUE OR e.kind = 'unwanted' OR e.kind = 'noise') AND (e.is_archived IS FALSE OR e.is_archived IS NULL)) as unwanted
      FROM emails e
      JOIN email_accounts a ON a.id = e.account_id
      WHERE a.user_id = $1`;
    const params: any[] = [userId];

    if (accountEmail && accountEmail !== 'all') {
      params.push(accountEmail);
      sql += ` AND LOWER(a.email) = LOWER($${params.length})`;
    }

    const counts = await db.queryOne(sql, params);

    return {
      requests: Number(counts?.requests || 0),
      lowSignal: Number(counts?.low_signal || 0),
      mergedMeetings: Number(counts?.merged_meetings || 0),
      unwanted: Number(counts?.unwanted || 0),
    };
  },
};
