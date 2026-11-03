import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTravelStore } from './travel.store';
import { AppHeader } from '../navigation/AppHeader';
import { PillTabs } from '../../shared/components/PillTabs';
import { TravelTab } from './travel.types';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';
import { useToast } from '../../shared/components/Toast';
import { AddTripSheet } from './components/AddTripSheet';
import { AddFareSheet } from './components/AddFareSheet';
import { AddDocumentSheet } from './components/AddDocumentSheet';
import { TripDetailSheet } from './components/TripDetailSheet';

const TRAVEL_TABS: { id: TravelTab; label: string }[] = [
  { id: 'trips', label: 'Trips' },
  { id: 'fares', label: 'Airfare' },
  { id: 'family', label: 'Documents' },
  { id: 'rail', label: 'Tatkal' },
  { id: 'history', label: 'History' },
];

async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Try modern navigator.clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Continue to fallback
    }
  }

  // 2. Robust fallback for browser contexts
  if (typeof document !== 'undefined') {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (success) return true;
    } catch (err) {
      console.warn('Fallback copy error:', err);
    }
  }

  return false;
}

export const TravelScreen: React.FC = () => {
  const {
    currentTab,
    setTab,
    overview,
    trips,
    fares,
    documents,
    tatkal,
    isLoading,
    loadAllData,
    openModal,
    deleteFare,
  } = useTravelStore();

  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const activeTrips = trips.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
  const pastTrips = trips.filter((t) => t.status === 'completed');

  return (
    <View style={styles.container}>
      <AppHeader
        kicker="JOURNEYS · LOGISTICS & TRANSIT"
        title="Travel unhurried."
        subtitle="Trips, fare trackers, travel documents and rail alerts."
      />

      {/* KPI Overview Pill */}
      <View style={styles.overviewBar}>
        <View style={styles.overviewPill}>
          <Text style={styles.overviewDot}>●</Text>
          <Text style={styles.overviewText}>
            {overview.upcomingTripsCount} Active Trips · {overview.faresBelowAverageCount} Price Drops ·{' '}
            {overview.documentsNeedingRenewalCount} Doc Warning
          </Text>
        </View>
      </View>

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ==================== 1. TRIPS TAB ==================== */}
        {currentTab === 'trips' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Upcoming Itineraries</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => openModal('addTrip')}
              >
                <Text style={styles.addBtnText}>+ Add Trip</Text>
              </TouchableOpacity>
            </View>

            {activeTrips.map((tr) => (
              <TouchableOpacity
                key={tr.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => openModal('tripDetail', tr)}
              >
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
                {!!tr.details && <Text style={styles.tripDetails}>{tr.details}</Text>}
                {tr.budgetInr > 0 && (
                  <Text style={styles.tripBudget}>
                    Budget: ₹{tr.budgetInr.toLocaleString('en-IN')}
                  </Text>
                )}
                <View style={styles.cardFooter}>
                  <Text style={styles.cardActionHint}>View details & segments ➔</Text>
                </View>
              </TouchableOpacity>
            ))}

            {activeTrips.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No upcoming trips planned</Text>
                <Text style={styles.emptySubtitle}>Tap "+ Add Trip" to create your next journey itinerary.</Text>
              </View>
            )}
          </View>
        )}

        {/* ==================== 2. AIRFARE TAB ==================== */}
        {currentTab === 'fares' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Tracked Airfares</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => openModal('addFare')}
              >
                <Text style={styles.addBtnText}>+ Track Route</Text>
              </TouchableOpacity>
            </View>

            {fares.map((f) => (
              <View key={f.id} style={styles.card}>
                <View style={styles.fareHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fareRoute}>{f.route}</Text>
                    <Text style={styles.fareDate}>Travel Date: {f.journeyDate}</Text>
                  </View>
                  <Text style={styles.fareVal}>{f.currentFare}</Text>
                </View>
                <Text style={styles.fareSub}>Typical: {f.typicalFare}</Text>
                <View style={styles.statusRow}>
                  <View style={styles.fareStatusBadge}>
                    <Text style={styles.fareStatus}>{f.status}</Text>
                  </View>
                </View>

                <View style={styles.fareActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => showToast('Redirecting to airline partner...', 'info')}
                  >
                    <Text style={styles.actionBtnText}>Book now ↗</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteLink}
                    onPress={async () => {
                      await deleteFare(f.id);
                      showToast('Route removed from tracker', 'info');
                    }}
                  >
                    <Text style={styles.deleteLinkText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {fares.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No routes being tracked</Text>
                <Text style={styles.emptySubtitle}>Set up flight price alerts to catch cheap dates.</Text>
              </View>
            )}
          </View>
        )}

        {/* ==================== 3. DOCUMENTS TAB ==================== */}
        {currentTab === 'family' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Family Travel Vault</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => openModal('addDoc')}
              >
                <Text style={styles.addBtnText}>+ Add Document</Text>
              </TouchableOpacity>
            </View>

            {documents.map((doc) => {
              const isWarning = doc.status === 'renewal_needed' || doc.status === 'expired';
              return (
                <View
                  key={doc.id}
                  style={[styles.card, isWarning && styles.cardWarm]}
                >
                  <View style={styles.docHeader}>
                    <Text style={styles.cardKicker}>
                      {doc.docType.toUpperCase()} · {doc.familyMember}
                    </Text>
                    <View
                      style={[
                        styles.docBadge,
                        isWarning ? styles.docBadgeWarn : styles.docBadgeValid,
                      ]}
                    >
                      <Text
                        style={[
                          styles.docBadgeText,
                          isWarning ? styles.docBadgeTextWarn : styles.docBadgeTextValid,
                        ]}
                      >
                        {doc.status === 'renewal_needed'
                          ? 'Renewal Needed'
                          : doc.status === 'expired'
                          ? 'Expired'
                          : 'Valid'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.docTitle}>{doc.docTitle}</Text>
                  {!!doc.docNumberMasked && (
                    <Text style={styles.docNumber}>Document: {doc.docNumberMasked}</Text>
                  )}
                  <Text style={styles.docExpiry}>
                    Expiry: {doc.expiryDate} ({doc.monthsRemaining} months left)
                  </Text>
                  {!!doc.notes && <Text style={styles.docDesc}>{doc.notes}</Text>}

                  {isWarning && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => showToast('Passport renewal reminder scheduled in Calendar!', 'success')}
                    >
                      <Text style={styles.actionBtnText}>Schedule renewal reminder ↗</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ==================== 4. TATKAL TAB ==================== */}
        {currentTab === 'rail' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>IRCTC Tatkal Assistant</Text>
            </View>

            {tatkal.map((task) => (
              <View key={task.id} style={styles.card}>
                <View style={styles.tatkalHead}>
                  <Text style={styles.cardKicker}>TATKAL ALARM · {task.classCode}</Text>
                  <View style={styles.tatkalTimeBadge}>
                    <Text style={styles.tatkalTimeText}>{task.openingTime}</Text>
                  </View>
                </View>

                <Text style={styles.docTitle}>{task.trainName} ({task.trainNumber})</Text>
                <Text style={styles.tripRoute}>{task.route}</Text>
                <Text style={styles.tripDates}>Journey: {task.travelDate}</Text>

                <View style={styles.masterListBox}>
                  <Text style={styles.masterListTitle}>
                    Saved Master Passenger List ({task.passengersCount} passengers)
                  </Text>
                  {task.passengers.map((p, idx) => (
                    <Text key={idx} style={styles.passengerRow}>
                      • {p.name}, {p.age} yrs {p.berthPreference ? `(${p.berthPreference})` : ''}
                    </Text>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={async () => {
                    const text = task.passengers
                      .map((p) => `${p.name}, Age: ${p.age}${p.berthPreference ? ` (${p.berthPreference})` : ''}`)
                      .join('\n');
                    await copyToClipboard(text);
                    showToast('Passenger details copied to clipboard! Ready for IRCTC.', 'success');
                  }}
                >
                  <Text style={styles.copyBtnText}>📋 Copy Master List for IRCTC</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ==================== 5. HISTORY TAB ==================== */}
        {currentTab === 'history' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past Travel Archive</Text>
            {pastTrips.map((tr) => (
              <View key={tr.id} style={styles.card}>
                <View style={styles.tripHeader}>
                  <Text style={styles.tripTitle}>{tr.title}</Text>
                  <View style={[styles.statusBadge, styles.statusWarm]}>
                    <Text style={styles.statusText}>Completed</Text>
                  </View>
                </View>
                <Text style={styles.tripRoute}>{tr.route}</Text>
                <Text style={styles.tripDates}>{tr.dates}</Text>
                <Text style={styles.tripDetails}>{tr.details}</Text>
              </View>
            ))}

            <View style={styles.card}>
              <Text style={styles.docTitle}>Earlier Completed Trips</Text>
              <Text style={styles.docDesc}>
                Ahmedabad Sports Clinic (Jul 2026) · Goa Family Monsoons (Jun 2025).
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <AddTripSheet />
      <AddFareSheet />
      <AddDocumentSheet />
      <TripDetailSheet />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  overviewBar: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  overviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    gap: 6,
  },
  overviewDot: {
    fontSize: 10,
    color: '#3b7a57',
  },
  overviewText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.inkSecondary,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  addBtn: {
    backgroundColor: colors.accentDark,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
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
  tripBudget: {
    fontSize: 11,
    color: '#3b7a57',
    fontFamily: typography.fontFamily.uiMedium,
    marginTop: 4,
  },
  cardFooter: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.xs,
  },
  cardActionHint: {
    fontSize: 11,
    color: colors.accentDark,
    fontFamily: typography.fontFamily.uiMedium,
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
    alignItems: 'flex-start',
  },
  fareRoute: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  fareDate: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
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
  statusRow: {
    marginTop: 4,
  },
  fareStatusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ebf4ea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  fareStatus: {
    fontSize: 11,
    color: '#2e6b48',
    fontFamily: typography.fontFamily.uiMedium,
  },
  fareActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  actionBtn: {
    marginTop: spacing.xs,
  },
  actionBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.accent,
  },
  deleteLink: {
    padding: 4,
  },
  deleteLinkText: {
    fontSize: 11,
    color: colors.muted,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  docBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  docBadgeWarn: {
    backgroundColor: '#fef3c7',
  },
  docBadgeValid: {
    backgroundColor: '#ebf4ea',
  },
  docBadgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
  },
  docBadgeTextWarn: {
    color: '#b45309',
  },
  docBadgeTextValid: {
    color: '#2e6b48',
  },
  docTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  docNumber: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  docExpiry: {
    fontSize: 12,
    color: colors.accent,
    marginTop: 2,
  },
  docDesc: {
    fontSize: 12,
    color: colors.inkSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  tatkalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tatkalTimeBadge: {
    backgroundColor: '#fed7aa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  tatkalTimeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#9a3412',
  },
  masterListBox: {
    backgroundColor: colors.surfaceWarm,
    padding: spacing.sm,
    borderRadius: radii.md,
    marginTop: spacing.sm,
    gap: 2,
  },
  masterListTitle: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.inkSecondary,
    marginBottom: 2,
  },
  passengerRow: {
    fontSize: 12,
    color: colors.ink,
  },
  copyBtn: {
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 9,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  copyBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.accentDark,
  },
  emptyCard: {
    padding: spacing.xl,
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.lg,
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
  },
});
