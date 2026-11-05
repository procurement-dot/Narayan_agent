import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSettingsStore } from './settings.store';
import { useEmailUiStore } from '../email/store/emailUi.store';
import { AppHeader } from '../navigation/AppHeader';
import { AiModelChoice } from './settings.types';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';
import { useToast } from '../../shared/components/Toast';

const AI_MODELS: AiModelChoice[] = [
  'GPT-6 · Instant',
  'GPT-6 · Medium',
  'GPT-6 · High',
  'Local on-device model',
];

export const SettingsScreen: React.FC = () => {
  const {
    connections,
    selectedModel,
    setModel,
    usagePeriod,
    setUsagePeriod,
    tokensUsed,
    costInr,
    toggleConnection,
  } = useSettingsStore();
  const {
    isConnected: isGmailConnected,
    connectedEmail,
    connectGmail,
    disconnectGmail,
    checkOAuthStatus,
  } = useEmailUiStore();
  const { showToast } = useToast();

  useEffect(() => {
    checkOAuthStatus();
  }, []);

  const handleToggleConnection = async (item: (typeof connections)[0]) => {
    if (item.id === 'gmail') {
      if (isGmailConnected) {
        try {
          await disconnectGmail();
          showToast('Gmail disconnected successfully', 'info');
        } catch (err: any) {
          showToast('Failed to disconnect Gmail', 'warning');
        }
      } else {
        try {
          await connectGmail();
        } catch (err: any) {
          showToast('Could not open Google login', 'warning');
        }
      }
      return;
    }

    if (item.id === 'calendar') {
      if (isGmailConnected) {
        showToast('Google Calendar is active with your Google account', 'info');
      } else {
        try {
          await connectGmail();
        } catch (err: any) {
          showToast('Could not open Google login', 'warning');
        }
      }
      return;
    }

    toggleConnection(item.id);
    showToast(
      item.connected
        ? `Disconnected ${item.name}`
        : `Connected ${item.name} (Simulation)`,
      'info'
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        kicker="NRYN / YOUR RULES"
        title="Control what connects."
        subtitle="Settings, AI models, permissions, spending ledger and reviews."
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Connections & Permissions */}
        <View style={styles.card}>
          <Text style={styles.cardKicker}>DATA INTEGRATIONS</Text>
          <Text style={styles.cardTitle}>Connections & Permissions</Text>
          <View style={styles.connectionList}>
            {connections.map((item) => {
              const isConnected =
                item.id === 'gmail' || item.id === 'calendar'
                  ? isGmailConnected
                  : item.connected;
              const displayDesc =
                (item.id === 'gmail' || item.id === 'calendar') && isGmailConnected && connectedEmail
                  ? `${item.desc} · Connected as ${connectedEmail}`
                  : item.desc;

              return (
                <View key={item.id} style={styles.connRow}>
                  <View style={styles.connInfo}>
                    <Text style={styles.connName}>{item.name}</Text>
                    <Text style={styles.connDesc}>{displayDesc}</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.connBadge,
                      isConnected ? styles.connBadgeActive : styles.connBadgeInactive,
                    ]}
                    onPress={() => handleToggleConnection(item)}
                  >
                    <Text
                      style={[
                        styles.connBadgeText,
                        isConnected && styles.connBadgeTextActive,
                      ]}
                    >
                      {isConnected ? 'Connected' : 'Connect'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
          <Text style={styles.disclaimerText}>
            Credentials and API keys must be entered through provider OAuth or secure native credential storage.
          </Text>
        </View>

        {/* AI Control Room */}
        <View style={styles.cardPeach}>
          <Text style={styles.cardKicker}>AI RUNTIME CONTROL</Text>
          <Text style={styles.cardTitle}>Active Model Choice</Text>
          <View style={styles.modelsGrid}>
            {AI_MODELS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.modelPill,
                  selectedModel === m && styles.modelPillActive,
                ]}
                onPress={() => {
                  setModel(m);
                  showToast(`Selected ${m}`, 'info');
                }}
              >
                <Text
                  style={[
                    styles.modelPillText,
                    selectedModel === m && styles.modelPillTextActive,
                  ]}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Usage Ledger */}
          <View style={styles.ledgerHeader}>
            <Text style={styles.ledgerTitle}>Usage Ledger</Text>
            <View style={styles.periodPills}>
              {(['daily', 'monthly'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.periodPill,
                    usagePeriod === p && styles.periodPillActive,
                  ]}
                  onPress={() => setUsagePeriod(p)}
                >
                  <Text
                    style={[
                      styles.periodPillText,
                      usagePeriod === p && styles.periodPillTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{tokensUsed}</Text>
              <Text style={styles.statLabel}>Tokens Processed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>₹{costInr.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Cost (Illustrative)</Text>
            </View>
          </View>
        </View>

        {/* Privacy & Sovereignty */}
        <View style={styles.card}>
          <Text style={styles.cardKicker}>PRIVACY & DATA SOVEREIGNTY</Text>
          <Text style={styles.cardTitle}>Local-First Controls</Text>
          <Text style={styles.privacyDesc}>
            Per-source opt-out, personal/work boundaries, data export and complete revocation.
            No password or credential is ever stored without encryption.
          </Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => showToast('Exported JSON archive to Downloads', 'success')}
            >
              <Text style={styles.outlineBtnText}>Export Local Archive</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardPeach: {
    backgroundColor: '#faebe5',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#f2dad0',
  },
  cardKicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  connectionList: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  connRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  connInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  connName: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  connDesc: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  connBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  connBadgeInactive: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.borderDark,
  },
  connBadgeActive: {
    backgroundColor: '#3b7a57',
    borderColor: '#3b7a57',
  },
  connBadgeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  connBadgeTextActive: {
    color: '#ffffff',
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 16,
    marginTop: spacing.md,
  },
  modelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  modelPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  modelPillActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  modelPillText: {
    fontSize: 12,
    color: colors.inkSecondary,
  },
  modelPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  ledgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
  },
  ledgerTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  periodPills: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    padding: 2,
  },
  periodPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  periodPillActive: {
    backgroundColor: colors.ink,
  },
  periodPillText: {
    fontSize: 11,
    color: colors.muted,
    textTransform: 'capitalize',
  },
  periodPillTextActive: {
    color: '#ffffff',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontFamily: typography.fontFamily.serifRegular,
    color: colors.ink,
  },
  statLabel: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  privacyDesc: {
    fontSize: 12,
    color: colors.inkSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  actionsRow: {
    marginTop: spacing.md,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingVertical: 8,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  outlineBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
});
