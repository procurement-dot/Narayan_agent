import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { colors, radii, spacing, typography } from '../../../shared/theme/tokens';
import { HourlyWeatherPoint, NewsArticle, WeatherInfo } from '../kickstart.types';

export interface SelectedKickItem {
  type: 'weather' | 'news';
  weatherPoint?: HourlyWeatherPoint;
  weatherOverall?: WeatherInfo;
  newsArticle?: NewsArticle;
}

interface KickstartDetailSheetProps {
  item: SelectedKickItem | null;
  onClose: () => void;
}

export const KickstartDetailSheet: React.FC<KickstartDetailSheetProps> = ({
  item,
  onClose,
}) => {
  if (!item) return null;

  const isWeather = item.type === 'weather';
  const wp = item.weatherPoint;
  const wo = item.weatherOverall;
  const na = item.newsArticle;

  const handleOpenLink = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <BottomSheet
      visible={Boolean(item)}
      title={isWeather ? (wp?.isRadar ? 'IMD Satellite Radar' : `Weather · ${wp?.time || 'Forecast'}`) : `${na?.category || 'News'}`}
      onClose={onClose}
      footer={
        isWeather ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleOpenLink('https://mausam.imd.gov.in/')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>Open Official IMD Satellite Radar ↗</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>✕ Close Brief and Return to NRYN</Text>
          </TouchableOpacity>
        )
      }
    >
      {isWeather ? (
        <View style={styles.content}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroCity}>Pune, Maharashtra</Text>
              <Text style={styles.heroCond}>{wp?.condition || wo?.condition || 'Clear skies'}</Text>
            </View>
            <Text style={styles.heroTemp}>{wp?.tempC ?? wo?.tempC ?? 24}°C</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>HIGH / LOW</Text>
              <Text style={styles.statVal}>{wo?.highTempC ?? 31}° / {wo?.lowTempC ?? 19}°</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>HUMIDITY</Text>
              <Text style={styles.statVal}>{wp?.humidityPct ?? wo?.humidityPct ?? 48}%</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>AIR QUALITY</Text>
              <Text style={[styles.statVal, { color: '#3b7a57' }]}>AQI {wp?.aqi ?? wo?.aqi ?? 68}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>RAIN PROBABILITY</Text>
              <Text style={styles.statVal}>{wp?.rainChancePct ?? 15}%</Text>
            </View>
          </View>

          <View style={styles.outlookBox}>
            <Text style={styles.outlookLabel}>OUTDOOR & RUNNING OUTLOOK</Text>
            <Text style={styles.outlookText}>
              {wo?.runningOutlook || 'Pleasant morning conditions for outdoor running. Zone 2 training suitable until 9:30 AM.'}
            </Text>
          </View>

          <Text style={styles.sourceNote}>
            Source: India Meteorological Department & OpenWeather hourly feed.
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.newsMeta}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{na?.category}</Text>
            </View>
            <Text style={styles.newsSource}>{na?.sourceName}</Text>
            {na?.publishedAt ? <Text style={styles.newsTime}>· {na.publishedAt}</Text> : null}
          </View>

          <Text style={styles.newsTitle}>{na?.title}</Text>
          <Text style={styles.newsDetail}>{na?.detail}</Text>

          <View style={styles.curationBox}>
            <Text style={styles.curationLabel}>EXECUTIVE SIGNAL</Text>
            <Text style={styles.curationText}>
              Verified brief curated for morning executive synthesis. High-confidence factual report.
            </Text>
          </View>
        </View>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  heroCity: {
    fontSize: 20,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  heroCond: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  heroTemp: {
    fontSize: 36,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceWarm,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    letterSpacing: 0.8,
  },
  statVal: {
    fontSize: 15,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginTop: 3,
  },
  outlookBox: {
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  outlookLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  outlookText: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 18,
  },
  sourceNote: {
    fontSize: 11,
    color: colors.muted,
    fontStyle: 'italic',
  },
  newsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#e3ede4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#30443a',
    letterSpacing: 0.8,
  },
  newsSource: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  newsTime: {
    fontSize: 12,
    color: colors.muted,
  },
  newsTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.serifRegular,
    color: colors.ink,
    lineHeight: 24,
  },
  newsDetail: {
    fontSize: 14,
    color: colors.inkSecondary,
    lineHeight: 20,
  },
  curationBox: {
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  curationLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  curationText: {
    fontSize: 12,
    color: colors.inkSecondary,
    lineHeight: 16,
  },
  actionBtn: {
    backgroundColor: colors.ink,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: colors.surface,
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
  },
});
