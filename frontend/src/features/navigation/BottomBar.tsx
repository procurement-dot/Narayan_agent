import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { useNavigationStore } from './navigation.store';

export const BottomBar: React.FC = () => {
  const { isDockOpen, openDock, openChat } = useNavigationStore();

  // Edge Swipe PanResponder to open dock when user swipes left near right edge
  const edgePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        // Swiping left from the right edge or a quick tap opens the dock
        if (gestureState.dx < -15 || (Math.abs(gestureState.dx) < 8 && Math.abs(gestureState.dy) < 8)) {
          openDock();
        }
      },
    })
  ).current;

  // When dock is open, hide edge slider and orb so they don't overlap with the right dock
  if (isDockOpen) {
    return null;
  }

  return (
    <>
      {/* Invisible Right Edge Swipe Catch-Zone */}
      <View
        style={styles.edgeSwipeZone}
        {...edgePanResponder.panHandlers}
      />

      {/* Right Edge Slide Handle (HTML Reference: #nryn-edge-slider) */}
      <TouchableOpacity
        style={styles.edgeSlider}
        onPress={openDock}
        activeOpacity={0.8}
        accessibilityLabel="Open NRYN spaces dock"
        accessibilityRole="button"
        {...edgePanResponder.panHandlers}
      >
        <View style={styles.sliderPillBar} />
      </TouchableOpacity>

      {/* Floating Ask NRYN Orb (HTML Reference: #nryn-orb) */}
      <TouchableOpacity
        style={styles.floatingAskOrb}
        onPress={openChat}
        activeOpacity={0.85}
        accessibilityLabel="Ask NRYN"
        accessibilityRole="button"
      >
        <Text style={styles.askOrbStar}>✳</Text>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  // Transparent touch stripe along the right edge for smooth swipe detection
  edgeSwipeZone: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 22,
    zIndex: 42,
  },
  // Authentic Right-Edge Slider Handle (#nryn-edge-slider from nryn-v6.9.html)
  edgeSlider: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -75 }],
    width: 14,
    height: 150,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    backgroundColor: 'rgba(137, 155, 144, 0.32)',
    borderWidth: 1,
    borderColor: 'rgba(115, 139, 122, 0.25)',
    borderRightWidth: 0,
    shadowColor: '#506958',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 45,
  },
  sliderPillBar: {
    width: 3,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#6e8878',
  },
  // Floating Ask NRYN Orb (#nryn-orb from nryn-v6.9.html)
  floatingAskOrb: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#405e51',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#20392c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 43,
  },
  askOrbStar: {
    fontSize: 24,
    color: '#ffffff',
    lineHeight: 26,
    textAlign: 'center',
  },
});
