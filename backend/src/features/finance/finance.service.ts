import { financeRepository } from './finance.repository.js';

export const financeService = {
  async getOverview(userId?: string) {
    await financeRepository.seedInitialIfEmpty(userId);

    const [assets, loans, transactions, retirement] = await Promise.all([
      financeRepository.getAllAssets(userId),
      financeRepository.getAllLoans(userId),
      financeRepository.getTransactions(userId, 'all', 100),
      financeRepository.getRetirementParams(userId),
    ]);

    const totalAssets = assets.reduce((sum, a) => sum + Number(a.value || 0), 0);
    const totalLoans = loans.reduce((sum, l) => sum + Number(l.principal || 0), 0);
    const netWorth = totalAssets + totalLoans;

    const propertyLandTotal = assets
      .filter((x) => /property|real estate|land/i.test(x.type))
      .reduce((sum, a) => sum + Number(a.value || 0), 0);

    const investmentsTotal = assets
      .filter((x) => !/property|real estate|land/i.test(x.type))
      .reduce((sum, a) => sum + Number(a.value || 0), 0);

    const monthlyRentExpected = assets.reduce((sum, a) => sum + Number(a.expected_rent || 0), 0);
    const monthlyRentReceived = assets.reduce((sum, a) => sum + Number(a.received_rent || 0), 0);
    const monthlyRentGap = Math.max(0, monthlyRentExpected - monthlyRentReceived);

    // Build 7-day cash flow trend from real SMS transactions (or fallback sample)
    let cashFlowSeries = [38, 44, 42, 55, 52, 65, 63];
    if (transactions.length >= 7) {
      cashFlowSeries = transactions
        .slice(0, 7)
        .reverse()
        .map((t) => Math.min(100, Math.max(15, Math.round((Number(t.amount) / 1000) * 1.5))));
    }

    return {
      netWorth,
      stats: {
        propertyLandTotal,
        investmentsTotal,
        lendingTotal: totalLoans,
        monthlyRentGap,
        monthlyRentExpected,
        monthlyRentReceived,
      },
      cashFlowSeries,
      assetsCount: assets.length,
      loansCount: loans.length,
      transactionsCount: transactions.length,
      retirement,
    };
  },

  async getAllAssets(userId?: string) {
    await financeRepository.seedInitialIfEmpty(userId);
    const raw = await financeRepository.getAllAssets(userId);
    return raw.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      value: Number(a.value),
      cost: Number(a.cost),
      expectedRent: Number(a.expected_rent),
      receivedRent: Number(a.received_rent),
      area: a.area || '',
      status: a.status || 'Active',
    }));
  },

  async createAsset(userId: string | undefined, data: any) {
    const raw = await financeRepository.createAsset(userId, data);
    return {
      id: raw.id,
      name: raw.name,
      type: raw.type,
      value: Number(raw.value),
      cost: Number(raw.cost),
      expectedRent: Number(raw.expected_rent),
      receivedRent: Number(raw.received_rent),
      area: raw.area,
      status: raw.status,
    };
  },

  async updateAssetRentStatus(id: string, userId: string | undefined, status: string, receivedRent?: number) {
    const raw = await financeRepository.updateAssetRentStatus(id, userId, status, receivedRent);
    if (!raw) return null;
    return {
      id: raw.id,
      name: raw.name,
      status: raw.status,
      receivedRent: Number(raw.received_rent),
    };
  },

  async deleteAsset(id: string, userId?: string) {
    return financeRepository.deleteAsset(id, userId);
  },

  async getAllLoans(userId?: string) {
    await financeRepository.seedInitialIfEmpty(userId);
    const raw = await financeRepository.getAllLoans(userId);
    return raw.map((l) => ({
      id: l.id,
      name: l.name,
      principal: Number(l.principal),
      rate: Number(l.rate),
      frequency: l.frequency,
      due: l.due,
      paid: Boolean(l.paid),
    }));
  },

  async createLoan(userId: string | undefined, data: any) {
    const raw = await financeRepository.createLoan(userId, data);
    return {
      id: raw.id,
      name: raw.name,
      principal: Number(raw.principal),
      rate: Number(raw.rate),
      frequency: raw.frequency,
      due: raw.due,
      paid: Boolean(raw.paid),
    };
  },

  async toggleLoanPaid(id: string, userId?: string) {
    const raw = await financeRepository.toggleLoanPaid(id, userId);
    if (!raw) return null;
    return {
      id: raw.id,
      paid: Boolean(raw.paid),
    };
  },

  async deleteLoan(id: string, userId?: string) {
    return financeRepository.deleteLoan(id, userId);
  },

  async syncSmsTransactions(userId: string | undefined, transactions: any[]) {
    await financeRepository.clearTransactions(userId);
    const syncedCount = await financeRepository.upsertTransactionsBatch(userId, transactions);

    // If transactions include rent credits, mark rent collected on assets
    for (const tx of transactions) {
      if (tx.type === 'credit' && /rent/i.test(tx.merchant || tx.rawBody || '')) {
        const assets = await financeRepository.getAllAssets(userId);
        for (const asset of assets) {
          if (asset.expected_rent > 0) {
            await financeRepository.updateAssetRentStatus(
              asset.id,
              userId,
              'Tenant occupied · Rent received',
              Number(asset.expected_rent)
            );
          }
        }
      }

      // If new account found in SMS, add to records vault
      if (tx.accountMask) {
        const records = await financeRepository.getAllRecords(userId);
        const exists = records.some((r) => r.masked_identifier.includes(tx.accountMask));
        if (!exists) {
          await financeRepository.createRecord(userId, {
            category: 'Accounts',
            title: `${tx.bankName} Account`,
            maskedIdentifier: tx.accountMask,
            detail: tx.balance && Number(tx.balance) <= 10000000 ? `Verified via SMS · Avl Bal ₹${Number(tx.balance).toLocaleString('en-IN')}` : 'Verified via SMS',
            documentName: 'None',
          });
        }
      }
    }

    return {
      syncedCount,
      totalReceived: transactions.length,
      syncedAt: new Date().toISOString(),
    };
  },

  async getTransactions(userId: string | undefined, type?: string, limit = 100) {
    const raw = await financeRepository.getTransactions(userId, type, limit);
    return raw.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      amountPaise: t.amount_paise !== null && t.amount_paise !== undefined ? Number(t.amount_paise) : Math.round(Number(t.amount) * 100),
      type: t.type,
      direction: t.direction || t.type,
      isExpense: t.is_expense !== null && t.is_expense !== undefined ? Boolean(t.is_expense) : t.type === 'debit',
      bankName: t.bank_name,
      accountMask: t.account_mask,
      merchant: t.merchant,
      balance: t.balance !== null && Number(t.balance) <= 10000000 ? Number(t.balance) : undefined,
      balancePaise: t.balance_paise !== null && t.balance_paise !== undefined && Number(t.balance_paise) <= 1000000000 ? Number(t.balance_paise) : (t.balance !== null && Number(t.balance) <= 10000000 ? Math.round(Number(t.balance) * 100) : undefined),
      dueDate: t.due_date,
      category: t.category,
      rawBody: t.raw_body,
      date: Number(t.date),
      refId: t.ref_id,
      source: (t.source as any) || 'sms',
      emailId: t.email_id || undefined,
    }));
  },

  async syncEmailCredits(userId: string | undefined) {
    const rawEmails = await financeRepository.getPotentialCreditEmails(userId);
    const existingTxs = await financeRepository.getTransactions(userId, 'credit', 200);

    const emailCredits: any[] = [];

    const PROMO_DROP_REGEX =
      /\b(?:pre-?approved|loan offer|apply now|avail loan|congratulations you are eligible|credit card offer|flat \d+% off)\b/i;
    const OTP_DROP_REGEX =
      /(?:is your otp|otp is|use otp|valid for \d+ min|one-time password)/i;
    const RUPEE_AMOUNT_REGEX =
      /(?:rs\.?|inr|₹|रु\.?)\s*([\d,]+(?:\.\d{1,2})?)|\b(?:credited|credit|deposited|salary)\s+(?:by|for|of)?\s*(?:rs\.?|inr|₹|रु\.?)?\s*([\d,]+(?:\.\d{1,2})?)/i;

    for (const em of rawEmails) {
      const fullText = `${em.subject || ''} ${em.preview || ''} ${em.content || ''}`;

      // Gate 1: Anti-Spam / Anti-Promo & Anti-OTP
      if (PROMO_DROP_REGEX.test(fullText) || OTP_DROP_REGEX.test(fullText)) {
        continue;
      }

      // Gate 2: Amount Detection
      const amtMatch = fullText.match(RUPEE_AMOUNT_REGEX);
      if (!amtMatch) continue;

      const rawNumStr = (amtMatch[1] || amtMatch[2] || '').replace(/,/g, '');
      const numVal = parseFloat(rawNumStr);
      if (isNaN(numVal) || numVal <= 0) continue;

      // Filter out small test or non-credit figures (< ₹50) or absurdly large (> 1 Cr)
      if (numVal < 50 || numVal > 10000000) continue;

      const amountPaise = Math.round(numVal * 100);

      // Gate 3: Direction & Category
      const isSalary = /\b(?:salary|payroll|stipend|pension)\b/i.test(fullText);
      const category = isSalary ? 'salary' : 'income';

      // Date
      const dateMs = em.received_at ? new Date(em.received_at).getTime() : Date.now();

      // Deduplication check: Has this exact credit already been recorded in SMS within 24h?
      const isAlreadyInSms = existingTxs.some((tx) => {
        const sameAmount =
          (tx.amount_paise && Number(tx.amount_paise) === amountPaise) ||
          Math.abs(Number(tx.amount) - numVal) < 0.01;
        const closeDate = Math.abs(Number(tx.date) - dateMs) <= 24 * 60 * 60 * 1000;
        return sameAmount && closeDate;
      });

      if (isAlreadyInSms) {
        continue;
      }

      let merchant = em.from_name || 'Employer Payroll';
      if (merchant.includes('<')) {
        merchant = merchant.split('<')[0].trim();
      }

      emailCredits.push({
        id: `email-credit-${em.id}`,
        amount: numVal,
        amountPaise,
        type: 'credit',
        direction: 'credit',
        isExpense: false,
        bankName: 'State Bank of India',
        accountMask: '•••• 3098',
        merchant: isSalary ? `${merchant} (Salary)` : merchant,
        balance: undefined,
        dueDate: undefined,
        category,
        rawBody: `[Email Inflow Alert] ${em.subject}: ${em.preview || em.content || ''}`.slice(0, 300),
        date: dateMs,
        refId: em.id,
        source: 'email',
        emailId: em.id,
      });
    }

    if (emailCredits.length > 0) {
      await financeRepository.upsertTransactionsBatch(userId, emailCredits);
    }

    return {
      syncedCount: emailCredits.length,
      credits: emailCredits,
    };
  },

  async getRetirementParams(userId?: string) {
    const raw = await financeRepository.getRetirementParams(userId);
    return {
      age: Number(raw.age),
      retire: Number(raw.retire_age),
      corpus: Number(raw.target_corpus),
      sip: Number(raw.current_sip),
      returnRate: Number(raw.return_rate),
      inflation: Number(raw.inflation_rate),
    };
  },

  async updateRetirementParams(userId: string | undefined, params: any) {
    const raw = await financeRepository.upsertRetirementParams(userId, params);
    return {
      age: Number(raw.age),
      retire: Number(raw.retire_age),
      corpus: Number(raw.target_corpus),
      sip: Number(raw.current_sip),
      returnRate: Number(raw.return_rate),
      inflation: Number(raw.inflation_rate),
    };
  },

  async getAllRecords(userId?: string) {
    await financeRepository.seedInitialIfEmpty(userId);
    const raw = await financeRepository.getAllRecords(userId);
    
    // Group records by category tuple [title, masked, detail, docName]
    const grouped: Record<string, [string, string, string, string][]> = {
      Accounts: [],
      'Credit cards': [],
      Insurance: [],
      Loans: [],
      Lockers: [],
      Credentials: [],
    };

    for (const r of raw) {
      if (!grouped[r.category]) {
        grouped[r.category] = [];
      }
      grouped[r.category].push([
        r.title,
        r.masked_identifier,
        r.detail,
        r.document_name,
      ]);
    }

    return grouped;
  },

  async createRecord(userId: string | undefined, data: any) {
    return financeRepository.createRecord(userId, data);
  },

  async attachDocumentToRecord(id: string, userId: string | undefined, docName: string, docUrl?: string) {
    return financeRepository.attachDocumentToRecord(id, userId, docName, docUrl);
  },

  async deleteRecord(id: string, userId?: string) {
    return financeRepository.deleteRecord(id, userId);
  },
};
