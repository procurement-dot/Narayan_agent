import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { usePrayanStore } from './prayan.store';
import { AppHeader } from '../navigation/AppHeader';
import { PillTabs } from '../../shared/components/PillTabs';
import { PrayanTab } from './prayan.types';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';
import { useToast } from '../../shared/components/Toast';

const PRAYAN_TABS: { id: PrayanTab; label: string }[] = [
  { id: 'world', label: 'His World' },
  { id: 'ideas', label: 'Explore' },
  { id: 'journey', label: 'Journey' },
  { id: 'community', label: 'Community' },
  { id: 'parent', label: 'For You' },
];

export const PrayanScreen: React.FC = () => {
  const { currentTab, setTab, records, milestones } = usePrayanStore();
  const { showToast } = useToast();

  return (
    <View style={styles.container}>
      <AppHeader
        kicker="GROWTH & WONDER · PRAYAN"
        title="Curiosity in motion."
        subtitle="Speedcubing, making, questions and mindful parenting."
      />

      <View style={styles.tabsContainer}>
        <PillTabs
          tabs={PRAYAN_TABS}
          activeTab={currentTab}
          onSelect={(t) => setTab(t as PrayanTab)}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentTab === 'world' && (
          <View style={styles.section}>
            {/* Speedcubing Hero Card */}
            <View style={styles.cardPeach}>
              <Text style={styles.cardKicker}>ACTIVE PASSION · SPEEDCUBING</Text>
              <Text style={styles.heroTitle}>3×3 Rubik's Cube</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeBox}>
                  <Text style={styles.timeVal}>14.82s</Text>
                  <Text style={styles.timeLabel}>Personal Best Single</Text>
                </View>
                <View style={styles.timeDivider} />
                <View style={styles.timeBox}>
                  <Text style={styles.timeVal}>18.40s</Text>
                  <Text style={styles.timeLabel}>Average of 5 (Ao5)</Text>
                </View>
              </View>
            </View>

            {/* Current Curiosity */}
            <View style={styles.card}>
              <Text style={styles.cardKicker}>TODAY'S QUESTION</Text>
              <Text style={styles.cardTitle}>"Why do magnets attract only some metals?"</Text>
              <Text style={styles.cardDesc}>
                Sparked from his DIY electro-magnet kit. Recommended an unhurried 15-minute experiment this evening.
              </Text>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => showToast('Activity saved to unhurried family time', 'success')}
              >
                <Text style={styles.actionBtnText}>Plan evening discovery ↗</Text>
              </TouchableOpacity>
            </View>

            {/* Records Table */}
            <Text style={styles.sectionTitle}>Cube Discipline Bests</Text>
            {records.map((r, i) => (
              <View key={i} style={styles.card}>
                <View style={styles.recHeader}>
                  <Text style={styles.recEvent}>{r.event}</Text>
                  <Text style={styles.recBest}>{r.best}</Text>
                </View>
                <Text style={styles.recSub}>Average: {r.average} · {r.date}</Text>
              </View>
            ))}
          </View>
        )}

        {currentTab === 'ideas' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardKicker}>MAKER IDEAS</Text>
              <Text style={styles.cardTitle}>Arduino Robot Obstacle Avoider</Text>
              <Text style={styles.cardDesc}>
                Using ultrasonic distance sensor and small servo motors. Great next step after EV3 line-follower.
              </Text>
            </View>
          </View>
        )}

        {currentTab === 'journey' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Milestone Journey</Text>
            {milestones.map((m, i) => (
              <View key={i} style={styles.card}>
                <View style={styles.milestoneHeader}>
                  <Text style={styles.milestoneTitle}>{m.title}</Text>
                  <Text style={styles.milestoneDate}>{m.date}</Text>
                </View>
                <Text style={styles.milestoneCat}>{m.category}</Text>
                <Text style={styles.milestoneDesc}>{m.desc}</Text>
              </View>
            ))}
          </View>
        )}

        {currentTab === 'community' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardKicker}>WCA COMPETITION CALENDAR</Text>
              <Text style={styles.cardTitle}>Pune Open 2026</Text>
              <Text style={styles.cardDesc}>
                Date: 15-16 Nov 2026 · Venue: Symbiosis Auditorium, Viman Nagar{'\n'}
                Events: 3x3x3, 2x2x2, Pyraminx
              </Text>
            </View>
          </View>
        )}

        {currentTab === 'parent' && (
          <View style={styles.section}>
            <View style={styles.cardWarm}>
              <Text style={styles.cardKicker}>PARENTING INQUIRY</Text>
              <Text style={styles.cardTitle}>Sugata Mitra & Peter Gray</Text>
              <Text style={styles.cardDesc}>
                "Self-directed learning flourishes when children have freedom, tools, and genuine adult interest without intrusive direction."
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
  cardKicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.serifRegular,
    color: colors.ink,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  timeBox: {
    flex: 1,
    alignItems: 'center',
  },
  timeVal: {
    fontSize: 22,
    fontFamily: typography.fontFamily.serifRegular,
    color: colors.ink,
  },
  timeLabel: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  timeDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.08)',
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
  actionBtn: {
    marginTop: spacing.sm,
  },
  actionBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.accent,
  },
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recEvent: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  recBest: {
    fontSize: 15,
    fontFamily: typography.fontFamily.serifRegular,
    color: colors.accent,
  },
  recSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  milestoneDate: {
    fontSize: 11,
    color: colors.accent,
  },
  milestoneCat: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
    marginBottom: 4,
  },
  milestoneDesc: {
    fontSize: 12,
    color: colors.inkSecondary,
    lineHeight: 17,
  },
});
