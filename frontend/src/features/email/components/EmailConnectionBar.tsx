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

export const EmailConnectionBar: React.FC = () => {
  const {
    isConnected,
    connectedEmail,
    connectedAccounts,
    selectedAccountEmail,
    setSelectedAccountEmail,
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

  const accounts = connectedAccounts && connectedAccounts.length > 0
    ? connectedAccounts
    : (connectedEmail ? [{ id: '1', email: connectedEmail }] : []);

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
      // Brief cool-down to prevent rapid multi-clicks
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
      <View style={{ marginBottom: spacing.md }}>
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
              pressRetentionOffset={{ top: 25, bottom: 25, left: 25, right: 25 }}
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
        </View>

        {showManual && (
          <View style={styles.manualBox}>
            <Text style={styles.manualLabel}>
              Chrome मध्ये दिसलेली लिंक (किंवा code) खाली पेस्ट करा:
            </Text>
            <View style={styles.manualRow}>
              <TextInput
                style={styles.manualInput}
                placeholder="Paste localhost:4000/api/email/oauth/callback?code=..."
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
            Connected Accounts ({accounts.length}/2)
          </Text>
          <Text style={styles.scopeBadge}>LIVE SYNC</Text>
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
          const isPrimary = index === 0;
          const roleLabel = isPrimary ? 'Personal / Primary' : 'Work / Secondary';
          const isSelected = selectedAccountEmail.toLowerCase() === acc.email.toLowerCase();

          return (
            <TouchableOpacity
              key={acc.id || acc.email}
              style={[styles.accountCard, isSelected && styles.accountCardSelected]}
              onPress={() => setSelectedAccountEmail(isSelected ? 'all' : acc.email)}
              activeOpacity={0.8}
            >
              <View style={styles.accountCardLeft}>
                <View style={[styles.accountOrb, !isPrimary && styles.accountOrbWork, isSelected && styles.accountOrbActive]}>
                  <Text style={styles.accountOrbText}>{isPrimary ? '1' : '2'}</Text>
                </View>
                <View style={styles.accountTextCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.roleTag}>{roleLabel}</Text>
                    {isSelected ? (
                      <View style={styles.activeViewingBadge}>
                        <Text style={styles.activeViewingText}>● VIEWING THIS INBOX</Text>
                      </View>
                    ) : (
                      <Text style={styles.tapToViewText}>Tap to view ➔</Text>
                    )}
                  </View>
                  <Text style={[styles.accountEmailText, isSelected && styles.accountEmailTextSelected]} numberOfLines={1}>
                    {acc.email}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.singleDisconnectBtn}
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleDisconnect(acc.email);
                }}
                disabled={isSyncing}
                activeOpacity={0.7}
              >
                <Text style={styles.singleDisconnectText}>Remove ✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Quick filter pills switcher */}
      {accounts.length > 1 && (
        <View style={styles.filterPillsRow}>
          <Text style={styles.filterPillLabel}>Viewing:</Text>
          <TouchableOpacity
            style={[styles.filterPill, selectedAccountEmail === 'all' && styles.filterPillActive]}
            onPress={() => setSelectedAccountEmail('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterPillText, selectedAccountEmail === 'all' && styles.filterPillTextActive]}>
              All Inboxes ({accounts.length})
            </Text>
          </TouchableOpacity>

          {accounts.map((acc, idx) => {
            const isActive = selectedAccountEmail.toLowerCase() === acc.email.toLowerCase();
            const prefix = idx === 0 ? 'Personal' : 'Work';
            const shortName = acc.email.split('@')[0];

            return (
              <TouchableOpacity
                key={`pill-${acc.email}`}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setSelectedAccountEmail(isActive ? 'all' : acc.email)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]} numberOfLines={1}>
                  {prefix}: {shortName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Add second account action if < 2 */}
      {accounts.length < 2 && (
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
                  Add Second Email (Work / Personal)
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Manual paste toggle for 2nd account */}
      {accounts.length < 2 && (
        <TouchableOpacity
          onPress={() => setShowManual(!showManual)}
          style={{ alignSelf: 'center', marginTop: 6 }}
        >
          <Text style={{ fontSize: 11, color: colors.accentDark || '#ae613f', textDecorationLine: 'underline' }}>
            {showManual ? 'Hide link paste' : 'Paste link for 2nd email?'}
          </Text>
        </TouchableOpacity>
      )}

      {showManual && (
        <View style={[styles.manualBox, { marginTop: 8 }]}>
          <Text style={styles.manualLabel}>
            दुसऱ्या ईमेलची Chrome मध्ये आलेली लिंक (किंवा code) खाली पेस्ट करा:
          </Text>
          <View style={styles.manualRow}>
            <TextInput
              style={styles.manualInput}
              placeholder="Paste callback URL with code for 2nd email..."
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
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disconnectButton: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#e2cfcf',
    backgroundColor: '#fbf4f4',
  },
  disconnectButtonText: {
    fontSize: 11,
    color: '#8c3f3f',
    fontFamily: typography.fontFamily.uiMedium,
  },
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
  manualBox: {
    backgroundColor: '#ffffff',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#e2dfd4',
    padding: spacing.sm,
    marginTop: 6,
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
  },
  multiHeaderTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#1f2e22',
  },
  accountList: {
    gap: 8,
  },
  accountCard: {
    backgroundColor: '#ffffff',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: '#dce7de',
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountCardSelected: {
    borderColor: '#2e603d',
    borderWidth: 1.5,
    backgroundColor: '#f2f8f4',
    shadowColor: '#2e603d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  accountCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },
  accountOrb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2e603d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountOrbWork: {
    backgroundColor: '#9e623b',
  },
  accountOrbActive: {
    transform: [{ scale: 1.05 }],
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
  activeViewingBadge: {
    backgroundColor: '#d8ecdc',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.pill,
  },
  activeViewingText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#20572e',
    letterSpacing: 0.5,
  },
  tapToViewText: {
    fontSize: 10,
    color: '#657467',
    fontStyle: 'italic',
  },
  accountEmailText: {
    fontSize: 12,
    color: '#243026',
    fontWeight: '500',
    marginTop: 1,
  },
  accountEmailTextSelected: {
    color: '#1a4424',
    fontWeight: '700',
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0eae2',
  },
  filterPillLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#657467',
    marginRight: 2,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: radii.pill,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cfdcd1',
  },
  filterPillActive: {
    backgroundColor: '#2b332b',
    borderColor: '#2b332b',
  },
  filterPillText: {
    fontSize: 11,
    color: '#344036',
    fontFamily: typography.fontFamily.uiMedium,
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  singleDisconnectBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
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
    paddingVertical: 9,
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
});
