import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigationStore } from '../features/navigation/navigation.store';
import { Dock } from '../features/navigation/Dock';
import { BottomBar } from '../features/navigation/BottomBar';
import { AskNrynSheet } from '../features/chat/AskNrynSheet';
import { colors } from '../shared/theme/tokens';

// Core App Screens
import { CalendarScreen } from '../features/calendar';
import { EmailScreen } from '../features/email';
import { FinanceScreen } from '../features/finance';
import { SettingsScreen } from '../features/settings';

export default function Index() {
  const currentSpace = useNavigationStore((state) => state.currentSpace);

  const renderActiveSpace = () => {
    switch (currentSpace) {
      case 'today':
        return <CalendarScreen />;
      case 'email':
        return <EmailScreen />;
      case 'finance':
        return <FinanceScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <CalendarScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.innerShell}>
          <View style={styles.spaceContainer}>{renderActiveSpace()}</View>
          <BottomBar />
        </View>
      </View>

      {/* Global Modals & Drawers */}
      <Dock />
      <AskNrynSheet />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ebeae5', // Authentic HTML prototype desktop canvas
  },
  container: {
    flex: 1,
    backgroundColor: '#ebeae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerShell: {
    flex: 1,
    width: '100%',
    maxWidth: 760,
    backgroundColor: colors.bg,
    position: 'relative',
    shadowColor: '#202b23',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 36,
    elevation: 8,
  },
  spaceContainer: {
    flex: 1,
    paddingBottom: 0,
  },
});

