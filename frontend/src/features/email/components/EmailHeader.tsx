import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useNavigationStore } from '../../navigation/navigation.store';
import { useCalendarStore } from '../../calendar/calendar.store';
import { colors, radii, spacing, typography } from '../../../shared/theme/tokens';

interface EmailHeaderProps {
  onBack?: () => void;
}

export const EmailHeader: React.FC<EmailHeaderProps> = ({ onBack }) => {
  const { openDock, goBack } = useNavigationStore();
  const { openNotifications, unreadNotificationsCount } = useCalendarStore();
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
          <Text style={styles.headline}>Email</Text>
        </View>

        <View style={styles.rightGroup}>
          {/* Approval Bell Button */}
          <TouchableOpacity
            style={styles.bellHeaderBtn}
            onPress={openNotifications}
            activeOpacity={0.7}
            accessibilityLabel="Approvals"
          >
            <Text style={styles.bellIconText}>🔔</Text>
            {unreadNotificationsCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openDock}
            style={styles.spacesButton}
            activeOpacity={0.7}
          >
            <Text style={styles.spacesText}>Spaces ▾</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    marginBottom: 0,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    marginRight: spacing.xs,
    paddingRight: 4,
  },
  backChevron: {
    fontSize: 28,
    lineHeight: 32,
    color: colors.ink,
    fontWeight: '300',
  },
  kicker: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#6e766e',
  },
  bellHeaderBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
    backgroundColor: '#f1f2ee',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e1e3dd',
  },
  bellIconText: {
    fontSize: 13,
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#d4805c',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fcfbf8',
  },
  bellBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
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
    fontSize: 30,
    lineHeight: 34,
    fontFamily: 'Georgia',
    color: '#292e29',
    letterSpacing: -1,
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
