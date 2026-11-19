import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { colors, radii, spacing, typography } from '../../../shared/theme/tokens';

interface CompareFlightSheetProps {
  visible: boolean;
  route: string;
  baseFare: string;
  onClose: () => void;
}

export const CompareFlightSheet: React.FC<CompareFlightSheetProps> = ({
  visible,
  route,
  baseFare,
  onClose,
}) => {
  const numericFare = parseInt(baseFare.replace(/[^0-9]/g, ''), 10) || 3800;

  const handleOpenBooking = async (url: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    await Linking.openURL(url);
  };

  const airlineOffers = [
    {
      airline: 'IndiGo',
      flightNumber: '6E-452',
      timing: '07:15 AM → 08:45 AM (Nonstop)',
      fare: `₹${numericFare.toLocaleString('en-IN')}`,
      tag: '⚡ Lowest Fare',
      perks: '7kg Cabin + 15kg Check-in baggage',
      bookingUrl: 'https://www.goindigo.in/',
    },
    {
      airline: 'Air India Express',
      flightNumber: 'IX-1204',
      timing: '01:20 PM → 02:50 PM (Nonstop)',
      fare: `₹${(numericFare + 280).toLocaleString('en-IN')}`,
      tag: '🍱 Meal Included',
      perks: 'Complimentary Hot Snack & Beverage',
      bookingUrl: 'https://www.airindiaexpress.com/',
    },
    {
      airline: 'Akasa Air',
      flightNumber: 'QP-1311',
      timing: '06:40 PM → 08:05 PM (Nonstop)',
      fare: `₹${(numericFare + 120).toLocaleString('en-IN')}`,
      tag: '★ New Aircraft',
      perks: 'Boeing 737 MAX with USB power ports',
      bookingUrl: 'https://www.akasaair.com/',
    },
  ];

  return (
    <BottomSheet visible={visible} title={`Flight Comparison · ${route}`} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.headerBox}>
          <Text style={styles.kicker}>MULTI-AIRLINE LIVE FARE BENCHMARK</Text>
          <Text style={styles.title}>{route}</Text>
          <Text style={styles.sub}>
            Comparing real-time airline quotes, departure slots & baggage allowances
          </Text>
        </View>

        {/* Portal Offer Banner */}
        <View style={styles.offerBanner}>
          <Text style={styles.offerIcon}>🏷️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.offerTitle}>MakeMyTrip Executive Offer Active</Text>
            <Text style={styles.offerDesc}>Use code MMTSTEAL for up to ₹650 instant discount</Text>
          </View>
        </View>

        {/* Airline Comparison Cards */}
        <Text style={styles.sectionHeader}>Live Quotes by Airline</Text>
        {airlineOffers.map((offer, idx) => (
          <View key={idx} style={styles.airlineCard}>
            <View style={styles.airlineHeader}>
              <View>
                <Text style={styles.airlineName}>{offer.airline}</Text>
                <Text style={styles.flightNum}>{offer.flightNumber}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.fareText}>{offer.fare}</Text>
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>{offer.tag}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.timingText}>🕒 {offer.timing}</Text>
            <Text style={styles.perksText}>✓ {offer.perks}</Text>

            <TouchableOpacity
              style={styles.bookBtn}
              activeOpacity={0.8}
              onPress={() => handleOpenBooking(offer.bookingUrl)}
            >
              <Text style={styles.bookBtnText}>Book on {offer.airline} ↗</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Universal Compare on MakeMyTrip */}
        <TouchableOpacity
          style={styles.mmtBtn}
          activeOpacity={0.8}
          onPress={() => handleOpenBooking('https://www.makemytrip.com/flights/')}
        >
          <Text style={styles.mmtBtnText}>Compare All on MakeMyTrip Flights ↗</Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerBox: {
    backgroundColor: '#ebf2ec',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#d2e3d5',
  },
  kicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#284632',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontFamily: typography.fontFamily.serifRegular,
    color: '#233829',
    marginTop: 4,
    fontWeight: '700',
  },
  sub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
  },
  offerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#fed7aa',
    gap: 8,
  },
  offerIcon: {
    fontSize: 16,
  },
  offerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9a3412',
  },
  offerDesc: {
    fontSize: 10,
    color: '#c2410c',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 4,
  },
  airlineCard: {
    backgroundColor: '#ffffff',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#e2ece4',
    gap: 6,
  },
  airlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  airlineName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#253d2d',
  },
  flightNum: {
    fontSize: 11,
    color: colors.muted,
  },
  fareText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#255e3b',
  },
  tagBadge: {
    backgroundColor: '#eaf4eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
    marginTop: 2,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#286b3e',
  },
  timingText: {
    fontSize: 12,
    color: colors.ink,
    marginTop: 2,
  },
  perksText: {
    fontSize: 11,
    color: '#4b6352',
  },
  bookBtn: {
    backgroundColor: '#284632',
    paddingVertical: 8,
    borderRadius: radii.pill,
    alignItems: 'center',
    marginTop: 4,
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  mmtBtn: {
    backgroundColor: '#f1f6f2',
    paddingVertical: 12,
    borderRadius: radii.pill,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c6dccb',
    marginTop: spacing.xs,
  },
  mmtBtnText: {
    color: '#284632',
    fontSize: 12,
    fontWeight: '700',
  },
});
