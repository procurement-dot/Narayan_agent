import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useTravelStore } from '../travel.store';
import { colors, radii, spacing, typography } from '../../../shared/theme/tokens';
import { useToast } from '../../../shared/components/Toast';
import { AiTravelOption } from '../travel.types';

const POPULAR_RADAR = [
  { origin: 'Pune', destination: 'Delhi', label: 'Pune ➔ Delhi', desc: 'Flight recommended' },
  { origin: 'Pune', destination: 'Mumbai', label: 'Pune ➔ Mumbai', desc: 'Cab / Vande Bharat' },
  { origin: 'Mumbai', destination: 'Goa', label: 'Mumbai ➔ Goa', desc: 'Flight / Scenic drive' },
  { origin: 'Pune', destination: 'Bengaluru', label: 'Pune ➔ Bengaluru', desc: 'Tech hub connect' },
];

export const AiTravelPlanner: React.FC = () => {
  const {
    aiPlan,
    isAiPlanning,
    generateAiPlan,
    clearAiPlan,
    createTrip,
    travelDestination,
  } = useTravelStore();
  const { showToast } = useToast();

  const [origin, setOrigin] = useState('Pune');
  const [destination, setDestination] = useState(travelDestination || 'Delhi');

  React.useEffect(() => {
    if (travelDestination) {
      setDestination(travelDestination);
    }
  }, [travelDestination]);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [seatingClass, setSeatingClass] = useState<'executive' | 'standard'>('executive');
  const [preferredTime, setPreferredTime] = useState('Morning (Reach before 11 AM)');
  const [addingType, setAddingType] = useState<string | null>(null);

  const handleExplore = async (customOrigin?: string, customDest?: string) => {
    const fromCity = customOrigin || origin;
    const toCity = customDest || destination;

    if (!fromCity.trim() || !toCity.trim()) {
      showToast('Please enter both origin and destination cities', 'warning');
      return;
    }

    try {
      await generateAiPlan({
        origin: fromCity.trim(),
        destination: toCity.trim(),
        date,
        isRoundTrip,
        returnDate: isRoundTrip ? returnDate : undefined,
        seatingClass,
        preferredTime,
      });
      showToast(
        `AI generated 3 ${seatingClass === 'executive' ? 'Executive' : 'Standard'} plans for ${fromCity} ${isRoundTrip ? '⇄' : '➔'} ${toCity}!`,
        'success'
      );
    } catch {
      showToast('Could not fetch travel plan. Please try again.', 'error');
    }
  };

  const handleSelectRadar = (item: (typeof POPULAR_RADAR)[0]) => {
    setOrigin(item.origin);
    setDestination(item.destination);
    handleExplore(item.origin, item.destination);
  };

  const handleAddToItinerary = async (opt: AiTravelOption) => {
    setAddingType(opt.type);
    try {
      const isRound = aiPlan?.isRoundTrip ?? isRoundTrip;
      const tripEndDate = isRound && (aiPlan?.returnDate || returnDate) ? (aiPlan?.returnDate || returnDate) : date;
      const success = await createTrip({
        title: `${opt.provider} · ${origin} ${isRound ? '⇄' : '➔'} ${destination}`,
        route: `${origin} ${isRound ? '⇄' : '➔'} ${destination}`,
        startDate: date,
        endDate: tripEndDate,
        budgetInr: Math.round(opt.estimatedCostInr),
        purpose: 'business',
        status: 'confirmed',
        details: `${opt.title} | Class: ${opt.seatingClassLabel} | Outbound: ${opt.departureTime} → ${opt.arrivalTime}${opt.returnDepartureTime ? ` | Return: ${opt.returnDepartureTime} → ${opt.returnArrivalTime}` : ''} | ${opt.aiReasoning}`,
      });

      if (success) {
        showToast(
          `Added ${opt.type.toUpperCase()} plan (${opt.seatingClassLabel}) to your Itinerary & Timeline!`,
          'success'
        );
      } else {
        showToast('Trip saved locally', 'info');
      }
    } catch {
      showToast('Error saving plan to itinerary', 'error');
    } finally {
      setAddingType(null);
    }
  };

  const handleOpenCabApp = async (provider: 'uber' | 'ola' | 'rapido') => {
    const targetCity = destination.trim() || 'Goa';
    const encodedDest = encodeURIComponent(targetCity);

    let webUrl = '';
    let mobileScheme = '';

    if (provider === 'uber') {
      showToast(`Opening Uber with destination: ${targetCity}...`, 'info');
      // Direct universal booking portal for Uber
      webUrl = `https://m.uber.com/looking?drop[0]={"addressLine1":"${encodedDest}"}`;
      mobileScheme = `uber://?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodedDest}`;
    } else if (provider === 'ola') {
      showToast(`Opening Ola Cabs with destination: ${targetCity}...`, 'info');
      // Direct live booking portal for Ola
      webUrl = `https://book.olacabs.com/?drop_name=${encodedDest}`;
      mobileScheme = `olacabs://app/launch`;
    } else if (provider === 'rapido') {
      showToast(`Opening Rapido...`, 'info');
      webUrl = 'https://www.rapido.bike/';
      mobileScheme = 'rapido://';
    }

    try {
      // 1. If running on Web / PC Browser (like Chrome on Windows):
      // Custom protocols (uber://, olacabs://) do not exist on Windows desktop and cause about:blank.
      // Therefore, on web, we directly open the official web booking platform!
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.open) {
          window.open(webUrl, '_blank', 'noopener,noreferrer');
        } else {
          await Linking.openURL(webUrl);
        }
        return;
      }

      // 2. If running on native mobile device (Android / iOS):
      if (mobileScheme) {
        const canOpen = await Linking.canOpenURL(mobileScheme);
        if (canOpen) {
          await Linking.openURL(mobileScheme);
          return;
        }
      }
      await Linking.openURL(webUrl);
    } catch (err) {
      console.warn('[handleOpenCabApp] Error opening cab app:', err);
      if (webUrl) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.open(webUrl, '_blank');
        } else {
          await Linking.openURL(webUrl);
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Header & Prompt Card (Exact match to index.html .n69-travel-prompt) */}
      <View style={styles.promptCard}>
        <View style={styles.iconCircle}>
          <Text style={styles.planeIcon}>✈</Text>
        </View>

        <Text style={styles.promptTitle}>Where would you like to go?</Text>
        <Text style={styles.promptSub}>
          Tell NRYN where & when — AI compares live Flights (MakeMyTrip), Trains (Executive & AC Chair Car) & Cabs with offers.
        </Text>

        <View style={styles.formContainer}>
          {/* Trip Type Toggle: One-Way vs Round-Trip */}
          <View style={styles.tripTypeRow}>
            <TouchableOpacity
              style={[styles.tripTypePill, !isRoundTrip && styles.tripTypePillActive]}
              onPress={() => setIsRoundTrip(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tripTypePillText, !isRoundTrip && styles.tripTypePillTextActive]}>
                One Way
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tripTypePill, isRoundTrip && styles.tripTypePillActive]}
              onPress={() => setIsRoundTrip(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tripTypePillText, isRoundTrip && styles.tripTypePillTextActive]}>
                ⇄ Round Trip
              </Text>
            </TouchableOpacity>
          </View>

          {/* Seating Class Selector: Executive Class vs Standard AC */}
          <View style={styles.classSelectorSection}>
            <Text style={styles.classSelectorLabel}>SEATING CLASS / TRAVEL STYLE</Text>
            <View style={styles.classChipsRow}>
              <TouchableOpacity
                style={[
                  styles.classChip,
                  seatingClass === 'executive' && styles.classChipActive,
                ]}
                onPress={() => setSeatingClass('executive')}
                activeOpacity={0.7}
              >
                <Text style={styles.classChipIcon}>👑</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.classChipTitle,
                      seatingClass === 'executive' && styles.classChipTitleActive,
                    ]}
                  >
                    Executive Class
                  </Text>
                  <Text style={styles.classChipSub}>EC / 1A · Business · SUV</Text>
                </View>
                {seatingClass === 'executive' && <Text style={styles.chipCheck}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.classChip,
                  seatingClass === 'standard' && styles.classChipActive,
                ]}
                onPress={() => setSeatingClass('standard')}
                activeOpacity={0.7}
              >
                <Text style={styles.classChipIcon}>🌿</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.classChipTitle,
                      seatingClass === 'standard' && styles.classChipTitleActive,
                    ]}
                  >
                    Standard AC
                  </Text>
                  <Text style={styles.classChipSub}>AC Chair (CC) · Economy · Sedan</Text>
                </View>
                {seatingClass === 'standard' && <Text style={styles.chipCheck}>✓</Text>}
              </TouchableOpacity>
            </View>
          </View>

          {/* City Selection Row */}
          <View style={styles.inputRow}>
            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>FROM</Text>
              <TextInput
                style={styles.textInput}
                value={origin}
                onChangeText={setOrigin}
                placeholder="e.g. Pune"
                placeholderTextColor={colors.inkMuted}
              />
            </View>

            <View style={styles.inputDivider} />

            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>TO</Text>
              <TextInput
                style={styles.textInput}
                value={destination}
                onChangeText={setDestination}
                placeholder="e.g. Delhi, Mumbai"
                placeholderTextColor={colors.inkMuted}
              />
            </View>
          </View>

          {/* Dates Row: Depart & Return (if round trip) */}
          {isRoundTrip ? (
            <View style={[styles.inputRow, { marginTop: 8 }]}>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>DEPARTURE DATE</Text>
                <TextInput
                  style={styles.textInput}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.inkMuted}
                />
              </View>

              <View style={styles.inputDivider} />

              <View style={styles.inputCol}>
                <Text style={[styles.inputLabel, { color: '#8c593b' }]}>RETURN DATE</Text>
                <TextInput
                  style={styles.textInput}
                  value={returnDate}
                  onChangeText={setReturnDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.inkMuted}
                />
              </View>
            </View>
          ) : (
            <View style={[styles.inputRow, { marginTop: 8 }]}>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>TRAVEL DATE</Text>
                <TextInput
                  style={styles.textInput}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.inkMuted}
                />
              </View>

              <View style={styles.inputDivider} />

              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>TIMING PREFERENCE</Text>
                <TextInput
                  style={styles.textInput}
                  value={preferredTime}
                  onChangeText={setPreferredTime}
                  placeholder="e.g. Reach by 11 AM"
                  placeholderTextColor={colors.inkMuted}
                />
              </View>
            </View>
          )}

          {/* Timing row if round-trip is selected */}
          {isRoundTrip && (
            <View style={[styles.inputRow, { marginTop: 8 }]}>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>TIMING PREFERENCE</Text>
                <TextInput
                  style={styles.textInput}
                  value={preferredTime}
                  onChangeText={setPreferredTime}
                  placeholder="e.g. Morning (Reach before 11 AM)"
                  placeholderTextColor={colors.inkMuted}
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.exploreBtn}
            activeOpacity={0.8}
            onPress={() => handleExplore()}
            disabled={isAiPlanning}
          >
            {isAiPlanning ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.exploreBtnText}>Analyzing live travel rates...</Text>
              </View>
            ) : (
              <Text style={styles.exploreBtnText}>
                Explore AI Plans ({seatingClass === 'executive' ? 'Executive' : 'Standard'} · {isRoundTrip ? 'Round-Trip' : 'One-Way'}) →
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Quick Radar Links (index.html "Journeys on your radar") */}
      {!aiPlan && (
        <View style={styles.radarSection}>
          <Text style={styles.radarSectionTitle}>Journeys on your radar</Text>
          <View style={styles.radarChips}>
            {POPULAR_RADAR.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.radarChip}
                onPress={() => handleSelectRadar(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.radarDot}>✈</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.radarLabel}>{item.label}</Text>
                  <Text style={styles.radarDesc}>{item.desc}</Text>
                </View>
                <Text style={styles.radarArrow}>↗</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 3. AI Generated Plans Output */}
      {aiPlan && (
        <View style={styles.plansSection}>
          <View style={styles.plansHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.plansTitle}>
                {aiPlan.origin} {aiPlan.isRoundTrip ? '⇄' : '➔'} {aiPlan.destination}
              </Text>
              <Text style={styles.plansSub}>
                {aiPlan.isRoundTrip
                  ? `${aiPlan.date} to ${aiPlan.returnDate || 'Return'} · Round-Trip`
                  : `${aiPlan.date} · One-Way`}
                {aiPlan.distanceKm ? ` · ~${aiPlan.distanceKm} km` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={clearAiPlan} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕ Clear</Text>
            </TouchableOpacity>
          </View>

          {/* AI Executive Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryBadgeRow}>
              <Text style={styles.summaryBadge}>🧠 AI EXECUTIVE RECOMMENDATION</Text>
              <View style={styles.summaryClassBadge}>
                <Text style={styles.summaryClassBadgeText}>
                  {aiPlan.seatingClass === 'executive' ? '👑 Executive Tier' : '🌿 Standard AC'}
                </Text>
              </View>
            </View>
            <Text style={styles.summaryText}>{aiPlan.aiSummary}</Text>
          </View>

          {/* 3 Plan Cards: Flight, Train, Cab */}
          {aiPlan.options.map((opt, idx) => {
            const isFlight = opt.type === 'flight';
            const isTrain = opt.type === 'train';
            const isCab = opt.type === 'cab';

            return (
              <View
                key={idx}
                style={[
                  styles.optionCard,
                  opt.isRecommended ? styles.optionCardRecommended : undefined,
                ]}
              >
                <View style={styles.optionTopRow}>
                  <View style={styles.badgesGroup}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeIcon}>
                        {isFlight ? '✈️' : isTrain ? '🚆' : '🚖'}
                      </Text>
                      <Text style={styles.typeBadgeText}>
                        {isFlight ? 'FLIGHT' : isTrain ? 'TRAIN' : 'INTERCITY CAB'}
                      </Text>
                    </View>

                    {/* Seating Class Badge */}
                    <View style={styles.seatingClassBadge}>
                      <Text style={styles.seatingClassBadgeText}>
                        {opt.seatingClassLabel}
                      </Text>
                    </View>
                  </View>

                  {opt.isRecommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>★ TOP CHOICE</Text>
                    </View>
                  )}
                </View>

                <View style={styles.mainTitleRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.optionTitle}>{opt.title}</Text>
                    <Text style={styles.providerText}>{opt.provider}</Text>
                  </View>
                  <View style={styles.costBox}>
                    <Text style={styles.costText}>{opt.formattedCost}</Text>
                    <Text style={styles.costSub}>
                      {aiPlan.isRoundTrip ? 'total return fare' : 'est. fare'}
                    </Text>
                  </View>
                </View>

                {/* Offer Badge (MakeMyTrip style) */}
                {!!opt.offerBadge && (
                  <View style={styles.offerPill}>
                    <Text style={styles.offerText}>{opt.offerBadge}</Text>
                  </View>
                )}

                {/* Schedule & Duration Row (Outbound) */}
                <View style={styles.scheduleRow}>
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>
                      {aiPlan.isRoundTrip ? 'OUTBOUND DEP' : 'DEPARTURE'}
                    </Text>
                    <Text style={styles.timeVal}>{opt.departureTime}</Text>
                  </View>
                  <View style={styles.durationBlock}>
                    <Text style={styles.durationLine}>────────</Text>
                    <Text style={styles.durationVal}>{opt.duration}</Text>
                  </View>
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>
                      {aiPlan.isRoundTrip ? 'OUTBOUND ARR' : 'ARRIVAL'}
                    </Text>
                    <Text style={styles.timeVal}>{opt.arrivalTime}</Text>
                  </View>
                </View>

                {/* Return Schedule Row if Round-Trip */}
                {opt.returnDepartureTime && (
                  <View style={styles.returnScheduleRow}>
                    <View style={styles.timeBlock}>
                      <Text style={styles.returnTimeLabel}>
                        RETURN DEP ({aiPlan.returnDate || 'Return'})
                      </Text>
                      <Text style={styles.returnTimeVal}>{opt.returnDepartureTime}</Text>
                    </View>
                    <View style={styles.durationBlock}>
                      <Text style={styles.returnDurationLine}>◀───────</Text>
                      <Text style={styles.returnDurationVal}>RETURN LEG</Text>
                    </View>
                    <View style={styles.timeBlock}>
                      <Text style={styles.returnTimeLabel}>RETURN ARRIVAL</Text>
                      <Text style={styles.returnTimeVal}>{opt.returnArrivalTime || '—'}</Text>
                    </View>
                  </View>
                )}

                {/* Feasibility Warning if Cab is too far */}
                {!!opt.feasibilityWarning && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>{opt.feasibilityWarning}</Text>
                  </View>
                )}

                {/* Key Highlights */}
                <View style={styles.highlightsList}>
                  {opt.highlights.map((hl, hIdx) => (
                    <View key={hIdx} style={styles.highlightItem}>
                      <Text style={styles.checkIcon}>✓</Text>
                      <Text style={styles.highlightText}>{hl}</Text>
                    </View>
                  ))}
                </View>

                {/* AI Reasoning */}
                <View style={styles.reasoningBox}>
                  <Text style={styles.reasoningLabel}>Why this option fits:</Text>
                  <Text style={styles.reasoningText}>{opt.aiReasoning}</Text>
                </View>

                {/* 🚖 Instant App Deep-Links for Cab (Uber, Ola, Rapido) */}
                {isCab && (
                  <View style={styles.cabBookingBox}>
                    <View style={styles.cabBookingHead}>
                      <Text style={styles.cabBookingKicker}>⚡ AUTO-LAUNCH CAB PARTNER</Text>
                      <Text style={styles.cabBookingSub}>Pre-loads pickup & {destination}</Text>
                    </View>

                    <View style={styles.cabButtonsRow}>
                      <TouchableOpacity
                        style={styles.cabBtnUber}
                        activeOpacity={0.8}
                        onPress={() => handleOpenCabApp('uber')}
                      >
                        <Text style={styles.cabBtnUberText}>⬛ Uber</Text>
                        <Text style={styles.cabBtnActionText}>Open ↗</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.cabBtnOla}
                        activeOpacity={0.8}
                        onPress={() => handleOpenCabApp('ola')}
                      >
                        <Text style={styles.cabBtnOlaText}>🟡 Ola</Text>
                        <Text style={styles.cabBtnActionText}>Open ↗</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.cabBtnRapido}
                        activeOpacity={0.8}
                        onPress={() => handleOpenCabApp('rapido')}
                      >
                        <Text style={styles.cabBtnRapidoText}>🛵 Rapido</Text>
                        <Text style={styles.cabBtnRapidoSubText}>Open ↗</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Action: Add to Itinerary */}
                <TouchableOpacity
                  style={[
                    styles.addToTripBtn,
                    opt.isRecommended ? styles.addToTripBtnActive : undefined,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleAddToItinerary(opt)}
                  disabled={addingType === opt.type}
                >
                  {addingType === opt.type ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text
                      style={[
                        styles.addToTripBtnText,
                        opt.isRecommended ? styles.addToTripBtnTextActive : undefined,
                      ]}
                    >
                      + Add to Itinerary & Timeline ➔
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  promptCard: {
    backgroundColor: '#e9f0ed', // exact matching index.html
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dce8e0',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d6e2d9',
  },
  planeIcon: {
    fontSize: 26,
    color: '#47624f',
  },
  promptTitle: {
    fontFamily: typography.fontFamily.serifRegular,
    fontSize: 22,
    color: '#28362c',
    textAlign: 'center',
    marginBottom: 6,
  },
  promptSub: {
    fontSize: 12,
    color: '#5f7566',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e1e9e3',
  },
  tripTypeRow: {
    flexDirection: 'row',
    backgroundColor: '#f2f6f4',
    borderRadius: 30,
    padding: 3,
    marginBottom: 12,
  },
  tripTypePill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 26,
  },
  tripTypePillActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  tripTypePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#769082',
  },
  tripTypePillTextActive: {
    color: '#294334',
    fontWeight: '700',
  },
  classSelectorSection: {
    marginBottom: 12,
  },
  classSelectorLabel: {
    fontSize: 9,
    letterSpacing: 0.8,
    fontWeight: '700',
    color: '#769082',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  classChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  classChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8faf9',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e3ece6',
    gap: 8,
  },
  classChipActive: {
    backgroundColor: '#edf5f0',
    borderColor: '#608670',
    borderWidth: 1.5,
  },
  classChipIcon: {
    fontSize: 16,
  },
  classChipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3d4d42',
  },
  classChipTitleActive: {
    color: '#1b3b27',
  },
  classChipSub: {
    fontSize: 9,
    color: '#7e9185',
    marginTop: 1,
  },
  chipCheck: {
    fontSize: 12,
    fontWeight: '800',
    color: '#47624f',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7faf8',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e8efe9',
  },
  inputCol: {
    flex: 1,
  },
  inputDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#d8e4dc',
    marginHorizontal: 10,
  },
  inputLabel: {
    fontSize: 9,
    letterSpacing: 0.8,
    fontWeight: '700',
    color: '#769082',
    marginBottom: 2,
  },
  textInput: {
    fontSize: 13,
    color: '#292e29',
    fontWeight: '600',
    padding: 0,
  },
  exploreBtn: {
    backgroundColor: '#47624f', // deep forest green from index.html
    borderRadius: 40,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  radarSection: {
    marginBottom: 16,
  },
  radarSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5f7566',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  radarChips: {
    gap: 8,
  },
  radarChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4eee6',
    gap: 10,
  },
  radarDot: {
    fontSize: 16,
    color: '#b58b73',
  },
  radarLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#354238',
  },
  radarDesc: {
    fontSize: 11,
    color: '#8b928b',
    marginTop: 2,
  },
  radarArrow: {
    fontSize: 14,
    color: '#769082',
  },
  plansSection: {
    marginBottom: 16,
  },
  plansHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  plansTitle: {
    fontFamily: typography.fontFamily.serifRegular,
    fontSize: 20,
    color: '#28362c',
  },
  plansSub: {
    fontSize: 12,
    color: '#7a8c7f',
    marginTop: 2,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f0f3ee',
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#55695a',
  },
  summaryCard: {
    backgroundColor: '#eef3ea',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#dbe7d7',
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryBadge: {
    fontSize: 9,
    letterSpacing: 0.8,
    fontWeight: '800',
    color: '#526b5d',
  },
  summaryClassBadge: {
    backgroundColor: '#dfebe1',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  summaryClassBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2e543b',
  },
  summaryText: {
    fontSize: 13,
    color: '#344739',
    lineHeight: 18,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e4ebe5',
  },
  optionCardRecommended: {
    borderColor: '#769082',
    borderWidth: 1.5,
    backgroundColor: '#fdfefd',
  },
  optionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f6f3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeIcon: {
    fontSize: 13,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#495f50',
    letterSpacing: 0.5,
  },
  seatingClassBadge: {
    backgroundColor: '#f7f4ed',
    borderWidth: 1,
    borderColor: '#e9dfcc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  seatingClassBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#846738',
  },
  recommendedBadge: {
    backgroundColor: '#e5efe5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3e6a4b',
    letterSpacing: 0.5,
  },
  mainTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#28362c',
  },
  providerText: {
    fontSize: 12,
    color: '#769082',
    marginTop: 2,
  },
  costBox: {
    alignItems: 'flex-end',
  },
  costText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#28362c',
  },
  costSub: {
    fontSize: 10,
    color: '#8b928b',
  },
  offerPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#fbf4ea',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f2e4d0',
  },
  offerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b57947',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8faf8',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
  },
  timeBlock: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#8b928b',
    marginBottom: 2,
  },
  timeVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#28362c',
  },
  durationBlock: {
    alignItems: 'center',
  },
  durationLine: {
    fontSize: 10,
    color: '#c2d1c6',
  },
  durationVal: {
    fontSize: 10,
    color: '#657a6b',
    fontWeight: '600',
  },
  returnScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fcf8f2',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#faeee0',
  },
  returnTimeLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#a87f58',
    marginBottom: 2,
  },
  returnTimeVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#423122',
  },
  returnDurationLine: {
    fontSize: 10,
    color: '#dfcaa8',
  },
  returnDurationVal: {
    fontSize: 9,
    color: '#a87f58',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  warningBox: {
    backgroundColor: '#fdf2f2',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f9dede',
  },
  warningText: {
    fontSize: 11,
    color: '#b84444',
    lineHeight: 16,
    fontWeight: '500',
  },
  highlightsList: {
    marginBottom: 10,
    gap: 4,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkIcon: {
    fontSize: 11,
    color: '#496f52',
    fontWeight: '700',
  },
  highlightText: {
    fontSize: 11,
    color: '#556658',
  },
  reasoningBox: {
    backgroundColor: '#f6f9f6',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
  },
  reasoningLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#769082',
    marginBottom: 2,
  },
  reasoningText: {
    fontSize: 11,
    color: '#3d4f41',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  addToTripBtn: {
    backgroundColor: '#f1f5f2',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dce6df',
  },
  addToTripBtnActive: {
    backgroundColor: '#47624f',
    borderColor: '#47624f',
  },
  addToTripBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#47624f',
  },
  addToTripBtnTextActive: {
    color: '#ffffff',
  },
  cabBookingBox: {
    backgroundColor: '#f7faf8',
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dce8dc',
  },
  cabBookingHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cabBookingKicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#284632',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cabBookingSub: {
    fontSize: 10,
    color: colors.muted,
  },
  cabButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cabBtnUber: {
    flex: 1,
    backgroundColor: '#000000',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cabBtnUberText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  cabBtnOla: {
    flex: 1,
    backgroundColor: '#253d2d',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cabBtnOlaText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  cabBtnRapido: {
    flex: 1,
    backgroundColor: '#f7c200',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cabBtnRapidoText: {
    color: '#1a1a1a',
    fontSize: 12,
    fontWeight: '700',
  },
  cabBtnActionText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 9,
    marginTop: 2,
    fontFamily: typography.fontFamily.uiMedium,
  },
  cabBtnRapidoSubText: {
    color: '#3d3400',
    fontSize: 9,
    marginTop: 2,
    fontFamily: typography.fontFamily.uiMedium,
  },
});
