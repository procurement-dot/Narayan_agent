import { apiClient } from '../../../shared/api/client';
import { getDeviceUserId } from '../../../shared/utils/deviceUser';
import { EmailItem, ProposalItem } from '../types/email.types';

export interface ConnectedEmailAccount {
  id: string;
  email: string;
  updatedAt?: string | null;
}

export interface EmailSummaryResponse {
  requests: number;
  lowSignal: number;
  mergedMeetings: number;
  connected?: boolean;
  email?: string | null;
  accounts?: ConnectedEmailAccount[];
}

export interface OAuthStatusResponse {
  connected: boolean;
  email: string | null;
  accounts?: ConnectedEmailAccount[];
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
    try {
      const userId = await getDeviceUserId();
      const clientId = '336166526092-k3p9s1nhskp3q23vdhsigl1vnbgit93s.apps.googleusercontent.com';
      const redirectUri = 'https://narayan-agent.onrender.com/api/email/oauth/callback';
      const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
      ].join(' ');

      const params = [
        `client_id=${encodeURIComponent(clientId)}`,
        `redirect_uri=${encodeURIComponent(redirectUri)}`,
        `response_type=code`,
        `scope=${encodeURIComponent(scopes)}`,
        `access_type=offline`,
        `prompt=${encodeURIComponent('consent select_account')}`,
        `state=${encodeURIComponent(userId || '00000000-0000-0000-0000-000000000001')}`,
      ].join('&');

      return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    } catch {
      const userId = '00000000-0000-0000-0000-000000000001';
      const res = await apiClient.get<{ url: string }>('/email/oauth/auth-url', {
        params: { userId },
      });
      return res.data.url;
    }
  },

  async getOAuthStatus(): Promise<OAuthStatusResponse> {
    const res = await apiClient.get<OAuthStatusResponse>('/email/oauth/status');
    return res.data;
  },

  async exchangeOAuthCode(code: string, state?: string): Promise<any> {
    const res = await apiClient.get('/email/oauth/callback', {
      params: { code, state },
    });
    return res.data;
  },

  async disconnectOAuth(email?: string): Promise<{ success: boolean }> {
    const res = await apiClient.post<{ success: boolean }>('/email/oauth/disconnect', { email });
    return res.data;
  },

  async syncEmails(maxResults = 15): Promise<SyncResponse> {
    const res = await apiClient.post<SyncResponse>(
      '/email/sync',
      { maxResults },
      { timeout: 120000 }
    );
    return res.data;
  },

  async getSummary(accountEmail?: string): Promise<EmailSummaryResponse> {
    const params: any = {};
    if (accountEmail && accountEmail !== 'all') {
      params.accountEmail = accountEmail;
    }
    const res = await apiClient.get<EmailSummaryResponse>('/email/summary', { params });
    return res.data;
  },

  async listEmails(tab?: string, accountEmail?: string): Promise<EmailItem[]> {
    const params: any = {};
    if (tab) params.tab = tab;
    if (accountEmail && accountEmail !== 'all') {
      params.accountEmail = accountEmail;
    }
    const res = await apiClient.get<EmailItem[]>('/email', { params });
    return res.data;
  },

  async saveDraft(emailId: string, body: string) {
    const res = await apiClient.put(`/email/${emailId}/draft`, { body });
    return res.data;
  },

  async generateDraft(
    emailId: string,
    options?: { instruction?: string; subject?: string; content?: string; fromName?: string }
  ): Promise<{ draft: string }> {
    const res = await apiClient.post<{ draft: string }>(
      `/email/${emailId}/generate-draft`,
      options || {},
      { timeout: 60000 }
    );
    return res.data;
  },

  async sendReply(emailId: string, body: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post<{ success: boolean; message: string }>(
      `/email/${emailId}/send`,
      { body },
      { timeout: 45000 }
    );
    return res.data;
  },

  async archiveEmail(emailId: string) {
    const res = await apiClient.post(`/email/${emailId}/archive`);
    return res.data;
  },

  async trashEmail(emailId: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post<{ success: boolean; message: string }>(
      `/email/${emailId}/trash`
    );
    return res.data;
  },

  async batchTrashEmails(
    emailIds: string[]
  ): Promise<{ success: boolean; deletedCount: number; message: string }> {
    const res = await apiClient.post<{ success: boolean; deletedCount: number; message: string }>(
      '/email/batch-trash',
      { emailIds }
    );
    return res.data;
  },

  async scanUnwanted(): Promise<{ success: boolean; taggedCount: number }> {
    const res = await apiClient.post<{ success: boolean; taggedCount: number }>(
      '/email/scan-unwanted'
    );
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
