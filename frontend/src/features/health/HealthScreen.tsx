import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useHealthStore } from './health.store';
import { AppHeader } from '../navigation/AppHeader';
import { PillTabs } from '../../shared/components/PillTabs';
import { HealthTab } from './health.types';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';
import { useToast } from '../../shared/components/Toast';

const HEALTH_TABS: { id: HealthTab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'goals', label: 'Goals' },
  { id: 'plan', label: '12-Week Plan' },
  { id: 'body', label: 'Body' },
  { id: 'events', label: 'Events' },
  { id: 'journal', label: 'Journal' },
];

export const HealthScreen: React.FC = () => {
  const {
    currentTab,
    setTab,
    goals,
    plan,
    events,
    journalText,
    setJournalText,
    saveJournal,
    savedJournals,
    selectedPerson,
    setSelectedPerson,
  } = useHealthStore();
  const { showToast } = useToast();

  const handleSaveJournal = () => {
    if (!journalText.trim()) {
      showToast('Please write a note before saving', 'warning');
      return;
    }
    saveJournal();
    showToast('Reflection saved to your health journal', 'success');
  };

  return (
    <View style={styles.container}>
      <AppHeader
        kicker="HEALTH · ENDURANCE & RECOVERY"
        title="Listen to your body."
        subtitle="Metrics, marathon build, medical records and daily journal."
      />

      <View style={styles.tabsContainer}>
        <PillTabs
          tabs={HEALTH_TABS}
          activeTab={currentTab}
          onSelect={(t) => setTab(t as HealthTab)}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentTab === 'today' && (
          <View style={styles.section}>
            {/* Vitals Summary Card */}
            <View style={styles.cardPeach}>
              <Text style={styles.cardKicker}>TODAY'S RECOVERY</Text>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>52</Text>
                  <Text style={styles.statLabel}>Resting HR (bpm)</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>7h 25m</Text>
                  <Text style={styles.statLabel}>Sleep duration</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>88%</Text>
                  <Text style={styles.statLabel}>Recovery score</Text>
                </View>
              </View>
            </View>

            {/* Suggested Movement */}
            <View style={styles.card}>
              <Text style={styles.cardKicker}>COACH SUGGESTION</Text>
              <Text style={styles.cardTitle}>Tempo interval session</Text>
              <Text style={styles.cardDesc}>
                Recovery is optimal. Good day for 8 km including 4 × 1 km at 4:50/km pace.
              </Text>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => showToast('Session added to today\'s calendar', 'success')}
              >
                <Text style={styles.actionBtnText}>Add to Calendar ↗</Text>
              </TouchableOpacity>
            </View>

            {/* 7-day rhythm chart */}
            <View style={styles.card}>
              <Text style={styles.cardKicker}>WEEKLY TRAINING LOAD</Text>
              <View style={styles.rhythmBars}>
                {[55, 68, 85, 45, 70, 92, 40].map((h, i) => (
                  <View key={i} style={styles.barCol}>
                    <View style={[styles.barFill, { height: `${h}%` }]} />
                    <Text style={styles.barDay}>
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {currentTab === 'goals' && (
          <View style={styles.section}>
            {goals.map((g) => (
              <View key={g.id} style={styles.card}>
                <View style={styles.goalHeader}>
                  <View>
                    <Text style={styles.goalTitle}>{g.name}</Text>
                    <Text style={styles.goalSub}>{g.category} · {g.date}</Text>
                  </View>
                  <Text style={styles.goalProgress}>{g.progress}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${g.progress}%` }]} />
                </View>
              </View>
            ))}
          </View>
        )}

        {currentTab === 'plan' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Week 4 of 12 — Speed Endurance</Text>
            {plan.map((d, i) => (
              <View
                key={i}
                style={[
                  styles.card,
                  d.status === 'today' && styles.cardHighlight,
                ]}
              >
                <View style={styles.planRow}>
                  <View style={styles.planDayBadge}>
                    <Text style={styles.planDayText}>{d.day}</Text>
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={styles.planWorkout}>{d.workout}</Text>
                    <Text style={styles.planDist}>{d.distance}</Text>
                  </View>
                  <Text style={styles.planStatus}>
                    {d.status === 'completed'
                      ? '✓'
                      : d.status === 'today'
                      ? 'TODAY'
                      : 'Upcoming'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {currentTab === 'body' && (
          <View style={styles.section}>
            <View style={styles.familyPills}>
              {(['Self', 'Neha', 'Prayan'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.familyPill,
                    selectedPerson === p && styles.familyPillActive,
                  ]}
                  onPress={() => setSelectedPerson(p)}
                >
                  <Text
                    style={[
                      styles.familyPillText,
                      selectedPerson === p && styles.familyPillTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardKicker}>{selectedPerson.toUpperCase()}'S VITALS</Text>
              <Text style={styles.cardTitle}>Vitals & Health Metrics</Text>
              <Text style={styles.cardDesc}>
                Resting Heart Rate: 52 bpm{'\n'}
                Sleep Average: 7h 25m{'\n'}
                Hydration Target: 3.2L / day
              </Text>
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => showToast('Medical document upload simulation', 'info')}
              >
                <Text style={styles.outlineBtnText}>+ Upload Lab Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentTab === 'events' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Target Races</Text>
            {events.map((e) => (
              <View key={e.id} style={styles.card}>
                <View style={styles.eventRow}>
                  <View style={styles.eventDateBadge}>
                    <Text style={styles.eventDateText}>{e.date}</Text>
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{e.name}</Text>
                    <Text style={styles.eventSub}>{e.sport} · {e.region}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {currentTab === 'journal' && (
          <View style={styles.section}>
            <View style={styles.cardWarm}>
              <Text style={styles.cardKicker}>DAILY REFLECTION</Text>
              <Text style={styles.cardTitle}>How did your body feel today?</Text>
              <TextInput
                style={styles.journalInput}
                placeholder="Energy, soreness, sleep, mood, training reflections..."
                value={journalText}
                onChangeText={setJournalText}
                multiline
                numberOfLines={4}
                placeholderTextColor={colors.muted}
              />
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleSaveJournal}
              >
                <Text style={styles.primaryBtnText}>Save Reflection</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Previous Reflections</Text>
            {savedJournals.map((j, idx) => (
              <View key={idx} style={styles.card}>
                <Text style={styles.journalDate}>{j.date}</Text>
                <Text style={styles.journalBody}>{j.text}</Text>
              </View>
            ))}
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
  cardPeach: {
    backgroundColor: '#faebe5',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#f2dad0',
  },
  cardWarm: {
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardHighlight: {
    borderColor: colors.ink,
    borderWidth: 1.5,
  },
  cardKicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontFamily: typography.fontFamily.serifRegular,
    color: colors.ink,
  },
  statLabel: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  actionBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.accent,
  },
  rhythmBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 90,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: 18,
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  barDay: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 6,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  goalSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  goalProgress: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.accent,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surfaceWarm,
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planDayBadge: {
    width: 44,
    alignItems: 'center',
  },
  planDayText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  planInfo: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  planWorkout: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  planDist: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  planStatus: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.accent,
  },
  familyPills: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  familyPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  familyPillActive: {
    backgroundColor: colors.ink,
  },
  familyPillText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.inkSecondary,
  },
  familyPillTextActive: {
    color: '#ffffff',
  },
  outlineBtn: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radii.pill,
    paddingVertical: 8,
    alignItems: 'center',
  },
  outlineBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDateBadge: {
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.md,
    marginRight: spacing.sm,
  },
  eventDateText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  eventSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  journalInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 13,
    color: colors.ink,
    marginTop: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: colors.ink,
    paddingVertical: 10,
    borderRadius: radii.pill,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
  },
  journalDate: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    marginBottom: 4,
  },
  journalBody: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 18,
  },
});
