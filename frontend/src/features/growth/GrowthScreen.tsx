import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useGrowthStore } from './growth.store';
import { AppHeader } from '../navigation/AppHeader';
import { PillTabs } from '../../shared/components/PillTabs';
import { GrowthTab } from './growth.types';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';
import { useToast } from '../../shared/components/Toast';

const GROWTH_TABS: { id: GrowthTab; label: string }[] = [
  { id: 'paths', label: 'Learn' },
  { id: 'schedule', label: 'Practice' },
  { id: 'assessment', label: 'Assess' },
  { id: 'library', label: 'Discover' },
];

export const GrowthScreen: React.FC = () => {
  const { currentTab, setTab, paths, selectPath } = useGrowthStore();
  const { showToast } = useToast();

  return (
    <View style={styles.container}>
      <AppHeader
        kicker="PERSONAL MASTERY · HABITS"
        title="Become yourself."
        subtitle="Deliberate practice, skills, habits and mental models."
      />

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
      >
        {currentTab === 'paths' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Skill Pathways</Text>
            {paths.map((p) => (
              <View key={p.id} style={styles.card}>
                <View style={styles.pathHeader}>
                  <View>
                    <Text style={styles.pathName}>{p.name}</Text>
                    <Text style={styles.pathCat}>{p.category} · {p.level}</Text>
                  </View>
                  <Text style={styles.pathProg}>{p.progress}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${p.progress}%` }]} />
                </View>
                <Text style={styles.modulesHeader}>Key Competencies:</Text>
                {p.modules.map((m, i) => (
                  <Text key={i} style={styles.moduleItem}>✓ {m}</Text>
                ))}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => showToast(`Continuing ${p.name}`, 'info')}
                >
                  <Text style={styles.actionBtnText}>Continue pathway ↗</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {currentTab === 'schedule' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardKicker}>DAILY HABIT RHYTHM</Text>
              <Text style={styles.cardTitle}>Deliberate Daily Practice</Text>
              <View style={styles.habitRow}>
                <Text style={styles.habitCheck}>✓</Text>
                <Text style={styles.habitText}>Morning 20m: High-signal reading</Text>
              </View>
              <View style={styles.habitRow}>
                <Text style={styles.habitCheck}>✓</Text>
                <Text style={styles.habitText}>Midday: Zone 2 easy aerobic training</Text>
              </View>
              <View style={styles.habitRow}>
                <Text style={styles.habitPending}>○</Text>
                <Text style={styles.habitText}>Evening 10m: Reflection without screens</Text>
              </View>
            </View>
          </View>
        )}

        {currentTab === 'assessment' && (
          <View style={styles.section}>
            <View style={styles.cardWarm}>
              <Text style={styles.cardKicker}>SELF EVALUATION</Text>
              <Text style={styles.cardTitle}>Systems Thinking Maturity</Text>
              <Text style={styles.cardDesc}>
                Score: 78/100 · High score in recognizing feedback delays and unintended consequences.
              </Text>
            </View>
          </View>
        )}

        {currentTab === 'library' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardKicker}>CURATED DISCOVERIES</Text>
              <Text style={styles.cardTitle}>Thinking in Systems — Donella Meadows</Text>
              <Text style={styles.cardDesc}>
                Fundamental primer on stocks, flows and systemic leverage points.
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
    marginTop: 4,
    marginBottom: 2,
  },
  moduleItem: {
    fontSize: 12,
    color: colors.inkSecondary,
    paddingVertical: 1,
  },
  actionBtn: {
    marginTop: spacing.sm,
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
    paddingVertical: 6,
  },
  habitCheck: {
    color: '#3b7a57',
    fontWeight: '700',
  },
  habitPending: {
    color: colors.muted,
  },
  habitText: {
    fontSize: 13,
    color: colors.ink,
  },
});
