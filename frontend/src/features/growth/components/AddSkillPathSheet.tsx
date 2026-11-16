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

const CATEGORIES = [
  'Product & Tech',
  'Leadership & Strategy',
  'Sport & Physiology',
  'Cognitive & Mindset',
];

const LEVELS: ('Beginner' | 'Intermediate' | 'Practitioner' | 'Advanced')[] = [
  'Beginner',
  'Intermediate',
  'Practitioner',
  'Advanced',
];

export const AddSkillPathSheet: React.FC = () => {
  const { isAddSkillOpen, setAddSkillOpen, addSkillPath, isLoading } = useGrowthStore();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Product & Tech');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Practitioner' | 'Advanced'>('Intermediate');
  const [competencies, setCompetencies] = useState('');
  const [initialProgress, setInitialProgress] = useState('10');

  const resetForm = () => {
    setName('');
    setCategory('Product & Tech');
    setLevel('Intermediate');
    setCompetencies('');
    setInitialProgress('10');
  };

  const handleClose = () => {
    resetForm();
    setAddSkillOpen(false);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast('Please enter a skill path name', 'warning');
      return;
    }
    const modules = competencies
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    const progress = Math.max(0, Math.min(100, parseInt(initialProgress, 10) || 0));

    try {
      await addSkillPath({
        name: name.trim(),
        category,
        level,
        progress,
        modules: modules.length > 0 ? modules : ['Core Fundamentals', 'Practical Application'],
      });
      showToast(`Created pathway: "${name.trim()}"`, 'success');
      handleClose();
    } catch {
      showToast('Failed to create pathway', 'error');
    }
  };

  return (
    <BottomSheet
      visible={isAddSkillOpen}
      title="Create Skill Pathway"
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
            <Text style={styles.submitBtnText}>Start Skill Pathway</Text>
          )}
        </TouchableOpacity>
      }
    >
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>SKILL PATHWAY NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Cognitive Bias & Mental Models"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
          />
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
          <Text style={styles.label}>LEVEL</Text>
          <View style={styles.pillRow}>
            {LEVELS.map((l) => (
              <TouchableOpacity
                key={l}
                style={[styles.pill, level === l && styles.pillActive]}
                onPress={() => setLevel(l)}
              >
                <Text style={[styles.pillText, level === l && styles.pillTextActive]}>
                  {l}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>KEY COMPETENCIES (COMMA-SEPARATED)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Inversion, First Principles, Second-Order Thinking"
            placeholderTextColor={colors.muted}
            value={competencies}
            onChangeText={setCompetencies}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>CURRENT PROGRESS (%)</Text>
          <TextInput
            style={styles.input}
            placeholder="10"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={initialProgress}
            onChangeText={setInitialProgress}
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
