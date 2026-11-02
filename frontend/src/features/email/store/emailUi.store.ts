import { create } from 'zustand';
import { EmailTab } from '../types/email.types';

interface EmailUiState {
  mailTab: EmailTab;
  selectedEmailId: string | null;
  selectedProposalId: string | null;
  mailDrafts: Record<string, string>;
  mailStatus: Record<string, string>;
  reviewStatus: Record<string, 'approved' | 'dismissed'>;
  approvedTasks: string[];

  setMailTab: (tab: EmailTab) => void;
  openEmail: (id: string | null) => void;
  openProposal: (id: string | null) => void;
  saveDraft: (emailId: string, text: string) => void;
  proposeArchive: (emailId: string) => void;
  approveProposal: (proposalId: string) => boolean; // returns false if duplicate
  dismissProposal: (proposalId: string) => void;
}

export const useEmailUiStore = create<EmailUiState>((set, get) => ({
  mailTab: 'priority',
  selectedEmailId: null,
  selectedProposalId: null,
  mailDrafts: {},
  mailStatus: {},
  reviewStatus: {},
  approvedTasks: [],

  setMailTab: (tab) => set({ mailTab: tab }),

  openEmail: (id) => set({ selectedEmailId: id }),

  openProposal: (id) => set({ selectedProposalId: id }),

  saveDraft: (emailId, text) =>
    set((state) => ({
      mailDrafts: { ...state.mailDrafts, [emailId]: text },
      mailStatus: { ...state.mailStatus, [emailId]: 'Draft saved locally' },
    })),

  proposeArchive: (emailId) =>
    set((state) => ({
      mailStatus: { ...state.mailStatus, [emailId]: 'Archive proposed (demo)' },
    })),

  approveProposal: (proposalId) => {
    const state = get();
    if (state.approvedTasks.includes(proposalId)) {
      return false; // Duplicate blocked!
    }
    set({
      approvedTasks: [...state.approvedTasks, proposalId],
      reviewStatus: { ...state.reviewStatus, [proposalId]: 'approved' },
    });
    return true;
  },

  dismissProposal: (proposalId) =>
    set((state) => ({
      reviewStatus: { ...state.reviewStatus, [proposalId]: 'dismissed' },
    })),
}));
