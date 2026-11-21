import { db } from '../../db/db.js';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

export const financeRepository = {
  async ensureTablesExist(): Promise<void> {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS finance_assets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID DEFAULT '${DEFAULT_USER_ID}',
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          value NUMERIC NOT NULL DEFAULT 0,
          cost NUMERIC NOT NULL DEFAULT 0,
          expected_rent NUMERIC NOT NULL DEFAULT 0,
          received_rent NUMERIC NOT NULL DEFAULT 0,
          area TEXT,
          status TEXT DEFAULT 'Active',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS finance_loans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID DEFAULT '${DEFAULT_USER_ID}',
          name TEXT NOT NULL,
          principal NUMERIC NOT NULL DEFAULT 0,
          rate NUMERIC NOT NULL DEFAULT 0,
          frequency TEXT DEFAULT 'Monthly interest',
          due TEXT NOT NULL,
          paid BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS finance_transactions (
          id TEXT PRIMARY KEY,
          user_id UUID DEFAULT '${DEFAULT_USER_ID}',
          amount NUMERIC NOT NULL,
          type TEXT NOT NULL,
          bank_name TEXT NOT NULL,
          account_mask TEXT,
          merchant TEXT,
          balance NUMERIC,
          due_date TEXT,
          category TEXT DEFAULT 'general',
          raw_body TEXT,
          date BIGINT NOT NULL,
          amount_paise BIGINT,
          balance_paise BIGINT,
          is_expense BOOLEAN DEFAULT TRUE,
          direction TEXT,
          ref_id TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Add any missing columns to existing table
        DO $$ 
        BEGIN 
          BEGIN ALTER TABLE finance_transactions ADD COLUMN amount_paise BIGINT; EXCEPTION WHEN duplicate_column THEN END;
          BEGIN ALTER TABLE finance_transactions ADD COLUMN balance_paise BIGINT; EXCEPTION WHEN duplicate_column THEN END;
          BEGIN ALTER TABLE finance_transactions ADD COLUMN is_expense BOOLEAN DEFAULT TRUE; EXCEPTION WHEN duplicate_column THEN END;
          BEGIN ALTER TABLE finance_transactions ADD COLUMN direction TEXT; EXCEPTION WHEN duplicate_column THEN END;
          BEGIN ALTER TABLE finance_transactions ADD COLUMN ref_id TEXT; EXCEPTION WHEN duplicate_column THEN END;
          BEGIN ALTER TABLE finance_transactions ADD COLUMN source TEXT DEFAULT 'sms'; EXCEPTION WHEN duplicate_column THEN END;
          BEGIN ALTER TABLE finance_transactions ADD COLUMN email_id UUID; EXCEPTION WHEN duplicate_column THEN END;
        END $$;

        CREATE TABLE IF NOT EXISTS finance_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID DEFAULT '${DEFAULT_USER_ID}',
          category TEXT NOT NULL,
          title TEXT NOT NULL,
          masked_identifier TEXT NOT NULL,
          detail TEXT NOT NULL,
          document_name TEXT NOT NULL,
          document_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS finance_retirement_params (
          user_id UUID PRIMARY KEY DEFAULT '${DEFAULT_USER_ID}',
          age INT NOT NULL DEFAULT 38,
          retire_age INT NOT NULL DEFAULT 58,
          target_corpus NUMERIC NOT NULL DEFAULT 35000000,
          current_sip NUMERIC NOT NULL DEFAULT 65000,
          return_rate NUMERIC NOT NULL DEFAULT 12,
          inflation_rate NUMERIC NOT NULL DEFAULT 6.5,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
    } catch (e) {
      console.warn('[FinanceRepo] Notice checking tables:', e);
    }
  },

  // ================= ASSETS =================
  async getAllAssets(userId = DEFAULT_USER_ID) {
    await this.ensureTablesExist();
    return db.query(
      `SELECT * FROM finance_assets WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    );
  },

  async createAsset(userId = DEFAULT_USER_ID, data: any) {
    await this.ensureTablesExist();
    return db.queryOne(
      `INSERT INTO finance_assets (user_id, name, type, value, cost, expected_rent, received_rent, area, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userId,
        data.name,
        data.type,
        data.value,
        data.cost || 0,
        data.expectedRent || 0,
        data.receivedRent || 0,
        data.area || '',
        data.status || 'Active',
      ]
    );
  },

  async updateAssetRentStatus(id: string, userId = DEFAULT_USER_ID, status: string, receivedRent?: number) {
    await this.ensureTablesExist();
    if (receivedRent !== undefined) {
      return db.queryOne(
        `UPDATE finance_assets 
         SET status = $1, received_rent = $2, updated_at = NOW() 
         WHERE id = $3 AND user_id = $4 RETURNING *`,
        [status, receivedRent, id, userId]
      );
    }
    return db.queryOne(
      `UPDATE finance_assets 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [status, id, userId]
    );
  },

  async deleteAsset(id: string, userId = DEFAULT_USER_ID) {
    await this.ensureTablesExist();
    return db.queryOne(
      `DELETE FROM finance_assets WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
  },

  // ================= LOANS =================
  async getAllLoans(userId = DEFAULT_USER_ID) {
    await this.ensureTablesExist();
    return db.query(
      `SELECT * FROM finance_loans WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    );
  },

  async createLoan(userId = DEFAULT_USER_ID, data: any) {
    await this.ensureTablesExist();
    return db.queryOne(
      `INSERT INTO finance_loans (user_id, name, principal, rate, frequency, due, paid)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        data.name,
        data.principal,
        data.rate,
        data.frequency || 'Monthly interest',
        data.due,
        data.paid || false,
      ]
    );
  },

  async toggleLoanPaid(id: string, userId = DEFAULT_USER_ID) {
    await this.ensureTablesExist();
    return db.queryOne(
      `UPDATE finance_loans 
       SET paid = NOT paid, updated_at = NOW() 
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );
  },

  async deleteLoan(id: string, userId = DEFAULT_USER_ID) {
    await this.ensureTablesExist();
    return db.queryOne(
      `DELETE FROM finance_loans WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
  },

  // ================= SMS & EMAIL TRANSACTIONS =================
  async clearTransactions(userId = DEFAULT_USER_ID, keepEmailCredits = true) {
    await this.ensureTablesExist();
    if (keepEmailCredits) {
      return db.query(
        `DELETE FROM finance_transactions WHERE user_id = $1 AND (source != 'email' OR source IS NULL)`,
        [userId]
      );
    }
    return db.query(`DELETE FROM finance_transactions WHERE user_id = $1`, [userId]);
  },

  async upsertTransactionsBatch(userId = DEFAULT_USER_ID, transactions: any[]) {
    await this.ensureTablesExist();
    let insertedCount = 0;

    for (const tx of transactions) {
      const amountPaise =
        tx.amountPaise !== undefined
          ? tx.amountPaise
          : Math.round(Number(tx.amount || 0) * 100);
      const balancePaise =
        tx.balancePaise !== undefined
          ? tx.balancePaise
          : tx.balance !== undefined && tx.balance !== null
          ? Math.round(Number(tx.balance) * 100)
          : null;
      const isExpense = tx.isExpense !== undefined ? tx.isExpense : tx.type === 'debit';
      const direction = tx.direction || tx.type || 'debit';
      const source = tx.source || 'sms';
      const emailId = tx.emailId || null;

      const res = await db.query(
        `INSERT INTO finance_transactions 
         (id, user_id, amount, type, bank_name, account_mask, merchant, balance, due_date, category, raw_body, date, amount_paise, balance_paise, is_expense, direction, ref_id, source, email_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         ON CONFLICT (id) DO UPDATE SET
           amount = EXCLUDED.amount,
           balance = COALESCE(EXCLUDED.balance, finance_transactions.balance),
           due_date = COALESCE(EXCLUDED.due_date, finance_transactions.due_date),
           amount_paise = EXCLUDED.amount_paise,
           balance_paise = COALESCE(EXCLUDED.balance_paise, finance_transactions.balance_paise),
           is_expense = EXCLUDED.is_expense,
           direction = EXCLUDED.direction,
           ref_id = COALESCE(EXCLUDED.ref_id, finance_transactions.ref_id),
           source = COALESCE(EXCLUDED.source, finance_transactions.source),
           email_id = COALESCE(EXCLUDED.email_id, finance_transactions.email_id)
         RETURNING id`,
        [
          tx.id,
          userId,
          tx.amount,
          direction,
          tx.bankName,
          tx.accountMask || null,
          tx.merchant || null,
          tx.balance || null,
          tx.dueDate || null,
          tx.category || 'general',
          tx.rawBody,
          tx.date,
          amountPaise,
          balancePaise,
          isExpense,
          direction,
          tx.refId || null,
          source,
          emailId,
        ]
      );
      if (res.length > 0) insertedCount++;
    }

    return insertedCount;
  },

  async getPotentialCreditEmails(userId = DEFAULT_USER_ID) {
    await this.ensureTablesExist();
    return db.query(
      `SELECT 
         e.id, 
         e.subject, 
         e.preview, 
         e.content, 
         e.from_name, 
         e.from_email, 
         e.received_at, 
         e.account_id,
         a.email as account_email
       FROM emails e
       JOIN email_accounts a ON a.id = e.account_id
       WHERE a.user_id = $1
         AND (
           e.subject ~* '(salary|credited|credit|deposited|payroll|pension|stipend|neft.*cr|imps.*cr|inward)'
           OR e.content ~* '(salary|credited|credit|deposited|payroll|pension|stipend|neft.*cr|imps.*cr|inward)'
           OR e.preview ~* '(salary|credited|credit|deposited|payroll|pension|stipend|neft.*cr|imps.*cr|inward)'
         )
       ORDER BY e.received_at DESC
       LIMIT 100`,
      [userId]
    );
  },

  async getTransactions(userId = DEFAULT_USER_ID, type?: string, limit = 100) {
    await this.ensureTablesExist();
    if (type && type !== 'all') {
      return db.query(
        `SELECT * FROM finance_transactions 
         WHERE user_id = $1 AND type = $2 
         ORDER BY date DESC LIMIT $3`,
        [userId, type, limit]
      );
    }
    return db.query(
      `SELECT * FROM finance_transactions 
       WHERE user_id = $1 
       ORDER BY date DESC LIMIT $2`,
      [userId, limit]
    );
  },

  async getCashFlowWeeklySeries(userId = DEFAULT_USER_ID) {
    await this.ensureTablesExist();
    const rows = await db.query(
      `SELECT type, amount, date FROM finance_transactions 
       WHERE user_id = $1 
       ORDER BY date DESC LIMIT 200`,
      [userId]
    );
    return rows;
  },

  // ================= RETIREMENT =================
  async getRetirementParams(userId = DEFAULT_USER_ID) {
    await this.ensureTablesExist();
    const row = await db.queryOne(
      `SELECT * FROM finance_retirement_params WHERE user_id = $1`,
      [userId]
    );
    if (row) return row;

    // Return default if not set
    return {
      user_id: userId,
      age: 38,
      retire_age: 58,
      target_corpus: 35000000,
      current_sip: 65000,
      return_rate: 12,
      inflation_rate: 6.5,
    };
  },

  async upsertRetirementParams(userId = DEFAULT_USER_ID, params: any) {
    await this.ensureTablesExist();
    return db.queryOne(
      `INSERT INTO finance_retirement_params (user_id, age, retire_age, target_corpus, current_sip, return_rate, inflation_rate, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         age = COALESCE(EXCLUDED.age, finance_retirement_params.age),
         retire_age = COALESCE(EXCLUDED.retire_age, finance_retirement_params.retire_age),
         target_corpus = COALESCE(EXCLUDED.target_corpus, finance_retirement_params.target_corpus),
         current_sip = COALESCE(EXCLUDED.current_sip, finance_retirement_params.current_sip),
         return_rate = COALESCE(EXCLUDED.return_rate, finance_retirement_params.return_rate),
         inflation_rate = COALESCE(EXCLUDED.inflation_rate, finance_retirement_params.inflation_rate),
         updated_at = NOW()
       RETURNING *`,
      [
        userId,
        params.age || 38,
        params.retireAge || 58,
        params.targetCorpus || 35000000,
        params.currentSip || 65000,
        params.returnRate || 12,
        params.inflationRate || 6.5,
      ]
    );
  },

  // ================= RECORDS VAULT =================
  async getAllRecords(userId = DEFAULT_USER_ID) {
    await this.ensureTablesExist();
    return db.query(
      `SELECT * FROM finance_records WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    );
  },

  async createRecord(userId = DEFAULT_USER_ID, data: any) {
    await this.ensureTablesExist();
    return db.queryOne(
      `INSERT INTO finance_records (user_id, category, title, masked_identifier, detail, document_name, document_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        data.category,
        data.title,
        data.maskedIdentifier,
        data.detail,
        data.documentName || 'None',
        data.documentUrl || null,
      ]
    );
  },

  async attachDocumentToRecord(id: string, userId = DEFAULT_USER_ID, docName: string, docUrl?: string) {
    await this.ensureTablesExist();
    return db.queryOne(
      `UPDATE finance_records 
       SET document_name = $1, document_url = $2, updated_at = NOW() 
       WHERE id = $3 AND user_id = $4 RETURNING *`,
      [docName, docUrl || null, id, userId]
    );
  },

  async deleteRecord(id: string, userId = DEFAULT_USER_ID) {
    await this.ensureTablesExist();
    return db.queryOne(
      `DELETE FROM finance_records WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
  },

  // ================= INITIAL SEED =================
  async seedInitialIfEmpty(_userId = DEFAULT_USER_ID) {
    await this.ensureTablesExist();
    // No dummy data seeded: all assets, loans and records are populated dynamically
    // from user input and verified bank SMS scanning.
  }
};
