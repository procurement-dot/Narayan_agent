import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTravelStore } from './travel.store';
import { AppHeader } from '../navigation/AppHeader';
import { PillTabs } from '../../shared/components/PillTabs';
import { TravelTab } from './travel.types';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';
import { useToast } from '../../shared/components/Toast';

const TRAVEL_TABS: { id: TravelTab; label: string }[] = [
  { id: 'trips', label: 'Trips' },
  { id: 'fares', label: 'Airfare' },
  { id: 'family', label: 'Documents' },
  { id: 'rail', label: 'Tatkal' },
  { id: 'history', label: 'History' },
];

export const TravelScreen: React.FC = () => {
  const { currentTab, setTab, trips, fares } = useTravelStore();
  const { showToast } = useToast();

  return (
    <View style={styles.container}>
      <AppHeader
        kicker="JOURNEYS · LOGISTICS & TRANSIT"
        title="Travel unhurried."
        subtitle="Trips, fare trackers, travel documents and rail alerts."
      />

      <View style={styles.tabsContainer}>
        <PillTabs
          tabs={TRAVEL_TABS}
          activeTab={currentTab}
          onSelect={(t) => setTab(t as TravelTab)}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentTab === 'trips' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Itineraries</Text>
            {trips.map((tr) => (
              <View key={tr.id} style={styles.card}>
                <View style={styles.tripHeader}>
                  <Text style={styles.tripTitle}>{tr.title}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      tr.status === 'confirmed' ? styles.statusGreen : styles.statusWarm,
                    ]}
                  >
                    <Text style={styles.statusText}>{tr.status}</Text>
                  </View>
                </View>
                <Text style={styles.tripRoute}>{tr.route}</Text>
                <Text style={styles.tripDates}>{tr.dates}</Text>
                <Text style={styles.tripDetails}>{tr.details}</Text>
              </View>
            ))}
          </View>
        )}

        {currentTab === 'fares' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tracked Airfares</Text>
            {fares.map((f, i) => (
              <View key={i} style={styles.card}>
                <View style={styles.fareHeader}>
                  <Text style={styles.fareRoute}>{f.route}</Text>
                  <Text style={styles.fareVal}>{f.currentFare}</Text>
                </View>
                <Text style={styles.fareSub}>Typical: {f.typicalFare}</Text>
                <Text style={styles.fareStatus}>{f.status}</Text>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => showToast('Opening airline partner booking link', 'info')}
                >
                  <Text style={styles.actionBtnText}>Book now ↗</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {currentTab === 'family' && (
          <View style={styles.section}>
            <View style={styles.cardWarm}>
              <Text style={styles.cardKicker}>PASSPORT VALIDITY CHECK</Text>
              <Text style={styles.docTitle}>Neha's Passport Renewal Needed</Text>
              <Text style={styles.docDesc}>
                Expires in 7 months (June 2027). Recommend renewal before booking international summer travel.
              </Text>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => showToast('Passport renewal task scheduled', 'success')}
              >
                <Text style={styles.actionBtnText}>Schedule renewal reminder ↗</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentTab === 'rail' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardKicker}>IRCTC TATKAL ASSISTANT</Text>
              <Text style={styles.docTitle}>AC Tatkal Opens at 10:00 AM</Text>
              <Text style={styles.docDesc}>
                Pune ➔ Mumbai Deccan Queen · 3 passengers saved in master list.
              </Text>
            </View>
          </View>
        )}

        {currentTab === 'history' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.docTitle}>Past Travel Archive</Text>
              <Text style={styles.docDesc}>
                Bangalore Marathon (Aug 2026) · Ahmedabad Sports Clinic (Jul 2026).
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  tabsContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginVertical: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardWarm: {
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardKicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  tripRoute: {
    fontSize: 13,
    fontFamily: typography.fontFamily.serifRegular,
    color: colors.ink,
    marginTop: 4,
  },
  tripDates: {
    fontSize: 12,
    color: colors.accent,
    marginTop: 2,
  },
  tripDetails: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  statusGreen: {
    backgroundColor: '#ebf4ea',
  },
  statusWarm: {
    backgroundColor: colors.surfaceWarm,
  },
  statusText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    textTransform: 'capitalize',
  },
  fareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareRoute: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  fareVal: {
    fontSize: 16,
    fontFamily: typography.fontFamily.serifRegular,
    color: '#3b7a57',
  },
  fareSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  fareStatus: {
    fontSize: 12,
    color: colors.accent,
    marginTop: 4,
  },
  actionBtn: {
    marginTop: spacing.sm,
  },
  actionBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.accent,
  },
  docTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  docDesc: {
    fontSize: 12,
    color: colors.inkSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
});
