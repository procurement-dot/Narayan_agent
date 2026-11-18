import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  Dimensions,
} from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { useKickstartStore } from './kickstart.store';
import { KickstartTab, HourlyWeatherPoint, NewsArticle, WeatherInfo } from './kickstart.types';
import { InAppWeatherSheet } from './components/InAppWeatherSheet';
import { InAppNewsSheet } from './components/InAppNewsSheet';
import { InAppHoroscopeSheet } from './components/InAppHoroscopeSheet';

const TABS: { id: KickstartTab; label: string }[] = [
  { id: 'today', label: '◷  All' },
  { id: 'weather', label: '☼  Weather' },
  { id: 'news', label: '✳  News' },
  { id: 'astro', label: '☾  Horoscope' },
];

interface SelectedWeatherItem {
  type: 'weather' | 'news';
  weatherPoint?: HourlyWeatherPoint;
  weatherOverall?: WeatherInfo;
  newsArticle?: NewsArticle;
}

interface TickerItemDisplay {
  id: string;
  tag: string;
  headline: string;
  isPrimary?: boolean;
  rawType: 'weather' | 'news' | 'astro';
  weatherPoint?: HourlyWeatherPoint;
  newsArticle?: NewsArticle;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const KickstartScreen: React.FC = () => {
  const {
    currentTab,
    setTab,
    weather,
    news,
    astro,
    timeline,
    fetchKickstartData,
  } = useKickstartStore();

  const [isPaused, setIsPaused] = useState(false);
  const [selectedWeatherItem, setSelectedWeatherItem] = useState<SelectedWeatherItem | null>(null);
  const [selectedNewsArticle, setSelectedNewsArticle] = useState<NewsArticle | null>(null);
  const [isHoroscopeSheetVisible, setIsHoroscopeSheetVisible] = useState(false);

  // Animated vertical translateY for continuous teleprompter roll
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const animRunningRef = useRef<Animated.CompositeAnimation | null>(null);
  const currentOffsetRef = useRef(0);
  const totalContentHeightRef = useRef(1200);

  useEffect(() => {
    fetchKickstartData();
  }, [fetchKickstartData]);

  // Build the list of ticker items based on active tab
  const getTickerItems = (): TickerItemDisplay[] => {
    if (currentTab === 'weather') {
      const hourly =
        weather?.hourly && weather.hourly.length > 0
          ? weather.hourly
          : [
              { time: 'IR', condition: 'View official IMD satellite', tempC: 24, isRadar: true },
              { time: '06', condition: '24°C · partly cloudy (sample)', tempC: 24, rainChancePct: 10, humidityPct: 56, aqi: 52 },
              { time: '09', condition: 'Low wind · illustrative', tempC: 25, rainChancePct: 10, humidityPct: 48, aqi: 64 },
              { time: '12', condition: 'Afternoon 29°C · illustrative', tempC: 29, rainChancePct: 15, humidityPct: 42, aqi: 72 },
              { time: '15', condition: 'Rain chance 20% · illustrative', tempC: 28, rainChancePct: 20, humidityPct: 62, aqi: 60 },
              { time: '18', condition: 'Sunset 18:15 · illustrative', tempC: 26, rainChancePct: 10, humidityPct: 54, aqi: 58 },
              { time: '20', condition: 'No live severe-weather feed', tempC: 23, rainChancePct: 5, humidityPct: 58, aqi: 50 },
            ];
      return hourly.map((h, i) => ({
        id: `w_${i}_${h.time}`,
        tag: h.time,
        headline: h.condition,
        isPrimary: i === 0 || i === 1 || i === 4,
        rawType: 'weather',
        weatherPoint: h,
      }));
    }

    if (currentTab === 'news') {
      const genericWords = [
        'headlines',
        'world',
        'india',
        'pune',
        'pune local',
        'local',
        'interests',
        'your interests',
      ];

      return (news || []).map((n, i) => {
        const titleLower = (n.title || '').trim().toLowerCase();
        const isGeneric = !n.title || genericWords.includes(titleLower);
        const headlineText = isGeneric && n.detail ? n.detail : n.title;
        const categoryTag = (n.category || 'NEWS').toUpperCase();

        return {
          id: n.id,
          tag: categoryTag,
          headline: headlineText,
          isPrimary: i % 2 === 1,
          rawType: 'news',
          newsArticle: {
            ...n,
            title: headlineText,
          },
        };
      });
    }

    if (currentTab === 'astro') {
      const astroList = [
        { tag: 'TODAY', headline: 'Aries Sun · Sagittarius Moon (illustrative)', isPrimary: true },
        { tag: 'FOCUS', headline: 'Notice a reaction before answering', isPrimary: false },
        { tag: 'MONTH', headline: 'A reflection on freedom and responsibility', isPrimary: true },
        { tag: 'SYMBOLS', headline: 'Astrology is a cultural reflection', isPrimary: false },
        { tag: 'SOURCE', headline: 'Sakal / Pune Times — not connected', isPrimary: false },
        { tag: 'VIEW', headline: 'Explore your birth chart & AI analysis', isPrimary: true },
      ];

      return astroList.map((a, i) => ({
        id: `astro_${i}_${a.tag}`,
        tag: a.tag,
        headline: a.headline,
        isPrimary: a.isPrimary,
        rawType: 'astro' as const,
      }));
    }

    // Tab 'today' / 'All'
    return (timeline || []).map((t, i) => ({
      id: t.id,
      tag: t.timeSlot,
      headline: t.title,
      isPrimary: t.isEmphasized || i % 2 === 1,
      rawType: 'weather',
      weatherPoint: {
        time: t.timeSlot,
        condition: t.title + (t.detail ? ` · ${t.detail}` : ''),
        tempC: 24,
      },
    }));
  };

  const rawItems = getTickerItems();
  // Duplicate array so it rolls in an infinite seamless loop
  const displayItems = [...rawItems, ...rawItems];

  // Start continuous upward roll animation
  const startRollAnimation = (startFromOffset = 0) => {
    if (animRunningRef.current) {
      animRunningRef.current.stop();
    }

    const distance = totalContentHeightRef.current;
    if (distance <= 0) return;

    // ~36 seconds for one full loop
    const remainingDistance = distance - Math.abs(startFromOffset);
    const duration = Math.max(8000, (remainingDistance / distance) * 36000);

    animRunningRef.current = Animated.timing(scrollAnim, {
      toValue: -distance,
      duration: duration,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web',
    });

    animRunningRef.current.start(({ finished }) => {
      if (finished) {
        scrollAnim.setValue(0);
        currentOffsetRef.current = 0;
        startRollAnimation(0);
      }
    });
  };

  // Pause the roll
  const pauseRoll = () => {
    setIsPaused(true);
    if (animRunningRef.current) {
      animRunningRef.current.stop();
    }
  };

  // Resume or start
  const resumeRoll = () => {
    setIsPaused(false);
    startRollAnimation(currentOffsetRef.current);
  };

  // Restart from top
  const restartRoll = () => {
    setIsPaused(false);
    scrollAnim.setValue(0);
    currentOffsetRef.current = 0;
    startRollAnimation(0);
  };

  // Track animated offset listener for accurate resume
  useEffect(() => {
    const listenerId = scrollAnim.addListener(({ value }) => {
      currentOffsetRef.current = value;
    });
    return () => {
      scrollAnim.removeListener(listenerId);
    };
  }, [scrollAnim]);

  // Restart roll whenever the tab changes
  useEffect(() => {
    scrollAnim.setValue(0);
    currentOffsetRef.current = 0;
    setIsPaused(false);
    const timer = setTimeout(() => {
      startRollAnimation(0);
    }, 150);
    return () => clearTimeout(timer);
  }, [currentTab]);

  const handleItemPress = (item: TickerItemDisplay) => {
    pauseRoll();
    if (item.rawType === 'astro') {
      setIsHoroscopeSheetVisible(true);
    } else if (item.rawType === 'news' && item.newsArticle) {
      setSelectedNewsArticle(item.newsArticle);
    } else {
      setSelectedWeatherItem({
        type: item.rawType,
        weatherPoint: item.weatherPoint,
        weatherOverall: weather || undefined,
        newsArticle: item.newsArticle,
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Bar: Minimal Authentic Navigation */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>‹   Kickstart</Text>
      </View>

      {/* 2. Top Pill Filter Tabs */}
      <View style={styles.pillsRow}>
        {TABS.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => setTab(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. The Continuous Rolling Teleprompter Viewport */}
      <View
        style={styles.scrollbox}
        onTouchStart={pauseRoll}
        onTouchEnd={() => {
          if (!isPaused) resumeRoll();
        }}
      >
        <Animated.View
          style={[
            styles.scrolltrack,
            {
              transform: [{ translateY: scrollAnim }],
            },
          ]}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0) {
              totalContentHeightRef.current = h / 2;
            }
          }}
        >
          {displayItems.map((item, idx) => {
            const isHighlight = item.isPrimary;
            return (
              <TouchableOpacity
                key={`${item.id}_${idx}`}
                style={styles.tickerRow}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.65}
              >
                <Text style={styles.tickerTag}>{item.tag}</Text>
                <Text
                  style={[
                    styles.tickerHeadline,
                    isHighlight && styles.tickerHeadlineEmph,
                  ]}
                  numberOfLines={3}
                >
                  {item.headline}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Top Fade Gradient Mask */}
        <View style={styles.maskTop} pointerEvents="none">
          <Svg height="100%" width="100%">
            <Defs>
              <SvgGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#f9faf5" stopOpacity="1" />
                <Stop offset="40%" stopColor="#f9faf5" stopOpacity="0.8" />
                <Stop offset="100%" stopColor="#f9faf5" stopOpacity="0" />
              </SvgGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#topFade)" />
          </Svg>
        </View>

        {/* Bottom Fade Gradient Mask */}
        <View style={styles.maskBottom} pointerEvents="none">
          <Svg height="100%" width="100%">
            <Defs>
              <SvgGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#f9faf5" stopOpacity="0" />
                <Stop offset="60%" stopColor="#f9faf5" stopOpacity="0.8" />
                <Stop offset="100%" stopColor="#f9faf5" stopOpacity="1" />
              </SvgGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#bottomFade)" />
          </Svg>
        </View>

        {/* 4. Floating Action Controls (Pause / Play & Restart) */}
        <View style={styles.feedTools}>
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={isPaused ? resumeRoll : pauseRoll}
            activeOpacity={0.8}
          >
            <Text style={styles.toolBtnText}>
              {isPaused ? '▶ Play' : 'Ⅱ Pause'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolBtn}
            onPress={restartRoll}
            activeOpacity={0.8}
          >
            <Text style={styles.toolBtnText}>↺ Restart</Text>
          </TouchableOpacity>
        </View>

        {/* Floating Action Button (Asterisk) */}
        <TouchableOpacity
          style={styles.fabBtn}
          activeOpacity={0.8}
          accessibilityLabel="Assistant quick action"
        >
          <Text style={styles.fabIcon}>✳</Text>
        </TouchableOpacity>
      </View>

      {/* 5. Dedicated In-App Weather Intelligence Sheet (Opened on Weather Tap) */}
      <InAppWeatherSheet
        visible={Boolean(selectedWeatherItem)}
        weatherPoint={selectedWeatherItem?.weatherPoint}
        weatherOverall={selectedWeatherItem?.weatherOverall}
        onClose={() => {
          setSelectedWeatherItem(null);
          resumeRoll();
        }}
      />

      {/* 6. Option 1: In-App Google News Sheet (Opened on News Tap) */}
      <InAppNewsSheet
        visible={Boolean(selectedNewsArticle)}
        article={selectedNewsArticle}
        onClose={() => {
          setSelectedNewsArticle(null);
          resumeRoll();
        }}
      />

      {/* 7. Dedicated In-App Horoscope & Astro Intelligence Sheet */}
      <InAppHoroscopeSheet
        visible={isHoroscopeSheetVisible}
        onClose={() => {
          setIsHoroscopeSheetVisible(false);
          resumeRoll();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9faf5', // Authentic calm off-white / sage tint
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#f9faf5',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#313c35',
    letterSpacing: -0.4,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f9faf5',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#e2e6df',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  pillActive: {
    backgroundColor: '#e3ede4',
    borderColor: '#7d9786',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5e6d64',
  },
  pillTextActive: {
    color: '#30443a',
    fontWeight: '700',
  },
  scrollbox: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f9faf5',
  },
  scrolltrack: {
    paddingTop: SCREEN_HEIGHT * 0.15,
    paddingBottom: SCREEN_HEIGHT * 0.45,
    paddingHorizontal: 24,
  },
  tickerRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#edf0e9',
  },
  tickerTag: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9da9a0',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tickerHeadline: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -1.2,
    color: '#c6cac2', // Faded subtle items by default
  },
  tickerHeadlineEmph: {
    color: '#313c35', // Prominent dark text for active/highlight items
  },
  maskTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
  },
  maskBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
  },
  feedTools: {
    position: 'absolute',
    bottom: 14,
    right: 18,
    zIndex: 10,
    flexDirection: 'row',
    gap: 8,
  },
  toolBtn: {
    backgroundColor: 'rgba(241, 245, 238, 0.95)',
    borderWidth: 1,
    borderColor: '#dde7dd',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 30,
    shadowColor: '#263b30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  toolBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#53675a',
  },
  fabBtn: {
    position: 'absolute',
    bottom: 68,
    right: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#354d3f',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1d2e24',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 11,
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
});
