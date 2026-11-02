import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { useToast } from '../../../shared/components/Toast';
import { useNavigationStore } from '../../navigation/navigation.store';
import { TOASTS } from '../constants';
import mockData from '../mock/email.mock.json';
import { useEmailUiStore } from '../store/emailUi.store';
import { emailStyles } from '../styles/email.styles';
import { EmailItem, ProposalItem } from '../types/email.types';
import { filterByTab } from '../utils/filterByTab';

import { EmailDetailSheet } from '../components/EmailDetailSheet';
import { EmailHeader } from '../components/EmailHeader';
import { EmailRow } from '../components/EmailRow';
import { EmailSummaryCard } from '../components/EmailSummaryCard';
import { EmailTabs } from '../components/EmailTabs';
import { ProposalSheet } from '../components/ProposalSheet';
import { SourceActionsCard } from '../components/SourceActionsCard';
import { TrustFooter } from '../components/TrustFooter';

export const EmailScreen: React.FC = () => {
  const { showToast } = useToast();
  const { goBack } = useNavigationStore();
  const {
    mailTab,
    selectedEmailId,
    selectedProposalId,
    mailDrafts,
    mailStatus,
    setMailTab,
    openEmail,
    openProposal,
    saveDraft,
    proposeArchive,
    approveProposal,
    dismissProposal,
  } = useEmailUiStore();

  const allEmails = mockData.emails as EmailItem[];
  const allProposals = mockData.proposals as ProposalItem[];

  // Filter emails based on the active tab
  const displayedEmails = useMemo(() => {
    return filterByTab(allEmails, mailTab, mailDrafts);
  }, [allEmails, mailTab, mailDrafts]);

  // Active email for detail sheet
  const activeEmail = useMemo(() => {
    return allEmails.find((e) => e.id === selectedEmailId) || null;
  }, [allEmails, selectedEmailId]);

  // Active proposal for proposal sheet
  const activeProposal = useMemo(() => {
    return allProposals.find((p) => p.id === selectedProposalId) || null;
  }, [allProposals, selectedProposalId]);

  // Handlers
  const handleSaveDraft = (emailId: string, draftText: string) => {
    saveDraft(emailId, draftText);
    openEmail(null);
    showToast(TOASTS.draftSaved);
  };

  const handleArchive = (emailId: string) => {
    proposeArchive(emailId);
    openEmail(null);
    showToast(TOASTS.archiveProposed);
  };

  const handleReviewActionFromMail = (emailId: string) => {
    openEmail(null);
    // In mock, e1 -> akc, e2 -> manjalpur, e4 -> quotation
    const mapping: Record<string, string> = {
      e1: 'akc',
      e2: 'manjalpur',
      e4: 'quotation',
    };
    const proposalId = mapping[emailId];
    if (proposalId) {
      openProposal(proposalId);
    }
  };

  const handleApproveProposal = (
    proposalId: string,
    data: { title: string; start: string; end: string; detail: string }
  ) => {
    if (!data.title.trim() || !data.start || !data.end || data.end <= data.start) {
      showToast(TOASTS.validationError);
      return;
    }

    const isNew = approveProposal(proposalId);
    openProposal(null);

    if (isNew) {
      showToast(TOASTS.approved);
    } else {
      showToast(TOASTS.duplicate);
    }
  };

  const handleDismissProposal = (proposalId: string) => {
    dismissProposal(proposalId);
    openProposal(null);
    showToast(TOASTS.dismissed);
  };

  return (
    <View style={emailStyles.container}>
      <ScrollView
        contentContainerStyle={emailStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <EmailHeader onBack={goBack} />

        {/* Intelligence Summary Card */}
        <EmailSummaryCard
          requestsCount={3}
          lowSignalCount={1}
          onReviewActions={() => openProposal('akc')}
        />

        {/* Tabs */}
        <EmailTabs activeTab={mailTab} onSelectTab={setMailTab} />

        {/* Email Rows List Card */}
        <Card>
          {displayedEmails.length > 0 ? (
            displayedEmails.map((email, index) => (
              <EmailRow
                key={email.id}
                email={email}
                statusOverride={mailStatus[email.id]}
                isLast={index === displayedEmails.length - 1}
                onOpen={() => openEmail(email.id)}
              />
            ))
          ) : (
            <View style={emailStyles.emptyContainer}>
              <Text style={emailStyles.emptyText}>Nothing in this sample view.</Text>
            </View>
          )}
        </Card>

        {/* Source Aware Actions Card */}
        <SourceActionsCard />

        {/* Trust Footer */}
        <TrustFooter />
      </ScrollView>

      {/* Email Detail Bottom Sheet */}
      <EmailDetailSheet
        visible={Boolean(selectedEmailId)}
        email={activeEmail}
        savedDraft={activeEmail ? mailDrafts[activeEmail.id] : undefined}
        onClose={() => openEmail(null)}
        onSaveDraft={handleSaveDraft}
        onArchive={handleArchive}
        onReviewAction={handleReviewActionFromMail}
      />

      {/* Proposal Bottom Sheet */}
      <ProposalSheet
        visible={Boolean(selectedProposalId)}
        proposal={activeProposal}
        onClose={() => openProposal(null)}
        onDismiss={handleDismissProposal}
        onApprove={handleApproveProposal}
      />
    </View>
  );
};
