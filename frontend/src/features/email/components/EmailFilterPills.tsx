import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../../shared/theme/tokens';
import { useEmailUiStore } from '../store/emailUi.store';
import { useNavigationStore } from '../../navigation/navigation.store';

export const EmailFilterPills: React.FC = () => {
  const {
    isConnected,
    connectedEmail,
    connectedAccounts,
    selectedAccountEmail,
    setSelectedAccountEmail,
  } = useEmailUiStore();
  const { navigate } = useNavigationStore();

  const accounts =
    connectedAccounts && connectedAccounts.length > 0
      ? connectedAccounts
      : connectedEmail
      ? [{ id: '1', email: connectedEmail }]
      : [];

  if (!isConnected || accounts.length === 0) {
    return (
      <TouchableOpacity
        style={styles.emptyContainer}
        onPress={() => navigate('settings')}
        activeOpacity={0.7}
      >
        <Text style={styles.emptyText}>
          ✉ No email accounts connected · <Text style={styles.emptyLink}>Manage in Settings ⚙ ➔</Text>
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.filterLabel}>Filter:</Text>

        <TouchableOpacity
          style={[styles.pill, selectedAccountEmail === 'all' && styles.pillActive]}
          onPress={() => setSelectedAccountEmail('all')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.pillText,
              selectedAccountEmail === 'all' && styles.pillTextActive,
            ]}
          >
            All Inboxes ({accounts.length})
          </Text>
        </TouchableOpacity>

        {accounts.map((acc, idx) => {
          const isActive = selectedAccountEmail.toLowerCase() === acc.email.toLowerCase();
          const shortName = acc.email.split('@')[0];
          const domain = acc.email.split('@')[1]?.split('.')[0] || '';
          const pillLabel = idx === 0 ? `Primary: ${shortName}` : `${shortName}@${domain}`;

          return (
            <TouchableOpacity
              key={`pill-${acc.id || acc.email}`}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => setSelectedAccountEmail(isActive ? 'all' : acc.email)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.pillText, isActive && styles.pillTextActive]}
                numberOfLines={1}
              >
                {pillLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Settings shortcut button */}
      <TouchableOpacity
        style={styles.settingsShortcut}
        onPress={() => navigate('settings')}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.settingsShortcutText}>⚙ Manage</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    backgroundColor: '#f7f9f7',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#e2ede4',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#556858',
    marginRight: 4,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cfded2',
  },
  pillActive: {
    backgroundColor: '#2b332b',
    borderColor: '#2b332b',
  },
  pillText: {
    fontSize: 12,
    color: '#344036',
    fontFamily: typography.fontFamily.uiMedium,
  },
  pillTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  settingsShortcut: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radii.sm,
    backgroundColor: '#edf5ee',
    borderWidth: 1,
    borderColor: '#d2e4d5',
    marginLeft: 6,
  },
  settingsShortcutText: {
    fontSize: 11,
    color: '#3d5c43',
    fontFamily: typography.fontFamily.uiMedium,
  },
  emptyContainer: {
    backgroundColor: '#f6f7f3',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#e5e3d7',
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#656b63',
    fontFamily: typography.fontFamily.uiMedium,
  },
  emptyLink: {
    color: '#2b5c36',
    fontWeight: '700',
  },
});
