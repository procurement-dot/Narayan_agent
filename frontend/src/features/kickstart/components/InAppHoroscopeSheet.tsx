import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
} from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { radii, spacing } from '../../../shared/theme/tokens';

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {}
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {}
  },
};

export interface ZodiacSignInfo {
  sign: string;
  symbol: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  rulingPlanet: string;
  dateRange: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

export const ZODIAC_SIGNS: ZodiacSignInfo[] = [
  { sign: 'Aries', symbol: '♈', element: 'Fire', rulingPlanet: 'Mars', dateRange: 'Mar 21 – Apr 19', startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
  { sign: 'Taurus', symbol: '♉', element: 'Earth', rulingPlanet: 'Venus', dateRange: 'Apr 20 – May 20', startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
  { sign: 'Gemini', symbol: '♊', element: 'Air', rulingPlanet: 'Mercury', dateRange: 'May 21 – Jun 20', startMonth: 5, startDay: 21, endMonth: 6, endDay: 20 },
  { sign: 'Cancer', symbol: '♋', element: 'Water', rulingPlanet: 'Moon', dateRange: 'Jun 21 – Jul 22', startMonth: 6, startDay: 21, endMonth: 7, endDay: 22 },
  { sign: 'Leo', symbol: '♌', element: 'Fire', rulingPlanet: 'Sun', dateRange: 'Jul 23 – Aug 22', startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
  { sign: 'Virgo', symbol: '♍', element: 'Earth', rulingPlanet: 'Mercury', dateRange: 'Aug 23 – Sep 22', startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
  { sign: 'Libra', symbol: '♎', element: 'Air', rulingPlanet: 'Venus', dateRange: 'Sep 23 – Oct 22', startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
  { sign: 'Scorpio', symbol: '♏', element: 'Water', rulingPlanet: 'Pluto & Mars', dateRange: 'Oct 23 – Nov 21', startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
  { sign: 'Sagittarius', symbol: '♐', element: 'Fire', rulingPlanet: 'Jupiter', dateRange: 'Nov 22 – Dec 21', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
  { sign: 'Capricorn', symbol: '♑', element: 'Earth', rulingPlanet: 'Saturn', dateRange: 'Dec 22 – Jan 19', startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
  { sign: 'Aquarius', symbol: '♒', element: 'Air', rulingPlanet: 'Uranus & Saturn', dateRange: 'Jan 20 – Feb 18', startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
  { sign: 'Pisces', symbol: '♓', element: 'Water', rulingPlanet: 'Neptune & Jupiter', dateRange: 'Feb 19 – Mar 20', startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
];

export function getZodiacFromDate(day: number, month: number): ZodiacSignInfo {
  for (const z of ZODIAC_SIGNS) {
    if (z.startMonth === z.endMonth) {
      if (month === z.startMonth && day >= z.startDay && day <= z.endDay) return z;
    } else if (z.startMonth > z.endMonth) {
      // Crosses year boundary (Capricorn: Dec 22 - Jan 19)
      if ((month === z.startMonth && day >= z.startDay) || (month === z.endMonth && day <= z.endDay)) {
        return z;
      }
    } else {
      if ((month === z.startMonth && day >= z.startDay) || (month === z.endMonth && day <= z.endDay)) {
        return z;
      }
    }
  }
  return ZODIAC_SIGNS[0]; // Default Aries
}

interface HoroscopeAnalysis {
  headline: string;
  dailyTheme: string;
  energyLevel: string;
  bestWindow: string;
  mindfulCaution: string;
  directorAffirmation: string;
  focusKeywords: string[];
}

export function generateAstroAnalysis(sign: string, birthDateStr: string): HoroscopeAnalysis {
  switch (sign) {
    case 'Aries':
      return {
        headline: 'Aries Sun · High Vitality & Leadership Momentum',
        dailyTheme: 'Decisive action paired with patient strategic listening.',
        energyLevel: 'High Vitality · 88% Focus',
        bestWindow: '10:00 AM – 12:30 PM (High cognitive alignment for key calls)',
        mindfulCaution: 'Avoid snapping at colleagues during sudden midday schedule changes. Take 3 deep breaths.',
        directorAffirmation: 'Move swiftly with strategic intent, not unhurried impulse.',
        focusKeywords: ['Leadership', 'Execution', 'Patience', 'Clarity'],
      };
    case 'Taurus':
      return {
        headline: 'Taurus Sun · Grounded Execution & Resource Stewardship',
        dailyTheme: 'Steadfast momentum on financial and operational consolidation.',
        energyLevel: 'Steady Endurance · 92% Focus',
        bestWindow: '08:30 AM – 11:30 AM (Optimal for contracts, asset reviews & budgets)',
        mindfulCaution: 'Watch out for stubborn resistance to helpful suggestions from partners. Stay open-minded.',
        directorAffirmation: 'True endurance is building unshakeable foundations quietly.',
        focusKeywords: ['Stability', 'Finance', 'Grounded', 'Persistence'],
      };
    case 'Gemini':
      return {
        headline: 'Gemini Sun · High Intellectual Agility & Synthesis',
        dailyTheme: 'Cross-functional synthesis and creative communication.',
        energyLevel: 'Agile & Quick · 85% Focus',
        bestWindow: '11:00 AM – 02:00 PM (Ideal for pitch meetings, writing & strategy brainstorms)',
        mindfulCaution: 'Do not scatter energy across 5 projects simultaneously. Complete the single highest-leverage task first.',
        directorAffirmation: 'Focus your curiosity into deep execution rather than broad distraction.',
        focusKeywords: ['Synthesis', 'Communication', 'Inquiry', 'Innovation'],
      };
    case 'Cancer':
      return {
        headline: 'Cancer Sun · Intuitive Vision & Team Nurturing',
        dailyTheme: 'Protecting core values, family alignment and high-trust partnerships.',
        energyLevel: 'Deep Intuition · 82% Focus',
        bestWindow: '02:00 PM – 04:30 PM (Optimal for empathetic feedback and team alignment)',
        mindfulCaution: 'Do not take professional feedback personally. Keep healthy emotional detachment.',
        directorAffirmation: 'Lead with strength that protects both your vision and your peace of mind.',
        focusKeywords: ['Trust', 'Intuition', 'Family', 'Culture'],
      };
    case 'Leo':
      return {
        headline: 'Leo Sun · Commanding Presence & Strategic Charisma',
        dailyTheme: 'Inspiring teams through bold clarity and generous recognition.',
        energyLevel: 'Magnetic Energy · 94% Focus',
        bestWindow: '09:30 AM – 12:00 PM (Prime stage for executive pitches and investor conversations)',
        mindfulCaution: 'Avoid dominating discussions. Allow associates room to voice alternative solutions.',
        directorAffirmation: 'Great leaders elevate everyone around them without needing the spotlight.',
        focusKeywords: ['Courage', 'Magnetism', 'Vision', 'Generosity'],
      };
    case 'Virgo':
      return {
        headline: 'Virgo Sun · Precision Architecture & Operational Mastery',
        dailyTheme: 'Refining workflows, auditing bottlenecks and perfecting deliverables.',
        energyLevel: 'Laser Precision · 96% Focus',
        bestWindow: '07:30 AM – 10:30 AM (Top window for complex analysis and technical decisions)',
        mindfulCaution: 'Avoid paralyzing perfectionism. An 85% ready initiative launched now beats 100% late.',
        directorAffirmation: 'Excellence is a daily habit of refined consistency, not anxiety.',
        focusKeywords: ['Precision', 'Systems', 'Refinement', 'Efficiency'],
      };
    case 'Libra':
      return {
        headline: 'Libra Sun · Harmonious Negotiation & Collaborative Synthesis',
        dailyTheme: 'Balancing win-win agreements and restoring equilibrium in negotiations.',
        energyLevel: 'Balanced Flow · 87% Focus',
        bestWindow: '01:30 PM – 04:00 PM (Superb for partnership discussions and contract mediation)',
        mindfulCaution: 'Beware of indecision driven by trying to please everyone. Take a firm stand.',
        directorAffirmation: 'Equilibrium comes from clarity of values, not passive consensus.',
        focusKeywords: ['Diplomacy', 'Balance', 'Partnerships', 'Fairness'],
      };
    case 'Scorpio':
      return {
        headline: 'Scorpio Sun · Deep Focus & Transformational Leverage',
        dailyTheme: 'Penetrating insights, uncovering hidden opportunities and quiet leverage.',
        energyLevel: 'Intense Drive · 95% Focus',
        bestWindow: '06:00 AM – 09:00 AM & 08:00 PM – 10:00 PM (Uninterrupted high-stakes thinking)',
        mindfulCaution: 'Guard against unnecessary secrecy or holding grudges. Transparent clarity builds trust.',
        directorAffirmation: 'Direct your intense inner fire toward constructive breakthrough.',
        focusKeywords: ['Insight', 'Leverage', 'Transformation', 'Mastery'],
      };
    case 'Sagittarius':
      return {
        headline: 'Sagittarius Sun · Expansive Vision & Long-Horizon Philosophy',
        dailyTheme: 'Broad-horizon strategic planning, international expansion and optimism.',
        energyLevel: 'Expansive & Dynamic · 90% Focus',
        bestWindow: '10:00 AM – 01:00 PM (Best for big-picture roadmaps and visionary exploration)',
        mindfulCaution: 'Do not overlook ground-level operational details while looking at the horizon.',
        directorAffirmation: 'Keep your gaze on the infinite horizon while planting your feet firmly on today’s earth.',
        focusKeywords: ['Expansion', 'Philosophy', 'Optimism', 'Freedom'],
      };
    case 'Capricorn':
      return {
        headline: 'Capricorn Sun · Strategic Authority & Architectural Resilience',
        dailyTheme: 'Institutional building, disciplined milestones and long-term legacy.',
        energyLevel: 'Iron Discipline · 97% Focus',
        bestWindow: '08:00 AM – 11:30 AM (Peak executive command and governance reviews)',
        mindfulCaution: 'Avoid excessive rigidity or burnout. Schedule at least 30 minutes of unstructured rest.',
        directorAffirmation: 'Mountains are climbed one deliberate, unhurried step at a time.',
        focusKeywords: ['Legacy', 'Discipline', 'Governance', 'Authority'],
      };
    case 'Aquarius':
      return {
        headline: 'Aquarius Sun · Visionary Innovation & Systems Thinking',
        dailyTheme: 'Disruptive frameworks, community-scale architecture and modern tech adoption.',
        energyLevel: 'Innovative Flow · 89% Focus',
        bestWindow: '02:00 PM – 05:00 PM (High resonance for future-facing ideas and tech architecture)',
        mindfulCaution: 'Stay connected to emotional reality; avoid intellectual detachment from team feelings.',
        directorAffirmation: 'Build systems that serve human freedom and collective elevation.',
        focusKeywords: ['Innovation', 'Ecosystems', 'Future', 'Objectivity'],
      };
    case 'Pisces':
    default:
      return {
        headline: 'Pisces Sun · Creative Synthesis & Intuitive Horizon',
        dailyTheme: 'Fluid adaptability, empathic leadership and visionary storytelling.',
        energyLevel: 'Creative Flow · 84% Focus',
        bestWindow: '06:30 AM – 09:00 AM (Early morning creative synthesis and journaling)',
        mindfulCaution: 'Avoid escaping into wishful thinking when hard budget numbers are discussed.',
        directorAffirmation: 'Trust your deep inner compass, then anchor it with practical deadlines.',
        focusKeywords: ['Intuition', 'Creativity', 'Adaptability', 'Empathy'],
      };
  }
}

interface InAppHoroscopeSheetProps {
  visible: boolean;
  onClose: () => void;
}

const STORAGE_KEY_BIRTHDATE = '@nryn_director_birthdate';
const STORAGE_KEY_ZODIAC = '@nryn_director_zodiac';

export const InAppHoroscopeSheet: React.FC<InAppHoroscopeSheetProps> = ({
  visible,
  onClose,
}) => {
  const [day, setDay] = useState<string>('24');
  const [month, setMonth] = useState<string>('08');
  const [year, setYear] = useState<string>('1988');
  const [selectedSign, setSelectedSign] = useState<string>('Virgo');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Load saved birthdate and zodiac on mount
  useEffect(() => {
    function loadStoredProfile() {
      try {
        const savedDate = safeStorage.getItem(STORAGE_KEY_BIRTHDATE);
        const savedZodiac = safeStorage.getItem(STORAGE_KEY_ZODIAC);
        if (savedDate) {
          const parts = savedDate.split('-');
          if (parts.length === 3) {
            setYear(parts[0]);
            setMonth(parts[1]);
            setDay(parts[2]);
          }
        }
        if (savedZodiac) {
          setSelectedSign(savedZodiac);
        } else if (savedDate) {
          const parts = savedDate.split('-');
          const d = parseInt(parts[2], 10) || 1;
          const m = parseInt(parts[1], 10) || 1;
          const detected = getZodiacFromDate(d, m);
          setSelectedSign(detected.sign);
        }
      } catch (e) {
        // Fallback default
      }
    }
    loadStoredProfile();
  }, []);

  // When day or month changes, auto-update zodiac recommendation
  const handleDateChange = (dStr: string, mStr: string, yStr: string) => {
    setDay(dStr);
    setMonth(mStr);
    setYear(yStr);

    const d = parseInt(dStr, 10);
    const m = parseInt(mStr, 10);
    if (!isNaN(d) && !isNaN(m) && d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      const z = getZodiacFromDate(d, m);
      setSelectedSign(z.sign);
    }
  };

  const handleSaveProfile = () => {
    try {
      const dateStr = `${year.padStart(4, '2000')}-${month.padStart(2, '01')}-${day.padStart(2, '01')}`;
      safeStorage.setItem(STORAGE_KEY_BIRTHDATE, dateStr);
      safeStorage.setItem(STORAGE_KEY_ZODIAC, selectedSign);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2200);
    } catch (e) {
      // Ignore
    }
  };

  if (!visible) return null;

  const currentZodiacInfo =
    ZODIAC_SIGNS.find((z) => z.sign === selectedSign) || ZODIAC_SIGNS[0];
  const analysis = generateAstroAnalysis(
    selectedSign,
    `${day}/${month}/${year}`
  );

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
          {/* Top Handle */}
          <View style={styles.handle} />

          {/* 1. Header Bar */}
          <View style={styles.headerBar}>
            {/* Left: ✕ Close */}
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              accessibilityLabel="Close horoscope sheet"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>

            {/* Center: Title & Security Badge */}
            <View style={styles.centerBadge}>
              <View style={styles.centerTopRow}>
                <Text style={styles.starIcon}>☾</Text>
                <Text style={styles.brandTitle}>
                  <Text style={styles.brandAccent}>Horoscope</Text> · Astro Intelligence
                </Text>
              </View>
              <View style={styles.lockRow}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.lockUrl}>Personalized AI Cosmic Blueprint</Text>
              </View>
            </View>

            {/* Right: Selected Zodiac Pill */}
            <View style={styles.catPill}>
              <Text style={styles.catPillText}>
                {currentZodiacInfo.symbol} {selectedSign.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* 2. Scrollable Body */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Input Card (Birth Date & Zodiac) */}
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <Text style={styles.profileIcon}>🗓</Text>
                <Text style={styles.profileTitle}>
                  YOUR BIRTHDATE & ZODIAC PROFILE
                </Text>
              </View>

              <Text style={styles.profileDesc}>
                Enter your date of birth or pick your zodiac sign. NRYN synthesizes a personalized daily executive blueprint.
              </Text>

              {/* Date Input Row */}
              <View style={styles.dateInputsRow}>
                <View style={styles.dateInputCol}>
                  <Text style={styles.inputLabel}>DAY</Text>
                  <TextInput
                    style={styles.textInput}
                    value={day}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="DD"
                    placeholderTextColor="#a2aca5"
                    onChangeText={(txt) => handleDateChange(txt, month, year)}
                  />
                </View>

                <View style={styles.dateInputCol}>
                  <Text style={styles.inputLabel}>MONTH</Text>
                  <TextInput
                    style={styles.textInput}
                    value={month}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="MM"
                    placeholderTextColor="#a2aca5"
                    onChangeText={(txt) => handleDateChange(day, txt, year)}
                  />
                </View>

                <View style={[styles.dateInputCol, { flex: 1.4 }]}>
                  <Text style={styles.inputLabel}>YEAR</Text>
                  <TextInput
                    style={styles.textInput}
                    value={year}
                    keyboardType="number-pad"
                    maxLength={4}
                    placeholder="YYYY"
                    placeholderTextColor="#a2aca5"
                    onChangeText={(txt) => handleDateChange(day, month, txt)}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.saveBtn, isSaved && styles.saveBtnActive]}
                  onPress={handleSaveProfile}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveBtnText}>
                    {isSaved ? '✓ Saved' : '⚡ Update'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Zodiac Horizontal Chips */}
              <View style={styles.zodiacScrollWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.zodiacChipsRow}
                >
                  {ZODIAC_SIGNS.map((z) => {
                    const isSelected = z.sign === selectedSign;
                    return (
                      <TouchableOpacity
                        key={z.sign}
                        style={[
                          styles.zodiacChip,
                          isSelected && styles.zodiacChipSelected,
                        ]}
                        onPress={() => setSelectedSign(z.sign)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.zodiacChipSymbol}>{z.symbol}</Text>
                        <Text
                          style={[
                            styles.zodiacChipText,
                            isSelected && styles.zodiacChipTextSelected,
                          ]}
                        >
                          {z.sign}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* Hero AI Cosmic Blueprint Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.heroZodiacName}>
                    {currentZodiacInfo.symbol} {currentZodiacInfo.sign}
                  </Text>
                  <Text style={styles.heroSubtext}>
                    {currentZodiacInfo.element} Element · Ruled by {currentZodiacInfo.rulingPlanet}
                  </Text>
                  <Text style={styles.heroDateRange}>
                    Date Range: {currentZodiacInfo.dateRange}
                  </Text>
                </View>
                <View style={styles.vitalityBadge}>
                  <Text style={styles.vitalityVal}>{analysis.energyLevel.split('·')[1]?.trim() || '90% Focus'}</Text>
                  <Text style={styles.vitalityLabel}>ENERGY ALIGNMENT</Text>
                </View>
              </View>

              <View style={styles.heroDivider} />

              <Text style={styles.analysisHeadline}>{analysis.headline}</Text>
              <Text style={styles.analysisTheme}>{analysis.dailyTheme}</Text>

              {/* Focus Keyword Tags */}
              <View style={styles.keywordTagsRow}>
                {analysis.focusKeywords.map((kw, i) => (
                  <View key={`kw_${i}`} style={styles.keywordTag}>
                    <Text style={styles.keywordTagText}>#{kw}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Strategic Decision & Focus Window */}
            <View style={styles.windowCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardIcon}>⏱</Text>
                <Text style={styles.cardHeaderTitle}>
                  OPTIMAL EXECUTIVE DECISION WINDOW
                </Text>
              </View>
              <Text style={styles.windowTimeText}>{analysis.bestWindow}</Text>
              <Text style={styles.windowSub}>
                Plan your high-stakes negotiations, leadership reviews, and contract discussions within this alignment window.
              </Text>
            </View>

            {/* Mindful Guardrail (What to Avoid) */}
            <View style={styles.cautionCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardIcon}>🛡</Text>
                <Text style={styles.cardHeaderTitle}>
                  DIRECTOR'S MINDFUL GUARDRAIL (CAUTION)
                </Text>
              </View>
              <Text style={styles.cautionText}>{analysis.mindfulCaution}</Text>
            </View>

            {/* Executive Daily Affirmation */}
            <View style={styles.affirmationCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardIcon}>✦</Text>
                <Text style={styles.cardHeaderTitle}>
                  EXECUTIVE PRINCIPLE FOR TODAY
                </Text>
              </View>
              <Text style={styles.affirmationText}>
                "{analysis.directorAffirmation}"
              </Text>
            </View>

            {/* Bottom Close Button */}
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>
                ✕ Close Horoscope and Return to NRYN
              </Text>
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
  starIcon: {
    fontSize: 14,
    color: '#334a3e',
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

  // Profile Card
  profileCard: {
    backgroundColor: '#f8faf6',
    padding: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#e1e8df',
    gap: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileIcon: {
    fontSize: 14,
  },
  profileTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#344b3c',
    letterSpacing: 0.8,
  },
  profileDesc: {
    fontSize: 12,
    color: '#5e6f63',
    lineHeight: 17,
  },
  dateInputsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  dateInputCol: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6e8074',
    letterSpacing: 0.6,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ced8cb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#28392e',
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: '#354d3f',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnActive: {
    backgroundColor: '#2e7d32',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Zodiac Chips
  zodiacScrollWrapper: {
    marginTop: 2,
  },
  zodiacChipsRow: {
    gap: 6,
    paddingVertical: 2,
  },
  zodiacChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 99,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe3da',
  },
  zodiacChipSelected: {
    backgroundColor: '#e2ede3',
    borderColor: '#4f7f62',
    borderWidth: 1.5,
  },
  zodiacChipSymbol: {
    fontSize: 13,
  },
  zodiacChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#617366',
  },
  zodiacChipTextSelected: {
    color: '#203628',
    fontWeight: '800',
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#e1e8df',
    gap: 10,
    shadowColor: '#1a2b20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroZodiacName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#222f26',
    letterSpacing: -0.4,
  },
  heroSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495a4f',
    marginTop: 2,
  },
  heroDateRange: {
    fontSize: 11,
    color: '#76857b',
    marginTop: 2,
  },
  vitalityBadge: {
    backgroundColor: '#f0f5ee',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d7e2d6',
    alignItems: 'center',
  },
  vitalityVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2e7d32',
  },
  vitalityLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#6f8073',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  heroDivider: {
    height: 1,
    backgroundColor: '#edf1ea',
    marginVertical: 4,
  },
  analysisHeadline: {
    fontSize: 15,
    fontWeight: '700',
    color: '#243b2d',
    lineHeight: 20,
  },
  analysisTheme: {
    fontSize: 13,
    color: '#4a5b50',
    lineHeight: 18,
  },
  keywordTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  keywordTag: {
    backgroundColor: '#f3f6f1',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e1e8df',
  },
  keywordTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#415949',
  },

  // Decision Window Card
  windowCard: {
    backgroundColor: '#fbfcf9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e9df',
    padding: 14,
    gap: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#304b3c',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardIcon: {
    fontSize: 13,
  },
  cardHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#344b3c',
    letterSpacing: 0.8,
  },
  windowTimeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e3224',
    lineHeight: 18,
  },
  windowSub: {
    fontSize: 11,
    color: '#65776c',
    lineHeight: 16,
  },

  // Caution Card
  cautionCard: {
    backgroundColor: '#fffcf7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#faebd7',
    padding: 14,
    gap: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#d35400',
  },
  cautionText: {
    fontSize: 12,
    color: '#704829',
    lineHeight: 17,
    fontWeight: '500',
  },

  // Affirmation Card
  affirmationCard: {
    backgroundColor: '#f7f9f6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e7de',
    padding: 14,
    gap: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
  },
  affirmationText: {
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#253d2e',
    lineHeight: 19,
  },

  // Bottom Close Button
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
