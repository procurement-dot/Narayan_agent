import { apiClient } from '../../../shared/api/client';
import {
  WorkOverviewData,
  WorkProject,
  WorkInvoice,
  WorkDeal,
  WorkTeamOps,
  WorkEASignal,
  WorkExternalApp,
} from '../work.types';

export const workApi = {
  // Overview
  async getOverview(): Promise<WorkOverviewData> {
    const res = await apiClient.get('/work/overview');
    return res.data?.data;
  },

  // Projects
  async getProjects(): Promise<WorkProject[]> {
    const res = await apiClient.get('/work/projects');
    return res.data?.data || [];
  },

  async getProject(id: string): Promise<WorkProject> {
    const res = await apiClient.get(`/work/projects/${id}`);
    return res.data?.data;
  },

  async createProject(payload: {
    name: string;
    subtitle?: string;
    tag?: string;
    next_action?: string;
    tasks?: string[];
  }): Promise<WorkProject> {
    const res = await apiClient.post('/work/projects', payload);
    return res.data?.data;
  },

  async addTask(projectId: string, title: string): Promise<WorkProject> {
    const res = await apiClient.post(`/work/projects/${projectId}/tasks`, { title });
    return res.data?.data;
  },

  async toggleTask(projectId: string, taskId: string): Promise<WorkProject> {
    const res = await apiClient.patch(`/work/projects/${projectId}/tasks/${taskId}/toggle`);
    return res.data?.data;
  },

  // Finance
  async getFinanceSummary(): Promise<{
    revenue: string;
    grossMargin: string;
    monthlyPayroll: string;
    collectionRisk: string;
    invoices: WorkInvoice[];
  }> {
    const res = await apiClient.get('/work/finance');
    return res.data?.data;
  },

  async createInvoice(payload: {
    invoice_number: string;
    client_name: string;
    vertical: string;
    amount: string;
    due_date: string;
    status?: 'pending' | 'overdue' | 'paid';
  }): Promise<WorkInvoice> {
    const res = await apiClient.post('/work/finance/invoices', payload);
    return res.data?.data;
  },

  async sendPaymentReminder(invoiceId: string): Promise<{
    invoice: WorkInvoice;
    messageDraft: string;
    status: string;
  }> {
    const res = await apiClient.post(`/work/finance/invoices/${invoiceId}/remind`);
    return res.data?.data;
  },

  // Sales
  async getSalesPipeline(): Promise<{
    pipelineTotal: string;
    activeDealsCount: number;
    deals: WorkDeal[];
  }> {
    const res = await apiClient.get('/work/sales');
    return res.data?.data;
  },

  async createDeal(payload: {
    client_name: string;
    deal_value: string;
    stage?: 'lead' | 'demo' | 'proposal' | 'negotiation' | 'won' | 'lost';
    contact_person?: string;
    notes?: string;
    next_action?: string;
  }): Promise<WorkDeal> {
    const res = await apiClient.post('/work/sales/deals', payload);
    return res.data?.data;
  },

  // HR
  async getTeamOps(): Promise<WorkTeamOps> {
    const res = await apiClient.get('/work/hr');
    return res.data?.data;
  },

  async resolveHRTicket(ticketId: string): Promise<WorkTeamOps> {
    const res = await apiClient.patch(`/work/hr/tickets/${ticketId}/resolve`);
    return res.data?.data;
  },

  // EA
  async getEASignals(): Promise<WorkEASignal[]> {
    const res = await apiClient.get('/work/ea/signals');
    return res.data?.data || [];
  },

  async resolveEASignal(id: string): Promise<WorkEASignal> {
    const res = await apiClient.patch(`/work/ea/signals/${id}/resolve`);
    return res.data?.data;
  },

  // External Apps
  async getExternalApps(): Promise<WorkExternalApp[]> {
    const res = await apiClient.get('/work/external-apps');
    return res.data?.data || [];
  },

  async updateExternalAppUrl(appKey: string, deployUrl: string, name?: string): Promise<WorkExternalApp> {
    const res = await apiClient.put(`/work/external-apps/${appKey}/url`, {
      deploy_url: deployUrl,
      name,
    });
    return res.data?.data;
  },
};
