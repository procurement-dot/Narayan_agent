import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useHealthStore } from './health.store';
import { AppHeader } from '../navigation/AppHeader';
import { PillTabs } from '../../shared/components/PillTabs';
import { HealthTab, PersonName } from './health.types';
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
    selectedPerson,
    setSelectedPerson,
    isLoading,
    isRefreshing,
    vitals,
    coachSuggestion,
    weeklyRhythm,
    goals,
    plan,
    events,
    documents,
    journalText,
    setJournalText,
    saveJournal,
    savedJournals,
    fetchDashboard,
    refreshDashboard,
    toggleTrainingStatus,
    syncWorkoutToCalendar,
    updateGoalProgress,
    addGoal,
    uploadDocument,
  } = useHealthStore();

  const { showToast } = useToast();

  // Local Form States
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('Speed endurance');
  const [newGoalDate, setNewGoalDate] = useState('Next target');

  const [showAddReport, setShowAddReport] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState('');
  const [newReportType, setNewReportType] = useState('Blood Test');

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleSaveJournal = async () => {
    if (!journalText.trim()) {
      showToast('Please write a note before saving', 'warning');
      return;
    }
    await saveJournal();
    showToast('Reflection saved! AI coach feedback generated.', 'success');
  };

  const handleSyncToCalendar = async (sessionId?: string) => {
    const title = await syncWorkoutToCalendar(sessionId);
    showToast(`"${title}" added to today's 24-hr calendar!`, 'success');
  };

  const handleToggleWorkout = async (id: string) => {
    await toggleTrainingStatus(id);
    showToast('Training session updated', 'info');
  };

  const handleCreateGoal = async () => {
    if (!newGoalName.trim()) {
      showToast('Please enter goal name', 'warning');
      return;
    }
    await addGoal(newGoalName.trim(), newGoalDate, newGoalCategory);
    setNewGoalName('');
    setShowAddGoal(false);
    showToast('New fitness goal created!', 'success');
  };

  const handleUploadReport = async () => {
    if (!newReportTitle.trim()) {
      showToast('Please enter report title', 'warning');
      return;
    }
    await uploadDocument(newReportTitle.trim(), newReportType);
    setNewReportTitle('');
    setShowAddReport(false);
    showToast('Medical document indexed into health memory!', 'success');
  };

  const formatSleepDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshDashboard}
            tintColor={colors.ink}
            colors={[colors.ink]}
          />
        }
      >
        {isLoading && !isRefreshing && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.ink} />
            <Text style={styles.loadingText}>Syncing health signals...</Text>
          </View>
        )}

        {/* 1. TODAY TAB */}
        {currentTab === 'today' && (
          <View style={styles.section}>
            {/* Vitals Summary Card */}
            <View style={styles.cardPeach}>
              <View style={styles.kickerRow}>
                <Text style={styles.cardKicker}>TODAY'S RECOVERY</Text>
                <Text style={styles.badgeText}>{vitals.source || 'Garmin Venu 2 Plus'}</Text>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{vitals.resting_hr}</Text>
                  <Text style={styles.statLabel}>Resting HR (bpm)</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{formatSleepDuration(vitals.sleep_duration_minutes)}</Text>
                  <Text style={styles.statLabel}>Sleep duration</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{vitals.recovery_score}%</Text>
                  <Text style={styles.statLabel}>Recovery score</Text>
                </View>
              </View>
            </View>

            {/* Coach Suggestion */}
            <View style={styles.card}>
              <View style={styles.kickerRow}>
                <Text style={styles.cardKicker}>{coachSuggestion.category}</Text>
                <Text style={styles.badgeAi}>AI COACH</Text>
              </View>
              <Text style={styles.cardTitle}>{coachSuggestion.title}</Text>
              <Text style={styles.cardDesc}>{coachSuggestion.description}</Text>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleSyncToCalendar(coachSuggestion.recommendedWorkoutId)}
              >
                <Text style={styles.actionBtnText}>Add to Calendar ↗</Text>
              </TouchableOpacity>
            </View>

            {/* 7-day rhythm chart */}
            <View style={styles.card}>
              <View style={styles.kickerRow}>
                <Text style={styles.cardKicker}>WEEKLY TRAINING LOAD</Text>
                <Text style={styles.badgeText}>7-Day Rhythm</Text>
              </View>
              <View style={styles.rhythmBars}>
                {weeklyRhythm.map((item, i) => (
                  <View key={i} style={styles.barCol}>
                    <View style={[styles.barFill, { height: `${item.load}%` }]} />
                    <Text style={styles.barDay}>{item.day}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* 2. GOALS TAB */}
        {currentTab === 'goals' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Active Fitness & Endurance Targets</Text>
              <TouchableOpacity
                style={styles.smallOutlineBtn}
                onPress={() => setShowAddGoal(!showAddGoal)}
              >
                <Text style={styles.smallOutlineBtnText}>{showAddGoal ? 'Cancel' : '+ New Goal'}</Text>
              </TouchableOpacity>
            </View>

            {/* Add Goal Inline Form */}
            {showAddGoal && (
              <View style={styles.inlineFormCard}>
                <Text style={styles.cardKicker}>CREATE FITNESS GOAL</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 10km Sub-48 min run"
                  value={newGoalName}
                  onChangeText={setNewGoalName}
                  placeholderTextColor={colors.muted}
                />
                <View style={styles.formRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="Category (e.g. Speed Endurance)"
                    value={newGoalCategory}
                    onChangeText={setNewGoalCategory}
                    placeholderTextColor={colors.muted}
                  />
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="Target Date"
                    value={newGoalDate}
                    onChangeText={setNewGoalDate}
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateGoal}>
                  <Text style={styles.primaryBtnText}>Save Goal</Text>
                </TouchableOpacity>
              </View>
            )}

            {goals.map((g) => (
              <View key={g.id} style={styles.card}>
                <View style={styles.goalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalTitle}>{g.name}</Text>
                    <Text style={styles.goalSub}>
                      {g.category} · {g.date}
                    </Text>
                  </View>
                  <View style={styles.progressActions}>
                    <TouchableOpacity
                      style={styles.microBtn}
                      onPress={() => updateGoalProgress(g.id, g.progress - 5)}
                    >
                      <Text style={styles.microBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.goalProgress}>{g.progress}%</Text>
                    <TouchableOpacity
                      style={styles.microBtn}
                      onPress={() => updateGoalProgress(g.id, g.progress + 5)}
                    >
                      <Text style={styles.microBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${g.progress}%` }]} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 3. 12-WEEK PLAN TAB */}
        {currentTab === 'plan' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Week 4 of 12 — Speed Endurance</Text>
              <Text style={styles.badgeText}>Tap status to toggle</Text>
            </View>

            {plan.map((d, i) => (
              <View
                key={d.id || i}
                style={[
                  styles.card,
                  d.status === 'today' && styles.cardHighlight,
                ]}
              >
                <View style={styles.planRow}>
                  <View
                    style={[
                      styles.planDayBadge,
                      d.status === 'completed' && styles.planDayCompleted,
                    ]}
                  >
                    <Text
                      style={[
                        styles.planDayText,
                        d.status === 'completed' && styles.planDayCompletedText,
                      ]}
                    >
                      {d.day}
                    </Text>
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={styles.planWorkout}>{d.workout}</Text>
                    <Text style={styles.planDist}>{d.distance}</Text>
                  </View>

                  <View style={styles.planStatusWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.statusPill,
                        d.status === 'completed' && styles.statusCompleted,
                        d.status === 'today' && styles.statusToday,
                      ]}
                      onPress={() => handleToggleWorkout(d.id || d.day)}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          d.status === 'completed' && styles.statusCompletedText,
                          d.status === 'today' && styles.statusTodayText,
                        ]}
                      >
                        {d.status === 'completed'
                          ? '✓ Done'
                          : d.status === 'today'
                          ? 'Today'
                          : 'Upcoming'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.iconCalBtn}
                      onPress={() => handleSyncToCalendar(d.id)}
                      accessibilityLabel="Sync to Calendar"
                    >
                      <Text style={styles.iconCalBtnText}>📅</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 4. BODY & FAMILY RECORDS TAB */}
        {currentTab === 'body' && (
          <View style={styles.section}>
            <View style={styles.familyPills}>
              {(['Self', 'Neha', 'Prayan'] as const).map((p: PersonName) => (
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

            {/* Profile Vitals Overview */}
            <View style={styles.card}>
              <Text style={styles.cardKicker}>{selectedPerson.toUpperCase()}'S VITALS & METRICS</Text>
              <Text style={styles.cardTitle}>Baseline & Physiological Profile</Text>
              <Text style={styles.cardDesc}>
                Resting Heart Rate: {vitals.resting_hr} bpm{'\n'}
                Sleep Average: {formatSleepDuration(vitals.sleep_duration_minutes)}{'\n'}
                Hydration Target: {vitals.hydration_liters || 3.2}L / day{'\n'}
                Recovery Score: {vitals.recovery_score}%
              </Text>
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => setShowAddReport(!showAddReport)}
              >
                <Text style={styles.outlineBtnText}>
                  {showAddReport ? 'Cancel' : '+ Upload Lab Report'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Add Report Form */}
            {showAddReport && (
              <View style={styles.inlineFormCard}>
                <Text style={styles.cardKicker}>INDEX LAB REPORT</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Report Title (e.g. Lipid Profile, CBC)"
                  value={newReportTitle}
                  onChangeText={setNewReportTitle}
                  placeholderTextColor={colors.muted}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Document Type (e.g. Blood Test, MRI)"
                  value={newReportType}
                  onChangeText={setNewReportType}
                  placeholderTextColor={colors.muted}
                />
                <TouchableOpacity style={styles.primaryBtn} onPress={handleUploadReport}>
                  <Text style={styles.primaryBtnText}>Save & Index Document</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Medical Documents List */}
            <Text style={styles.sectionTitle}>Indexed Lab Reports & Documents</Text>
            {documents.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardDesc}>No medical documents uploaded yet.</Text>
              </View>
            ) : (
              documents.map((doc) => (
                <View key={doc.id} style={styles.card}>
                  <View style={styles.kickerRow}>
                    <Text style={styles.cardKicker}>{doc.doc_type.toUpperCase()}</Text>
                    <Text style={styles.badgeText}>{doc.test_date}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{doc.title}</Text>
                  {doc.extracted_summary && (
                    <Text style={styles.reportSummary}>{doc.extracted_summary}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* 5. TARGET EVENTS TAB */}
        {currentTab === 'events' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Target Races & Competitions</Text>
              <Text style={styles.badgeText}>{events.length} Upcoming</Text>
            </View>

            {events.map((e) => (
              <View key={e.id} style={styles.card}>
                <View style={styles.eventRow}>
                  <View style={styles.eventDateBadge}>
                    <Text style={styles.eventDateText}>{e.date}</Text>
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{e.name}</Text>
                    <Text style={styles.eventSub}>
                      {e.sport} · {e.region}
                    </Text>
                  </View>
                  {e.registered && (
                    <View style={styles.regBadge}>
                      <Text style={styles.regBadgeText}>Registered</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 6. JOURNAL & REFLECTION TAB */}
        {currentTab === 'journal' && (
          <View style={styles.section}>
            <View style={styles.cardWarm}>
              <View style={styles.kickerRow}>
                <Text style={styles.cardKicker}>DAILY REFLECTION</Text>
                <Text style={styles.badgeText}>{selectedPerson}</Text>
              </View>
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
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveJournal}>
                <Text style={styles.primaryBtnText}>Save Reflection</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Previous Reflections</Text>
            {savedJournals.map((j, idx) => (
              <View key={j.id || idx} style={styles.card}>
                <View style={styles.kickerRow}>
                  <Text style={styles.journalDate}>{j.date}</Text>
                  {j.energy_level && (
                    <Text style={styles.badgeText}>Energy: {j.energy_level}</Text>
                  )}
                </View>
                <Text style={styles.journalBody}>{j.text}</Text>

                {j.ai_coach_reflection && (
                  <View style={styles.aiReflectionBox}>
                    <Text style={styles.aiReflectionKicker}>💡 COACH INSIGHT</Text>
                    <Text style={styles.aiReflectionText}>{j.ai_coach_reflection}</Text>
                  </View>
                )}
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
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  loadingText: {
    fontSize: 12,
    color: colors.muted,
  },
  kickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
  },
  badgeAi: {
    fontSize: 9,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#0d6efd',
    backgroundColor: '#e7f1ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    letterSpacing: 0.5,
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
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '600',
    color: colors.ink,
  },
  statLabel: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  actionBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
  },
  rhythmBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 70,
    marginTop: spacing.sm,
    paddingTop: 10,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: 14,
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    minHeight: 8,
  },
  barDay: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 4,
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
  progressActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  microBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceWarm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  microBtnText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  goalProgress: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '600',
    color: colors.ink,
    minWidth: 35,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.pill,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planDayBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  planDayCompleted: {
    backgroundColor: '#e6f4ea',
  },
  planDayText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  planDayCompletedText: {
    color: '#137333',
  },
  planInfo: {
    flex: 1,
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
  planStatusWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceWarm,
  },
  statusCompleted: {
    backgroundColor: '#e6f4ea',
  },
  statusToday: {
    backgroundColor: colors.ink,
  },
  statusPillText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
  },
  statusCompletedText: {
    color: '#137333',
  },
  statusTodayText: {
    color: '#ffffff',
  },
  iconCalBtn: {
    padding: 6,
  },
  iconCalBtnText: {
    fontSize: 14,
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
  reportSummary: {
    fontSize: 12,
    color: colors.inkSecondary,
    lineHeight: 17,
    marginTop: 6,
    backgroundColor: colors.surfaceWarm,
    padding: spacing.xs,
    borderRadius: radii.sm,
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
  regBadge: {
    backgroundColor: '#e6f4ea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  regBadgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#137333',
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
  },
  journalBody: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  aiReflectionBox: {
    marginTop: spacing.sm,
    backgroundColor: '#f3f6fc',
    padding: spacing.sm,
    borderRadius: radii.md,
    borderLeftWidth: 3,
    borderLeftColor: '#0d6efd',
  },
  aiReflectionKicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#0d6efd',
    marginBottom: 2,
  },
  aiReflectionText: {
    fontSize: 12,
    color: colors.ink,
    lineHeight: 16,
  },
  smallOutlineBtn: {
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  smallOutlineBtnText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  inlineFormCard: {
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.ink,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
