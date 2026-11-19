import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { TravelTab } from '../travel.types';
import { useTravelStore } from '../travel.store';
import { colors, radii, spacing, typography } from '../../../shared/theme/tokens';
import { useToast } from '../../../shared/components/Toast';

const RADAR_JOURNEYS = [
  { city: 'Udaipur', desc: 'Self-directed learning visit' },
  { city: 'Vadodara', desc: 'KinderSports visit' },
  { city: 'Hyderabad', desc: 'Project review' },
];

interface TravelTripsWelcomeProps {
  onSelectTab: (tab: TravelTab) => void;
}

export const TravelTripsWelcome: React.FC<TravelTripsWelcomeProps> = ({ onSelectTab }) => {
  const { trips, openModal, travelDestination, setDestination } = useTravelStore();
  const [inputVal, setInputVal] = useState(travelDestination || 'Mumbai');
  const { showToast } = useToast();

  const handleExplore = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) {
      showToast('Enter a destination city or country', 'warning');
      return;
    }
    setDestination(trimmed);
  };

  const handleSelectRadar = (city: string) => {
    setInputVal(city);
    setDestination(city);
  };

  const activeTrips = trips.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');

  return (
    <View style={styles.container}>
      {/* 1. Prompt Card: Where would you like to go? (Exact match to index.html .n69-travel-prompt) */}
      <View style={styles.promptCard}>
        <Text style={styles.planeGlyph}>✈</Text>
        <Text style={styles.promptTitle}>Where would you like to go?</Text>

        <View style={styles.promptForm}>
          <TextInput
            style={styles.promptInput}
            value={inputVal}
            onChangeText={setInputVal}
            placeholder="City or country"
            placeholderTextColor="#8a9c8f"
            onSubmitEditing={handleExplore}
          />
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={handleExplore}
            activeOpacity={0.8}
          >
            <Text style={styles.exploreBtnText}>Explore →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Hero Card: YOUR JOURNEY (Exact match to index.html .n69-hero.soft-sage) */}
      {!!travelDestination && (
        <View style={styles.heroCard}>
          <Text style={styles.heroKicker}>YOUR JOURNEY</Text>
          <Text style={styles.heroTitle}>{travelDestination}</Text>

          <View style={styles.journeyLinksRow}>
            <TouchableOpacity
              style={styles.journeyLinkBtn}
              onPress={() => onSelectTab('fares')}
              activeOpacity={0.7}
            >
              <Text style={styles.journeyLinkText}>✈ Airfares</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.journeyLinkBtn}
              onPress={() => onSelectTab('family')}
              activeOpacity={0.7}
            >
              <Text style={styles.journeyLinkText}>▧ Documents</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.journeyLinkBtn}
              onPress={() => onSelectTab('rail')}
              activeOpacity={0.7}
            >
              <Text style={styles.journeyLinkText}>▦ Trains</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 3. Ideas for your trip (Exact match to index.html .n69Tiles) */}
      {!!travelDestination && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Ideas for your trip</Text>
          <View style={styles.tilesGrid}>
            <TouchableOpacity
              style={[styles.tileCard, { backgroundColor: '#eef3ea' }]}
              onPress={() => onSelectTab('fares')}
              activeOpacity={0.75}
            >
              <Text style={styles.tileIcon}>✈</Text>
              <Text style={styles.tileTitle}>Flights</Text>
              <Text style={styles.tileDesc}>Compare dates</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tileCard, { backgroundColor: '#f3ede7' }]}
              onPress={() => onSelectTab('family')}
              activeOpacity={0.75}
            >
              <Text style={styles.tileIcon}>♡</Text>
              <Text style={styles.tileTitle}>Family</Text>
              <Text style={styles.tileDesc}>Travel together</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tileCard, { backgroundColor: '#eeeef3' }]}
              onPress={() => onSelectTab('rail')}
              activeOpacity={0.75}
            >
              <Text style={styles.tileIcon}>☼</Text>
              <Text style={styles.tileTitle}>Places</Text>
              <Text style={styles.tileDesc}>Things to explore</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 4. Journeys on your radar (Exact match to index.html .n69-simple-list) */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Journeys on your radar</Text>
        <View style={styles.radarList}>
          {RADAR_JOURNEYS.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.radarRow}
              onPress={() => handleSelectRadar(item.city)}
              activeOpacity={0.7}
            >
              <Text style={styles.radarPlane}>✈</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.radarCity}>{item.city}</Text>
                <Text style={styles.radarDesc}>{item.desc}</Text>
              </View>
              <Text style={styles.radarArrow}>↗</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 5. Planned Trips (Saved in Itinerary) */}
      {activeTrips.length > 0 && (
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderBetween}>
            <Text style={styles.sectionTitle}>Confirmed Itineraries</Text>
            <TouchableOpacity
              style={styles.addTripBtn}
              onPress={() => openModal('addTrip')}
            >
              <Text style={styles.addTripBtnText}>+ Add Trip</Text>
            </TouchableOpacity>
          </View>

          {activeTrips.map((tr) => (
            <TouchableOpacity
              key={tr.id}
              style={styles.tripCard}
              activeOpacity={0.7}
              onPress={() => openModal('tripDetail', tr)}
            >
              <View style={styles.tripCardHeader}>
                <Text style={styles.tripCardTitle}>{tr.title}</Text>
                <View style={styles.tripBadge}>
                  <Text style={styles.tripBadgeText}>{tr.status}</Text>
                </View>
              </View>
              <Text style={styles.tripCardRoute}>{tr.route}</Text>
              <Text style={styles.tripCardDates}>{tr.dates}</Text>
              {!!tr.details && (
                <Text style={styles.tripCardDetails} numberOfLines={2}>
                  {tr.details}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  // Exact match to .n69-travel-prompt from index.html
  promptCard: {
    backgroundColor: '#e9f0ed', // exact pastel from index.html
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  planeGlyph: {
    fontSize: 38,
    color: '#3d5c48',
    marginBottom: 12,
  },
  promptTitle: {
    fontFamily: 'Georgia',
    fontSize: 26,
    lineHeight: 30,
    color: '#28362c',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  promptForm: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 50,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e1e9e3',
  },
  promptInput: {
    flex: 1,
    fontSize: 14,
    color: '#28362c',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  exploreBtn: {
    backgroundColor: '#47624f', // exact deep forest green from index.html
    borderRadius: 40,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Exact match to .n69-hero.soft-sage from index.html
  heroCard: {
    backgroundColor: '#e9f0e9', // soft-sage
    borderRadius: 24,
    padding: 24,
    marginBottom: 18,
  },
  heroKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: '#708876',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroTitle: {
    fontFamily: 'Georgia',
    fontSize: 32,
    color: '#28362c',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  journeyLinksRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  journeyLinkBtn: {
    backgroundColor: '#ffffffbd', // exact white semi-transparent from index.html
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dce6dd',
  },
  journeyLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#486454',
  },

  // Section Styles
  sectionBlock: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28362c',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addTripBtn: {
    backgroundColor: '#47624f',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  addTripBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },

  // Tiles Grid (Ideas for your trip)
  tilesGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  tileCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    minHeight: 105,
    justifyContent: 'space-between',
  },
  tileIcon: {
    fontSize: 22,
    color: '#425b49',
    marginBottom: 4,
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#344738',
  },
  tileDesc: {
    fontSize: 10,
    color: '#8c9c8f',
  },

  // Journeys on your radar list
  radarList: {
    gap: 8,
  },
  radarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e8eee9',
    gap: 12,
  },
  radarPlane: {
    fontSize: 16,
    color: '#b58b73',
  },
  radarCity: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2e3b32',
  },
  radarDesc: {
    fontSize: 11,
    color: '#8b9b90',
    marginTop: 2,
  },
  radarArrow: {
    fontSize: 14,
    color: '#769082',
  },

  // Trip Cards
  tripCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e6ede8',
  },
  tripCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tripCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#28362c',
    flex: 1,
  },
  tripBadge: {
    backgroundColor: '#e5efe5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tripBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3e6a4b',
  },
  tripCardRoute: {
    fontSize: 12,
    color: '#769082',
    marginTop: 2,
  },
  tripCardDates: {
    fontSize: 11,
    color: '#8b928b',
    marginTop: 2,
  },
  tripCardDetails: {
    fontSize: 11,
    color: '#556658',
    marginTop: 6,
    lineHeight: 16,
  },
});
