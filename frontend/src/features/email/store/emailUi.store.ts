import { create } from 'zustand';
import { Linking, Platform, NativeModules } from 'react-native';
import { EmailItem, EmailTab, ProposalItem } from '../types/email.types';
import { emailApi, EmailSummaryResponse, ConnectedEmailAccount } from '../services/email.api';
import mockData from '../mock/email.mock.json';
import { useCalendarStore } from '../../calendar/calendar.store';

interface EmailUiState {
  mailTab: EmailTab;
  selectedEmailId: string | null;
  selectedProposalId: string | null;

  // Data
  emails: EmailItem[];
  summary: EmailSummaryResponse;
  proposals: Record<string, ProposalItem>;

  // Connection
  isConnected: boolean;
  connectedEmail: string | null;
  connectedAccounts: ConnectedEmailAccount[];
  selectedAccountEmail: string | 'all';

  // Loading
  isLoading: boolean;
  isSyncing: boolean;

  // Local overrides
  mailDrafts: Record<string, string>;
  mailStatus: Record<string, string>;
  reviewStatus: Record<string, 'approved' | 'dismissed'>;
  approvedTasks: string[];

  // Setters & Sheets
  setMailTab: (tab: EmailTab) => void;
  setSelectedAccountEmail: (email: string | 'all') => void;
  openEmail: (id: string | null) => void;
  openProposal: (id: string | null) => void;

  // API Actions
  fetchEmails: (tab?: EmailTab, accountEmail?: string | 'all') => Promise<void>;
  fetchSummary: (accountEmail?: string | 'all') => Promise<void>;
  checkOAuthStatus: () => Promise<void>;
  connectGmail: () => Promise<void>;
  connectWithCode: (input: string) => Promise<boolean>;
  disconnectGmail: (email?: string) => Promise<void>;
  syncEmails: (options?: { silent?: boolean }) => Promise<{ synced: number; totalChecked: number } | null>;
  saveDraft: (emailId: string, text: string) => Promise<void>;
  generateDraft: (emailId: string, instruction?: string) => Promise<string>;
  sendReply: (emailId: string, body: string) => Promise<{ success: boolean; message: string }>;
  proposeArchive: (emailId: string) => Promise<void>;
  fetchProposal: (idOrEmailId: string) => Promise<ProposalItem | null>;
  approveProposal: (
    proposalId: string,
    data: { title: string; start: string; end: string; detail: string }
  ) => Promise<boolean>;
  dismissProposal: (proposalId: string) => Promise<void>;
}

// Initial mock proposals map
const initialProposalsMap: Record<string, ProposalItem> = {};
(mockData.proposals as ProposalItem[]).forEach((p) => {
  initialProposalsMap[p.id] = p;
});

