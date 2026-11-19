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
import { useNavigationStore } from '../navigation/navigation.store';
import { PillTabs } from '../../shared/components/PillTabs';
import { TravelTab } from './travel.types';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';
import { useToast } from '../../shared/components/Toast';
import { AddTripSheet } from './components/AddTripSheet';
import { AddFareSheet } from './components/AddFareSheet';
import { AddDocumentSheet } from './components/AddDocumentSheet';
import { TripDetailSheet } from './components/TripDetailSheet';
import { AiTravelPlanner } from './components/AiTravelPlanner';
import { TravelDocumentsChecklist } from './components/TravelDocumentsChecklist';
import { TravelTripsWelcome } from './components/TravelTripsWelcome';
import { CompareFlightSheet } from './components/CompareFlightSheet';

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
    travelDestination,
  } = useTravelStore();

  const { goBack } = useNavigationStore();
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

  // Dynamic route pricing based on selected destination
  const targetCity = travelDestination && travelDestination.trim() ? travelDestination.trim() : 'Mumbai';
  const isMumbai = targetCity.toLowerCase().includes('mumbai');
  const isGoa = targetCity.toLowerCase().includes('goa');
  const isBengaluru = targetCity.toLowerCase().includes('bengaluru') || targetCity.toLowerCase().includes('bangalore');
  const isDelhi = targetCity.toLowerCase().includes('delhi');

  const NO_AIRPORT_CITIES = [
    'satara',
    'mahabaleshwar',
    'panchgani',
    'lonavala',
    'khandala',
    'alibaug',
    'ahmednagar',
    'baramati',
    'karad',
    'sangli',
    'kolhapur',
    'solapur',
    'nashik',
    'shirdi',
  ];
  const hasAirport = !NO_AIRPORT_CITIES.some((c) => targetCity.toLowerCase().includes(c));

  const [comparingFlight, setComparingFlight] = useState<{ route: string; baseFare: string } | null>(null);

  const refLowFare = isMumbai ? '₹2,450' : isGoa ? '₹3,200' : isBengaluru ? '₹3,890' : isDelhi ? '₹4,950' : '₹3,600';
  const refHighFare = isMumbai ? '₹4,200' : isGoa ? '₹5,400' : isBengaluru ? '₹5,800' : isDelhi ? '₹7,100' : '₹5,900';

  return (
    <View style={styles.container}>
      {/* Exact Header matching index.html / Screenshot: ‹ Travel */}
      <View style={styles.minimalHeader}>
        <TouchableOpacity
          onPress={goBack}
          style={styles.minimalBackBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.minimalBackChevron}>‹</Text>
          <Text style={styles.minimalTitle}>Travel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <PillTabs
          tabs={TRAVEL_TABS}
          activeTab={currentTab}
          variant="pastel"
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
          <TravelTripsWelcome onSelectTab={(t) => setTab(t)} />
        )}

        {/* ==================== 2. AIRFARE TAB ==================== */}
        {currentTab === 'fares' && (
          <View style={styles.section}>
            {/* Sage Route Watcher */}
            <View style={styles.featureSageCard}>
              <Text style={styles.featureKicker}>
                {hasAirport ? 'Watched route · dynamic live pricing' : 'Highway corridor · ~110 km'}
              </Text>
              <Text style={styles.featureTitle}>Pune → {targetCity}</Text>
              <Text style={styles.featureSub}>
                {hasAirport
                  ? `Reference low fare in this example: ${refLowFare}`
                  : 'Direct highway drive (1h 45m via NH48) or Train. No commercial flight needed.'}
              </Text>
            </View>

            {/* Illustrative Fare History Chart */}
            <View style={styles.card}>
              <Text style={styles.chartTitle}>
                {hasAirport
                  ? `Illustrative fare history (${targetCity})`
                  : 'National Flight Benchmark (Executive Corridors)'}
              </Text>
              <View style={styles.fareChart}>
                {[
                  { day: 'Mon', pct: 95 },
                  { day: 'Tue', pct: 91 },
                  { day: 'Wed', pct: 79 },
                  { day: 'Thu', pct: 83 },
                  { day: 'Fri', pct: 66 },
                  { day: 'Sat', pct: 86 },
                  { day: 'Sun', pct: 77 },
                ].map((item, idx) => (
                  <View key={idx} style={styles.fareChartCol}>
                    <View style={[styles.fareChartBar, { height: `${item.pct}%` }]} />
                    <Text style={styles.fareChartDay}>{item.day}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.chartLegend}>
                <Text style={styles.chartLegendText}>
                  {hasAirport ? `${refLowFare} demo low` : '₹2,850 demo low'}
                </Text>
                <Text style={styles.chartLegendText}>
                  {hasAirport ? `${refHighFare} demo high` : '₹5,800 demo high'}
                </Text>
              </View>
            </View>

            {/* Tracked Routes Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Watched Flight Fares</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => openModal('addFare')}
              >
                <Text style={styles.addBtnText}>+ Track Route</Text>
              </TouchableOpacity>
            </View>

            {/* Reference quotes (Only includes routes where commercial flights actually operate) */}
            {(hasAirport
              ? [
                  { route: `Pune → ${targetCity}`, fare: refLowFare, date: 'Live watchlist' },
                  { route: 'Mumbai → Delhi', fare: '₹4,600', date: 'Daily nonstop' },
                  { route: 'Pune → Bengaluru', fare: '₹3,890', date: 'Daily nonstop' },
                  { route: 'Pune → Delhi', fare: '₹4,950', date: 'Daily nonstop' },
                  { route: 'Pune → Goa', fare: '₹2,850', date: 'Daily nonstop' },
                ]
              : [
                  { route: 'Mumbai → Delhi', fare: '₹4,600', date: 'Daily nonstop' },
                  { route: 'Pune → Bengaluru', fare: '₹3,890', date: 'Daily nonstop' },
                  { route: 'Pune → Delhi', fare: '₹4,950', date: 'Daily nonstop' },
                  { route: 'Pune → Goa', fare: '₹2,850', date: 'Daily nonstop' },
                ]
            ).map((rf, rIdx) => (
              <View key={rIdx} style={styles.sampleFareRow}>
                <Text style={styles.sampleFareIcon}>✈</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sampleFareRoute}>{rf.route}</Text>
                  <Text style={styles.sampleFareMeta}>
                    {rf.fare} · {rf.date} · illustrative quote
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.bookMiniBtn}
                  onPress={() => setComparingFlight({ route: rf.route, baseFare: rf.fare })}
                >
                  <Text style={styles.bookMiniBtnText}>Compare ↗</Text>
                </TouchableOpacity>
              </View>
            ))}

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
          </View>
        )}

        {/* ==================== 3. DOCUMENTS TAB ==================== */}
        {currentTab === 'family' && (
          <View style={styles.section}>
            <TravelDocumentsChecklist />
          </View>
        )}

        {/* ==================== 4. TATKAL TAB ==================== */}
        {currentTab === 'rail' && (
          <View style={styles.section}>
            {/* 1. Tatkal Sage Card (Exact match to index.html n68Travel rail) */}
            <View style={styles.featureSageCard}>
              <Text style={styles.featureKicker}>Tatkal reminder · Pune → {targetCity}</Text>
              <Text style={styles.featureTitle}>19 Nov 2026</Text>
              <Text style={styles.featureSub}>10:00 AM · AC classes IST</Text>
            </View>

            {/* 2. AI Multi-Modal Travel & Journey Planner (From, To, Date, Return Date, Executive vs Standard AC) */}
            <AiTravelPlanner />

            {/* 3. Saved Master Passenger List */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>IRCTC Master Passenger List</Text>
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
            {/* Peach Feature Card (Exact match to index.html n68Travel history) */}
            <View style={styles.featurePeachCard}>
              <Text style={styles.featureKickerPeach}>Travel memories · demo</Text>
              <Text style={styles.featureTitlePeach}>12 journeys</Text>
              <Text style={styles.featureSubPeach}>
                Illustrative reconstruction from calendar, chats and receipts
              </Text>
            </View>

            {/* Historic journeys from index.html */}
            {[
              ['Sep 2026', 'Hyderabad', 'Project review · flight receipts'],
              ['Aug 2026', 'Vadodara', 'Manjalpur school visit'],
              ['Jul 2026', 'Mumbai', 'Family weekend'],
              ['May 2026', 'Udaipur', 'Learning community research'],
              ['Apr 2026', 'Bengaluru', 'Sports conference'],
              ['Feb 2026', 'Goa', 'Family leisure'],
            ].map(([date, place, context], idx) => (
              <View key={idx} style={styles.historyRow}>
                <Text style={styles.historyIcon}>⌁</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyPlace}>{place}</Text>
                  <Text style={styles.historyContext}>
                    {date} · {context}
                  </Text>
                </View>
                <Text style={styles.historyArrow}>↗</Text>
              </View>
            ))}

            {/* Any completed trips from store */}
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
                {!!tr.details && <Text style={styles.tripDetails}>{tr.details}</Text>}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) matching index.html / Screenshot 1 */}
      <TouchableOpacity
        style={styles.fabButton}
        activeOpacity={0.8}
        onPress={() => showToast('NRYN Assistant ready', 'info')}
      >
        <Text style={styles.fabIcon}>✱</Text>
      </TouchableOpacity>

      {/* Modals */}
      <AddTripSheet />
      <AddFareSheet />
      <AddDocumentSheet />
      <TripDetailSheet />

      {/* Live Airline Fare Comparison Modal */}
      {comparingFlight && (
        <CompareFlightSheet
          visible={!!comparingFlight}
          route={comparingFlight.route}
          baseFare={comparingFlight.baseFare}
          onClose={() => setComparingFlight(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  minimalHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  minimalBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  minimalBackChevron: {
    fontSize: 26,
    lineHeight: 26,
    color: '#344738',
    fontWeight: '300',
  },
  minimalTitle: {
    fontSize: 22,
    fontFamily: 'Georgia',
    fontWeight: '700',
    color: '#28362c',
    letterSpacing: -0.4,
  },
  fabButton: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#385240', // exact dark green from screenshot 1
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
    zIndex: 99,
  },
  fabIcon: {
    fontSize: 26,
    color: '#edf5ee',
    lineHeight: 26,
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
  // Sage Feature Card (.n68-feature.n68-sage)
  featureSageCard: {
    backgroundColor: '#e9f0e7',
    borderRadius: 22,
    padding: 22,
    marginBottom: 14,
  },
  featureKicker: {
    fontSize: 11,
    color: '#7a8d7d',
    fontWeight: '500',
    marginBottom: 4,
  },
  featureTitle: {
    fontFamily: 'Georgia',
    fontSize: 30,
    color: '#455e4d',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  featureDate: {
    fontFamily: 'Georgia',
    fontSize: 28,
    color: '#455e4d',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  featureSub: {
    fontSize: 12,
    color: '#6d806f',
  },

  // Fare Chart
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#425745',
    marginBottom: 12,
  },
  fareChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: 10,
  },
  fareChartCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 6,
  },
  fareChartBar: {
    width: '65%',
    maxWidth: 26,
    backgroundColor: '#a3bea9',
    borderRadius: 6,
  },
  fareChartDay: {
    fontSize: 10,
    color: '#99a998',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f3ee',
    paddingTop: 8,
  },
  chartLegendText: {
    fontSize: 11,
    color: '#869987',
  },

  // Sample Fare Rows
  sampleFareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e7ece6',
    gap: 12,
  },
  sampleFareIcon: {
    fontSize: 18,
    color: '#769082',
  },
  sampleFareRoute: {
    fontSize: 13,
    fontWeight: '700',
    color: '#28362c',
  },
  sampleFareMeta: {
    fontSize: 11,
    color: '#8a9b8e',
    marginTop: 2,
  },
  bookMiniBtn: {
    backgroundColor: '#edf4ee',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  bookMiniBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#45604d',
  },

  // Peach Feature Card (.n68-feature.n68-peach)
  featurePeachCard: {
    backgroundColor: '#f3eae2',
    borderRadius: 22,
    padding: 22,
    marginBottom: 14,
  },
  featureKickerPeach: {
    fontSize: 11,
    color: '#9b7f73',
    fontWeight: '500',
    marginBottom: 4,
  },
  featureTitlePeach: {
    fontFamily: 'Georgia',
    fontSize: 30,
    color: '#654b3d',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  featureSubPeach: {
    fontSize: 12,
    color: '#8c766b',
  },

  // History Rows
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee9e3',
    gap: 12,
  },
  historyIcon: {
    fontSize: 18,
    color: '#b58b73',
  },
  historyPlace: {
    fontSize: 14,
    fontWeight: '700',
    color: '#28362c',
  },
  historyContext: {
    fontSize: 11,
    color: '#8a928b',
    marginTop: 2,
  },
  historyArrow: {
    fontSize: 14,
    color: '#769082',
  },
});
