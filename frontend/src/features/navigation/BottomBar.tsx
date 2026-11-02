import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigationStore } from './navigation.store';
import { DOCK_SPACES } from './navigation.types';
import { Icon } from '../../shared/components/Icon';

export const BottomBar: React.FC = () => {
  const { currentSpace, navigate, openChat } = useNavigationStore();

  return (
    <>
      {/* Floating Ask NRYN Orb (HTML Reference: #nryn-orb) */}
      <TouchableOpacity
        style={styles.floatingAskOrb}
        onPress={openChat}
        activeOpacity={0.82}
        accessibilityLabel="Ask NRYN"
      >
        <Text style={styles.askOrbStar}>✳</Text>
      </TouchableOpacity>

      {/* macOS Style Glassmorphism Floating Dock */}
      <View style={styles.floatingContainer} pointerEvents="box-none">
        <View style={styles.macDock}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dockRail}
          >
            {DOCK_SPACES.map((space) => {
              const isActive = currentSpace === space.id;
              return (
                <TouchableOpacity
                  key={space.id}
                  style={[styles.dockGlyph, isActive && styles.dockGlyphActive]}
                  onPress={() => navigate(space.id)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.glyphShape,
                      { backgroundColor: space.color },
                      isActive && styles.glyphShapeActive,
                    ]}
                  >
                    <Icon
                      name={space.icon}
                      size={22}
                      color={isActive ? '#1e2821' : '#384b40'}
                      strokeWidth={isActive ? 2 : 1.65}
                    />
                  </View>
                  <Text
                    style={[styles.glyphLabel, isActive && styles.glyphLabelActive]}
                    numberOfLines={1}
                  >
                    {space.label}
                  </Text>
                  {isActive ? (
                    <View style={styles.activeDot} />
                  ) : (
                    <View style={styles.activeDotPlaceholder} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  floatingAskOrb: {
    position: 'absolute',
    right: 20,
    bottom: 96,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3f5d50',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#20392c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 60,
  },
  askOrbStar: {
    fontSize: 24,
    color: '#ffffff',
    lineHeight: 26,
    textAlign: 'center',
  },
  floatingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 14,
    alignItems: 'center',
    zIndex: 50,
  },
  macDock: {
    width: '92%',
    maxWidth: 760,
    backgroundColor: 'rgba(236, 239, 234, 0.76)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 7,
    paddingHorizontal: 8,
    shadowColor: '#2b362c',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 36,
    elevation: 14,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(30px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(30px) saturate(1.5)',
        } as any)
      : {}),
  },
  dockRail: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  dockGlyph: {
    alignItems: 'center',
    width: 50,
    position: 'relative',
    paddingVertical: 2,
  },
  dockGlyphActive: {
    transform: [{ translateY: -3 }],
  },
  glyphShape: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#4a5a4d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },
  glyphShapeActive: {
    borderColor: '#384b40',
    borderWidth: 1.6,
    shadowOpacity: 0.24,
    shadowRadius: 8,
  },
  glyphLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#485248',
    marginTop: 3,
    textAlign: 'center',
    maxWidth: 60,
  },
  glyphLabelActive: {
    color: '#1a221c',
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4c6759',
    marginTop: 2,
  },
  activeDotPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 2,
  },
});
