import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { useTravelStore } from '../travel.store';
import { useToast } from '../../../shared/components/Toast';
import { colors, radii, spacing, typography } from '../../../shared/theme/tokens';

export const TripDetailSheet: React.FC = () => {
  const { activeModal, closeModal, selectedTrip, updateTripStatus, deleteTrip } = useTravelStore();
  const { showToast } = useToast();

  const isOpen = activeModal === 'tripDetail' && !!selectedTrip;

  if (!selectedTrip) return null;

  const handleToggleStatus = async () => {
    const nextStatus = selectedTrip.status === 'confirmed' ? 'planning' : 'confirmed';
    await updateTripStatus(selectedTrip.id, nextStatus);
    showToast(`Trip marked as ${nextStatus}!`, 'success');
  };

  const handleDelete = async () => {
    await deleteTrip(selectedTrip.id);
    showToast('Trip itinerary deleted', 'info');
  };

  return (
    <BottomSheet visible={isOpen} title={selectedTrip.title} onClose={closeModal}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.topBanner}>
          <View>
            <Text style={styles.routeText}>{selectedTrip.route}</Text>
            <Text style={styles.datesText}>{selectedTrip.dates}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              selectedTrip.status === 'confirmed' ? styles.statusGreen : styles.statusWarm,
            ]}
          >
            <Text style={styles.statusBadgeText}>{selectedTrip.status}</Text>
          </View>
        </View>

        {selectedTrip.budgetInr > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estimated Budget:</Text>
            <Text style={styles.infoVal}>₹{selectedTrip.budgetInr.toLocaleString('en-IN')}</Text>
          </View>
        )}

        {!!selectedTrip.details && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notes & Context</Text>
            <Text style={styles.notesText}>{selectedTrip.details}</Text>
          </View>
        )}

        <Text style={styles.sectionHeader}>Itinerary Segments</Text>
        {selectedTrip.segments && selectedTrip.segments.length > 0 ? (
          selectedTrip.segments.map((seg) => (
            <View key={seg.id} style={styles.segmentCard}>
              <View style={styles.segHeader}>
                <Text style={styles.segType}>
                  {seg.type === 'flight' ? '✈ Flight' : seg.type === 'hotel' ? '🏨 Hotel' : '🚆 Rail'}
                </Text>
                <Text style={styles.segStatus}>{seg.status}</Text>
              </View>
              <Text style={styles.segTitle}>{seg.title}</Text>
              {!!seg.confirmationCode && (
                <Text style={styles.segPnr}>Ref / PNR: {seg.confirmationCode}</Text>
              )}
              {seg.costInr > 0 && (
                <Text style={styles.segCost}>Cost: ₹{seg.costInr.toLocaleString('en-IN')}</Text>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No flights or hotels attached yet.</Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              selectedTrip.status === 'confirmed' ? styles.toggleBtnWarm : styles.toggleBtnGreen,
            ]}
            onPress={handleToggleStatus}
          >
            <Text style={styles.toggleBtnText}>
              Mark as {selectedTrip.status === 'confirmed' ? 'Planning' : 'Confirmed'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>Delete Trip</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  topBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  routeText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  datesText: {
    fontSize: 13,
    color: colors.accent,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  statusGreen: {
    backgroundColor: '#ebf4ea',
  },
  statusWarm: {
    backgroundColor: colors.surface,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    textTransform: 'capitalize',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  infoVal: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  notesBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  notesLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  segmentCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 4,
  },
  segHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  segType: {
    fontSize: 12,
    color: colors.accent,
    fontFamily: typography.fontFamily.uiMedium,
  },
  segStatus: {
    fontSize: 11,
    color: colors.muted,
    textTransform: 'capitalize',
  },
  segTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  segPnr: {
    fontSize: 12,
    color: colors.muted,
  },
  segCost: {
    fontSize: 12,
    color: '#3b7a57',
    fontFamily: typography.fontFamily.uiMedium,
  },
  emptyBox: {
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.md,
  },
  emptyText: {
    fontSize: 12,
    color: colors.muted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  toggleBtnGreen: {
    backgroundColor: '#3b7a57',
  },
  toggleBtnWarm: {
    backgroundColor: colors.accentDark,
  },
  toggleBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
  },
  deleteBtn: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#c2410c',
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
  },
});
