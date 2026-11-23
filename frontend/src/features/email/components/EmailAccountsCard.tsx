import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../../shared/theme/tokens';
import { useEmailUiStore } from '../store/emailUi.store';
import { useToast } from '../../../shared/components/Toast';

export const EmailAccountsCard: React.FC = () => {
  const {
    isConnected,
    connectedEmail,
    connectedAccounts,
    isSyncing,
    connectGmail,
    connectWithCode,
    syncEmails,
    disconnectGmail,
  } = useEmailUiStore();
  const { showToast } = useToast();

  const [showManual, setShowManual] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [isOpeningLogin, setIsOpeningLogin] = useState(false);

  const accounts =
    connectedAccounts && connectedAccounts.length > 0
      ? connectedAccounts
      : connectedEmail
      ? [{ id: '1', email: connectedEmail }]
      : [];

  const handleManualSubmit = async () => {
    const trimmed = manualInput.trim();
    if (!trimmed) {
      showToast('Please paste the URL from Chrome', 'warning');
      return;
    }
    setIsSubmittingCode(true);
    try {
      showToast('Connecting Gmail with provided link...', 'info');
      await connectWithCode(trimmed);
      showToast('Gmail connected successfully!', 'success');
      setShowManual(false);
      setManualInput('');
    } catch (err: any) {
      showToast(err.message || 'Could not verify link. Please check.', 'warning');
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const handleConnect = async () => {
    if (isOpeningLogin) return;
    setIsOpeningLogin(true);
    try {
      await connectGmail();
    } catch (err: any) {
      showToast('Could not open Google login', 'warning');
    } finally {
      setTimeout(() => setIsOpeningLogin(false), 2000);
    }
  };

  const handleDisconnect = async (email?: string) => {
    try {
      await disconnectGmail(email);
      showToast(email ? `Disconnected ${email}` : 'Gmail disconnected successfully', 'info');
    } catch (err: any) {
      showToast('Could not disconnect Gmail', 'warning');
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

  if (!isConnected || accounts.length === 0) {
    return (
      <View style={styles.disconnectedContainer}>
        <View style={styles.leftCol}>
          <View style={styles.tagRow}>
            <Text style={styles.badgeOrb}>✳</Text>
            <Text style={styles.tagText}>GOOGLE OAUTH 2.0</Text>
          </View>
          <Text style={styles.title}>Live Gmail Assistant</Text>
          <Text style={styles.desc}>
            Connect your personal and work emails to read, categorize, and extract tasks in one place.
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <TouchableOpacity
            style={[styles.connectButton, isOpeningLogin && { opacity: 0.75 }]}
            onPress={handleConnect}
            disabled={isOpeningLogin}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            {isOpeningLogin ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.connectButtonText}>Opening...</Text>
              </View>
            ) : (
              <Text style={styles.connectButtonText}>Connect Gmail ↗</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowManual(!showManual)}
            style={{ paddingVertical: 4, paddingHorizontal: 2 }}
          >
            <Text style={{ fontSize: 11, color: colors.accentDark || '#ae613f', textDecorationLine: 'underline' }}>
              {showManual ? 'Hide link paste' : 'Paste link from Chrome?'}
            </Text>
          </TouchableOpacity>
        </View>

        {showManual && (
          <View style={[styles.manualBox, { width: '100%', marginTop: 12 }]}>
            <Text style={styles.manualLabel}>
              Chrome मध्ये दिसलेली लिंक (किंवा code) खाली पेस्ट करा:
            </Text>
            <View style={styles.manualRow}>
              <TextInput
                style={styles.manualInput}
                placeholder="Paste callback URL with code..."
                placeholderTextColor="#999"
                value={manualInput}
                onChangeText={setManualInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.manualSubmitBtn}
                onPress={handleManualSubmit}
                disabled={isSubmittingCode}
              >
                {isSubmittingCode ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.manualSubmitText}>Connect ⚡</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.multiConnectedContainer}>
      {/* Header bar */}
      <View style={styles.multiHeaderRow}>
        <View style={styles.multiHeaderLeft}>
          <View style={styles.statusDot} />
          <Text style={styles.multiHeaderTitle}>
            Connected Accounts ({accounts.length} Active)
          </Text>
          <Text style={styles.scopeBadge}>MULTI-INBOX SYNC</Text>
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
            <Text style={styles.syncButtonText}>Sync All ↻</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Account items list */}
      <View style={styles.accountList}>
        {accounts.map((acc, index) => {
          const roleLabel =
            index === 0
              ? 'Primary Inbox'
              : index === 1
              ? 'Secondary Inbox'
              : `Inbox #${index + 1}`;

          return (
            <View
              key={acc.id || acc.email}
              style={styles.accountCard}
            >
              <View style={styles.accountCardLeft}>
                <View
                  style={[
                    styles.accountOrb,
                    index > 0 && styles.accountOrbWork,
                  ]}
                >
                  <Text style={styles.accountOrbText}>{index + 1}</Text>
                </View>
                <View style={styles.accountTextCol}>
                  <Text style={styles.roleTag}>{roleLabel}</Text>
                  <Text
                    style={styles.accountEmailText}
                    numberOfLines={1}
                  >
                    {acc.email}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.singleDisconnectBtn}
                onPress={() => handleDisconnect(acc.email)}
                disabled={isSyncing}
                activeOpacity={0.7}
              >
                <Text style={styles.singleDisconnectText}>Remove ✕</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Add another email account action */}
      <View style={styles.addAccountSection}>
        <TouchableOpacity
          style={[styles.addAccountButton, isOpeningLogin && { opacity: 0.75 }]}
          onPress={handleConnect}
          disabled={isOpeningLogin}
          activeOpacity={0.7}
        >
          {isOpeningLogin ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ActivityIndicator size="small" color="#223b28" />
              <Text style={styles.addAccountButtonText}>Opening Google...</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.addAccountPlus}>＋</Text>
              <Text style={styles.addAccountButtonText}>
                Add Another Email Account (Gmail / Workspace)
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Manual paste toggle for additional accounts */}
      <TouchableOpacity
        onPress={() => setShowManual(!showManual)}
        style={{ alignSelf: 'center', marginTop: 10 }}
      >
        <Text
          style={{
            fontSize: 11,
            color: colors.accentDark || '#ae613f',
            textDecorationLine: 'underline',
          }}
        >
          {showManual ? 'Hide link paste' : 'Paste verification link from Chrome?'}
        </Text>
      </TouchableOpacity>

      {showManual && (
        <View style={[styles.manualBox, { marginTop: 10 }]}>
          <Text style={styles.manualLabel}>
            Chrome मध्ये आलेली लिंक (किंवा code) खाली पेस्ट करा:
          </Text>
          <View style={styles.manualRow}>
            <TextInput
              style={styles.manualInput}
              placeholder="Paste callback URL with code for new email..."
              placeholderTextColor="#999"
              value={manualInput}
              onChangeText={setManualInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.manualSubmitBtn}
              onPress={handleManualSubmit}
              disabled={isSubmittingCode}
            >
              {isSubmittingCode ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.manualSubmitText}>Connect ⚡</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  leftCol: {
    flex: 1,
    minWidth: 180,
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

  multiConnectedContainer: {
    backgroundColor: '#f3f6f3',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#d2ded4',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  multiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0eae2',
  },
  multiHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    flexWrap: 'wrap',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#357a46',
  },
  multiHeaderTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#1f2e22',
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
  accountList: {
    gap: 8,
  },
  accountCard: {
    backgroundColor: '#ffffff',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: '#dce7de',
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  accountOrb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2e603d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountOrbWork: {
    backgroundColor: '#9e623b',
  },
  accountOrbText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  accountTextCol: {
    flex: 1,
  },
  roleTag: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#657467',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  accountEmailText: {
    fontSize: 13,
    color: '#243026',
    fontWeight: '600',
    marginTop: 1,
  },
  singleDisconnectBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: '#fdf3f3',
    borderWidth: 1,
    borderColor: '#f0d2d2',
    marginLeft: 8,
  },
  singleDisconnectText: {
    fontSize: 11,
    color: '#9e3f3f',
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '500',
  },
  addAccountSection: {
    marginTop: 10,
  },
  addAccountButton: {
    backgroundColor: '#e6efe8',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#c6dacb',
    borderStyle: 'dashed',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAccountPlus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#264e32',
  },
  addAccountButtonText: {
    fontSize: 12,
    color: '#264e32',
    fontFamily: typography.fontFamily.uiMedium,
  },
  manualBox: {
    backgroundColor: '#ffffff',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#e2dfd4',
    padding: spacing.sm,
  },
  manualLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#555e55',
    marginBottom: 6,
  },
  manualRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#f7f6f2',
    borderWidth: 1,
    borderColor: '#ddd9cc',
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: '#222',
  },
  manualSubmitBtn: {
    backgroundColor: '#273a2a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualSubmitText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
