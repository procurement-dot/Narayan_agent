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
import { ProposalItem } from '../types/email.types';

interface ProposalSheetProps {
  proposal: ProposalItem | null;
  visible: boolean;
  onClose: () => void;
  onDismiss: (proposalId: string) => void;
  onApprove: (
    proposalId: string,
    data: { title: string; start: string; end: string; detail: string }
  ) => void;
}

export const ProposalSheet: React.FC<ProposalSheetProps> = ({
  proposal,
  visible,
  onClose,
  onDismiss,
  onApprove,
}) => {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('14:00');
  const [end, setEnd] = useState('14:30');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    if (proposal) {
      setTitle(proposal.title);
      setStart(proposal.start);
      setEnd(proposal.end);
      setDetail(proposal.detail);
    }
  }, [proposal]);

  if (!proposal) return null;

  const sheetTitle =
    proposal.type === 'meeting' ? 'Review proposed meeting' : 'Review proposed task';

  const sourceLabels = proposal.sources
    .map((s) => (s.startsWith('w') ? 'WhatsApp' : 'Email'))
    .join(' + ');

  const footerButtons = (
    <View style={styles.footerContainer}>
      <TouchableOpacity
        style={styles.outlineBtn}
        onPress={() => onDismiss(proposal.id)}
      >
        <Text style={styles.outlineBtnText}>Dismiss</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.solidBtn}
        onPress={() => onApprove(proposal.id, { title, start, end, detail })}
      >
        <Text style={styles.solidBtnText}>Approve for my day</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <BottomSheet
      visible={visible}
      title={sheetTitle}
      onClose={onClose}
      footer={footerButtons}
    >
      <Text style={styles.kicker}>
        {proposal.context} · {proposal.confidence} confidence
      </Text>

      {/* Quoted Evidence */}
      <View style={styles.proposalQuoteBox}>
        <Text style={styles.proposalQuoteText}>“{proposal.evidence}”</Text>
      </View>

      <Text style={styles.noteText}>
        Two sources may refer to the same event. NRYN merges likely duplicates and keeps the source trail.
      </Text>

      {/* Editable Fields */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Action</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Action title"
          placeholderTextColor={TOKENS.colors.inkMuted}
        />
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeField}>
          <Text style={styles.fieldLabel}>Start</Text>
          <TextInput
            style={styles.input}
            value={start}
            onChangeText={setStart}
            placeholder="HH:mm"
          />
        </View>

        <View style={styles.timeField}>
          <Text style={styles.fieldLabel}>End</Text>
          <TextInput
            style={styles.input}
            value={end}
            onChangeText={setEnd}
            placeholder="HH:mm"
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Context</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          multiline
          numberOfLines={3}
          value={detail}
          onChangeText={setDetail}
          placeholder="Context details"
        />
      </View>

      {/* Notice */}
      <View style={styles.noticeBox}>
        <Text style={styles.noticeText}>
          Sources: {sourceLabels}. No external calendar is modified.
        </Text>
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
    marginBottom: 10,
    fontFamily: FONTS.regular,
  },
  proposalQuoteBox: {
    borderLeftWidth: 2,
    borderLeftColor: '#d49b79',
    paddingLeft: 13,
    paddingVertical: 6,
    marginVertical: 10,
  },
  proposalQuoteText: {
    fontSize: 12,
    lineHeight: 20,
    color: '#525e53',
    fontStyle: 'italic',
    fontFamily: FONTS.regular,
  },
  noteText: {
    fontSize: 11,
    color: '#768476',
    lineHeight: 17,
    marginBottom: 14,
    fontFamily: FONTS.regular,
  },
  fieldGroup: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    color: '#758176',
    fontWeight: '600',
    marginBottom: 5,
    fontFamily: FONTS.regular,
  },
  input: {
    backgroundColor: TOKENS.colors.paper,
    borderWidth: 1,
    borderColor: TOKENS.colors.inputBorder,
    borderRadius: TOKENS.radius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: TOKENS.colors.ink,
    fontFamily: FONTS.regular,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  timeField: {
    flex: 1,
  },
  textarea: {
    minHeight: 65,
    textAlignVertical: 'top',
  },
  noticeBox: {
    backgroundColor: TOKENS.colors.noticeBg,
    borderWidth: 1,
    borderColor: TOKENS.colors.noticeBorder,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 11,
    lineHeight: 17,
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
    flex: 1.5,
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
