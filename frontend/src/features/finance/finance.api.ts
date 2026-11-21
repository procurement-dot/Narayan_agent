import { apiClient } from '../../shared/api/client';
import { FinanceAsset, FinanceLoan, RecordItem, RetirementParams } from './finance.types';
import { ParsedBankTransaction } from './sms/sms.types';

export interface FinanceOverviewData {
  netWorth: number;
  stats: {
    propertyLandTotal: number;
    investmentsTotal: number;
    lendingTotal: number;
    monthlyRentGap: number;
    monthlyRentExpected: number;
    monthlyRentReceived: number;
  };
  cashFlowSeries: number[];
  assetsCount: number;
  loansCount: number;
  transactionsCount: number;
  retirement: RetirementParams;
}

export const financeApi = {
  async getOverview(): Promise<FinanceOverviewData> {
    const res = await apiClient.get<FinanceOverviewData>('/finance/overview');
    return res.data;
  },

  async getAssets(): Promise<FinanceAsset[]> {
    const res = await apiClient.get<FinanceAsset[]>('/finance/assets');
    return res.data;
  },

  async createAsset(asset: Partial<FinanceAsset>): Promise<FinanceAsset> {
    const res = await apiClient.post<FinanceAsset>('/finance/assets', asset);
    return res.data;
  },

  async updateAssetRent(id: string, status: string, receivedRent?: number): Promise<any> {
    const res = await apiClient.put(`/finance/assets/${id}/rent`, { status, receivedRent });
    return res.data;
  },

  async deleteAsset(id: string): Promise<{ success: boolean; id: string }> {
    const res = await apiClient.delete(`/finance/assets/${id}`);
    return res.data;
  },

  async getLoans(): Promise<FinanceLoan[]> {
    const res = await apiClient.get<FinanceLoan[]>('/finance/loans');
    return res.data;
  },

  async createLoan(loan: Partial<FinanceLoan>): Promise<FinanceLoan> {
    const res = await apiClient.post<FinanceLoan>('/finance/loans', loan);
    return res.data;
  },

  async toggleLoanPaid(id: string): Promise<{ id: string; paid: boolean }> {
    const res = await apiClient.patch(`/finance/loans/${id}/toggle-paid`);
    return res.data;
  },

  async deleteLoan(id: string): Promise<{ success: boolean; id: string }> {
    const res = await apiClient.delete(`/finance/loans/${id}`);
    return res.data;
  },

  async syncSmsBatch(transactions: ParsedBankTransaction[]): Promise<{ syncedCount: number; totalReceived: number }> {
    const res = await apiClient.post('/finance/sms/sync', { transactions });
    return res.data;
  },

  async syncEmailCredits(): Promise<{ success: boolean; syncedCount: number; credits: ParsedBankTransaction[] }> {
    const res = await apiClient.post('/finance/email/sync');
    return res.data;
  },

  async getTransactions(type?: string, limit = 100): Promise<ParsedBankTransaction[]> {
    const res = await apiClient.get<ParsedBankTransaction[]>('/finance/sms/transactions', {
      params: { type, limit },
    });
    return res.data;
  },

  async getRetirement(): Promise<RetirementParams> {
    const res = await apiClient.get<RetirementParams>('/finance/retirement');
    return res.data;
  },

  async updateRetirement(params: Partial<RetirementParams>): Promise<RetirementParams> {
    const res = await apiClient.put<RetirementParams>('/finance/retirement', params);
    return res.data;
  },

  async getRecords(): Promise<Record<string, RecordItem[]>> {
    const res = await apiClient.get<Record<string, RecordItem[]>>('/finance/records');
    return res.data;
  },

  async createRecord(payload: {
    category: string;
    title: string;
    maskedIdentifier: string;
    detail: string;
    documentName?: string;
  }): Promise<any> {
    const res = await apiClient.post('/finance/records', payload);
    return res.data;
  },

  async attachDocument(id: string, documentName: string, documentUrl?: string): Promise<any> {
    const res = await apiClient.post(`/finance/records/${id}/attach`, { documentName, documentUrl });
    return res.data;
  },
};
