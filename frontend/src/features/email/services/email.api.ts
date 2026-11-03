import { apiClient } from '../../../shared/api/client';
import { EmailItem, ProposalItem } from '../types/email.types';

export interface EmailSummaryResponse {
  requests: number;
  lowSignal: number;
  mergedMeetings: number;
  connected?: boolean;
  email?: string | null;
}

export interface OAuthStatusResponse {
  connected: boolean;
  email: string | null;
  updatedAt?: string | null;
}

export interface SyncResponse {
  message: string;
  result: {
    synced: number;
    totalChecked: number;
  };
}

export const emailApi = {
  async getOAuthUrl(): Promise<string> {
    const res = await apiClient.get<{ url: string }>('/email/oauth/auth-url');
    return res.data.url;
  },

  async getOAuthStatus(): Promise<OAuthStatusResponse> {
    const res = await apiClient.get<OAuthStatusResponse>('/email/oauth/status');
    return res.data;
  },

  async disconnectOAuth(): Promise<{ success: boolean }> {
    const res = await apiClient.post<{ success: boolean }>('/email/oauth/disconnect');
    return res.data;
  },

  async syncEmails(maxResults = 15): Promise<SyncResponse> {
    const res = await apiClient.post<SyncResponse>('/email/sync', { maxResults });
    return res.data;
  },

  async getSummary(): Promise<EmailSummaryResponse> {
    const res = await apiClient.get<EmailSummaryResponse>('/email/summary');
    return res.data;
  },

  async listEmails(tab?: string): Promise<EmailItem[]> {
    const params = tab ? { tab } : {};
    const res = await apiClient.get<EmailItem[]>('/email', { params });
    return res.data;
  },

  async saveDraft(emailId: string, body: string) {
    const res = await apiClient.put(`/email/${emailId}/draft`, { body });
    return res.data;
  },

  async generateDraft(emailId: string, instruction?: string): Promise<{ draft: string }> {
    const res = await apiClient.post<{ draft: string }>(`/email/${emailId}/generate-draft`, { instruction });
    return res.data;
  },

  async sendReply(emailId: string, body: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post<{ success: boolean; message: string }>(`/email/${emailId}/send`, { body });
    return res.data;
  },

  async archiveEmail(emailId: string) {
    const res = await apiClient.post(`/email/${emailId}/archive`);
    return res.data;
  },

  async getProposal(idOrEmailId: string): Promise<ProposalItem> {
    const res = await apiClient.get<ProposalItem>(`/email/${idOrEmailId}/proposal`);
    return res.data;
  },

  async approveProposal(
    proposalId: string,
    data: { title: string; start: string; end: string; detail: string }
  ) {
    const res = await apiClient.post(`/email/proposals/${proposalId}/approve`, data);
    return res.data;
  },

  async dismissProposal(proposalId: string) {
    const res = await apiClient.post(`/email/proposals/${proposalId}/dismiss`);
    return res.data;
  },
};
