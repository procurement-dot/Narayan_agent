import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { DOCK_SPACES } from './navigation.types';
import { useNavigationStore } from './navigation.store';
import { Icon } from '../../shared/components/Icon';

export const Dock: React.FC = () => {
  const { isDockOpen, closeDock, currentSpace, navigate } = useNavigationStore();
  const slideAnim = useRef(new Animated.Value(120)).current;
  const useNative = Platform.OS !== 'web';

  useEffect(() => {
    if (isDockOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: useNative,
        tension: 65,
        friction: 9,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 120,
        duration: 180,
        useNativeDriver: useNative,
      }).start();
    }
  }, [isDockOpen]);

  // Swipe-right gesture on the dock to dismiss/close it
  const dockPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dx > 15 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 30) {
          closeDock();
        }
      },
    })
  ).current;

  if (!isDockOpen) return null;

  const screenHeight = Dimensions.get('window').height;
  const maxDockHeight = Math.min(screenHeight * 0.82, 730);

  return (
    <Modal
      visible={isDockOpen}
      transparent
      animationType="none"
      onRequestClose={closeDock}
    >
      {/* 
        Transparent background overlay (HTML Reference: #dock-root .dock-outside).
        Does NOT blur the underlying screen, so the full calendar/content stays 100% visible!
      */}
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closeDock}
          accessibilityLabel="Dismiss dock"
        />

        {/* Right-Side macOS Vertical Floating Glassmorphism Dock (HTML Reference: .mac-dock) */}
        <Animated.View
          style={[
            styles.macDock,
            {
              maxHeight: maxDockHeight,
              transform: [{ translateX: slideAnim }, { translateY: -maxDockHeight / 2 }],
            },
          ]}
          {...dockPanResponder.panHandlers}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.dockRail}
            bounces={true}
          >
            {DOCK_SPACES.map((space) => {
              const isActive = currentSpace === space.id;
              return (
                <TouchableOpacity
                  key={space.id}
                  style={styles.dockGlyph}
                  onPress={() => {
                    navigate(space.id);
                    closeDock();
                  }}
                  activeOpacity={0.72}
                  accessibilityLabel={space.label}
                  accessibilityRole="button"
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
                    numberOfLines={2}
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
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Completely transparent backdrop so background content stays crystal clear and readable
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  // Authentic macOS-style Right Floating Dock (.mac-dock from nryn-v6.9.html)
  macDock: {
    position: 'absolute',
    right: 10,
    top: '50%',
    width: 94,
    backgroundColor: 'rgba(236, 239, 234, 0.88)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 10,
    paddingHorizontal: 5,
    shadowColor: '#394539',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 36,
    elevation: 16,
    zIndex: 90,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(28px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
        } as any)
      : {}),
  },
  dockRail: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  dockGlyph: {
    width: 80,
    alignItems: 'center',
    paddingVertical: 3,
    position: 'relative',
  },
  glyphShape: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#4a5a4d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  glyphShapeActive: {
    borderColor: '#384b40',
    borderWidth: 1.8,
    shadowOpacity: 0.24,
    shadowRadius: 8,
  },
  glyphLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#485248',
    marginTop: 3,
    textAlign: 'center',
    maxWidth: 76,
    minHeight: 12,
  },
  glyphLabelActive: {
    color: '#1a221c',
    fontWeight: '800',
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
