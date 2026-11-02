import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useKickstartStore } from './kickstart.store';
import { KICKSTART_DATA } from './kickstart.mock';
import { AppHeader } from '../navigation/AppHeader';
import { PillTabs } from '../../shared/components/PillTabs';
import { KickstartTab } from './kickstart.types';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';
import { useToast } from '../../shared/components/Toast';

const TABS: { id: KickstartTab; label: string }[] = [
  { id: 'today', label: 'All' },
  { id: 'weather', label: 'Weather ☀️' },
  { id: 'news', label: 'News 📰' },
  { id: 'astro', label: 'Astrology 🌙' },
];

export const KickstartScreen: React.FC = () => {
  const { currentTab, setTab, isPlaying, togglePlay, selectItem } = useKickstartStore();
  const { showToast } = useToast();

  const items = KICKSTART_DATA[currentTab] || [];

  return (
    <View style={styles.container}>
      <AppHeader
        kicker="MORNING BRIEFING · DAILY INTENT"
        title="Start with clarity."
        subtitle="Curated signal across your day, weather and interests."
      />

      {/* Audio briefing card */}
      <View style={styles.briefCard}>
        <View style={styles.briefInfo}>
          <Text style={styles.briefKicker}>NRYN AUDIO BRIEF</Text>
          <Text style={styles.briefTitle}>Morning 3-minute synthesis</Text>
          <Text style={styles.briefDesc}>
            Summary of meetings, news and weather.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.playBtn}
          onPress={() => {
            togglePlay();
            showToast(
              isPlaying ? 'Audio briefing paused' : 'Playing 3-minute morning briefing',
              'info'
            );
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.playIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
        </TouchableOpacity>
      </View>

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
      >
        <View style={styles.list}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemCard, item.emph && styles.itemCardEmph]}
              onPress={() => {
                selectItem(item.id);
                showToast(`Briefing: ${item.title}`, 'info');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.itemNum}>{item.num}</Text>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.detail ? (
                  <Text style={styles.itemDetail}>{item.detail}</Text>
                ) : null}
              </View>
              <Text style={styles.arrowIcon}>↗</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    fontSize: 14,
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
  itemNum: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.accent,
    width: 50,
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    textTransform: 'capitalize',
  },
  itemDetail: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 14,
    color: colors.muted,
    marginLeft: spacing.xs,
  },
});
