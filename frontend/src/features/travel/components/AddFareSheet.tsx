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

export const AddFareSheet: React.FC = () => {
  const { activeModal, closeModal, createFare, isLoading } = useTravelStore();
  const { showToast } = useToast();

  const [route, setRoute] = useState('');
  const [journeyDate, setJourneyDate] = useState('');
  const [currentFare, setCurrentFare] = useState('');
  const [typicalFare, setTypicalFare] = useState('');
  const [targetFare, setTargetFare] = useState('');

  const isOpen = activeModal === 'addFare';

  const resetForm = () => {
    setRoute('');
    setJourneyDate('');
    setCurrentFare('');
    setTypicalFare('');
    setTargetFare('');
  };

  const handleClose = () => {
    resetForm();
    closeModal();
  };

  const handleSubmit = async () => {
    if (!route.trim()) {
      showToast('Please enter flight route (e.g. PNQ ➔ BOM)', 'warning');
      return;
    }
    if (!journeyDate.trim()) {
      showToast('Please enter journey date (YYYY-MM-DD)', 'warning');
      return;
    }
    const current = parseFloat(currentFare);
    const typical = parseFloat(typicalFare);

    if (isNaN(current) || current <= 0) {
      showToast('Please enter a valid current fare', 'warning');
      return;
    }
    if (isNaN(typical) || typical <= 0) {
      showToast('Please enter a valid typical average fare', 'warning');
      return;
    }

    const success = await createFare({
      route: route.trim(),
      journeyDate: journeyDate.trim(),
      currentFareInr: current,
      typicalFareInr: typical,
      targetFareInr: targetFare ? parseFloat(targetFare) : undefined,
    });

    if (success) {
      showToast('Airfare price tracker activated!', 'success');
      handleClose();
    } else {
      showToast('Failed to save fare tracker', 'error');
    }
  };

  return (
    <BottomSheet visible={isOpen} title="Track Airfare Route" onClose={handleClose}>
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Flight Route *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. PNQ ➔ BOM (Morning flight)"
            placeholderTextColor={colors.muted}
            value={route}
            onChangeText={setRoute}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Journey Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD (e.g. 2026-12-10)"
            placeholderTextColor={colors.muted}
            value={journeyDate}
            onChangeText={setJourneyDate}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Current Price (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2800"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={currentFare}
              onChangeText={setCurrentFare}
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Typical Price (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 3900"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={typicalFare}
              onChangeText={setTypicalFare}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Target Deal Price (₹) (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2500"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={targetFare}
            onChangeText={setTargetFare}
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
            <Text style={styles.submitBtnText}>Start Tracking Fare</Text>
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
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
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
