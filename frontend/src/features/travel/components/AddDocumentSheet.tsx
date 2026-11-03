import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { useTravelStore } from '../travel.store';
import { useToast } from '../../../shared/components/Toast';
import { colors, radii, spacing, typography } from '../../../shared/theme/tokens';

export const AddDocumentSheet: React.FC = () => {
  const { activeModal, closeModal, createDocument, isLoading } = useTravelStore();
  const { showToast } = useToast();

  const [familyMember, setFamilyMember] = useState('');
  const [docType, setDocType] = useState<'passport' | 'visa' | 'id' | 'insurance'>('passport');
  const [docTitle, setDocTitle] = useState('');
  const [docNumberMasked, setDocNumberMasked] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  const isOpen = activeModal === 'addDoc';

  const resetForm = () => {
    setFamilyMember('');
    setDocType('passport');
    setDocTitle('');
    setDocNumberMasked('');
    setExpiryDate('');
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    closeModal();
  };

  const handleSubmit = async () => {
    if (!familyMember.trim()) {
      showToast('Please enter family member name', 'warning');
      return;
    }
    if (!docTitle.trim()) {
      showToast('Please enter document title', 'warning');
      return;
    }
    if (!expiryDate.trim()) {
      showToast('Please enter expiry date (YYYY-MM-DD)', 'warning');
      return;
    }

    const success = await createDocument({
      familyMember: familyMember.trim(),
      docType,
      docTitle: docTitle.trim(),
      docNumberMasked: docNumberMasked.trim(),
      expiryDate: expiryDate.trim(),
      notes: notes.trim(),
    });

    if (success) {
      showToast('Document saved to Travel Vault!', 'success');
      handleClose();
    } else {
      showToast('Failed to save document', 'error');
    }
  };

  return (
    <BottomSheet visible={isOpen} title="Add Travel Document" onClose={handleClose}>
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Family Member *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Neha, Nikhil, Prayan"
            placeholderTextColor={colors.muted}
            value={familyMember}
            onChangeText={setFamilyMember}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Document Type</Text>
          <View style={styles.typeSelector}>
            {(['passport', 'visa', 'id', 'insurance'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, docType === t && styles.typeBtnActive]}
                onPress={() => setDocType(t)}
              >
                <Text style={[styles.typeText, docType === t && styles.typeTextActive]}>
                  {t.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Document Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Neha's Indian Passport"
            placeholderTextColor={colors.muted}
            value={docTitle}
            onChangeText={setDocTitle}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Number (Masked)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Z****921"
              placeholderTextColor={colors.muted}
              value={docNumberMasked}
              onChangeText={setDocNumberMasked}
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Expiry Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              value={expiryDate}
              onChangeText={setExpiryDate}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes & Visa Endorsements</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. Valid for Schengen and UK travel..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={2}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>Save to Vault</Text>
          )}
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  field: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.inkSecondary,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    fontFamily: typography.fontFamily.uiRegular,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.md,
    padding: 3,
    gap: 4,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  typeBtnActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  typeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
  },
  typeTextActive: {
    color: colors.ink,
  },
  submitBtn: {
    backgroundColor: colors.accentDark,
    paddingVertical: 13,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
  },
});
