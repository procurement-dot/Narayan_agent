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

export const AddTripSheet: React.FC = () => {
  const { activeModal, closeModal, createTrip, isLoading } = useTravelStore();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [route, setRoute] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'planning' | 'confirmed'>('planning');
  const [details, setDetails] = useState('');
  const [budget, setBudget] = useState('');

  const isOpen = activeModal === 'addTrip';

  const resetForm = () => {
    setTitle('');
    setRoute('');
    setStartDate('');
    setEndDate('');
    setStatus('planning');
    setDetails('');
    setBudget('');
  };

  const handleClose = () => {
    resetForm();
    closeModal();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showToast('Please enter a trip title', 'warning');
      return;
    }
    if (!route.trim()) {
      showToast('Please enter origin and destination', 'warning');
      return;
    }
    if (!startDate.trim() || !endDate.trim()) {
      showToast('Please enter start and end dates (YYYY-MM-DD)', 'warning');
      return;
    }

    const success = await createTrip({
      title: title.trim(),
      route: route.trim(),
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      status,
      details: details.trim(),
      budgetInr: budget ? Number(budget) : 0,
    });

    if (success) {
      showToast('Trip itinerary added successfully!', 'success');
      handleClose();
    } else {
      showToast('Could not save trip. Please try again.', 'error');
    }
  };

  return (
    <BottomSheet visible={isOpen} title="Plan New Journey" onClose={handleClose}>
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Trip Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Udaipur Learning Break"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Route / Destination *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Pune (PNQ) ➔ Udaipur (UDR)"
            placeholderTextColor={colors.muted}
            value={route}
            onChangeText={setRoute}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Start Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>End Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Trip Status</Text>
          <View style={styles.statusToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, status === 'planning' && styles.toggleBtnActive]}
              onPress={() => setStatus('planning')}
            >
              <Text style={[styles.toggleText, status === 'planning' && styles.toggleTextActive]}>
                Planning
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, status === 'confirmed' && styles.toggleBtnActive]}
              onPress={() => setStatus('confirmed')}
            >
              <Text style={[styles.toggleText, status === 'confirmed' && styles.toggleTextActive]}>
                Confirmed
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Estimated Budget (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 35000"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={budget}
            onChangeText={setBudget}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes & Booking Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. Meeting with partners, hotel options..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
            value={details}
            onChangeText={setDetails}
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
            <Text style={styles.submitBtnText}>Save Itinerary</Text>
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
    minHeight: 70,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.md,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  toggleBtnActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  toggleText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
  },
  toggleTextActive: {
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
