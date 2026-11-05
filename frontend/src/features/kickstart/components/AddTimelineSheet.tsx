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
import { useKickstartStore } from '../kickstart.store';
import { useToast } from '../../../shared/components/Toast';
import { colors, radii, spacing, typography } from '../../../shared/theme/tokens';

const QUICK_TIMES = ['09:30', '11:30', '14:00', '16:30', '19:00'];

export const AddTimelineSheet: React.FC = () => {
  const { isAddTimelineOpen, setAddTimelineOpen, addTimelineItem, isLoading } = useKickstartStore();
  const { showToast } = useToast();

  const [timeSlot, setTimeSlot] = useState('14:00');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [isEmphasized, setIsEmphasized] = useState(false);

  const resetForm = () => {
    setTimeSlot('14:00');
    setTitle('');
    setDetail('');
    setIsEmphasized(false);
  };

  const handleClose = () => {
    resetForm();
    setAddTimelineOpen(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showToast('Please enter an agenda title', 'warning');
      return;
    }
    if (!timeSlot.trim()) {
      showToast('Please select or enter a time slot (e.g. 14:00)', 'warning');
      return;
    }

    try {
      await addTimelineItem({
        timeSlot: timeSlot.trim(),
        title: title.trim(),
        detail: detail.trim(),
        isEmphasized,
      });
      showToast(`Added to agenda: "${title.trim()}" at ${timeSlot}`, 'success');
      handleClose();
    } catch {
      showToast('Failed to add agenda item', 'error');
    }
  };

  return (
    <BottomSheet
      visible={isAddTimelineOpen}
      title="Add to Daily Agenda"
      onClose={handleClose}
      footer={
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.submitBtnText}>Add to Today's Agenda</Text>
          )}
        </TouchableOpacity>
      }
    >
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>TIME SLOT</Text>
          <View style={styles.pillRow}>
            {QUICK_TIMES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.pill, timeSlot === t && styles.pillActive]}
                onPress={() => setTimeSlot(t)}
              >
                <Text style={[styles.pillText, timeSlot === t && styles.pillTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, { marginTop: 6 }]}
            placeholder="Or type custom time (e.g. 15:45)"
            placeholderTextColor={colors.muted}
            value={timeSlot}
            onChangeText={setTimeSlot}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>AGENDA ITEM / TASK TITLE</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Product Review with Founders"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>DETAILS & CONTEXT (OPTIONAL)</Text>
          <TextInput
            style={[styles.input, { height: 68, textAlignVertical: 'top' }]}
            placeholder="e.g. Review deliverables, alignment on Q4 architecture"
            placeholderTextColor={colors.muted}
            multiline
            value={detail}
            onChangeText={setDetail}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>PRIORITY FOCUS</Text>
          <TouchableOpacity
            style={[styles.toggleBtn, isEmphasized && styles.toggleBtnActive]}
            onPress={() => setIsEmphasized(!isEmphasized)}
          >
            <Text style={[styles.toggleBtnText, isEmphasized && styles.toggleBtnTextActive]}>
              {isEmphasized ? '★ High Priority / Emphasized' : '☆ Standard Priority'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  pillActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  pillText: {
    fontSize: 12,
    color: colors.inkSecondary,
    fontFamily: typography.fontFamily.uiMedium,
  },
  pillTextActive: {
    color: colors.surface,
  },
  toggleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#f5f2e8',
    borderColor: '#e2dbc8',
  },
  toggleBtnText: {
    fontSize: 13,
    color: colors.inkSecondary,
    fontFamily: typography.fontFamily.uiMedium,
  },
  toggleBtnTextActive: {
    color: colors.ink,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: colors.ink,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: colors.surface,
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
  },
});
