import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useFinanceStore } from './finance.store';
import { AppHeader } from '../navigation/AppHeader';
import { PillTabs } from '../../shared/components/PillTabs';
import { FinanceAsset, FinanceTab } from './finance.types';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';
import { useToast } from '../../shared/components/Toast';

const FINANCE_TABS: { id: FinanceTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'assets', label: 'Assets' },
  { id: 'lending', label: 'Lending' },
  { id: 'retire', label: 'Retirement' },
  { id: 'reminders', label: 'Reminders' },
];

export const FinanceScreen: React.FC = () => {
  const {
    currentTab,
    setTab,
    assets,
    loans,
    alerts,
    selectedAsset,
    selectAsset,
    addAsset,
  } = useFinanceStore();
  const { showToast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetVal, setAssetVal] = useState('');
  const [assetRent, setAssetRent] = useState('');

  const totalNetWorth = assets.reduce((sum, a) => sum + a.value, 0);
  const totalLending = loans.reduce((sum, l) => sum + l.principal, 0);
  const totalRentExpected = assets.reduce((sum, a) => sum + a.expectedRent, 0);
  const totalRentReceived = assets.reduce((sum, a) => sum + a.receivedRent, 0);

  const formatLakhsCr = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const handleSaveAsset = () => {
    if (!assetName.trim() || !assetVal) {
      showToast('Please enter asset name and value', 'warning');
      return;
    }
    addAsset({
      name: assetName.trim(),
      type: 'Asset',
      value: Number(assetVal) || 0,
      cost: Number(assetVal) || 0,
      expectedRent: Number(assetRent) || 0,
      receivedRent: 0,
      area: 'India',
      status: 'New asset',
    });
    setAssetName('');
    setAssetVal('');
    setAssetRent('');
    setIsAddOpen(false);
    showToast('Asset added to portfolio', 'success');
  };

  return (
    <View style={styles.container}>
      <AppHeader
        kicker="WEALTH & CAPITAL · LIQUIDITY"
        title="Clarity on money."
        subtitle="Assets, rental income, lending and retirement runway."
      />

      <View style={styles.tabsContainer}>
        <PillTabs
          tabs={FINANCE_TABS}
          activeTab={currentTab}
          onSelect={(t) => setTab(t as FinanceTab)}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentTab === 'overview' && (
          <View style={styles.section}>
            {/* Net Worth Card */}
            <View style={styles.cardGreen}>
              <Text style={styles.cardKicker}>TOTAL ESTIMATED NET WORTH</Text>
              <Text style={styles.netWorthVal}>{formatLakhsCr(totalNetWorth)}</Text>
              <Text style={styles.netWorthSub}>Across 5 asset classes in India</Text>

              <View style={styles.gridStats}>
                <View style={styles.gridBox}>
                  <Text style={styles.gridLabel}>Outstanding Lending</Text>
                  <Text style={styles.gridVal}>{formatLakhsCr(totalLending)}</Text>
                </View>
                <View style={styles.gridDivider} />
                <View style={styles.gridBox}>
                  <Text style={styles.gridLabel}>Monthly Rent Gap</Text>
                  <Text style={styles.gridVal}>
                    ₹{(totalRentExpected - totalRentReceived).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Rental Income Snapshot */}
            <View style={styles.card}>
              <Text style={styles.cardKicker}>RENTAL CASHFLOW</Text>
              <View style={styles.flowRow}>
                <View>
                  <Text style={styles.flowLabel}>Expected / Month</Text>
                  <Text style={styles.flowVal}>₹{totalRentExpected.toLocaleString('en-IN')}</Text>
                </View>
                <View>
                  <Text style={styles.flowLabel}>Received This Month</Text>
                  <Text style={styles.flowValReceived}>
                    ₹{totalRentReceived.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setTab('assets')}
              >
                <Text style={styles.actionBtnText}>Review Powai Naka missing rent ↗</Text>
              </TouchableOpacity>
            </View>

            {/* Upcoming Financial Alerts */}
            <View style={styles.card}>
              <Text style={styles.cardKicker}>NEXT 7 DAYS REMINDERS</Text>
              {alerts.slice(0, 3).map((a, i) => (
                <View key={i} style={styles.alertRow}>
                  <View style={styles.alertInfo}>
                    <Text style={styles.alertTitle}>{a.title}</Text>
                    <Text style={styles.alertDue}>Due: {a.due}</Text>
                  </View>
                  <Text style={styles.alertAmount}>{a.amount}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {currentTab === 'assets' && (
          <View style={styles.section}>
            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>Asset Portfolio</Text>
              <TouchableOpacity
                style={styles.pillBtn}
                onPress={() => setIsAddOpen(true)}
              >
                <Text style={styles.pillBtnText}>+ Add Asset</Text>
              </TouchableOpacity>
            </View>

            {assets.map((asset, i) => (
              <TouchableOpacity
                key={i}
                style={styles.assetCard}
                onPress={() => selectAsset(asset)}
                activeOpacity={0.7}
              >
                <View style={styles.assetHeader}>
                  <Text style={styles.assetName}>{asset.name}</Text>
                  <Text style={styles.assetVal}>{formatLakhsCr(asset.value)}</Text>
                </View>
                <View style={styles.assetFooter}>
                  <Text style={styles.assetType}>{asset.type} · {asset.area}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      asset.status === 'Rent missing'
                        ? styles.statusWarning
                        : styles.statusNeutral,
                    ]}
                  >
                    <Text style={styles.statusText}>{asset.status}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {currentTab === 'lending' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Loans & Commitments</Text>
            {loans.map((loan, idx) => (
              <View key={idx} style={styles.card}>
                <View style={styles.loanHeader}>
                  <Text style={styles.loanName}>{loan.name}</Text>
                  <Text style={styles.loanPrincipal}>{formatLakhsCr(loan.principal)}</Text>
                </View>
                <View style={styles.loanMeta}>
                  <Text style={styles.loanRate}>
                    Interest: {loan.rate}% · {loan.frequency}
                  </Text>
                  <Text style={styles.loanDue}>Next due: {loan.due}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {currentTab === 'retire' && (
          <View style={styles.section}>
            <View style={styles.cardWarm}>
              <Text style={styles.cardKicker}>RETIREMENT RUNWAY CALCULATOR</Text>
              <Text style={styles.retireTitle}>Target Corpus: ₹3.00 Cr</Text>
              <Text style={styles.retireDesc}>
                Current age: 42 · Target age: 60{'\n'}
                Monthly SIP: ₹1,00,000{'\n'}
                Expected portfolio return: 10% · Inflation: 6%
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '68%' }]} />
              </View>
              <Text style={styles.progressNote}>68% of retirement milestone reached</Text>
            </View>
          </View>
        )}

        {currentTab === 'reminders' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Payment & Tax Reminders</Text>
            {alerts.map((alert, i) => (
              <View key={i} style={styles.card}>
                <View style={styles.alertRow}>
                  <View style={styles.alertInfo}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertDue}>{alert.desc} · {alert.due}</Text>
                  </View>
                  <Text style={styles.alertAmount}>{alert.amount}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Asset Modal */}
      <Modal visible={isAddOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add New Asset</Text>
            <Text style={styles.fieldLabel}>Asset Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Pune commercial unit"
              value={assetName}
              onChangeText={setAssetName}
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.fieldLabel}>Estimated Value (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5000000"
              keyboardType="numeric"
              value={assetVal}
              onChangeText={setAssetVal}
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.fieldLabel}>Expected Monthly Rent (₹, optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 25000"
              keyboardType="numeric"
              value={assetRent}
              onChangeText={setAssetRent}
              placeholderTextColor={colors.muted}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsAddOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveAsset}
              >
                <Text style={styles.saveBtnText}>Save Asset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Asset Detail Modal */}
      <Modal visible={!!selectedAsset} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{selectedAsset?.name}</Text>
            <Text style={styles.netWorthVal}>
              {selectedAsset ? formatLakhsCr(selectedAsset.value) : ''}
            </Text>
            <Text style={styles.assetDetailMeta}>
              Type: {selectedAsset?.type} · Location: {selectedAsset?.area}{'\n'}
              Cost basis: {selectedAsset ? formatLakhsCr(selectedAsset.cost) : ''}{'\n'}
              Expected Rent: ₹{selectedAsset?.expectedRent.toLocaleString('en-IN')}/mo
            </Text>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => selectAsset(null)}
            >
              <Text style={styles.doneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  tabsContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginVertical: spacing.xs,
  },
  pillBtn: {
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  pillBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardGreen: {
    backgroundColor: '#ebf4ea',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#d7e7d5',
  },
  cardWarm: {
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardKicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  netWorthVal: {
    fontSize: 26,
    fontFamily: typography.fontFamily.serifRegular,
    color: colors.ink,
  },
  netWorthSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  gridStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  gridBox: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11,
    color: colors.muted,
  },
  gridVal: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginTop: 2,
  },
  gridDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginHorizontal: spacing.md,
  },
  flowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  flowLabel: {
    fontSize: 11,
    color: colors.muted,
  },
  flowVal: {
    fontSize: 15,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginTop: 2,
  },
  flowValReceived: {
    fontSize: 15,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#3b7a57',
    marginTop: 2,
  },
  actionBtn: {
    marginTop: spacing.sm,
  },
  actionBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.accent,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  alertDue: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  alertAmount: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  assetCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetName: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  assetVal: {
    fontSize: 14,
    fontFamily: typography.fontFamily.serifRegular,
    color: colors.ink,
  },
  assetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  assetType: {
    fontSize: 11,
    color: colors.muted,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  statusWarning: {
    backgroundColor: '#fae3dc',
  },
  statusNeutral: {
    backgroundColor: colors.surfaceWarm,
  },
  statusText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanName: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  loanPrincipal: {
    fontSize: 14,
    fontFamily: typography.fontFamily.serifRegular,
    color: colors.ink,
  },
  loanMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  loanRate: {
    fontSize: 11,
    color: colors.muted,
  },
  loanDue: {
    fontSize: 11,
    color: colors.accent,
  },
  retireTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.serifRegular,
    color: colors.ink,
    marginTop: 4,
  },
  retireDesc: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 18,
    marginTop: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 3,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b7a57',
  },
  progressNote: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.serifRegular,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    marginBottom: 4,
    marginTop: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: colors.inkSecondary,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: colors.ink,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radii.pill,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
  },
  assetDetailMeta: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 20,
    marginVertical: spacing.md,
  },
  doneBtn: {
    backgroundColor: colors.surfaceWarm,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radii.pill,
  },
  doneBtnText: {
    color: colors.ink,
    fontFamily: typography.fontFamily.uiMedium,
  },
});