export const useEmailUiStore = create<EmailUiState>((set, get) => ({
  mailTab: 'priority',
  selectedEmailId: null,
  selectedProposalId: null,

  emails: mockData.emails as EmailItem[],
  summary: { requests: 3, lowSignal: 1, mergedMeetings: 2, connected: false, email: null },
  proposals: initialProposalsMap,

  isConnected: false,
  connectedEmail: null,
  connectedAccounts: [],
  selectedAccountEmail: 'all',
  isLoading: false,
  isSyncing: false,

  mailDrafts: {},
  mailStatus: {},
  reviewStatus: {},
  approvedTasks: [],

  setMailTab: (tab) => {
    set({ mailTab: tab });
    get().fetchEmails(tab);
  },

  setSelectedAccountEmail: (email) => {
    set({ selectedAccountEmail: email });
    get().fetchEmails(get().mailTab, email);
    get().fetchSummary(email);
  },

  openEmail: (id) => set({ selectedEmailId: id }),

  openProposal: (id) => set({ selectedProposalId: id }),

  fetchEmails: async (tab, accountEmail) => {
    const currentTab = tab || get().mailTab;
    const currentAccount = accountEmail !== undefined ? accountEmail : get().selectedAccountEmail;
    try {
      set({ isLoading: true });
      const data = await emailApi.listEmails(currentTab, currentAccount);
      if (Array.isArray(data) && data.length > 0) {
        const seenIds = new Set<string>();
        const uniqueEmails = data.filter((item) => {
          if (!item.id || seenIds.has(item.id)) return false;
          seenIds.add(item.id);
          return true;
        });
        set({ emails: uniqueEmails });
      } else if (!get().isConnected) {
        // If not connected and no DB rows, keep mock data visible
        set({ emails: mockData.emails as EmailItem[] });
      } else {
        set({ emails: [] });
      }
    } catch (err) {
      console.warn('Failed to fetch emails from API, using fallback:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSummary: async (accountEmail) => {
    const currentAccount = accountEmail !== undefined ? accountEmail : get().selectedAccountEmail;
    try {
      const summary = await emailApi.getSummary(currentAccount);
      const accounts = summary.accounts || (summary.email ? [{ id: '1', email: summary.email }] : []);
      set({
        summary,
        isConnected: Boolean(summary.connected),
        connectedEmail: summary.email || null,
        connectedAccounts: accounts,
      });
    } catch (err) {
      console.warn('Failed to fetch summary from API:', err);
    }
  },

  checkOAuthStatus: async () => {
    try {
      const status = await emailApi.getOAuthStatus();
      const accounts = status.accounts || (status.email ? [{ id: '1', email: status.email }] : []);
      set({
        isConnected: status.connected,
        connectedEmail: status.email,
        connectedAccounts: accounts,
      });
    } catch (err) {
      console.warn('Failed to check OAuth status:', err);
    }
  },

  connectGmail: async () => {
    try {
      const url = await emailApi.getOAuthUrl();
      const isWeb = (Platform.OS as string) === 'web';

      if (isWeb && typeof window !== 'undefined') {
        const width = 500;
        const height = 650;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(
          url,
          'Gmail OAuth Authorization',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
        );

        let cleanedUp = false;
        let pollTimer: NodeJS.Timeout | null = null;
        let maxTimeout: NodeJS.Timeout | null = null;
        let bc: BroadcastChannel | null = null;

        const handleSuccess = async () => {
          if (cleanedUp) return;
          cleanup();
          await get().checkOAuthStatus();
          await get().fetchSummary();
          await get().fetchEmails();
        };

        const cleanup = () => {
          cleanedUp = true;
          if (pollTimer) clearInterval(pollTimer);
          if (maxTimeout) clearTimeout(maxTimeout);
          try {
            bc?.close();
          } catch {}
          window.removeEventListener('storage', onStorage);
          window.removeEventListener('message', onMessage);
          window.removeEventListener('focus', onFocus);
        };

        // 1. BroadcastChannel
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            bc = new BroadcastChannel('nryn_oauth');
            bc.onmessage = (ev) => {
              if (ev.data?.type === 'GMAIL_CONNECTED') {
                handleSuccess();
              }
            };
          }
        } catch {}

        // 2. Storage event
        const onStorage = (ev: StorageEvent) => {
          if (ev.key === 'nryn_gmail_connected') {
            handleSuccess();
          }
        };
        window.addEventListener('storage', onStorage);

        // 3. PostMessage event
        const onMessage = (ev: MessageEvent) => {
          if (ev.data?.type === 'GMAIL_CONNECTED') {
            handleSuccess();
          }
        };
        window.addEventListener('message', onMessage);

        // 4. Focus event
        const onFocus = async () => {
          const status = await emailApi.getOAuthStatus().catch(() => null);
          if (status?.connected) {
            handleSuccess();
          }
        };
        window.addEventListener('focus', onFocus);

        // 5. Periodic status poll against backend API (never touches popup object)
        pollTimer = setInterval(async () => {
          try {
            const status = await emailApi.getOAuthStatus();
            if (status.connected) {
              handleSuccess();
            }
          } catch {}
        }, 2000);

        // 6. Stop polling after 60s
        maxTimeout = setTimeout(() => {
          cleanup();
        }, 60000);
      } else {
        if (Platform.OS === 'android' && NativeModules.OAuthServer) {
          try {
            await NativeModules.OAuthServer.startServer();
          } catch (e) {
            console.warn('[OAuthServer] start failed:', e);
          }
        }
        await Linking.openURL(url);
      }
    } catch (err) {
      console.error('Failed to initiate Gmail OAuth:', err);
    }
  },

  connectWithCode: async (input: string) => {
    try {
      set({ isLoading: true });
      let code = input.trim();
      let state = await getDeviceUserId();

      if (code.includes('code=')) {
        const matchCode = code.match(/code=([^&]+)/);
        if (matchCode) code = decodeURIComponent(matchCode[1]);
        const matchState = input.match(/state=([^&]+)/);
        if (matchState) state = decodeURIComponent(matchState[1]);
      }

      await emailApi.exchangeOAuthCode(code, state);
      await get().checkOAuthStatus();
      await get().fetchSummary();
      await get().fetchEmails();
      await get().syncEmails({ silent: false }).catch(() => {});
      return true;
    } catch (err: any) {
      console.warn('connectWithCode failed:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  disconnectGmail: async (email?: string) => {
    try {
      set({ isLoading: true });
      await emailApi.disconnectOAuth(email);
      await get().checkOAuthStatus();
      await get().fetchSummary();
      await get().fetchEmails();

      if (!get().isConnected) {
        set({
          connectedEmail: null,
          connectedAccounts: [],
          emails: mockData.emails as EmailItem[],
          summary: { requests: 3, lowSignal: 1, mergedMeetings: 2, connected: false, email: null },
          mailDrafts: {},
          mailStatus: {},
        });
      }

      // Broadcast to other windows/tabs
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          const bc = new BroadcastChannel('nryn_oauth');
          bc.postMessage({ type: 'GMAIL_DISCONNECTED' });
        } catch (e) {}
        try {
          localStorage.setItem('nryn_gmail_disconnected', String(Date.now()));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Failed to disconnect Gmail:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  syncEmails: async (options?: { silent?: boolean }) => {
    if (!get().isConnected) {
      return null;
    }
    try {
      if (!options?.silent) {
        set({ isSyncing: true });
      }
      const res = await emailApi.syncEmails(15);
      // Refresh emails and summary
      await Promise.all([get().fetchEmails(), get().fetchSummary()]);
      return res.result;
    } catch (err: any) {
      if (!options?.silent) {
        console.error('Failed to sync emails:', err);
      }
      const msg = err.response?.data?.error || err.message || 'Sync failed';
      if (!options?.silent) {
        throw new Error(msg);
      }
      return null;
    } finally {
      if (!options?.silent) {
        set({ isSyncing: false });
      }
    }
  },

  saveDraft: async (emailId, text) => {
    set((state) => ({
      mailDrafts: { ...state.mailDrafts, [emailId]: text },
      mailStatus: { ...state.mailStatus, [emailId]: 'Draft saved locally' },
    }));

    try {
      await emailApi.saveDraft(emailId, text);
    } catch (err) {
      console.warn('Could not persist draft to backend:', err);
    }
  },

  generateDraft: async (emailId, instruction) => {
    try {
      const email = get().emails.find((e) => e.id === emailId);
      const res = await emailApi.generateDraft(emailId, {
        instruction,
        subject: email?.subject,
        content: email?.content,
        fromName: email?.name,
      });
      if (res?.draft) {
        set((state) => ({
          mailDrafts: { ...state.mailDrafts, [emailId]: res.draft },
          mailStatus: { ...state.mailStatus, [emailId]: 'AI Draft generated' },
        }));
        return res.draft;
      }
      return '';
    } catch (err: any) {
      console.warn('Could not generate draft from backend:', err);
      const email = get().emails.find((e) => e.id === emailId);
      const fallback = `Thank you for reaching out regarding "${email?.subject || 'your email'}". I have reviewed the details and will follow up shortly.`;
      set((state) => ({
        mailDrafts: { ...state.mailDrafts, [emailId]: fallback },
        mailStatus: { ...state.mailStatus, [emailId]: 'Draft saved locally' },
      }));
      return fallback;
    }
  },

  sendReply: async (emailId, body) => {
    try {
      const res = await emailApi.sendReply(emailId, body);
      set((state) => ({
        mailStatus: { ...state.mailStatus, [emailId]: 'Replied via Gmail' },
      }));
      return res;
    } catch (err: any) {
      console.error('Failed to send reply:', err);
      throw new Error(err.response?.data?.error || err.message || 'Failed to send reply');
    }
  },

  proposeArchive: async (emailId) => {
    set((state) => ({
      mailStatus: { ...state.mailStatus, [emailId]: 'Archive proposed (demo)' },
    }));

    try {
      await emailApi.archiveEmail(emailId);
    } catch (err) {
      console.warn('Could not mark archive on backend:', err);
    }
  },

  fetchProposal: async (idOrEmailId) => {
    // 1. Check local cache
    const existing = get().proposals[idOrEmailId];
    if (existing) return existing;

    // 2. Fetch from API
    try {
      const proposal = await emailApi.getProposal(idOrEmailId);
      if (proposal) {
        set((state) => ({
          proposals: { ...state.proposals, [proposal.id]: proposal, [idOrEmailId]: proposal },
        }));
        return proposal;
      }
    } catch (err) {
      console.warn(`Could not load proposal for ${idOrEmailId}:`, err);
    }
    return null;
  },

  approveProposal: async (proposalId, data) => {
    const state = get();
    if (state.approvedTasks.includes(proposalId)) {
      return false; // Duplicate blocked!
    }

    set({
      approvedTasks: [...state.approvedTasks, proposalId],
      reviewStatus: { ...state.reviewStatus, [proposalId]: 'approved' },
    });

    // 1. Call Backend API
    try {
      await emailApi.approveProposal(proposalId, data);
    } catch (err: any) {
      if (err.response?.status === 409) {
        return false;
      }
      console.warn('Backend approval request notice:', err);
    }

    // 2. Directly add event to Calendar Store for 24-hr Rolling Clock
    try {
      useCalendarStore.getState().addEvent({
        title: data.title,
        subtitle: data.detail || 'From approved proposal',
        start: data.start,
        end: data.end,
        cat: 'peach',
        kind: 'work',
      });
    } catch (calErr) {
      console.warn('Failed to insert into calendar store:', calErr);
    }

    return true;
  },

  dismissProposal: async (proposalId) => {
    set((state) => ({
      reviewStatus: { ...state.reviewStatus, [proposalId]: 'dismissed' },
    }));

    try {
      await emailApi.dismissProposal(proposalId);
    } catch (err) {
      console.warn('Backend dismiss notice:', err);
    }
  },
}));

// Listen for cross-window messages on web when OAuth completes
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const refreshAll = () => {
    useEmailUiStore.getState().checkOAuthStatus();
    useEmailUiStore.getState().fetchSummary();
    useEmailUiStore.getState().fetchEmails();
  };

  if (window.addEventListener) {
    // 1. window message event
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'GMAIL_CONNECTED' || event.data?.type === 'GMAIL_DISCONNECTED') {
        refreshAll();
      }
    });

    // 2. localStorage storage event (fired across tabs/windows)
    window.addEventListener('storage', (event) => {
      if (event.key === 'nryn_gmail_connected' || event.key === 'nryn_gmail_disconnected') {
        refreshAll();
      }
    });
  }

  // 3. BroadcastChannel (modern standard for inter-window communication)
  try {
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel('nryn_oauth');
      bc.onmessage = (event) => {
        if (event.data?.type === 'GMAIL_CONNECTED' || event.data?.type === 'GMAIL_DISCONNECTED') {
          refreshAll();
        }
      };
    }
  } catch (e) {}
}
