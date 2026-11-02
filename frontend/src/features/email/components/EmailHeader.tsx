import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useNavigationStore } from '../../navigation/navigation.store';
import { colors, radii, spacing, typography } from '../../../shared/theme/tokens';

interface EmailHeaderProps {
  onBack?: () => void;
}

export const EmailHeader: React.FC<EmailHeaderProps> = ({ onBack }) => {
  const { openDock, goBack } = useNavigationStore();
  const handleBack = onBack || goBack;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.leftGroup}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backChevron}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.kicker}>COMMUNICATION / INTELLIGENCE</Text>
        </View>

        <TouchableOpacity
          onPress={openDock}
          style={styles.spacesButton}
          activeOpacity={0.7}
        >
          <Text style={styles.spacesText}>Spaces ▾</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.headline}>
        Less inbox.{'\n'}
        <Text style={styles.headlineEm}>More clarity.</Text>
      </Text>
      <Text style={styles.subtitle}>
        Understand · extract · review · act. No message is ever sent automatically.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: spacing.xs,
    paddingRight: 4,
  },
  backChevron: {
    fontSize: 24,
    lineHeight: 24,
    color: colors.ink,
    fontWeight: '300',
  },
  kicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    letterSpacing: 1.8,
    color: '#8b928b',
    textTransform: 'uppercase',
  },
  spacesButton: {
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  spacesText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.inkSecondary,
  },
  headline: {
    fontSize: 32,
    lineHeight: 36,
    fontFamily: 'Georgia',
    color: '#292e29',
    letterSpacing: -1,
    marginTop: 4,
  },
  headlineEm: {
    fontStyle: 'italic',
    color: '#cd8167',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiRegular,
    color: '#8b928b',
    marginTop: 4,
    lineHeight: 17,
  },
});
