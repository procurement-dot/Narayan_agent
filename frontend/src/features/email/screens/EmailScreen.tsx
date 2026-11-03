import React, { useMemo, useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { useToast } from '../../../shared/components/Toast';
import { useNavigationStore } from '../../navigation/navigation.store';
import { TOASTS } from '../constants';
import { useEmailUiStore } from '../store/emailUi.store';
import { emailStyles } from '../styles/email.styles';
import { filterByTab } from '../utils/filterByTab';

import { EmailDetailSheet } from '../components/EmailDetailSheet';
import { EmailHeader } from '../components/EmailHeader';
import { EmailRow } from '../components/EmailRow';
import { EmailSummaryCard } from '../components/EmailSummaryCard';
import { EmailTabs } from '../components/EmailTabs';
import { ProposalSheet } from '../components/ProposalSheet';
import { SourceActionsCard } from '../components/SourceActionsCard';
import { TrustFooter } from '../components/TrustFooter';
import { EmailConnectionBar } from '../components/EmailConnectionBar';

export const EmailScreen: React.FC = () => {
  const { showToast } = useToast();
  const { goBack } = useNavigationStore();
  const {
    mailTab,
    selectedEmailId,
    selectedProposalId,
    mailDrafts,
    mailStatus,
    emails,
    summary,
    proposals,
    setMailTab,
    openEmail,
    openProposal,
    fetchProposal,
    saveDraft,
    proposeArchive,
    approveProposal,
    dismissProposal,
    fetchEmails,
    fetchSummary,
    checkOAuthStatus,
    generateDraft,
    sendReply,
  } = useEmailUiStore();

  // Load initial data on screen mount
  useEffect(() => {
    checkOAuthStatus();
    fetchSummary();
    fetchEmails();
  }, []);

  // Filter emails based on the active tab
  const displayedEmails = useMemo(() => {
    return filterByTab(emails, mailTab, mailDrafts);
  }, [emails, mailTab, mailDrafts]);

  // Active email for detail sheet
  const activeEmail = useMemo(() => {
    return emails.find((e) => e.id === selectedEmailId) || null;
  }, [emails, selectedEmailId]);

  // Active proposal for proposal sheet
  const activeProposal = useMemo(() => {
    if (!selectedProposalId) return null;
    return proposals[selectedProposalId] || null;
  }, [proposals, selectedProposalId]);

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

  const handleSendReply = async (emailId: string, draftText: string) => {
    try {
      showToast('Sending reply via Gmail...', 'success');
      const res = await sendReply(emailId, draftText);
      openEmail(null);
      showToast(res.message || 'Reply sent successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to send reply', 'warning');
    }
  };

  const handleGenerateDraft = async (emailId: string) => {
    try {
      const generated = await generateDraft(emailId);
      showToast('AI draft generated with Gemini', 'success');
      return generated;
    } catch (err: any) {
      showToast(err.message || 'Could not generate draft', 'warning');
      return '';
    }
  };

  const handleReviewActionFromMail = async (emailId: string) => {
    openEmail(null);

    // 1. Check if email has direct proposalId
    if (activeEmail?.proposalId) {
      await fetchProposal(activeEmail.proposalId);
      openProposal(activeEmail.proposalId);
      return;
    }

    // 2. Check mock mapping fallback
    const mockMapping: Record<string, string> = {
      e1: 'akc',
      e2: 'manjalpur',
      e4: 'quotation',
    };
    const mappedId = mockMapping[emailId];
    if (mappedId) {
      openProposal(mappedId);
      return;
    }

    // 3. Try to fetch from backend by email ID
    const p = await fetchProposal(emailId);
    if (p) {
      openProposal(p.id);
    } else {
      showToast('No extracted action proposal found for this email.', 'warning');
    }
  };

  const handleApproveProposal = async (
    proposalId: string,
    data: { title: string; start: string; end: string; detail: string }
  ) => {
    if (!data.title.trim() || !data.start || !data.end || data.end <= data.start) {
      showToast(TOASTS.validationError, 'warning');
      return;
    }

    const isNew = await approveProposal(proposalId, data);
    openProposal(null);

    if (isNew) {
      showToast(TOASTS.approved, 'success');
    } else {
      showToast(TOASTS.duplicate, 'warning');
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

        {/* Gmail OAuth 2.0 Connection Bar */}
        <EmailConnectionBar />

        {/* Intelligence Summary Card */}
        <EmailSummaryCard
          requestsCount={summary.requests}
          lowSignalCount={summary.lowSignal}
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
              <Text style={emailStyles.emptyText}>
                {mailTab === 'priority'
                  ? 'No action-required requests found in your recent emails. Tap "All email" or "Low signal" above to see all synced messages.'
                  : mailTab === 'meetings'
                  ? 'No meeting requests found. Tap "All email" to view all synced messages.'
                  : 'Nothing in this view.'}
              </Text>
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
        onSendReply={handleSendReply}
        onGenerateDraft={handleGenerateDraft}
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
