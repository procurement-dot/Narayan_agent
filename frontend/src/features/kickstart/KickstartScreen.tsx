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
import { useKickstartStore } from './kickstart.store';
import { AppHeader } from '../navigation/AppHeader';
import { PillTabs } from '../../shared/components/PillTabs';
import { KickstartTab } from './kickstart.types';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';
import { useToast } from '../../shared/components/Toast';
import { AddTimelineSheet } from './components/AddTimelineSheet';

const TABS: { id: KickstartTab; label: string }[] = [
  { id: 'today', label: 'All' },
  { id: 'weather', label: 'Weather ☀️' },
  { id: 'news', label: 'News 📰' },
  { id: 'astro', label: 'Astrology 🌙' },
];

export const KickstartScreen: React.FC = () => {
  const {
    currentTab,
    setTab,
    isPlaying,
    togglePlay,
    audioBrief,
    timeline,
    weather,
    news,
    astro,
    isLoading,
    fetchKickstartData,
    toggleTimelineItem,
    setAddTimelineOpen,
  } = useKickstartStore();

  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchKickstartData();
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [fetchKickstartData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchKickstartData();
    setRefreshing(false);
  };

  const handleToggleTimeline = async (id: string, title: string, currentlyDone?: boolean) => {
    await toggleTimelineItem(id);
    if (!currentlyDone) {
      showToast(`Completed: "${title}" ✓`, 'success');
    } else {
      showToast(`Marked pending: "${title}"`, 'info');
    }
  };

  const handleToggleAudio = () => {
    if (isPlaying) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      togglePlay();
      showToast('Audio briefing paused', 'info');
    } else {
      togglePlay();
      showToast('Playing 3-minute morning briefing 🎧', 'info');

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const priorityItem = timeline.find((t) => t.isEmphasized && !t.isCompleted) || timeline[0];
        const topNews = news[0]?.title || 'Tech and economy momentum continues';

        const script = `Good morning. Here is your 3-minute executive synthesis. In Pune, weather is ${weather?.tempC ?? 24} degrees celsius with ${weather?.condition?.toLowerCase() ?? 'clear skies'}. Air quality is index ${weather?.aqi ?? 68}, moderate and suitable for your morning run. In your daily agenda, your priority focus is ${priorityItem?.title ?? 'Your day in motion'} scheduled for ${priorityItem?.timeSlot ?? '8:30 AM'}. In top headlines, ${topNews}. Today's mindset focus: execute with calm clarity and unhurried momentum. Have an intentional day.`;

        const utterance = new SpeechSynthesisUtterance(script);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.lang.startsWith('en'))
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onend = () => {
          useKickstartStore.setState({ isPlaying: false });
        };
        utterance.onerror = () => {
          useKickstartStore.setState({ isPlaying: false });
        };

        window.speechSynthesis.speak(utterance);
      }
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        kicker="MORNING BRIEFING · DAILY INTENT"
        title="Start with clarity."
        subtitle="Curated signal across your day, weather and interests."
      />

      {/* Audio Briefing Executive Player */}
      {audioBrief && (
        <View style={styles.briefCard}>
          <View style={styles.briefInfo}>
            <Text style={styles.briefKicker}>NRYN AUDIO BRIEF</Text>
            <Text style={styles.briefTitle}>{audioBrief.title}</Text>
            <Text style={styles.briefDesc}>{audioBrief.summary}</Text>
          </View>
          <TouchableOpacity
            style={[styles.playBtn, isPlaying && styles.playBtnActive]}
            onPress={handleToggleAudio}
            activeOpacity={0.8}
          >
            <Text style={styles.playIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <PillTabs
          tabs={TABS}
          activeTab={currentTab}
          onSelect={(tab) => setTab(tab as KickstartTab)}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.ink}
          />
        }
      >
        {/* ========================================== */}
        {/* 1. ALL / TODAY TAB (Timeline & Agenda)    */}
        {/* ========================================== */}
        {currentTab === 'today' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Agenda & Flow</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setAddTimelineOpen(true)}
              >
                <Text style={styles.addBtnText}>+ Add Task</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.list}>
              {timeline.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    item.isEmphasized && styles.itemCardEmph,
                    item.isCompleted && styles.itemCardDone,
                  ]}
                  onPress={() =>
                    handleToggleTimeline(item.id, item.title, item.isCompleted)
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.checkCol}>
                    <Text
                      style={
                        item.isCompleted
                          ? styles.checkDone
                          : styles.checkPending
                      }
                    >
                      {item.isCompleted ? '✓' : '○'}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.itemNum,
                      item.isCompleted && styles.itemTextStrikethrough,
                    ]}
                  >
                    {item.timeSlot}
                  </Text>

                  <View style={styles.itemBody}>
                    <Text
                      style={[
                        styles.itemTitle,
                        item.isCompleted && styles.itemTextStrikethrough,
                      ]}
                    >
                      {item.title}
                    </Text>
                    {item.detail ? (
                      <Text style={styles.itemDetail}>{item.detail}</Text>
                    ) : null}
                  </View>

                  {item.isEmphasized && !item.isCompleted && (
                    <View style={styles.priorityPill}>
                      <Text style={styles.priorityPillText}>★ Priority</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ========================================== */}
        {/* 2. WEATHER TAB (Pune Weather & AQI)       */}
        {/* ========================================== */}
        {currentTab === 'weather' && weather && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Weather & Environment</Text>
            </View>

            {/* Main Weather Card */}
            <View style={styles.weatherHeroCard}>
              <View style={styles.weatherTopRow}>
                <View>
                  <Text style={styles.weatherCity}>{weather.city}</Text>
                  <Text style={styles.weatherCond}>{weather.condition}</Text>
                </View>
                <Text style={styles.weatherTempBig}>{weather.tempC}°C</Text>
              </View>

              <View style={styles.weatherStatsRow}>
                <View style={styles.weatherStatItem}>
                  <Text style={styles.weatherStatLabel}>HIGH / LOW</Text>
                  <Text style={styles.weatherStatVal}>
                    {weather.highTempC}° / {weather.lowTempC}°
                  </Text>
                </View>
                <View style={styles.weatherStatItem}>
                  <Text style={styles.weatherStatLabel}>HUMIDITY</Text>
                  <Text style={styles.weatherStatVal}>{weather.humidityPct}%</Text>
                </View>
                <View style={styles.weatherStatItem}>
                  <Text style={styles.weatherStatLabel}>AIR QUALITY</Text>
                  <Text style={[styles.weatherStatVal, { color: '#3b7a57' }]}>
                    AQI {weather.aqi}
                  </Text>
                </View>
              </View>
            </View>

            {/* Running & Training Outlook */}
            <View style={styles.cardWarm}>
              <Text style={styles.briefKicker}>OUTDOOR & RUNNING OUTLOOK</Text>
              <Text style={styles.cardTitle}>Morning Athletic Signal</Text>
              <Text style={styles.cardDesc}>{weather.runningOutlook}</Text>
            </View>
          </View>
        )}

        {/* ========================================== */}
        {/* 3. NEWS TAB (Curated Morning Signals)     */}
        {/* ========================================== */}
        {currentTab === 'news' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Curated Morning Signals</Text>
            </View>

            <View style={styles.list}>
              {news.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <Text style={styles.itemNum}>{item.orderNum}</Text>
                  <View style={styles.itemBody}>
                    <View style={styles.newsMetaRow}>
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>
                          {item.category.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.sourceText}>{item.sourceName}</Text>
                    </View>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {item.detail ? (
                      <Text style={styles.itemDetail}>{item.detail}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ========================================== */}
        {/* 4. ASTRO TAB (Astrology & Mindset)        */}
        {/* ========================================== */}
        {currentTab === 'astro' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Astrology & Mindset Intent</Text>
            </View>

            <View style={styles.list}>
              {astro.map((item) => (
                <View key={item.id} style={styles.cardWarm}>
                  <View style={styles.astroHeader}>
                    <Text style={styles.briefKicker}>
                      {item.orderNum} · {item.moonPhase.toUpperCase()}
                    </Text>
                    <Text style={styles.astroDate}>{item.date}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDesc}>{item.detail}</Text>

                  <View style={styles.astroFooter}>
                    <Text style={styles.astroFocusText}>
                      Focus: {item.todayFocus}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Interactive Modal Sheet for Adding Agenda Tasks */}
      <AddTimelineSheet />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  briefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceWarm,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  briefInfo: {
    flex: 1,
  },
  briefKicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    letterSpacing: 1.2,
  },
  briefTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.serifRegular,
    color: colors.ink,
    marginTop: 2,
  },
  briefDesc: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  playBtnActive: {
    backgroundColor: '#3b7a57',
  },
  playIcon: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 2,
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
  list: {
    gap: spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  itemCardEmph: {
    backgroundColor: '#f5f2e8',
    borderColor: '#e2dbc8',
  },
  itemCardDone: {
    opacity: 0.65,
  },
  checkCol: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  checkDone: {
    fontSize: 16,
    color: '#3b7a57',
    fontWeight: '700',
  },
  checkPending: {
    fontSize: 16,
    color: colors.muted,
  },
  itemNum: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.inkSecondary,
    width: 48,
  },
  itemTextStrikethrough: {
    textDecorationLine: 'line-through',
  },
  itemBody: {
    flex: 1,
    marginLeft: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  itemDetail: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  priorityPill: {
    backgroundColor: '#e2dbc8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    marginLeft: 6,
  },
  priorityPillText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  cardWarm: {
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginTop: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  weatherHeroCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  weatherTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  weatherCity: {
    fontSize: 18,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  weatherCond: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  weatherTempBig: {
    fontSize: 32,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  weatherStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  weatherStatItem: {
    alignItems: 'center',
  },
  weatherStatLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    letterSpacing: 0.8,
  },
  weatherStatVal: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginTop: 2,
  },
  newsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  catBadge: {
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  catBadgeText: {
    fontSize: 9,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.inkSecondary,
    letterSpacing: 0.5,
  },
  sourceText: {
    fontSize: 11,
    color: colors.muted,
  },
  astroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  astroDate: {
    fontSize: 11,
    color: colors.muted,
  },
  astroFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  astroFocusText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.accent,
  },
});
