import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { TOKENS } from '../../../shared/theme/tokens';
import { FONTS } from '../../../shared/theme/fonts';
import { EmailItem } from '../types/email.types';

interface EmailDetailSheetProps {
  email: EmailItem | null;
  savedDraft?: string;
  visible: boolean;
  onClose: () => void;
  onSaveDraft: (emailId: string, draft: string) => void;
  onSendReply: (emailId: string, draft: string) => Promise<void>;
  onGenerateDraft: (emailId: string) => Promise<string>;
  onArchive: (emailId: string) => void;
  onTrash?: (emailId: string) => void;
  onReviewAction?: (emailId: string) => void;
}

export const EmailDetailSheet: React.FC<EmailDetailSheetProps> = ({
  email,
  savedDraft,
  visible,
  onClose,
  onSaveDraft,
  onSendReply,
  onGenerateDraft,
  onArchive,
  onTrash,
  onReviewAction,
}) => {
  const [draftText, setDraftText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) return;

    setSendError(null);
    const existingDraft = (savedDraft && savedDraft.trim()) || (email.draft && email.draft.trim()) || '';
    if (existingDraft) {
      setDraftText(existingDraft);
      setIsGenerating(false);
    } else {
      // Auto-generate AI draft immediately when opening any email that has no draft yet!
      setDraftText('');
      setIsGenerating(true);
      onGenerateDraft(email.id)
        .then((generated) => {
          if (generated) {
            setDraftText(generated);
          }
        })
        .catch((err) => {
          console.warn('Auto draft generation error:', err);
        })
        .finally(() => {
          setIsGenerating(false);
        });
    }
  }, [email?.id]);

  if (!email) return null;

  const isNoise = email.kind === 'noise';
  const intentLabel = isNoise
    ? 'Low priority'
    : email.kind === 'meeting'
    ? 'Meeting'
    : 'Action candidate';

  const handleManualGenerate = async () => {
    try {
      setIsGenerating(true);
      const generated = await onGenerateDraft(email.id);
      if (generated) {
        setDraftText(generated);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!draftText.trim() || isSending) return;
    try {
      setSendError(null);
      setIsSending(true);
      await onSendReply(email.id, draftText);
    } catch (err: any) {
      setSendError(err.message || 'Unable to send reply. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const footerButtons = (
    <View style={styles.footerContainer}>
      {onTrash && (
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => {
            if (Platform.OS === 'web') {
              const ok = typeof window !== 'undefined'
                ? window.confirm('Are you sure you want to move this email to Gmail Trash?')
                : true;
              if (ok) {
                onTrash(email.id);
              }
              return;
            }
            Alert.alert(
              'Delete Email?',
              'Are you sure you want to move this email to Gmail Trash?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => onTrash(email.id),
                },
              ]
            );
          }}
          disabled={isSending || isGenerating}
        >
          <Text style={styles.deleteBtnText}>Delete 🗑</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.archiveBtn}
        onPress={() => onArchive(email.id)}
        disabled={isSending || isGenerating}
      >
        <Text style={styles.archiveBtnText}>Archive</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.outlineBtn,
          (!draftText.trim() || isGenerating) && styles.disabledBtn,
        ]}
        onPress={() => {
          if (draftText.trim()) {
            onSaveDraft(email.id, draftText);
          }
        }}
        disabled={isSending || isGenerating || !draftText.trim()}
      >
        <Text style={styles.outlineBtnText}>Save draft</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.sendBtn,
          (isSending || isGenerating || !draftText.trim()) && styles.sendBtnDisabled,
        ]}
        onPress={handleSend}
        disabled={isSending || isGenerating || !draftText.trim()}
        activeOpacity={0.8}
      >
        {isSending ? (
          <View style={styles.sendingRow}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={styles.sendBtnText}> Sending...</Text>
          </View>
        ) : (
          <Text style={styles.sendBtnText}>Send reply ↗</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <BottomSheet
      visible={visible}
      title={email.subject}
      onClose={onClose}
      footer={footerButtons}
    >
      {email.unwantedReason && (
        <View style={styles.unwantedCard}>
          <Text style={styles.unwantedTitle}>⚠️ AI Detected as Unwanted</Text>
          <Text style={styles.unwantedDesc}>
            {email.unwantedReason}. You can delete this email to keep your inbox clean.
          </Text>
        </View>
      )}

      <Text style={styles.kicker}>
        {email.name.toUpperCase()} · {email.time} · {email.source}
        {email.accountEmail ? ` · INBOX: ${email.accountEmail}` : ''}
      </Text>

      <Text style={styles.content}>{email.content}</Text>

      <View style={styles.metaRow}>
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>Suggested intent: {intentLabel}</Text>
        </View>

        {onReviewAction && !isNoise && (
          <TouchableOpacity
            style={styles.reviewActionLink}
            onPress={() => onReviewAction(email.id)}
          >
            <Text style={styles.reviewActionLinkText}>Review extracted action →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Draft Reply Area */}
      <View style={styles.replyBoxContainer}>
        <View style={styles.replyHeaderRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.replyLabel}>Editable reply — never auto-sent</Text>
            {email.accountEmail && (
              <Text style={{ fontSize: 10, color: '#68776b', marginTop: 1 }}>
                From: <Text style={{ fontWeight: '600', color: '#274b31' }}>{email.accountEmail}</Text>
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.aiDraftBtn}
            onPress={handleManualGenerate}
            disabled={isGenerating}
            activeOpacity={0.7}
          >
            {isGenerating ? (
              <View style={styles.generatingRow}>
                <ActivityIndicator size="small" color="#2a5438" />
                <Text style={styles.aiDraftBtnText}> Drafting...</Text>
              </View>
            ) : (
              <Text style={styles.aiDraftBtnText}>
                {draftText ? '✨ Regenerate reply' : '✨ Ask AI to draft'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.textareaWrapper}>
          <TextInput
            style={styles.textarea}
            multiline
            numberOfLines={4}
            value={draftText}
            onChangeText={setDraftText}
            placeholder={
              isGenerating
                ? 'AI is drafting a thoughtful reply with Gemini...'
                : "Type your reply or tap '✨ Regenerate reply'..."
            }
            placeholderTextColor={TOKENS.colors.inkMuted}
            editable={!isGenerating && !isSending}
          />
          {isGenerating && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#355e43" />
              <Text style={styles.loadingOverlayText}>
                Gemini 3.5 Flash is drafting a reply...
              </Text>
            </View>
          )}
        </View>

        {sendError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠️ {sendError}</Text>
          </View>
        )}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  kicker: {
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#9aa49a',
    marginBottom: 12,
    fontFamily: FONTS.regular,
  },
  content: {
    fontSize: 13,
    lineHeight: 22,
    color: TOKENS.colors.ink,
    marginBottom: 16,
    fontFamily: FONTS.regular,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f7f8f3',
    borderWidth: 1,
    borderColor: '#e2e7dd',
    borderRadius: 99,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  tagText: {
    fontSize: 10,
    color: '#667b6a',
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
  reviewActionLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  reviewActionLinkText: {
    fontSize: 11,
    color: '#3d6349',
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
  replyBoxContainer: {
    marginTop: 6,
    marginBottom: 10,
  },
  replyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  replyLabel: {
    fontSize: 11,
    color: '#758176',
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
  aiDraftBtn: {
    backgroundColor: '#edf4ee',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#cde0d2',
  },
  aiDraftBtnText: {
    fontSize: 11,
    color: '#2a5438',
    fontWeight: '600',
  },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  textareaWrapper: {
    position: 'relative',
  },
  textarea: {
    backgroundColor: TOKENS.colors.paper,
    borderWidth: 1,
    borderColor: TOKENS.colors.inputBorder,
    borderRadius: TOKENS.radius.input,
    padding: 12,
    fontSize: 12,
    color: TOKENS.colors.ink,
    minHeight: 95,
    textAlignVertical: 'top',
    fontFamily: FONTS.regular,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: TOKENS.radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingOverlayText: {
    fontSize: 11,
    color: '#355e43',
    fontFamily: FONTS.regular,
    fontWeight: '600',
  },
  footerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  archiveBtn: {
    borderWidth: 1,
    borderColor: '#e1e7de',
    borderRadius: 13,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf9f5',
  },
  deleteBtn: {
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 13,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
    fontFamily: FONTS.regular,
  },
  unwantedCard: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fed7d7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  unwantedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#c53030',
    marginBottom: 2,
  },
  unwantedDesc: {
    fontSize: 11,
    color: '#742a2a',
    lineHeight: 16,
  },
  archiveBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#69776b',
    fontFamily: FONTS.regular,
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d5ded3',
    borderRadius: 13,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TOKENS.colors.paper,
  },
  outlineBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#33463a',
    fontFamily: FONTS.regular,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  sendBtn: {
    flex: 1.5,
    backgroundColor: '#28382c',
    borderRadius: 13,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: FONTS.regular,
    letterSpacing: 0.3,
  },
  errorBanner: {
    marginTop: 10,
    backgroundColor: '#fff0ee',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorBannerText: {
    color: '#a94442',
    fontSize: 12,
    lineHeight: 16,
  },
});
