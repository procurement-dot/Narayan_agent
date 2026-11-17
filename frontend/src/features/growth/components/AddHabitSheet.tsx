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
import { useGrowthStore } from '../growth.store';
import { useToast } from '../../../shared/components/Toast';
import { colors, radii, spacing, typography } from '../../../shared/theme/tokens';

const CATEGORIES: ('Mindset' | 'Physical' | 'Focus' | 'Reflection')[] = [
  'Mindset',
  'Physical',
  'Focus',
  'Reflection',
];

const TIMES_OF_DAY: ('Morning' | 'Midday' | 'Evening')[] = ['Morning', 'Midday', 'Evening'];

export const AddHabitSheet: React.FC = () => {
  const { isAddHabitOpen, setAddHabitOpen, addHabit, isLoading } = useGrowthStore();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Mindset' | 'Physical' | 'Focus' | 'Reflection'>('Mindset');
  const [timeOfDay, setTimeOfDay] = useState<'Morning' | 'Midday' | 'Evening'>('Morning');
  const [durationMins, setDurationMins] = useState('15');

  const resetForm = () => {
    setTitle('');
    setCategory('Mindset');
    setTimeOfDay('Morning');
    setDurationMins('15');
  };

  const handleClose = () => {
    resetForm();
    setAddHabitOpen(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showToast('Please enter a habit title', 'warning');
      return;
    }
    const mins = parseInt(durationMins, 10);
    if (isNaN(mins) || mins <= 0) {
      showToast('Please enter a valid duration (e.g. 15 mins)', 'warning');
      return;
    }

    try {
      await addHabit({
        title: title.trim(),
        category,
        timeOfDay,
        durationMins: mins,
      });
      showToast(`Added habit: "${title.trim()}"`, 'success');
      handleClose();
    } catch {
      showToast('Failed to add habit', 'error');
    }
  };

  return (
    <BottomSheet
      visible={isAddHabitOpen}
      title="Add Daily Habit"
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
            <Text style={styles.submitBtnText}>Add Habit to Routine</Text>
          )}
        </TouchableOpacity>
      }
    >
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>HABIT TITLE</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Morning 15m: Pranayama & breathwork"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>TIME OF DAY</Text>
          <View style={styles.pillRow}>
            {TIMES_OF_DAY.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.pill, timeOfDay === t && styles.pillActive]}
                onPress={() => setTimeOfDay(t)}
              >
                <Text style={[styles.pillText, timeOfDay === t && styles.pillTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>CATEGORY</Text>
          <View style={styles.pillRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.pill, category === c && styles.pillActive]}
                onPress={() => setCategory(c)}
              >
                <Text style={[styles.pillText, category === c && styles.pillTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>DURATION (MINUTES)</Text>
          <TextInput
            style={styles.input}
            placeholder="15"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={durationMins}
            onChangeText={setDurationMins}
          />
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
