import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useGrowthStore } from './growth.store';
import { AppHeader } from '../navigation/AppHeader';
import { PillTabs } from '../../shared/components/PillTabs';
import { GrowthTab } from './growth.types';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';
import { useToast } from '../../shared/components/Toast';
import { AddHabitSheet } from './components/AddHabitSheet';
import { AddSkillPathSheet } from './components/AddSkillPathSheet';

const GROWTH_TABS: { id: GrowthTab; label: string }[] = [
  { id: 'paths', label: 'Learn' },
  { id: 'schedule', label: 'Practice' },
  { id: 'assessment', label: 'Assess' },
  { id: 'library', label: 'Discover' },
];

export const GrowthScreen: React.FC = () => {
  const {
    currentTab,
    setTab,
    overview,
    paths,
    habits,
    assessments,
    library,
    isLoading,
    fetchGrowthData,
    toggleHabit,
    advanceSkillProgress,
    updateLibraryStatus,
    setAddHabitOpen,
    setAddSkillOpen,
  } = useGrowthStore();

  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchGrowthData();
  }, [fetchGrowthData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGrowthData();
    setRefreshing(false);
  };

  const handleToggleHabit = async (id: string, title: string, currentlyDone: boolean) => {
    await toggleHabit(id);
    if (!currentlyDone) {
      showToast(`Completed: ${title} ✓`, 'success');
    } else {
      showToast(`Marked pending: ${title}`, 'info');
    }
  };

  const handleAdvancePathway = async (id: string, name: string, currentProgress: number) => {
    if (currentProgress >= 100) {
      showToast(`${name} is already 100% completed! 🎉`, 'success');
      return;
    }
    await advanceSkillProgress(id, 10);
    const nextPct = Math.min(100, currentProgress + 10);
    showToast(`Advanced ${name} to ${nextPct}%! ↗`, 'success');
  };

  const handleToggleLibraryStatus = async (id: string, title: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Completed' ? 'Reading' : 'Completed';
    await updateLibraryStatus(id, nextStatus as 'Reading' | 'Completed');
    showToast(`Marked "${title}" as ${nextStatus}`, 'info');
  };

  return (
    <View style={styles.container}>
      <AppHeader
        kicker="PERSONAL MASTERY · HABITS"
        title="Become yourself."
        subtitle="Deliberate practice, skills, habits and mental models."
      />

      {/* Overview Stat Ribbon */}
      {overview && (
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{overview.activeSkillsCount}</Text>
            <Text style={styles.metricLabel}>ACTIVE SKILLS</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {overview.completedHabitsToday}/{overview.totalHabitsCount}
            </Text>
            <Text style={styles.metricLabel}>
              HABITS ({overview.habitsCompletionPct}%)
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: '#e07a5f' }]}>
              {overview.longestStreak}d 🔥
            </Text>
            <Text style={styles.metricLabel}>BEST STREAK</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{overview.averageAssessmentScore}</Text>
            <Text style={styles.metricLabel}>AVG SCORE</Text>
          </View>
        </View>
      )}

      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <PillTabs
          tabs={GROWTH_TABS}
          activeTab={currentTab}
          onSelect={(t) => setTab(t as GrowthTab)}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />
        }
      >
        {/* ========================================== */}
        {/* 1. LEARN TAB (Skill Pathways) */}
        {/* ========================================== */}
        {currentTab === 'paths' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Skill Pathways</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setAddSkillOpen(true)}
              >
                <Text style={styles.addBtnText}>+ Add Skill</Text>
              </TouchableOpacity>
            </View>

            {paths.map((p) => (
              <View key={p.id} style={styles.card}>
                <View style={styles.pathHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pathName}>{p.name}</Text>
                    <Text style={styles.pathCat}>
                      {p.category} · {p.level}
                    </Text>
                  </View>
                  <Text style={styles.pathProg}>{p.progress}%</Text>
                </View>

                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${p.progress}%` }]} />
                </View>

                {p.modules && p.modules.length > 0 && (
                  <>
                    <Text style={styles.modulesHeader}>Key Competencies:</Text>
                    {p.modules.map((m, i) => (
                      <Text key={i} style={styles.moduleItem}>
                        ✓ {m}
                      </Text>
                    ))}
                  </>
                )}

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleAdvancePathway(p.id, p.name, p.progress)}
                >
                  <Text style={styles.actionBtnText}>Continue pathway ↗</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ========================================== */}
        {/* 2. PRACTICE TAB (Daily Habits) */}
        {/* ========================================== */}
        {currentTab === 'schedule' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.cardKicker}>DAILY HABIT RHYTHM</Text>
                <Text style={styles.sectionTitle}>Deliberate Daily Practice</Text>
              </View>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setAddHabitOpen(true)}
              >
                <Text style={styles.addBtnText}>+ Add Habit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              {habits.map((h) => (
                <TouchableOpacity
                  key={h.id}
                  style={[
                    styles.habitRow,
                    h.isCompletedToday && styles.habitRowCompleted,
                  ]}
                  activeOpacity={0.7}
                  onPress={() =>
                    handleToggleHabit(h.id, h.title, h.isCompletedToday)
                  }
                >
                  <View style={styles.checkboxContainer}>
                    <Text
                      style={
                        h.isCompletedToday
                          ? styles.habitCheck
                          : styles.habitPending
                      }
                    >
                      {h.isCompletedToday ? '✓' : '○'}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.habitText,
                        h.isCompletedToday && styles.habitTextDone,
                      ]}
                    >
                      {h.title}
                    </Text>
                    <Text style={styles.habitMeta}>
                      {h.timeOfDay} · {h.durationMins}m · {h.category}
                    </Text>
                  </View>

                  {h.streakDays > 0 && (
                    <View style={styles.streakBadge}>
                      <Text style={styles.streakText}>{h.streakDays}d 🔥</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ========================================== */}
        {/* 3. ASSESS TAB (Self Evaluations) */}
        {/* ========================================== */}
        {currentTab === 'assessment' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Evaluations & Maturity</Text>
            </View>

            {assessments.map((a) => (
              <View key={a.id} style={styles.cardWarm}>
                <View style={styles.assessmentHeader}>
                  <Text style={styles.cardKicker}>{a.category.toUpperCase()}</Text>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreBadgeText}>
                      {a.score}/{a.maxScore || 100}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>{a.title}</Text>
                {a.summary ? (
                  <Text style={styles.cardDesc}>{a.summary}</Text>
                ) : null}

                {a.strengths && a.strengths.length > 0 && (
                  <View style={styles.tagSection}>
                    <Text style={styles.tagHeader}>Key Strengths:</Text>
                    <View style={styles.tagWrap}>
                      {a.strengths.map((s, idx) => (
                        <View key={idx} style={styles.strengthTag}>
                          <Text style={styles.strengthTagText}>✓ {s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {a.growthAreas && a.growthAreas.length > 0 && (
                  <View style={styles.tagSection}>
                    <Text style={styles.tagHeader}>Growth Areas:</Text>
                    <View style={styles.tagWrap}>
                      {a.growthAreas.map((g, idx) => (
                        <View key={idx} style={styles.growthAreaTag}>
                          <Text style={styles.growthAreaTagText}>↗ {g}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ========================================== */}
        {/* 4. DISCOVER TAB (Curated Library) */}
        {/* ========================================== */}
        {currentTab === 'library' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Curated Knowledge Library</Text>
            </View>

            {library.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.libHeader}>
                  <Text style={styles.cardKicker}>
                    {item.mediaType.toUpperCase()} · {item.category}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.statusPill,
                      item.readingStatus === 'Completed'
                        ? styles.statusPillDone
                        : styles.statusPillReading,
                    ]}
                    onPress={() =>
                      handleToggleLibraryStatus(
                        item.id,
                        item.title,
                        item.readingStatus
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        item.readingStatus === 'Completed'
                          ? styles.statusPillTextDone
                          : styles.statusPillTextReading,
                      ]}
                    >
                      {item.readingStatus}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.cardTitle}>
                  {item.title} — {item.author}
                </Text>
                <Text style={styles.cardDesc}>{item.summary}</Text>

                {item.keyTakeaways && item.keyTakeaways.length > 0 && (
                  <View style={styles.takeawaysContainer}>
                    <Text style={styles.modulesHeader}>Key Takeaways:</Text>
                    {item.keyTakeaways.map((t, idx) => (
                      <Text key={idx} style={styles.takeawayItem}>
                        • {t}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Interactive Bottom Sheet Modals */}
      <AddHabitSheet />
      <AddSkillPathSheet />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: 8,
    marginBottom: spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  metricLabel: {
    fontSize: 9,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    marginTop: 2,
    letterSpacing: 0.5,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  addBtn: {
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  addBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
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
  cardTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  pathHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pathName: {
    fontSize: 15,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  pathCat: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  pathProg: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.accent,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surfaceWarm,
    borderRadius: 3,
    marginVertical: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.ink,
  },
  modulesHeader: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    marginTop: 6,
    marginBottom: 2,
  },
  moduleItem: {
    fontSize: 12,
    color: colors.inkSecondary,
    paddingVertical: 1,
  },
  actionBtn: {
    marginTop: spacing.sm,
    paddingVertical: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.accent,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  habitRowCompleted: {
    opacity: 0.9,
  },
  checkboxContainer: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitCheck: {
    fontSize: 16,
    color: '#3b7a57',
    fontWeight: '700',
  },
  habitPending: {
    fontSize: 16,
    color: colors.muted,
  },
  habitText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  habitTextDone: {
    color: colors.inkSecondary,
  },
  habitMeta: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  streakBadge: {
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  streakText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#e07a5f',
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  scoreBadgeText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  tagSection: {
    marginTop: 8,
  },
  tagHeader: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    marginBottom: 4,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  strengthTag: {
    backgroundColor: 'rgba(59, 122, 87, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  strengthTagText: {
    fontSize: 11,
    color: '#3b7a57',
  },
  growthAreaTag: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  growthAreaTagText: {
    fontSize: 11,
    color: colors.inkSecondary,
  },
  libHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  statusPillReading: {
    backgroundColor: 'rgba(224, 122, 95, 0.12)',
  },
  statusPillDone: {
    backgroundColor: 'rgba(59, 122, 87, 0.12)',
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
  },
  statusPillTextReading: {
    color: '#e07a5f',
  },
  statusPillTextDone: {
    color: '#3b7a57',
  },
  takeawaysContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  takeawayItem: {
    fontSize: 12,
    color: colors.inkSecondary,
    lineHeight: 16,
    paddingVertical: 1,
  },
});
