import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useSpiritStore } from './spirit.store';
import { AppHeader } from '../navigation/AppHeader';
import { PillTabs } from '../../shared/components/PillTabs';
import { SpiritTab } from './spirit.types';
import { TEACHERS_LIST } from './spirit.mock';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';
import { useToast } from '../../shared/components/Toast';

const SPIRIT_TABS: { id: SpiritTab; label: string }[] = [
  { id: 'mind', label: 'On your mind' },
  { id: 'lesson', label: "Today's lesson" },
  { id: 'meditate', label: 'Meditation' },
];

export const SpiritScreen: React.FC = () => {
  const {
    currentTab,
    setTab,
    thoughtText,
    setThoughtText,
    selectedTeacher,
    setSelectedTeacher,
    perspectiveResponse,
    seekPerspective,
    clearThought,
    practices,
    meditationDuration,
    setMeditationDuration,
    isMeditating,
    toggleMeditation,
    meditationSecondsLeft,
  } = useSpiritStore();
  const { showToast } = useToast();

  const mins = Math.floor(meditationSecondsLeft / 60);
  const secs = meditationSecondsLeft % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <AppHeader
        kicker="INNER LIFE · A PRIVATE SPACE"
        title="Come as you are."
        subtitle="There is nothing to prove here. No performance."
      />

      <View style={styles.tabsContainer}>
        <PillTabs
          tabs={SPIRIT_TABS}
          activeTab={currentTab}
          onSelect={(t) => setTab(t as SpiritTab)}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentTab === 'mind' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardKicker}>PRIVATE SCRATCHPAD</Text>
              <Text style={styles.cardTitle}>What is on your mind?</Text>
              <Text style={styles.cardDesc}>
                A confession, an uncomfortable thought, gratitude, fear or anything you haven't said aloud.
              </Text>

              <TextInput
                style={styles.writeInput}
                placeholder="Start wherever you are..."
                value={thoughtText}
                onChangeText={setThoughtText}
                multiline
                numberOfLines={5}
                placeholderTextColor={colors.muted}
              />

              <View style={styles.privacyNote}>
                <Text style={styles.privacyText}>
                  🔒 Private scratchpad · Held in local memory until you choose
                </Text>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.eraseBtn}
                  onPress={() => {
                    clearThought();
                    showToast('Erased completely, no trace left', 'info');
                  }}
                >
                  <Text style={styles.eraseBtnText}>Erase, leave no trace</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.perspectiveBtn}
                  onPress={seekPerspective}
                >
                  <Text style={styles.perspectiveBtnText}>Seek perspective ↗</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Find a perspective that resonates</Text>
              <View style={styles.teachersGrid}>
                {TEACHERS_LIST.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.teacherPill,
                      selectedTeacher === t && styles.teacherPillActive,
                    ]}
                    onPress={() => setSelectedTeacher(t)}
                  >
                    <Text
                      style={[
                        styles.teacherPillText,
                        selectedTeacher === t && styles.teacherPillTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {perspectiveResponse && (
                <View style={styles.responseBox}>
                  <Text style={styles.responseKicker}>A PERSPECTIVE TO EXPLORE</Text>
                  <Text style={styles.responseText}>{perspectiveResponse}</Text>
                  <TouchableOpacity
                    style={styles.closeRespBtn}
                    onPress={clearThought}
                  >
                    <Text style={styles.closeRespText}>Close reflection</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {currentTab === 'lesson' && (
          <View style={styles.section}>
            <View style={styles.cardWarm}>
              <Text style={styles.cardKicker}>A MOMENT TO CONSIDER</Text>
              <Text style={styles.lessonHeading}>
                Can you listen without immediately preparing your answer?
              </Text>
              <Text style={styles.lessonBody}>
                A modern reflection inspired by the spirit of attentive inquiry.
                Today, try one conversation in which you simply listen. Notice what changes without forcing anything.
              </Text>
              <TouchableOpacity
                style={styles.keepBtn}
                onPress={() => showToast('Intention saved to today\'s rhythm', 'success')}
              >
                <Text style={styles.keepBtnText}>Keep this intention ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentTab === 'meditate' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardKicker}>VIGYAN BHAIRAV · NATURAL ATTENTION</Text>
              <Text style={styles.meditateHeading}>Notice the space between breaths.</Text>
              <Text style={styles.cardDesc}>
                Breathe naturally. Do not hold or strain.
              </Text>

              {/* Breathing Ring */}
              <View style={styles.breathCenter}>
                <View style={[styles.breathRing, isMeditating && styles.breathRingActive]}>
                  <Text style={styles.timerText}>{timeFormatted}</Text>
                  <Text style={styles.timerSub}>just notice</Text>
                </View>
              </View>

              <View style={styles.durationsRow}>
                {[2, 3, 5, 10].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.durationPill,
                      meditationDuration === d && styles.durationPillActive,
                    ]}
                    onPress={() => setMeditationDuration(d)}
                  >
                    <Text
                      style={[
                        styles.durationPillText,
                        meditationDuration === d && styles.durationPillTextActive,
                      ]}
                    >
                      {d} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.meditateActionBtn}
                onPress={() => {
                  toggleMeditation();
                  showToast(isMeditating ? 'Practice paused' : 'Practice begun', 'info');
                }}
              >
                <Text style={styles.meditateActionText}>
                  {isMeditating ? 'Pause the practice' : 'Begin the practice'}
                </Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Other ways into stillness</Text>
              {practices.map((p, idx) => (
                <View key={idx} style={styles.practiceCard}>
                  <Text style={styles.practiceNum}>0{idx + 1}</Text>
                  <View style={styles.practiceBody}>
                    <Text style={styles.practiceName}>{p.name}</Text>
                    <Text style={styles.practiceDesc}>{p.desc}</Text>
                  </View>
                  <Text style={styles.practiceDur}>{p.duration}</Text>
                </View>
              ))}
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
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardWarm: {
    backgroundColor: colors.surfaceWarm,
    padding: spacing.lg,
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
    fontSize: 15,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
    marginTop: 4,
  },
  writeInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.ink,
    marginTop: spacing.md,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  privacyNote: {
    marginVertical: spacing.xs,
  },
  privacyText: {
    fontSize: 11,
    color: colors.muted,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  eraseBtn: {
    paddingVertical: 8,
  },
  eraseBtnText: {
    fontSize: 12,
    color: colors.muted,
  },
  perspectiveBtn: {
    backgroundColor: colors.ink,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
  },
  perspectiveBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  teachersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  teacherPill: {
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  teacherPillActive: {
    backgroundColor: colors.ink,
  },
  teacherPillText: {
    fontSize: 11,
    color: colors.inkSecondary,
  },
  teacherPillTextActive: {
    color: '#ffffff',
  },
  responseBox: {
    backgroundColor: '#f2f0ea',
    padding: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.md,
  },
  responseKicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    letterSpacing: 1,
  },
  responseText: {
    fontSize: 13,
    color: colors.ink,
    lineHeight: 19,
    fontStyle: 'italic',
    marginTop: 6,
  },
  closeRespBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  closeRespText: {
    fontSize: 11,
    color: colors.accent,
  },
  lessonHeading: {
    fontSize: 18,
    fontFamily: typography.fontFamily.serifRegular,
    color: colors.ink,
    lineHeight: 24,
    marginTop: 6,
  },
  lessonBody: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  keepBtn: {
    backgroundColor: colors.ink,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
  },
  keepBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
  },
  meditateHeading: {
    fontSize: 16,
    fontFamily: typography.fontFamily.serifRegular,
    color: colors.ink,
    marginTop: 4,
  },
  breathCenter: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  breathRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  breathRingActive: {
    borderColor: colors.accent,
    backgroundColor: '#faf6f4',
  },
  timerText: {
    fontSize: 24,
    fontFamily: typography.fontFamily.serifRegular,
    color: colors.ink,
  },
  timerSub: {
    fontSize: 10,
    color: colors.muted,
  },
  durationsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  durationPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceWarm,
  },
  durationPillActive: {
    backgroundColor: colors.ink,
  },
  durationPillText: {
    fontSize: 12,
    color: colors.inkSecondary,
  },
  durationPillTextActive: {
    color: '#ffffff',
  },
  meditateActionBtn: {
    backgroundColor: colors.ink,
    paddingVertical: 12,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  meditateActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
  },
  practiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  practiceNum: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    width: 28,
  },
  practiceBody: {
    flex: 1,
  },
  practiceName: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  practiceDesc: {
    fontSize: 11,
    color: colors.muted,
  },
  practiceDur: {
    fontSize: 11,
    color: colors.accent,
  },
});
