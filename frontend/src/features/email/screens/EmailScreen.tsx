import React, { useMemo, useEffect } from 'react';
import { ScrollView, Text, View, Platform, AppState, Linking, DeviceEventEmitter, NativeModules } from 'react-native';
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
    syncEmails,
    isConnected,
    selectedAccountEmail,
    setSelectedAccountEmail,
  } = useEmailUiStore();

  // Load initial data and run real-time auto-sync
  useEffect(() => {
    checkOAuthStatus();
    fetchSummary();
    fetchEmails();

    // Instant silent sync on mount
    syncEmails({ silent: true }).catch(() => {});

    // Periodic auto-sync every 10 seconds so any incoming email appears immediately
    const pollTimer = setInterval(() => {
      syncEmails({ silent: true })
        .then((res) => {
          if (res && res.synced > 0) {
            showToast(`New email received: ${res.synced} new message${res.synced > 1 ? 's' : ''}`, 'info');
          }
        })
        .catch(() => {});
    }, 10000);

    // Refresh when app comes back to foreground (e.g. after OAuth redirect on mobile)
    const appStateSub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        checkOAuthStatus();
        fetchSummary();
        fetchEmails();
        syncEmails({ silent: true }).catch(() => {});

        // Auto-detect OAuth link if user copied it from Chrome address bar
        if (Platform.OS === 'android' && NativeModules.OAuthServer?.getClipboardText && !isConnected) {
          try {
            const clip: string = await NativeModules.OAuthServer.getClipboardText();
            if (clip && (clip.includes('code=') || clip.includes('/api/email/oauth/callback'))) {
              showToast('OAuth link detected from clipboard! Connecting...', 'info');
              await useEmailUiStore.getState().connectWithCode(clip);
              showToast('Gmail connected successfully!', 'success');
            }
          } catch {}
        }
      }
    });

    // Handle in-app OAuth server event
    const oAuthSub = DeviceEventEmitter.addListener('onOAuthCodeReceived', async (event: any) => {
      showToast('Gmail authorization received! Connecting...', 'info');
      try {
        if (event && event.code) {
          await useEmailUiStore.getState().connectWithCode(event.code);
        }
      } catch {}
      setTimeout(async () => {
        await checkOAuthStatus();
        await fetchSummary();
        await fetchEmails();
        await syncEmails({ silent: false }).catch(() => {});
      }, 800);
    });

    // Handle deep-link return from Google OAuth
    const linkingSub = Linking.addEventListener('url', (event) => {
      if (event.url.includes('email') || event.url.includes('connected')) {
        checkOAuthStatus();
        fetchSummary();
        fetchEmails();
        syncEmails({ silent: true }).catch(() => {});
      }
    });

    // Auto-sync when user returns/focuses on the browser tab (web)
    const handleFocus = () => {
      syncEmails({ silent: true }).catch(() => {});
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      clearInterval(pollTimer);
      appStateSub.remove();
      linkingSub.remove();
      oAuthSub.remove();
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, []);

  // Filter emails based on the active tab and selected account
  const displayedEmails = useMemo(() => {
    let list = filterByTab(emails, mailTab, mailDrafts);
    if (selectedAccountEmail && selectedAccountEmail !== 'all') {
      const target = selectedAccountEmail.toLowerCase();
      list = list.filter((e) => !e.accountEmail || e.accountEmail.toLowerCase() === target);
    }
    return list;
  }, [emails, mailTab, mailDrafts, selectedAccountEmail]);

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
        keyboardShouldPersistTaps="handled"
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

        {/* Active Account Filter Chip */}
        {selectedAccountEmail !== 'all' && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#edf5ef',
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 10,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: '#cce2d1',
            }}
          >
            <Text style={{ fontSize: 12, color: '#274f31' }}>
              Filtered by: <Text style={{ fontWeight: '700' }}>{selectedAccountEmail}</Text>
            </Text>
            <TouchableOpacity onPress={() => setSelectedAccountEmail('all')}>
              <Text style={{ fontSize: 11, color: '#7a3f3f', fontWeight: '600' }}>Show all inboxes ✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Email Rows List Card */}
        <Card>
          {displayedEmails.length > 0 ? (
            displayedEmails.map((email, index) => (
              <EmailRow
                key={`${email.id}-${index}`}
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
