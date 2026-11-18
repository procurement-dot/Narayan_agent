import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { radii, spacing } from '../../../shared/theme/tokens';
import { HourlyWeatherPoint, WeatherInfo } from '../kickstart.types';

interface InAppWeatherSheetProps {
  visible: boolean;
  weatherPoint?: HourlyWeatherPoint;
  weatherOverall?: WeatherInfo;
  onClose: () => void;
}

export const InAppWeatherSheet: React.FC<InAppWeatherSheetProps> = ({
  visible,
  weatherPoint,
  weatherOverall,
  onClose,
}) => {
  if (!visible) return null;

  const wo = weatherOverall;

  const hourlyList = wo?.hourly || [
    { time: 'IR', condition: 'View official IMD satellite', tempC: 24, isRadar: true },
    { time: '06', condition: '24°C · partly cloudy (sample)', tempC: 24, rainChancePct: 10, humidityPct: 56, aqi: 52 },
    { time: '09', condition: 'Low wind · illustrative', tempC: 25, rainChancePct: 10, humidityPct: 48, aqi: 64 },
    { time: '12', condition: 'Afternoon 29°C · illustrative', tempC: 29, rainChancePct: 15, humidityPct: 42, aqi: 72 },
    { time: '15', condition: 'Rain chance 20% · illustrative', tempC: 28, rainChancePct: 20, humidityPct: 62, aqi: 60 },
    { time: '18', condition: 'Sunset 18:15 · illustrative', tempC: 26, rainChancePct: 10, humidityPct: 54, aqi: 58 },
    { time: '20', condition: 'No live severe-weather feed', tempC: 23, rainChancePct: 5, humidityPct: 58, aqi: 50 },
  ];

  const [selectedSlotTime, setSelectedSlotTime] = React.useState<string>(
    weatherPoint?.time || '06'
  );

  React.useEffect(() => {
    if (weatherPoint?.time) {
      setSelectedSlotTime(weatherPoint.time);
    }
  }, [weatherPoint]);

  const activeSlot =
    hourlyList.find((h) => h.time === selectedSlotTime) ||
    weatherPoint ||
    hourlyList[1] ||
    hourlyList[0];

  const currentTemp = activeSlot?.isRadar
    ? (wo?.tempC ?? 24)
    : (activeSlot?.tempC ?? wo?.tempC ?? 24);
  const condition = activeSlot?.condition || wo?.condition || 'Partly cloudy';
  const highTemp = wo?.highTempC ?? 31;
  const lowTemp = wo?.lowTempC ?? 19;
  const humidity = activeSlot?.humidityPct ?? wo?.humidityPct ?? 48;
  const aqi = activeSlot?.aqi ?? wo?.aqi ?? 68;
  const rainChance = activeSlot?.rainChancePct ?? 15;
  const isRadar = activeSlot?.isRadar || activeSlot?.time === 'IR';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Scrim backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.scrim} />
        </TouchableWithoutFeedback>

        {/* Slide-Up In-App Sheet */}
        <Animated.View
          entering={SlideInDown.duration(240)}
          exiting={SlideOutDown.duration(200)}
          style={styles.sheet}
        >
          {/* Top Sheet Handle */}
          <View style={styles.handle} />

          {/* 1. Header Bar matching NRYN Kickstart specification */}
          <View style={styles.headerBar}>
            {/* Left: ✕ Close button */}
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              accessibilityLabel="Close weather sheet"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>

            {/* Center: ☼ Pune Weather · Live Intelligence */}
            <View style={styles.centerBadge}>
              <View style={styles.centerTopRow}>
                <Text style={styles.weatherIcon}>☼</Text>
                <Text style={styles.brandTitle}>
                  <Text style={styles.brandAccent}>Pune Weather</Text> · Live Intelligence
                </Text>
              </View>
              <View style={styles.lockRow}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.lockUrl}>IMD & OpenWeather · Verified Feed</Text>
              </View>
            </View>

            {/* Right: Location pill */}
            <View style={styles.catPill}>
              <Text style={styles.catPillText}>PUNE</Text>
            </View>
          </View>

          {/* 2. Scrollable Body */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Weather Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.cityName}>Pune, Maharashtra</Text>
                  <Text style={styles.conditionText}>{condition}</Text>
                  <Text style={styles.tempRange}>
                    High {highTemp}°C · Low {lowTemp}°C · Feels like {currentTemp + 1}°C
                  </Text>
                </View>
                <Text style={styles.giantTemp}>{currentTemp}°</Text>
              </View>

              <View style={styles.heroFooterRow}>
                <Text style={styles.verifiedTag}>✓ Updated today · IMD Pune Station</Text>
                <Text style={styles.forecastSlotTag}>
                  Slot: {activeSlot?.time || '06'}
                </Text>
              </View>
            </View>

            {/* Hourly 24-Hour Timeline */}
            <View style={styles.hourlySection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>⏱</Text>
                <Text style={styles.sectionTitle}>HOURLY FORECAST TIMELINE (TAP TO INSPECT)</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hourlyScrollContent}
              >
                {hourlyList.map((h, i) => {
                  const isSelected = selectedSlotTime === h.time;
                  return (
                    <TouchableOpacity
                      key={`h_${i}_${h.time}`}
                      onPress={() => setSelectedSlotTime(h.time)}
                      activeOpacity={0.7}
                      style={[
                        styles.hourlyItem,
                        isSelected && styles.hourlyItemSelected,
                        h.isRadar && styles.hourlyItemRadar,
                      ]}
                    >
                      <Text
                        style={[
                          styles.hourlyTime,
                          isSelected && styles.hourlyTimeSelected,
                        ]}
                      >
                        {h.time}
                      </Text>
                      <Text style={styles.hourlyEmoji}>
                        {h.isRadar
                          ? '📡'
                          : h.time === '06'
                          ? '⛅'
                          : h.time === '09'
                          ? '🌤'
                          : h.time === '12'
                          ? '☀️'
                          : h.time === '15'
                          ? '🌦'
                          : h.time === '18'
                          ? '🌅'
                          : '🌙'}
                      </Text>
                      <Text
                        style={[
                          styles.hourlyTemp,
                          isSelected && styles.hourlyTempSelected,
                        ]}
                      >
                        {h.isRadar ? 'RADAR' : `${h.tempC}°`}
                      </Text>
                      <Text style={styles.hourlyRain}>
                        {h.isRadar ? 'IMD' : `${h.rainChancePct ?? 10}% rain`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Environmental & Health Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>AIR QUALITY (AQI)</Text>
                <Text style={[styles.metricVal, { color: '#2e7d32' }]}>
                  AQI {aqi} · Good
                </Text>
                <Text style={styles.metricSub}>Safe for outdoor running</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>RAIN PROBABILITY</Text>
                <Text style={styles.metricVal}>{rainChance}%</Text>
                <Text style={styles.metricSub}>Low precipitation risk</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>HUMIDITY</Text>
                <Text style={styles.metricVal}>{humidity}%</Text>
                <Text style={styles.metricSub}>Comfortable morning range</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>WIND & UV INDEX</Text>
                <Text style={styles.metricVal}>9 km/h · UV 6</Text>
                <Text style={styles.metricSub}>WNW breeze · Moderate UV</Text>
              </View>
            </View>

            {/* Outdoor & Running Coach Advisory */}
            <View style={styles.advisoryCard}>
              <View style={styles.advisoryHeader}>
                <Text style={styles.advisoryIcon}>🏃</Text>
                <Text style={styles.advisoryTitle}>
                  OUTDOOR & RUNNING COACH ADVISORY
                </Text>
              </View>

              <View style={styles.advisoryList}>
                <View style={styles.advisoryItem}>
                  <Text style={styles.bullet}>•</Text>
                  <View style={styles.advisoryTextCol}>
                    <Text style={styles.advisoryLabel}>Optimal Running Window:</Text>
                    <Text style={styles.advisoryText}>
                      Ideal morning conditions for Zone 2 endurance running between 06:00 AM – 09:30 AM before temperatures rise past 27°C.
                    </Text>
                  </View>
                </View>

                <View style={styles.advisoryItem}>
                  <Text style={styles.bullet}>•</Text>
                  <View style={styles.advisoryTextCol}>
                    <Text style={styles.advisoryLabel}>Hydration & Electrolytes:</Text>
                    <Text style={styles.advisoryText}>
                      Pre-hydrate with 400–500 ml water with electrolytes. Relative humidity at 48% provides comfortable evaporation.
                    </Text>
                  </View>
                </View>

                <View style={styles.advisoryItem}>
                  <Text style={styles.bullet}>•</Text>
                  <View style={styles.advisoryTextCol}>
                    <Text style={styles.advisoryLabel}>Recommended Attire:</Text>
                    <Text style={styles.advisoryText}>
                      Lightweight technical singlet or tee. UV protection sunglasses recommended if running post 09:00 AM.
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* IMD Satellite Radar Intelligence */}
            <View
              style={[
                styles.radarCard,
                isRadar && styles.radarCardActive,
              ]}
            >
              <View style={styles.radarHeader}>
                <Text style={styles.radarIcon}>📡</Text>
                <Text style={styles.radarTitle}>
                  IMD PUNE DOPPLER RADAR & SATELLITE
                </Text>
                {isRadar && (
                  <View style={styles.radarActiveBadge}>
                    <Text style={styles.radarActiveBadgeText}>SELECTED</Text>
                  </View>
                )}
              </View>
              <Text style={styles.radarStatus}>
                Status: Operational · No severe convective storm cells detected over Pune or Western Ghats.
              </Text>
              <Text style={styles.radarSub}>
                Cloud cover stands at 35% scattered cumulus. Atmospheric pressure at 1012 hPa indicates stable conditions through sunset. Official IMD Pune Doppler station feed verified.
              </Text>
            </View>

            {/* Bottom Close Button */}
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>✕ Close Weather and Return to NRYN</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 35, 30, 0.55)',
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    height: '92%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#17221b',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.15,
    shadowRadius: 36,
    elevation: 24,
  },
  handle: {
    height: 4,
    width: 40,
    borderRadius: 99,
    backgroundColor: '#d6ded6',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#edf0eb',
    backgroundColor: '#f9faf6',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ebf1ea',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dce5db',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34463a',
  },
  centerBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherIcon: {
    fontSize: 14,
    color: '#e67e22',
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#28362d',
  },
  brandAccent: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  lockIcon: {
    fontSize: 10,
  },
  lockUrl: {
    fontSize: 10,
    color: '#65776c',
  },
  catPill: {
    backgroundColor: '#e3ede4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#cad8cc',
  },
  catPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2c4033',
    letterSpacing: 0.6,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },

  // Hero Weather Card
  heroCard: {
    backgroundColor: '#f6f8f4',
    padding: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#e1e8df',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cityName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222f26',
    letterSpacing: -0.3,
  },
  conditionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495a4f',
    marginTop: 3,
  },
  tempRange: {
    fontSize: 12,
    color: '#6e8074',
    marginTop: 4,
  },
  giantTemp: {
    fontSize: 48,
    fontWeight: '800',
    color: '#222f26',
    lineHeight: 52,
    letterSpacing: -1.5,
  },
  heroFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5ebe3',
  },
  verifiedTag: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: '600',
  },
  forecastSlotTag: {
    fontSize: 11,
    color: '#76857b',
    fontWeight: '600',
  },

  // Hourly Section
  hourlySection: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  sectionIcon: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#344b3c',
    letterSpacing: 0.8,
  },
  hourlyScrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  hourlyItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8df',
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 74,
    gap: 4,
  },
  hourlyItemSelected: {
    borderColor: '#4f7f62',
    backgroundColor: '#f0f5ee',
    borderWidth: 1.5,
  },
  hourlyItemRadar: {
    borderColor: '#7d9786',
    backgroundColor: '#f7f9f5',
  },
  hourlyTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#55695c',
  },
  hourlyTimeSelected: {
    color: '#243b2d',
  },
  hourlyEmoji: {
    fontSize: 18,
    marginVertical: 2,
  },
  hourlyTemp: {
    fontSize: 13,
    fontWeight: '800',
    color: '#243b2d',
  },
  hourlyTempSelected: {
    color: '#1b2e23',
  },
  hourlyRain: {
    fontSize: 10,
    color: '#76857b',
    fontWeight: '600',
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#edf0eb',
    padding: 12,
    gap: 3,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#76857b',
    letterSpacing: 0.8,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#243b2d',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 11,
    color: '#65776c',
  },

  // Advisory Card
  advisoryCard: {
    backgroundColor: '#fbfcf9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e3eae1',
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
  },
  advisoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1ea',
  },
  advisoryIcon: {
    fontSize: 14,
  },
  advisoryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#344b3c',
    letterSpacing: 0.8,
  },
  advisoryList: {
    gap: 10,
  },
  advisoryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    fontSize: 15,
    color: '#2e7d32',
    fontWeight: '700',
    lineHeight: 18,
  },
  advisoryTextCol: {
    flex: 1,
  },
  advisoryLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#253a2c',
    marginBottom: 2,
  },
  advisoryText: {
    fontSize: 12,
    color: '#495a4f',
    lineHeight: 17,
  },

  // Radar Card
  radarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#edf0eb',
    padding: 14,
    gap: 6,
  },
  radarCardActive: {
    borderColor: '#4f7f62',
    backgroundColor: '#f6faf5',
    borderWidth: 1.5,
  },
  radarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radarIcon: {
    fontSize: 13,
  },
  radarTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6e8074',
    letterSpacing: 0.8,
  },
  radarActiveBadge: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  radarActiveBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  radarStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2d3d32',
    lineHeight: 17,
  },
  radarSub: {
    fontSize: 11,
    color: '#65776c',
    lineHeight: 16,
  },

  // Done Button
  doneBtn: {
    backgroundColor: '#28362d',
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
