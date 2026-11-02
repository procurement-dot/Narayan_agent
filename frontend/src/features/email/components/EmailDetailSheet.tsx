import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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
  onArchive: (emailId: string) => void;
  onReviewAction: (emailId: string) => void;
}

export const EmailDetailSheet: React.FC<EmailDetailSheetProps> = ({
  email,
  savedDraft,
  visible,
  onClose,
  onSaveDraft,
  onArchive,
  onReviewAction,
}) => {
  const [draftText, setDraftText] = useState('');

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
    : 'Action';

  const footerButtons = (
    <View style={styles.footerContainer}>
      <TouchableOpacity
        style={styles.outlineBtn}
        onPress={() => onArchive(email.id)}
      >
        <Text style={styles.outlineBtnText}>Archive preview</Text>
      </TouchableOpacity>

      {!isNoise && (
        <>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => onSaveDraft(email.id, draftText)}
          >
            <Text style={styles.outlineBtnText}>Save draft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.solidBtn}
            onPress={() => onReviewAction(email.id)}
          >
            <Text style={styles.solidBtnText}>Review extracted action</Text>
          </TouchableOpacity>
        </>
      )}
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
        {email.name.toUpperCase()} · {email.time} · SAMPLE EMAIL
      </Text>

      <Text style={styles.content}>{email.content}</Text>

      <View style={styles.tagBadge}>
        <Text style={styles.tagText}>Suggested intent: {intentLabel}</Text>
      </View>

      {!isNoise ? (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Editable reply — never auto-sent</Text>
          <TextInput
            style={styles.textarea}
            multiline
            numberOfLines={4}
            value={draftText}
            onChangeText={setDraftText}
            placeholder="Type your reply here..."
            placeholderTextColor={TOKENS.colors.inkMuted}
          />
        </View>
      ) : (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Suggested: archive, rather than delete. NRYN should wait for your decision.
          </Text>
        </View>
      )}
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
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f7f8f3',
    borderWidth: 1,
    borderColor: '#e2e7dd',
    borderRadius: 99,
    paddingVertical: 5,
    paddingHorizontal: 9,
    marginBottom: 18,
  },
  tagText: {
    fontSize: 10,
    color: '#667b6a',
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
  formGroup: {
    marginTop: 8,
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    color: '#758176',
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: FONTS.regular,
  },
  textarea: {
    backgroundColor: TOKENS.colors.paper,
    borderWidth: 1,
    borderColor: TOKENS.colors.inputBorder,
    borderRadius: TOKENS.radius.input,
    padding: 12,
    fontSize: 12,
    color: TOKENS.colors.ink,
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: FONTS.regular,
  },
  noticeBox: {
    backgroundColor: TOKENS.colors.noticeBg,
    borderWidth: 1,
    borderColor: TOKENS.colors.noticeBorder,
    borderRadius: 14,
    padding: 13,
    marginVertical: 12,
  },
  noticeText: {
    fontSize: 11,
    lineHeight: 18,
    color: '#738275',
    fontFamily: FONTS.regular,
  },
  footerContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e7de',
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
  solidBtn: {
    flex: 1.4,
    backgroundColor: '#324c3d',
    borderRadius: 13,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: FONTS.regular,
  },
});
