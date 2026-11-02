import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigationStore } from '../features/navigation/navigation.store';
import { Dock } from '../features/navigation/Dock';
import { BottomBar } from '../features/navigation/BottomBar';
import { AskNrynSheet } from '../features/chat/AskNrynSheet';
import { colors } from '../shared/theme/tokens';

// Space Screens
import { CalendarScreen } from '../features/calendar';
import { KickstartScreen } from '../features/kickstart';
import { HealthScreen } from '../features/health';
import { PeopleScreen } from '../features/people';
import { EmailScreen } from '../features/email';
import { FinanceScreen } from '../features/finance';
import { WorkScreen } from '../features/work';
import { PrayanScreen } from '../features/prayan';
import { TravelScreen } from '../features/travel';
import { SpiritScreen } from '../features/spirit';
import { GrowthScreen } from '../features/growth';
import { NotesScreen } from '../features/notes';
import { SettingsScreen } from '../features/settings';

export default function Index() {
  const currentSpace = useNavigationStore((state) => state.currentSpace);

  const renderActiveSpace = () => {
    switch (currentSpace) {
      case 'today':
        return <CalendarScreen />;
      case 'kickstart':
        return <KickstartScreen />;
      case 'health':
        return <HealthScreen />;
      case 'inbox':
        return <PeopleScreen />;
      case 'email':
        return <EmailScreen />;
      case 'finance':
        return <FinanceScreen />;
      case 'work':
        return <WorkScreen />;
      case 'prayan':
        return <PrayanScreen />;
      case 'travel':
        return <TravelScreen />;
      case 'spirit':
        return <SpiritScreen />;
      case 'growth':
        return <GrowthScreen />;
      case 'notes':
        return <NotesScreen />;
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
    paddingBottom: 85,
  },
});
