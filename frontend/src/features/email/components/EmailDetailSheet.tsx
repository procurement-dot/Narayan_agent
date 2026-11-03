import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
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
  onReviewAction,
}) => {
  const [draftText, setDraftText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (email) {
      setDraftText(savedDraft !== undefined ? savedDraft : email.draft || '');
    }
  }, [email, savedDraft]);

  if (!email) return null;

  const isNoise = email.kind === 'noise';
  const intentLabel = isNoise
    ? 'Low priority'
    : email.kind === 'meeting'
    ? 'Meeting'
    : 'Action candidate';

  const handleGenerate = async () => {
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
    if (!draftText.trim()) return;
    try {
      setIsSending(true);
      await onSendReply(email.id, draftText);
    } finally {
      setIsSending(false);
    }
  };

  const footerButtons = (
    <View style={styles.footerContainer}>
      <TouchableOpacity
        style={styles.archiveBtn}
        onPress={() => onArchive(email.id)}
        disabled={isSending}
      >
        <Text style={styles.archiveBtnText}>Archive</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.outlineBtn}
        onPress={() => onSaveDraft(email.id, draftText)}
        disabled={isSending}
      >
        <Text style={styles.outlineBtnText}>Save draft</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.sendBtn, isSending && styles.sendBtnDisabled]}
        onPress={handleSend}
        disabled={isSending || !draftText.trim()}
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
      <Text style={styles.kicker}>
        {email.name.toUpperCase()} · {email.time} · {email.source}
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
          <Text style={styles.replyLabel}>Editable reply — never auto-sent</Text>
          <TouchableOpacity
            style={styles.aiDraftBtn}
            onPress={handleGenerate}
            disabled={isGenerating}
            activeOpacity={0.7}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#355e43" />
            ) : (
              <Text style={styles.aiDraftBtnText}>✨ Ask AI to draft</Text>
            )}
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.textarea}
          multiline
          numberOfLines={4}
          value={draftText}
          onChangeText={setDraftText}
          placeholder="Tap '✨ Ask AI to draft' or type your reply here..."
          placeholderTextColor={TOKENS.colors.inkMuted}
        />
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
  textarea: {
    backgroundColor: TOKENS.colors.paper,
    borderWidth: 1,
    borderColor: TOKENS.colors.inputBorder,
    borderRadius: TOKENS.radius.input,
    padding: 12,
    fontSize: 12,
    color: TOKENS.colors.ink,
    minHeight: 90,
    textAlignVertical: 'top',
    fontFamily: FONTS.regular,
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
  sendBtn: {
    flex: 1.5,
    backgroundColor: '#28382c',
    borderRadius: 13,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.6,
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
});
