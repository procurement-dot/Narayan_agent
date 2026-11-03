import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../../shared/theme/tokens';
import { useEmailUiStore } from '../store/emailUi.store';
import { useToast } from '../../../shared/components/Toast';

export const EmailConnectionBar: React.FC = () => {
  const { isConnected, connectedEmail, isSyncing, connectGmail, syncEmails } =
    useEmailUiStore();
  const { showToast } = useToast();

  const handleConnect = async () => {
    try {
      await connectGmail();
    } catch (err: any) {
      showToast('Could not open Google login', 'warning');
    }
  };

  const handleSync = async () => {
    if (isSyncing) return;
    try {
      showToast('Syncing emails & analyzing with Gemini...', 'success');
      const res = await syncEmails();
      if (res) {
        showToast(
          res.synced > 0
            ? `Synced ${res.synced} new email${res.synced > 1 ? 's' : ''}`
            : 'Inbox is up to date',
          'success'
        );
      }
    } catch (err: any) {
      const msg = err.message || 'Sync failed';
      if (msg.includes('Gmail API has not been used') || msg.includes('disabled')) {
        showToast('Please enable Gmail API in Google Cloud Console', 'warning');
      } else {
        showToast(msg.slice(0, 70), 'warning');
      }
    }
  };

  if (!isConnected) {
    return (
      <View style={styles.disconnectedContainer}>
        <View style={styles.leftCol}>
          <View style={styles.tagRow}>
            <Text style={styles.badgeOrb}>✳</Text>
            <Text style={styles.tagText}>GOOGLE OAUTH 2.0</Text>
          </View>
          <Text style={styles.title}>Live Gmail Assistant</Text>
          <Text style={styles.desc}>
            Connect securely to read, categorize, extract meetings and draft calm replies.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.connectButton}
          onPress={handleConnect}
          activeOpacity={0.8}
        >
          <Text style={styles.connectButtonText}>Connect Gmail ↗</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.connectedContainer}>
      <View style={styles.connectedLeft}>
        <View style={styles.statusDot} />
        <View style={styles.accountInfo}>
          <View style={styles.connectedTitleRow}>
            <Text style={styles.connectedTitle}>Gmail Live</Text>
            <Text style={styles.scopeBadge}>READ & DRAFT</Text>
          </View>
          <Text style={styles.emailAddress} numberOfLines={1}>
            {connectedEmail || 'Account connected'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
        onPress={handleSync}
        disabled={isSyncing}
        activeOpacity={0.7}
      >
        {isSyncing ? (
          <View style={styles.syncingRow}>
            <ActivityIndicator size="small" color="#2c3a2f" />
            <Text style={styles.syncButtonText}> Analyzing...</Text>
          </View>
        ) : (
          <Text style={styles.syncButtonText}>Sync Now ↻</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  disconnectedContainer: {
    backgroundColor: '#f7f6f1',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#e2dfd5',
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  leftCol: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  badgeOrb: {
    fontSize: 12,
    color: '#8a624a',
  },
  tagText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#7b8379',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 15,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#2a332c',
    marginBottom: 3,
  },
  desc: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6e766e',
  },
  connectButton: {
    backgroundColor: '#283129',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    letterSpacing: 0.3,
  },

  connectedContainer: {
    backgroundColor: '#f3f6f3',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#d2ded4',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#357a46',
  },
  accountInfo: {
    flex: 1,
  },
  connectedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connectedTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#233025',
  },
  scopeBadge: {
    fontSize: 9,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#496350',
    backgroundColor: '#dce8de',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: radii.pill,
    letterSpacing: 0.8,
  },
  emailAddress: {
    fontSize: 12,
    color: '#5b6b5d',
    marginTop: 1,
  },
  syncButton: {
    backgroundColor: '#e1ede3',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#c3dac7',
  },
  syncButtonDisabled: {
    opacity: 0.7,
  },
  syncingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncButtonText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#243b29',
  },
});
