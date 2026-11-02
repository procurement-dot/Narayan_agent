import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';
import { useNavigationStore } from './navigation.store';

interface AppHeaderProps {
  kicker: string;
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  kicker,
  title,
  subtitle,
  showBack = true,
}) => {
  const { goBack, openDock, currentSpace } = useNavigationStore();
  const canGoBack = showBack && currentSpace !== 'today';

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.leftGroup}>
          {canGoBack && (
            <TouchableOpacity
              onPress={goBack}
              style={styles.backButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.backChevron}>‹</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.kicker}>{kicker.toUpperCase()}</Text>
        </View>

        <TouchableOpacity
          onPress={openDock}
          style={styles.spacesButton}
          activeOpacity={0.7}
        >
          <Text style={styles.spacesText}>Spaces ▾</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontFamily: 'Georgia',
    color: colors.ink,
    letterSpacing: -0.8,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiRegular,
    color: '#8b928b',
    marginTop: 3,
    lineHeight: 17,
  },
});
