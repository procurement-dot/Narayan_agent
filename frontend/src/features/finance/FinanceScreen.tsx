import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useFinanceStore } from './finance.store';
import { AppHeader } from '../navigation/AppHeader';
import { FinanceTab, RecordItem } from './finance.types';
import { useToast } from '../../shared/components/Toast';
import { useCalendarStore } from '../calendar/calendar.store';
import { syncAllBankTransactions, ScanProgressInfo } from './sms/smsReader.service';
import { ParsedBankTransaction } from './sms/sms.types';

const TABS: { id: FinanceTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'assets', label: 'Assets' },
  { id: 'lending', label: 'Lending' },
  { id: 'retire', label: 'Retirement' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'records', label: 'Records' },
];

const CASH_FLOW_SERIES = [38, 44, 42, 55, 52, 65, 63];
const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const ASSET_TYPES = ['Land', 'Real estate', 'Stocks', 'Gold', 'Business equity', 'Other'];

export const FinanceScreen: React.FC = () => {
  const {
    currentTab,
    setTab,
    assets,
    loans,
    alerts,
    retirement,
    records,
    selectedRecordCategory,
    addAsset,
    updateAssetRentReason,
    addLoan,
    toggleLoanPaid,
    updateRetirement,
    setSelectedRecordCategory,
    attachDocumentToRecord,
    smsSyncSummary,
    parsedTransactions,
    isSyncingSms,
    setIsSyncingSms,
    fetchBackendData,
    userNetCashFlow,
    setUserNetCashFlow,
  } = useFinanceStore();

  useEffect(() => {
    fetchBackendData();
  }, []);

  const { showToast } = useToast();
  const { addEvent } = useCalendarStore();

  // SMS Sync state
  const [isSmsTransactionsModalOpen, setIsSmsTransactionsModalOpen] = useState(false);
  const [smsFilter, setSmsFilter] = useState<'all' | 'debit' | 'credit' | 'bill'>('all');
  const [isScanningModalVisible, setIsScanningModalVisible] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgressInfo | null>(null);

  // User-controlled Net Cash Flow Modal
  const [isNetCashFlowModalOpen, setIsNetCashFlowModalOpen] = useState(false);
  const [netCashFlowMode, setNetCashFlowMode] = useState<'auto' | 'manual'>('auto');
  const [manualCashFlowInput, setManualCashFlowInput] = useState('');
  const [timePeriod, setTimePeriod] = useState<'month' | 'all'>('all');

  const handleSaveNetCashFlow = async () => {
    if (netCashFlowMode === 'manual') {
      const val = parseFloat(manualCashFlowInput.replace(/[₹,]/g, ''));
      if (isNaN(val)) {
        showToast('Please enter a valid amount', 'warning');
        return;
      }
      await setUserNetCashFlow(val);
      showToast(`Monthly Net Cash Flow set to ₹${val.toLocaleString('en-IN')}`, 'success');
    } else {
      await setUserNetCashFlow(null);
      showToast('Switched to auto-calculation from bank SMS', 'success');
    }
    setIsNetCashFlowModalOpen(false);
  };

  const handleSyncBankSms = async () => {
    try {
      setIsSyncingSms(true);
      setIsScanningModalVisible(true);
      setScanProgress({
        percent: 10,
        stage: 'Connecting to Android SMS inbox...',
        detail: 'Requesting permission and reading message store',
        current: 0,
        total: 0,
        timeRemaining: '~3s',
      });

      const summary = await syncAllBankTransactions((info) => {
        setScanProgress(info);
      });

      setIsScanningModalVisible(false);
      setScanProgress(null);
      showToast(`Synced ${summary.bankSmsCount} bank transactions!`, 'success');
    } catch (e: any) {
      setIsScanningModalVisible(false);
      setScanProgress(null);
      showToast(e.message || 'Failed to sync SMS', 'error');
    } finally {
      setIsSyncingSms(false);
    }
  };

  // Modals state
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<number | null>(null);
  const [rentReviewAsset, setRentReviewAsset] = useState<string | null>(null);

  const [isAddLoanOpen, setIsAddLoanOpen] = useState(false);

  const [selectedAlertIndex, setSelectedAlertIndex] = useState<number | null>(null);

  const [selectedRecordItem, setSelectedRecordItem] = useState<{
    category: string;
    item: RecordItem;
    index: number;
  } | null>(null);

  // Form states for Add Asset
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetType, setNewAssetType] = useState('Land');
  const [newAssetVal, setNewAssetVal] = useState('');
  const [newAssetRent, setNewAssetRent] = useState('0');

  // Form states for Add Loan
  const [newLoanName, setNewLoanName] = useState('');
  const [newLoanPrincipal, setNewLoanPrincipal] = useState('');
  const [newLoanRate, setNewLoanRate] = useState('10');
  const [newLoanDue, setNewLoanDue] = useState('2026-11-15');

  // Form states for Retirement assumptions
  const [retireInputs, setRetireInputs] = useState({
    age: String(retirement.age),
    retire: String(retirement.retire),
    corpus: String(retirement.corpus),
    sip: String(retirement.sip),
    returnRate: String(retirement.returnRate),
    inflation: String(retirement.inflation),
  });

  // Numbers formatting
  const formatMoney = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
    return `₹${Math.round(n).toLocaleString('en-IN')}`;
  };

  // Dynamic Calculations (No dummy data)
  const totalAssetsNet = assets.reduce((sum, a) => sum + Number(a.value || 0), 0);
  const totalLending = loans.reduce((sum, l) => sum + Number(l.principal || 0), 0);
  const totalRentExpected = assets.reduce((sum, a) => sum + Number(a.expectedRent || 0), 0);
  const totalRentReceived = assets.reduce((sum, a) => sum + Number(a.receivedRent || 0), 0);
  const totalLiquidBalances = (smsSyncSummary?.accountsFound || []).reduce(
    (sum, acc) => sum + (Number(acc.lastBalance) || 0),
    0
  );

  // Time-period filtering for Overview (Default: All History or Recent 30 Days)
  const activePeriodTransactions = React.useMemo(() => {
    if (timePeriod === 'all') {
      return parsedTransactions;
    }
    // Calculate 30-day window relative to the latest transaction in user's history
    const latestTxDate = parsedTransactions.length > 0 ? parsedTransactions[0].date : Date.now();
    const thirtyDaysAgo = latestTxDate - 30 * 24 * 60 * 60 * 1000;
    const recent = parsedTransactions.filter((tx) => tx.date >= thirtyDaysAgo);
    return recent.length > 0 ? recent : parsedTransactions;
  }, [timePeriod, parsedTransactions]);

  const periodCredited = React.useMemo(() => {
    return activePeriodTransactions
      .filter((tx) => tx.type === 'credit')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [activePeriodTransactions]);

  const periodDebited = React.useMemo(() => {
    return activePeriodTransactions
      .filter((tx) => tx.type === 'debit')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [activePeriodTransactions]);

  const periodCreditCount = activePeriodTransactions.filter((tx) => tx.type === 'credit').length;
  const periodDebitCount = activePeriodTransactions.filter((tx) => tx.type === 'debit').length;

  const autoNetCashFlow = periodCredited - periodDebited;
  const displayNetCashFlow =
    userNetCashFlow !== null ? userNetCashFlow : autoNetCashFlow;

  // Real financial picture: actual verified liquid balance + user assets + loans
  const dynamicTotalWorth =
    totalLiquidBalances > 0
      ? totalLiquidBalances + totalAssetsNet + totalLending
      : totalAssetsNet + totalLending;

  const propertyLandTotal = assets
    .filter((x) => /property|real estate|land/i.test(x.type))
    .reduce((a, b) => a + Number(b.value || 0), 0);

  const investmentsTotal = assets
    .filter((x) => !/property|real estate|land/i.test(x.type))
    .reduce((a, b) => a + Number(b.value || 0), 0);

  const rentDueAssets = assets.filter(
    (x) => x.expectedRent > 0 && x.receivedRent < x.expectedRent
  );
  const monthlyRentGap = rentDueAssets.reduce(
    (a, b) => a + (b.expectedRent - b.receivedRent),
    0
  );

  // Dynamic 7-bar weekly cash flow from real parsed SMS transactions
  const dynamicBars = React.useMemo(() => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    if (parsedTransactions.length === 0) {
      return days.map((dayLabel) => ({
        label: dayLabel,
        height: 12,
        amount: 0,
      }));
    }

    const buckets = [0, 0, 0, 0, 0, 0, 0];
    parsedTransactions.forEach((tx) => {
      const d = new Date(tx.date).getDay();
      const idx = d === 0 ? 6 : d - 1;
      buckets[idx] += tx.amount;
    });

    const maxVal = Math.max(...buckets, 1);
    return days.map((dayLabel, i) => {
      const val = buckets[i];
      const h = val === 0 ? 12 : Math.max(16, Math.min(105, Math.round((val / maxVal) * 105)));
      return {
        label: dayLabel,
        height: h,
        amount: val,
      };
    });
  }, [parsedTransactions]);

  const dynamicAlerts = parsedTransactions.filter((x) => x.type === 'bill');

  // Retirement Math
  const calculateRetirementMath = () => {
    const years = Math.max(1, Number(retirement.retire) - Number(retirement.age));
    const monthly = Math.max(-0.9, Number(retirement.returnRate) / 100) / 12;
    const months = years * 12;
    const target = Number(retirement.corpus) * Math.pow(1 + Number(retirement.inflation) / 100, years);
    const current = 31000000;
    const fv =
      current * Math.pow(1 + monthly, months) +
      Number(retirement.sip) * (Math.pow(1 + monthly, months) - 1) / Math.max(monthly, 0.00001);
    const need = Math.max(
      0,
      ((target - current * Math.pow(1 + monthly, months)) * monthly) /
        (Math.pow(1 + monthly, months) - 1)
    );
    const shortfall = Math.max(0, target - fv);
    return { years, target, fv, need, shortfall };
  };

  const rm = calculateRetirementMath();

  const handleSaveAsset = () => {
    const val = Number(newAssetVal);
    const rent = Number(newAssetRent) || 0;
    if (!newAssetName.trim() || val <= 0) {
      showToast('Please enter asset name and estimated value', 'warning');
      return;
    }
    addAsset({
      name: newAssetName.trim(),
      type: newAssetType,
      value: val,
      cost: val,
      expectedRent: rent,
      receivedRent: 0,
      area: 'India',
      status: rent > 0 ? 'Rent expected' : 'New asset',
    });
    setNewAssetName('');
    setNewAssetVal('');
    setNewAssetRent('0');
    setIsAddAssetOpen(false);
    showToast('Asset added · demo values', 'success');
  };

  const handleSaveLoan = () => {
    const principal = Number(newLoanPrincipal);
    const rate = Number(newLoanRate) || 0;
    if (!newLoanName.trim() || principal <= 0) {
      showToast('Please enter name and principal amount', 'warning');
      return;
    }
    addLoan({
      name: newLoanName.trim(),
      principal,
      rate,
      frequency: 'Monthly',
      due: newLoanDue,
      paid: false,
    });
    setNewLoanName('');
    setNewLoanPrincipal('');
    setIsAddLoanOpen(false);
    showToast('Lending record added', 'success');
  };

  const handleRecalcRetirement = () => {
    updateRetirement({
      age: Number(retireInputs.age) || retirement.age,
      retire: Number(retireInputs.retire) || retirement.retire,
      corpus: Number(retireInputs.corpus) || retirement.corpus,
      sip: Number(retireInputs.sip) || retirement.sip,
      returnRate: Number(retireInputs.returnRate) || retirement.returnRate,
      inflation: Number(retireInputs.inflation) || retirement.inflation,
    });
    showToast('Pathway recalculated', 'success');
  };

  const handleApproveReminderToCalendar = async (alertIndex: number) => {
    const item = alerts[alertIndex];
    if (!item) return;

    try {
      await addEvent({
        title: `Reminder · ${item.title}`,
        start: '09:30',
        end: '10:00',
        date: item.due,
        cat: 'purple',
        kind: 'finance',
        detail: `${item.amount} · scheduled for ${item.due} (${item.desc})`,
      });
      setSelectedAlertIndex(null);
      showToast(`Added to your Calendar for ${item.due}`, 'success');
    } catch {
      showToast('Failed to add reminder to calendar', 'error');
    }
  };

  const handleAttachDocument = (cat: string, index: number) => {
    const fakeDoc = `${cat.toLowerCase()}-doc-${Date.now().toString().slice(-4)}.pdf`;
    attachDocumentToRecord(cat, index, fakeDoc);
    setSelectedRecordItem(null);
    showToast(`Document ${fakeDoc} attached & indexed`, 'success');
  };

  return (
    <View style={styles.screenContainer}>
      <AppHeader
        kicker="FINANCE / CLARITY"
        title="Money"
        subtitle="Assets, loans, retirement and document vault."
      />

      {/* Pill Tabs Bar (.n68-tabs) */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {TABS.map((t) => {
            const isActive = currentTab === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => setTab(t.id)}
                activeOpacity={0.7}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ===================== 1. OVERVIEW TAB ===================== */}
        {currentTab === 'overview' && (
          <View>
            {/* SMS Sync Bar */}
            <View style={styles.smsSyncContainer}>
              <View style={{ flex: 1 }}>
                <View style={styles.smsHeaderRow}>
                  <Text style={styles.smsSyncTitle}>
                    {smsSyncSummary
                      ? `⚡ ${smsSyncSummary.bankSmsCount} Bank Transactions Synced`
                      : '⚡ Bank SMS Tracker'}
                  </Text>
                  {smsSyncSummary && (
                    <View style={styles.liveBadge}>
                      <Text style={styles.liveBadgeText}>All History</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.smsSyncSubtitle}>
                  {smsSyncSummary
                    ? `Total: +${formatMoney(smsSyncSummary.totalCredited)} | -${formatMoney(smsSyncSummary.totalDebited)} · ${smsSyncSummary.accountsFound.length} Accounts`
                    : 'Auto-track entire bank transaction history, cash flow & bill dues'}
                </Text>
              </View>

              <View style={styles.smsActionButtons}>
                {smsSyncSummary && (
                  <TouchableOpacity
                    style={styles.smsViewBtn}
                    onPress={() => setIsSmsTransactionsModalOpen(true)}
                  >
                    <Text style={styles.smsViewBtnText}>View</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.smsSyncBtn, isSyncingSms && { opacity: 0.7 }]}
                  onPress={handleSyncBankSms}
                  disabled={isSyncingSms}
                >
                  <Text style={styles.smsSyncBtnText}>
                    {isSyncingSms ? 'Syncing...' : smsSyncSummary ? 'Re-Sync' : 'Sync All'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Feature Banner: Sage (100% Dynamic) */}
            <View style={[styles.featureCard, styles.featureSage]}>
              <Text style={styles.featureSmall}>Verified Bank & Cash Position</Text>
              <Text style={styles.featureBig}>{formatMoney(dynamicTotalWorth)}</Text>
              <Text style={styles.featureSpan}>
                {smsSyncSummary
                  ? `Based on ${smsSyncSummary.bankSmsCount} verified transactions across ${smsSyncSummary.accountsFound.length} account${smsSyncSummary.accountsFound.length > 1 ? 's' : ''}`
                  : 'Tap Sync All to automatically calculate from your bank SMS'}
              </Text>
            </View>

            {/* Period Filter Selector: All History vs Monthly (30 Days) */}
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  timePeriod === 'all' && styles.tabButtonActive,
                  { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 14 },
                ]}
                onPress={() => setTimePeriod('all')}
              >
                <Text
                  style={[
                    styles.tabText,
                    timePeriod === 'all' && styles.tabTextActive,
                    { fontSize: 12, fontWeight: '600' },
                  ]}
                >
                  ⚡ All History
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  timePeriod === 'month' && styles.tabButtonActive,
                  { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 14 },
                ]}
                onPress={() => setTimePeriod('month')}
              >
                <Text
                  style={[
                    styles.tabText,
                    timePeriod === 'month' && styles.tabTextActive,
                    { fontSize: 12, fontWeight: '600' },
                  ]}
                >
                  📅 Monthly (Last 30 Days)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Stat Grid 2x2 (100% Dynamic) */}
            <View style={styles.statGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>
                  {timePeriod === 'month' ? 'Monthly Inflow' : 'Total Inflow (Credits)'}
                </Text>
                <Text style={[styles.statValue, { color: '#2e7d32' }]}>
                  {parsedTransactions.length > 0 ? `+${formatMoney(periodCredited)}` : '₹0'}
                </Text>
                <Text style={{ fontSize: 10, color: '#7a8e7e', marginTop: 3 }}>
                  {parsedTransactions.length > 0
                    ? `${periodCreditCount} verified credit${periodCreditCount !== 1 ? 's' : ''}`
                    : '0 credits'}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>
                  {timePeriod === 'month' ? 'Monthly Outflow' : 'Total Outflow (Debits)'}
                </Text>
                <Text style={[styles.statValue, { color: '#8a3324' }]}>
                  {parsedTransactions.length > 0 ? `-${formatMoney(periodDebited)}` : '₹0'}
                </Text>
                <Text style={{ fontSize: 10, color: '#7a8e7e', marginTop: 3 }}>
                  {parsedTransactions.length > 0
                    ? `${periodDebitCount} verified debit${periodDebitCount !== 1 ? 's' : ''}`
                    : '0 debits'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.statCard}
                activeOpacity={0.7}
                onPress={() => {
                  setNetCashFlowMode(userNetCashFlow !== null ? 'manual' : 'auto');
                  setManualCashFlowInput(userNetCashFlow !== null ? userNetCashFlow.toString() : '');
                  setIsNetCashFlowModalOpen(true);
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.statLabel}>Net Cash Flow</Text>
                  <Text style={{ fontSize: 10, color: '#3f6347', fontWeight: '700' }}>✎ Set</Text>
                </View>
                <Text
                  style={[
                    styles.statValue,
                    displayNetCashFlow >= 0 ? { color: '#2e7d32' } : { color: '#8a3324' },
                  ]}
                >
                  {displayNetCashFlow >= 0 ? '+' : '-'}
                  {formatMoney(Math.abs(displayNetCashFlow))}
                </Text>
                <Text style={{ fontSize: 10, color: '#687b6d', marginTop: 3 }}>
                  {userNetCashFlow !== null
                    ? 'User Added · Tap to change'
                    : parsedTransactions.length > 0
                    ? timePeriod === 'month'
                      ? 'Monthly Net · Tap to set'
                      : 'All-time Net · Tap to set'
                    : 'Tap to add monthly target'}
                </Text>
              </TouchableOpacity>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Active Bank Accounts</Text>
                <Text style={styles.statValue}>
                  {smsSyncSummary ? `${smsSyncSummary.accountsFound.length} Verified` : '0 Accounts'}
                </Text>
                <Text style={{ fontSize: 10, color: '#7a8e7e', marginTop: 3 }} numberOfLines={1}>
                  {smsSyncSummary && smsSyncSummary.accountsFound.length > 0
                    ? smsSyncSummary.accountsFound.map((a) => `${a.bank} (${a.mask})`).join(', ')
                    : 'Sync to detect accounts'}
                </Text>
              </View>
            </View>

            {/* Section: Monthly cash flow (Dynamic from Real SMS) */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Weekly cash flow</Text>
              <View style={styles.card}>
                <View style={styles.barChartContainer}>
                  {dynamicBars.map((b, i) => (
                    <View key={i} style={styles.barCol}>
                      <View style={[styles.barFill, { height: b.height }]} />
                      <Text style={styles.barLabel}>{b.label}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.legendRow}>
                  <Text style={styles.legendItem}>● Live transaction volume</Text>
                  <Text style={styles.legendItem}>
                    {parsedTransactions.length > 0
                      ? `${parsedTransactions.length} Verified Bank Transactions`
                      : 'Sync to load live data'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Section: Needs your attention (100% Dynamic) */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Needs your attention</Text>

              {/* Dynamic Bills from SMS */}
              {dynamicAlerts.map((b, i) => (
                <View key={`bill-${i}`} style={styles.n68Row}>
                  <View style={[styles.rowIcon, { backgroundColor: '#faece4' }]}>
                    <Text style={[styles.rowIconText, { color: '#b95133' }]}>🔔</Text>
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{b.bankName} · {formatMoney(b.amount)}</Text>
                    <Text style={styles.rowSubtitle}>
                      {b.dueDate ? `Due date: ${b.dueDate}` : b.rawBody.slice(0, 75)}
                    </Text>
                  </View>
                </View>
              ))}

              {/* Dynamic Rent Due (only if user recorded properties) */}
              {rentDueAssets.map((x, i) => (
                <TouchableOpacity
                  key={`rent-${i}`}
                  style={styles.n68Row}
                  activeOpacity={0.7}
                  onPress={() => setRentReviewAsset(x.name)}
                >
                  <View style={styles.rowIcon}>
                    <Text style={styles.rowIconText}>⌂</Text>
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{x.name} · rent not received</Text>
                    <Text style={styles.rowSubtitle}>
                      {formatMoney(x.expectedRent - x.receivedRent)} opportunity cost this month
                    </Text>
                  </View>
                  <Text style={styles.rowArrow}>↗</Text>
                </TouchableOpacity>
              ))}

              {/* Dynamic Loans (only if user recorded loans) */}
              {loans.length > 0 && (
                <TouchableOpacity
                  style={styles.n68Row}
                  activeOpacity={0.7}
                  onPress={() => setTab('lending')}
                >
                  <View style={styles.rowIcon}>
                    <Text style={styles.rowIconText}>₹</Text>
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{loans.length} active lending arrangement{loans.length > 1 ? 's' : ''}</Text>
                    <Text style={styles.rowSubtitle}>Principal: {formatMoney(totalLending)} · tap to review interest</Text>
                  </View>
                  <Text style={styles.rowArrow}>↗</Text>
                </TouchableOpacity>
              )}

              {/* Clean all clear message if no pending dues */}
              {dynamicAlerts.length === 0 && rentDueAssets.length === 0 && (
                <View style={[styles.n68Row, { opacity: 0.95 }]}>
                  <View style={[styles.rowIcon, { backgroundColor: '#e9f2e7' }]}>
                    <Text style={[styles.rowIconText, { color: '#386641' }]}>✓</Text>
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>All accounts in good standing</Text>
                    <Text style={styles.rowSubtitle}>
                      {smsSyncSummary
                        ? `No pending bill due dates found across your ${smsSyncSummary.bankSmsCount} verified bank SMS.`
                        : 'No pending alerts found.'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ===================== 2. ASSETS TAB ===================== */}
        {currentTab === 'assets' && (
          <View>
            {/* Feature Banner: Sage */}
            <View style={[styles.featureCard, styles.featureSage]}>
              <Text style={styles.featureSmall}>Asset value · sample</Text>
              <Text style={styles.featureBig}>{formatMoney(totalAssetsNet)}</Text>
              <Text style={styles.featureSpan}>
                Valuations are editable assumptions, not live market appraisals.
              </Text>
            </View>

            {/* Primary Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.7}
              onPress={() => setIsAddAssetOpen(true)}
            >
              <Text style={styles.primaryButtonText}>+ Add land, property or investment</Text>
            </TouchableOpacity>

            {/* Verified Liquid Accounts from SMS */}
            {(smsSyncSummary?.accountsFound || []).map((acc, i) => (
              <View key={`acc-${i}`} style={styles.assetItem}>
                <View style={[styles.assetSymbolBox, { backgroundColor: '#e8f3e6' }]}>
                  <Text style={styles.assetSymbolText}>🏦</Text>
                </View>
                <View style={styles.assetInfo}>
                  <Text style={styles.assetName}>{acc.bank}</Text>
                  <Text style={styles.assetMeta}>Active Bank Account · {acc.mask}</Text>
                  <Text style={[styles.assetStatus, { color: '#2e7d32' }]}>Verified via SMS</Text>
                </View>
                <Text style={styles.assetValue}>
                  {acc.lastBalance !== undefined ? formatMoney(acc.lastBalance) : 'Verified'}
                </Text>
              </View>
            ))}

            {/* Asset Items */}
            {assets.map((x, i) => {
              const isLand = /land/i.test(x.type);
              const isProp = /property|real estate/i.test(x.type);
              const iconSym = isLand ? '◭' : isProp ? '⌂' : '◇';

              return (
                <TouchableOpacity
                  key={i}
                  style={styles.assetItem}
                  activeOpacity={0.7}
                  onPress={() => setSelectedAssetDetail(i)}
                >
                  <View style={styles.assetSymbolBox}>
                    <Text style={styles.assetSymbolText}>{iconSym}</Text>
                  </View>
                  <View style={styles.assetInfo}>
                    <Text style={styles.assetName}>{x.name}</Text>
                    <Text style={styles.assetMeta}>
                      {x.type} · {x.area}
                    </Text>
                    <Text style={styles.assetStatus}>{x.status}</Text>
                  </View>
                  <Text style={styles.assetValue}>{formatMoney(x.value)}</Text>
                </TouchableOpacity>
              );
            })}

            {assets.length === 0 && (!smsSyncSummary || smsSyncSummary.accountsFound.length === 0) && (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <Text style={styles.modalP}>No property or land recorded yet.</Text>
                <Text style={styles.modalMuted}>
                  Tap '+ Add land, property or investment' above to record properties.
                </Text>
              </View>
            )}

            {/* Rental Outlook */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Rental outlook</Text>
              <View style={styles.card}>
                <Text style={styles.cardSubTitle}>Expected vs collected</Text>
                <View style={styles.meterTrack}>
                  <View
                    style={[
                      styles.meterFill,
                      {
                        width: `${Math.round(
                          (100 * totalRentReceived) / Math.max(1, totalRentExpected)
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.legendRow}>
                  <Text style={styles.legendItem}>
                    {formatMoney(totalRentReceived)} collected
                  </Text>
                  <Text style={styles.legendItem}>
                    {formatMoney(totalRentExpected)} expected
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ===================== 3. LENDING TAB ===================== */}
        {currentTab === 'lending' && (
          <View>
            {/* Feature Banner: Peach */}
            <View style={[styles.featureCard, styles.featurePeach]}>
              <Text style={styles.featureSmall}>Money lent</Text>
              <Text style={styles.featureBig}>{formatMoney(totalLending)}</Text>
              <Text style={styles.featureSpan}>
                {loans.length} lending arrangements
              </Text>
            </View>

            {/* Primary Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.7}
              onPress={() => setIsAddLoanOpen(true)}
            >
              <Text style={styles.primaryButtonText}>+ Record a loan</Text>
            </TouchableOpacity>

            {/* Loans Cards */}
            {loans.map((x, i) => {
              const interest =
                x.frequency === 'Monthly'
                  ? Math.round((x.principal * x.rate) / 1200)
                  : x.frequency === 'Quarterly'
                  ? Math.round((x.principal * x.rate) / 400)
                  : 0;

              return (
                <View key={i} style={styles.card}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.loanBorrower}>{x.name}</Text>
                    <View style={[styles.tagPill, x.paid && styles.tagPillPaid]}>
                      <Text style={[styles.tagText, x.paid && styles.tagTextPaid]}>
                        {x.paid ? 'Collected' : 'Awaiting'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.loanAmount}>{formatMoney(x.principal)}</Text>
                  <Text style={styles.loanDetails}>
                    {x.rate}% p.a. · {x.frequency} · due {x.due}
                  </Text>

                  <View style={[styles.rowBetween, { marginTop: 14 }]}>
                    <Text style={styles.nextInterest}>
                      Next interest · {formatMoney(interest)}
                    </Text>
                    <TouchableOpacity
                      style={styles.miniBtn}
                      activeOpacity={0.7}
                      onPress={() => toggleLoanPaid(i)}
                    >
                      <Text style={styles.miniBtnText}>
                        {x.paid ? 'Undo' : 'Mark received'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {loans.length === 0 && (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <Text style={styles.modalP}>No active lending records.</Text>
                <Text style={styles.modalMuted}>
                  Tap '+ Record a loan' above to track money lent with interest and due dates.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ===================== 4. RETIREMENT TAB ===================== */}
        {currentTab === 'retire' && (
          <View>
            {/* Feature Banner: Sage */}
            <View style={[styles.featureCard, styles.featureSage]}>
              <Text style={styles.featureSmall}>Target at retirement · inflation adjusted</Text>
              <Text style={styles.featureBig}>{formatMoney(rm.target)}</Text>
              <Text style={styles.featureSpan}>
                {retirement.retire} years old · {rm.years} years to build
              </Text>
            </View>

            {/* Stat Grid 2x2 */}
            <View style={styles.statGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Projected corpus</Text>
                <Text style={styles.statValue}>{formatMoney(rm.fv)}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Indicative SIP needed</Text>
                <Text style={styles.statValue}>{formatMoney(rm.need)}/mo</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Current SIP</Text>
                <Text style={styles.statValue}>{formatMoney(retirement.sip)}/mo</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Potential gap</Text>
                <Text style={styles.statValue}>{formatMoney(rm.shortfall)}</Text>
              </View>
            </View>

            {/* Change the assumptions Card */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Change the assumptions</Text>
              <View style={styles.fieldsGrid}>
                <View style={styles.fieldCol}>
                  <Text style={styles.inputLabel}>Current age</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={retireInputs.age}
                    onChangeText={(v) => setRetireInputs({ ...retireInputs, age: v })}
                  />
                </View>
                <View style={styles.fieldCol}>
                  <Text style={styles.inputLabel}>Retire at</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={retireInputs.retire}
                    onChangeText={(v) => setRetireInputs({ ...retireInputs, retire: v })}
                  />
                </View>
                <View style={styles.fieldCol}>
                  <Text style={styles.inputLabel}>Target corpus (today ₹)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={retireInputs.corpus}
                    onChangeText={(v) => setRetireInputs({ ...retireInputs, corpus: v })}
                  />
                </View>
                <View style={styles.fieldCol}>
                  <Text style={styles.inputLabel}>Monthly SIP ₹</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={retireInputs.sip}
                    onChangeText={(v) => setRetireInputs({ ...retireInputs, sip: v })}
                  />
                </View>
                <View style={styles.fieldCol}>
                  <Text style={styles.inputLabel}>Annual return %</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={retireInputs.returnRate}
                    onChangeText={(v) => setRetireInputs({ ...retireInputs, returnRate: v })}
                  />
                </View>
                <View style={styles.fieldCol}>
                  <Text style={styles.inputLabel}>Inflation %</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={retireInputs.inflation}
                    onChangeText={(v) => setRetireInputs({ ...retireInputs, inflation: v })}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 14 }]}
                activeOpacity={0.7}
                onPress={handleRecalcRetirement}
              >
                <Text style={styles.primaryButtonText}>Recalculate pathway</Text>
              </TouchableOpacity>
            </View>

            {/* Life milestones Section */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Life milestones</Text>
              <View style={styles.card}>
                <View style={styles.goalLine}>
                  <Text style={styles.goalYear}>2028</Text>
                  <Text style={styles.goalName}>Parents’ medical reserve</Text>
                  <Text style={styles.goalAmt}>₹8 L</Text>
                </View>
                <View style={styles.goalLine}>
                  <Text style={styles.goalYear}>2032</Text>
                  <Text style={styles.goalName}>Prayan · learning & exploration fund</Text>
                  <Text style={styles.goalAmt}>₹18 L</Text>
                </View>
                <View style={styles.goalLine}>
                  <Text style={styles.goalYear}>2036</Text>
                  <Text style={styles.goalName}>Family education / opportunity reserve</Text>
                  <Text style={styles.goalAmt}>₹35 L</Text>
                </View>
                <View style={[styles.goalLine, { borderBottomWidth: 0 }]}>
                  <Text style={styles.goalYear}>2044</Text>
                  <Text style={styles.goalName}>Retirement & family security</Text>
                  <Text style={styles.goalAmt}>{formatMoney(rm.target)}</Text>
                </View>
              </View>
              <Text style={styles.mutedPad}>
                Illustrative calculations, not investment advice. Milestones require individual goal-specific funding and tax assumptions.
              </Text>
            </View>
          </View>
        )}

        {/* ===================== 5. REMINDERS TAB ===================== */}
        {currentTab === 'reminders' && (
          <View>
            {/* Feature Banner: Peach */}
            <View style={[styles.featureCard, styles.featurePeach]}>
              <Text style={styles.featureSmall}>Upcoming obligations</Text>
              <Text style={styles.featureBig}>{alerts.length}</Text>
              <Text style={styles.featureSpan}>
                Card payment · EMI · premiums · tax · interest
              </Text>
            </View>

            {/* Reminders list */}
            {alerts.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.n68Row}
                activeOpacity={0.7}
                onPress={() => setSelectedAlertIndex(i)}
              >
                <View style={styles.rowIcon}>
                  <Text style={styles.rowIconText}>◷</Text>
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowSubtitle}>
                    {item.amount} · {item.due} · {item.desc}
                  </Text>
                </View>
                <Text style={styles.rowArrow}>↗</Text>
              </TouchableOpacity>
            ))}

            {alerts.length === 0 && (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <Text style={styles.modalP}>No pending bill or EMI obligations.</Text>
                <Text style={styles.modalMuted}>
                  When banks send credit card or EMI statements via SMS, they will automatically appear here.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ===================== 6. RECORDS TAB ===================== */}
        {currentTab === 'records' && (
          <View>
            {/* 6 Category Tiles Grid (2x3) */}
            <View style={styles.tilesGrid}>
              {Object.keys(records).map((k, idx) => {
                const icons: Record<string, string> = {
                  Accounts: '🏦',
                  'Credit cards': '▤',
                  Insurance: '✚',
                  Loans: '⌁',
                  Lockers: '◫',
                  Credentials: '♙',
                };
                const bgColors = ['#eef3ea', '#f3ede7', '#eeeef3', '#eef3ea', '#f3ede7', '#eeeef3'];
                const isSelected = selectedRecordCategory === k;

                return (
                  <TouchableOpacity
                    key={k}
                    style={[
                      styles.recordTile,
                      { backgroundColor: bgColors[idx % 6] },
                      isSelected && styles.recordTileSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setSelectedRecordCategory(isSelected ? null : k)}
                  >
                    <Text style={styles.tileIcon}>{icons[k] || '▤'}</Text>
                    <Text style={styles.tileTitle}>{k}</Text>
                    <Text style={styles.tileSubtitle}>
                      {records[k]?.length || 0} sample items
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected Category Items List */}
            {selectedRecordCategory && records[selectedRecordCategory] && (
              <View style={{ marginTop: 20 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.sectionTitle}>{selectedRecordCategory}</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedRecordCategory(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.closeCategoryText}>Close</Text>
                  </TouchableOpacity>
                </View>

                {records[selectedRecordCategory].map((row, idx) => (
                  <View key={idx} style={styles.moneyRow}>
                    <TouchableOpacity
                      style={styles.moneyRowButton}
                      activeOpacity={0.7}
                      onPress={() =>
                        setSelectedRecordItem({
                          category: selectedRecordCategory,
                          item: row,
                          index: idx,
                        })
                      }
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.moneyRowTitle}>{row[0]}</Text>
                        <Text style={styles.moneyRowMeta}>
                          {row[1]} · {row[2]}
                        </Text>
                      </View>
                      <Text style={styles.rowArrow}>↗</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.docButton}
                      activeOpacity={0.7}
                      onPress={() => handleAttachDocument(selectedRecordCategory, idx)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.docButtonText}>▤</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.recordsNote}>
              Sample numbers are masked. Sensitive credentials and CVVs are not held in browser storage.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ===================== MODAL 1: ADD ASSET ===================== */}
      <Modal
        visible={isAddAssetOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddAssetOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Add an asset</Text>
              <TouchableOpacity onPress={() => setIsAddAssetOpen(false)}>
                <Text style={styles.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Land in Pune"
                value={newAssetName}
                onChangeText={setNewAssetName}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Type</Text>
              <View style={styles.optionsWrap}>
                {ASSET_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.optChip, newAssetType === t && styles.optChipChosen]}
                    onPress={() => setNewAssetType(t)}
                  >
                    <Text
                      style={[
                        styles.optChipText,
                        newAssetType === t && styles.optChipTextChosen,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Estimated value ₹</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="0"
                value={newAssetVal}
                onChangeText={setNewAssetVal}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Expected monthly rent ₹</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="0"
                value={newAssetRent}
                onChangeText={setNewAssetRent}
              />

              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 20 }]}
                onPress={handleSaveAsset}
              >
                <Text style={styles.primaryButtonText}>Add asset</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===================== MODAL 2: ASSET DETAIL ===================== */}
      <Modal
        visible={selectedAssetDetail !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedAssetDetail(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            {selectedAssetDetail !== null && assets[selectedAssetDetail] && (
              <View>
                <View style={styles.sheetHead}>
                  <Text style={styles.sheetTitle}>{assets[selectedAssetDetail].name}</Text>
                  <TouchableOpacity onPress={() => setSelectedAssetDetail(null)}>
                    <Text style={styles.sheetClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalBigAmount}>
                  {formatMoney(assets[selectedAssetDetail].value)}
                </Text>
                <Text style={styles.modalP}>
                  {assets[selectedAssetDetail].type} · {assets[selectedAssetDetail].area}
                </Text>
                <Text style={styles.modalP}>
                  Original cost (estimate): {formatMoney(assets[selectedAssetDetail].cost)}
                </Text>
                <Text style={styles.modalP}>
                  Rent expected: {formatMoney(assets[selectedAssetDetail].expectedRent)}/month
                </Text>
                <Text style={styles.modalP}>
                  Collected: {formatMoney(assets[selectedAssetDetail].receivedRent)}/month
                </Text>
                <Text style={styles.modalMuted}>
                  Market valuations require location, comparable transactions, taxes, maintenance, vacancy and trusted rental data. This is a manual estimate.
                </Text>

                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: 16 }]}
                  onPress={() => {
                    const name = assets[selectedAssetDetail].name;
                    setSelectedAssetDetail(null);
                    setRentReviewAsset(name);
                  }}
                >
                  <Text style={styles.primaryButtonText}>Check rental gap</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ===================== MODAL 3: RENTAL FOLLOW-UP ===================== */}
      <Modal
        visible={rentReviewAsset !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setRentReviewAsset(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Rental follow-up</Text>
              <TouchableOpacity onPress={() => setRentReviewAsset(null)}>
                <Text style={styles.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {rentReviewAsset && (
              <View>
                <Text style={styles.modalBigAmount}>
                  {formatMoney(
                    (assets.find((y) => y.name === rentReviewAsset)?.expectedRent || 18000) -
                      (assets.find((y) => y.name === rentReviewAsset)?.receivedRent || 0)
                  )}
                </Text>
                <Text style={styles.modalP}>
                  Illustrative monthly opportunity cost before vacancy, fees, taxes and maintenance.
                </Text>
                <Text style={styles.modalP}>
                  Ask whether rent was delayed, property is vacant, lease changed, or money was received elsewhere.
                </Text>

                <View style={[styles.optionsWrap, { marginTop: 14 }]}>
                  {['Delayed', 'Vacant', 'Waived', 'Received elsewhere'].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={styles.optChip}
                      onPress={() => {
                        updateAssetRentReason(rentReviewAsset, r);
                        setRentReviewAsset(null);
                        showToast(`Reason noted for follow-up: ${r}`, 'success');
                      }}
                    >
                      <Text style={styles.optChipText}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ===================== MODAL 4: RECORD LENDING ===================== */}
      <Modal
        visible={isAddLoanOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddLoanOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Record lending</Text>
              <TouchableOpacity onPress={() => setIsAddLoanOpen(false)}>
                <Text style={styles.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Person / organisation</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Name"
                value={newLoanName}
                onChangeText={setNewLoanName}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Amount lent ₹</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="e.g. 500000"
                value={newLoanPrincipal}
                onChangeText={setNewLoanPrincipal}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Annual interest %</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={newLoanRate}
                onChangeText={setNewLoanRate}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Next due date</Text>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                value={newLoanDue}
                onChangeText={setNewLoanDue}
              />

              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 20 }]}
                onPress={handleSaveLoan}
              >
                <Text style={styles.primaryButtonText}>Add lending record</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===================== MODAL 5: REMINDER CALENDAR APPROVAL ===================== */}
      <Modal
        visible={selectedAlertIndex !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedAlertIndex(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            {selectedAlertIndex !== null && alerts[selectedAlertIndex] && (
              <View>
                <View style={styles.sheetHead}>
                  <Text style={styles.sheetTitle}>{alerts[selectedAlertIndex].title}</Text>
                  <TouchableOpacity onPress={() => setSelectedAlertIndex(null)}>
                    <Text style={styles.sheetClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalBigAmount}>{alerts[selectedAlertIndex].amount}</Text>
                <Text style={styles.modalP}>
                  Due: {alerts[selectedAlertIndex].due} · {alerts[selectedAlertIndex].desc}
                </Text>
                <Text style={styles.modalMuted}>
                  Sample reminder from account documents. Calendar approval is required.
                </Text>

                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: 20 }]}
                  onPress={() => handleApproveReminderToCalendar(selectedAlertIndex)}
                >
                  <Text style={styles.primaryButtonText}>Approve reminder on my day</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ===================== MODAL 6: RECORD DETAIL SHEET ===================== */}
      <Modal
        visible={selectedRecordItem !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedRecordItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            {selectedRecordItem && (
              <View>
                <View style={styles.sheetHead}>
                  <Text style={styles.sheetTitle}>{selectedRecordItem.item[0]}</Text>
                  <TouchableOpacity onPress={() => setSelectedRecordItem(null)}>
                    <Text style={styles.sheetClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalMasked}>{selectedRecordItem.item[1]}</Text>
                <Text style={styles.modalP}>{selectedRecordItem.item[2]}</Text>
                <Text style={styles.modalP}>{selectedRecordItem.item[3]}</Text>

                {selectedRecordItem.category === 'Credit cards' && (
                  <Text style={styles.modalMuted}>
                    Card security code is never saved in this demo.
                  </Text>
                )}
                {selectedRecordItem.category === 'Credentials' && (
                  <Text style={styles.modalMuted}>
                    Use an OS-backed password manager for secrets, not this app.
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: 20 }]}
                  onPress={() =>
                    handleAttachDocument(
                      selectedRecordItem.category,
                      selectedRecordItem.index
                    )
                  }
                >
                  <Text style={styles.primaryButtonText}>▤ Attach a document</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ===================== MODAL 7: SMS TRANSACTIONS LIST ===================== */}
      <Modal
        visible={isSmsTransactionsModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsSmsTransactionsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.sheetContainer, { maxHeight: '85%' }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHead}>
              <View>
                <Text style={styles.sheetTitle}>Bank SMS Transactions</Text>
                <Text style={styles.sheetSub}>
                  {parsedTransactions.length} items parsed across entire SMS history
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsSmsTransactionsModalOpen(false)}>
                <Text style={styles.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Filter Pills */}
            <View style={styles.smsFilterRow}>
              {(['all', 'debit', 'credit', 'bill'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.smsFilterChip, smsFilter === f && styles.smsFilterChipActive]}
                  onPress={() => setSmsFilter(f)}
                >
                  <Text
                    style={[
                      styles.smsFilterChipText,
                      smsFilter === f && styles.smsFilterChipTextActive,
                    ]}
                  >
                    {f === 'all'
                      ? `All (${parsedTransactions.length})`
                      : f === 'debit'
                      ? `Debits (${parsedTransactions.filter((x) => x.type === 'debit').length})`
                      : f === 'credit'
                      ? `Credits (${parsedTransactions.filter((x) => x.type === 'credit').length})`
                      : `Bills (${parsedTransactions.filter((x) => x.type === 'bill').length})`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Transactions List */}
            <ScrollView
              style={{ marginTop: 12 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
            >
              {parsedTransactions
                .filter((tx) => smsFilter === 'all' || tx.type === smsFilter)
                .map((tx, idx) => {
                  const isCredit = tx.type === 'credit';
                  const isBill = tx.type === 'bill';
                  const dateStr = new Date(tx.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <View key={tx.id || idx} style={styles.smsTxItem}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.smsTxHeader}>
                          <Text style={styles.smsTxBank}>{tx.bankName}</Text>
                          {tx.accountMask && (
                            <Text style={styles.smsTxAccount}>{tx.accountMask}</Text>
                          )}
                          <Text style={styles.smsTxDate}>{dateStr}</Text>
                        </View>
                        <Text style={styles.smsTxDesc} numberOfLines={1}>
                          {tx.merchant || tx.category || 'Bank Transaction'}
                        </Text>
                        {tx.balance !== undefined && (
                          <Text style={styles.smsTxBal}>
                            Avl Bal: ₹{tx.balance.toLocaleString('en-IN')}
                          </Text>
                        )}
                        {tx.dueDate && (
                          <Text style={styles.smsTxDue}>Due: {tx.dueDate}</Text>
                        )}
                      </View>

                      <View style={styles.smsTxAmountCol}>
                        <Text
                          style={[
                            styles.smsTxAmount,
                            isCredit && styles.smsTxCredit,
                            isBill && styles.smsTxBill,
                          ]}
                        >
                          {isCredit ? '+' : isBill ? '🔔 ' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                        </Text>
                        <Text style={styles.smsTxTypeBadge}>
                          {tx.type.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  );
                })}

              {parsedTransactions.length === 0 && (
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <Text style={styles.modalP}>No bank SMS found. Click Sync All to scan.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===================== MODAL 8: LIVE SCAN PROGRESS MODAL ===================== */}
      <Modal
        visible={isScanningModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.progressCardContainer}>
            <View style={styles.progressIconRow}>
              <View style={styles.progressIconCircle}>
                <Text style={styles.progressIconText}>⚡</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.progressModalTitle}>Scanning Bank SMS</Text>
                <Text style={styles.progressModalSubtitle}>
                  Analyzing your entire message inbox
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${scanProgress ? scanProgress.percent : 10}%` },
                ]}
              />
            </View>

            {/* Percentage & ETA Row */}
            <View style={styles.progressMetaRow}>
              <Text style={styles.progressPercentText}>
                {scanProgress ? `${scanProgress.percent}%` : '0%'}
              </Text>
              <Text style={styles.progressEtaText}>
                {scanProgress ? scanProgress.timeRemaining : '~2s remaining'}
              </Text>
            </View>

            {/* Current Stage Text */}
            <View style={styles.progressStatusBox}>
              <Text style={styles.progressStageText}>
                {scanProgress?.stage || 'Connecting to Android SMS inbox...'}
              </Text>
              <Text style={styles.progressDetailText}>
                {scanProgress?.detail || 'Reading bank messages securely on-device'}
              </Text>
            </View>

            {/* Live Step Checklist */}
            <View style={styles.checklistWrap}>
              <View style={styles.checkStep}>
                <Text
                  style={[
                    styles.stepDot,
                    (scanProgress?.percent || 0) >= 20 && styles.stepDotDone,
                  ]}
                >
                  {(scanProgress?.percent || 0) >= 20 ? '✓' : '1'}
                </Text>
                <Text style={styles.stepLabel}>Connect to SMS inbox</Text>
              </View>
              <View style={styles.checkStep}>
                <Text
                  style={[
                    styles.stepDot,
                    (scanProgress?.percent || 0) >= 40 && styles.stepDotDone,
                  ]}
                >
                  {(scanProgress?.percent || 0) >= 40 ? '✓' : '2'}
                </Text>
                <Text style={styles.stepLabel}>Scan bank transactions</Text>
              </View>
              <View style={styles.checkStep}>
                <Text
                  style={[
                    styles.stepDot,
                    (scanProgress?.percent || 0) >= 80 && styles.stepDotDone,
                  ]}
                >
                  {(scanProgress?.percent || 0) >= 80 ? '✓' : '3'}
                </Text>
                <Text style={styles.stepLabel}>Extract balances & debits</Text>
              </View>
              <View style={styles.checkStep}>
                <Text
                  style={[
                    styles.stepDot,
                    (scanProgress?.percent || 0) >= 100 && styles.stepDotDone,
                  ]}
                >
                  {(scanProgress?.percent || 0) >= 100 ? '✓' : '4'}
                </Text>
                <Text style={styles.stepLabel}>Update live financial picture</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===================== MODAL 9: MONTHLY NET CASH FLOW ===================== */}
      <Modal
        visible={isNetCashFlowModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsNetCashFlowModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHead}>
              <View>
                <Text style={styles.sheetTitle}>Monthly Net Cash Flow</Text>
                <Text style={styles.sheetSub}>
                  Set your target monthly savings or auto-calculate from SMS
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsNetCashFlowModalOpen(false)}>
                <Text style={styles.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Mode Toggle Buttons */}
              <View style={{ flexDirection: 'row', gap: 10, marginVertical: 14 }}>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    netCashFlowMode === 'manual' && styles.tabButtonActive,
                    { flex: 1, paddingVertical: 10 },
                  ]}
                  onPress={() => setNetCashFlowMode('manual')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      netCashFlowMode === 'manual' && styles.tabTextActive,
                      { textAlign: 'center' },
                    ]}
                  >
                    ✎ User Specified
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    netCashFlowMode === 'auto' && styles.tabButtonActive,
                    { flex: 1, paddingVertical: 10 },
                  ]}
                  onPress={() => setNetCashFlowMode('auto')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      netCashFlowMode === 'auto' && styles.tabTextActive,
                      { textAlign: 'center' },
                    ]}
                  >
                    ⚡ Auto from SMS
                  </Text>
                </TouchableOpacity>
              </View>

              {netCashFlowMode === 'manual' ? (
                <View>
                  <Text style={styles.inputLabel}>Monthly Net Cash Flow / Savings Target (₹)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 25000"
                    keyboardType="numeric"
                    value={manualCashFlowInput}
                    onChangeText={setManualCashFlowInput}
                  />
                  <Text style={{ fontSize: 12, color: '#66786a', marginTop: 6, lineHeight: 18 }}>
                    Specify your own monthly net cash flow. This custom target will be saved and displayed on your overview.
                  </Text>
                </View>
              ) : (
                <View style={{ backgroundColor: '#f6f9f5', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2ede0', marginVertical: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#27382c' }}>
                    Auto-calculated from Verified Bank SMS:
                  </Text>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: autoNetCashFlow >= 0 ? '#2e7d32' : '#8a3324', marginTop: 6, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
                    {autoNetCashFlow >= 0 ? '+' : '-'}
                    {formatMoney(Math.abs(autoNetCashFlow))}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#66786a', marginTop: 4, lineHeight: 18 }}>
                    {smsSyncSummary
                      ? `Calculated as Total Inflow (+${formatMoney(smsSyncSummary.totalCredited)}) minus Total Outflow (-${formatMoney(smsSyncSummary.totalDebited)}).`
                      : 'Sync your bank SMS to automatically calculate from real deposits and debits.'}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 24 }]}
                onPress={handleSaveNetCashFlow}
              >
                <Text style={styles.primaryButtonText}>Save Net Cash Flow</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#fcfbf8',
  },
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#edf0eb',
    backgroundColor: '#fcfbf8',
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 7,
    flexDirection: 'row',
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e7df',
  },
  tabButtonActive: {
    backgroundColor: '#dfe9df',
    borderColor: '#aabfac',
  },
  tabText: {
    fontSize: 12,
    color: '#718375',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#31463a',
    fontWeight: '600',
  },
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    paddingTop: 8,
  },

  // Feature Hero Cards (.n68-feature)
  featureCard: {
    borderRadius: 23,
    padding: 22,
    marginVertical: 6,
    gap: 4,
  },
  featureSage: {
    backgroundColor: '#e9f0e7',
  },
  featurePeach: {
    backgroundColor: '#f3eae2',
  },
  featureSmall: {
    fontSize: 11,
    color: '#7a8d7d',
  },
  featureBig: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 36,
    fontWeight: '500',
    color: '#455e4d',
    marginVertical: 3,
    letterSpacing: -0.5,
  },
  featureSpan: {
    fontSize: 12,
    color: '#6d806f',
  },

  // Stat Grid (.n68-statgrid)
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginVertical: 12,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e7ece4',
    borderRadius: 16,
    padding: 14,
    minHeight: 90,
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#8d9c90',
    marginBottom: 4,
  },
  statValue: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 22,
    fontWeight: '600',
    color: '#405744',
    letterSpacing: -0.5,
  },

  // Section & Cards (.n68-section, .n68-card)
  sectionWrap: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '650' as any,
    color: '#425745',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e7ece6',
    borderRadius: 19,
    padding: 18,
    marginVertical: 4,
  },
  cardSubTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#425745',
    marginBottom: 10,
  },

  // Bar Chart (.n68-bars)
  barChartContainer: {
    height: 135,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  barCol: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: 26,
    borderRadius: 8,
    backgroundColor: '#a8c6ad',
  },
  barLabel: {
    fontSize: 10,
    color: '#a1aca0',
    marginTop: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  legendItem: {
    fontSize: 11,
    color: '#869987',
  },

  // Rows (.n68-row)
  n68Row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#edf0eb',
    gap: 13,
  },
  rowIcon: {
    width: 37,
    height: 37,
    borderRadius: 14,
    backgroundColor: '#eaf0e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconText: {
    fontSize: 18,
    color: '#7e927e',
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#425448',
    lineHeight: 18,
  },
  rowSubtitle: {
    fontSize: 11,
    color: '#9aa69a',
    marginTop: 3,
    lineHeight: 15,
  },
  rowArrow: {
    fontSize: 15,
    color: '#9daea0',
  },

  // Primary Action Button (.n68-primary)
  primaryButton: {
    backgroundColor: '#e2ece1',
    borderWidth: 1,
    borderColor: '#bed1be',
    borderRadius: 15,
    paddingVertical: 13,
    alignItems: 'center',
    marginVertical: 10,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '650' as any,
    color: '#3e5946',
  },

  // Asset item (.n68-asset)
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e8ece7',
    gap: 12,
  },
  assetSymbolBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#eaf0e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetSymbolText: {
    fontSize: 24,
    color: '#79917e',
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#405745',
  },
  assetMeta: {
    fontSize: 10,
    color: '#96a397',
    marginTop: 3,
  },
  assetStatus: {
    fontSize: 10,
    color: '#96a397',
    marginTop: 2,
  },
  assetValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#46614b',
  },

  // Meter (.n68-meter)
  meterTrack: {
    height: 8,
    backgroundColor: '#e8eee8',
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 10,
  },
  meterFill: {
    height: '100%',
    backgroundColor: '#95b49b',
    borderRadius: 20,
  },

  // Loans (.n68-card for loans)
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanBorrower: {
    fontSize: 14,
    fontWeight: '600',
    color: '#425448',
  },
  tagPill: {
    borderWidth: 1,
    borderColor: '#dbe5da',
    borderRadius: 40,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f8faf7',
  },
  tagPillPaid: {
    backgroundColor: '#e9f2ea',
    borderColor: '#a6c5ac',
  },
  tagText: {
    fontSize: 10,
    color: '#768f7a',
  },
  tagTextPaid: {
    color: '#3d6143',
    fontWeight: '600',
  },
  loanAmount: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 25,
    fontWeight: '600',
    color: '#4d6654',
    marginVertical: 8,
  },
  loanDetails: {
    fontSize: 12,
    color: '#859687',
  },
  nextInterest: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38483c',
  },
  miniBtn: {
    borderWidth: 1,
    borderColor: '#dfe9dc',
    borderRadius: 90,
    backgroundColor: '#f7faf6',
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  miniBtnText: {
    fontSize: 11,
    color: '#66816d',
    fontWeight: '600',
  },

  // Retirement inputs (.n68-fields)
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  fieldCol: {
    width: '48.5%',
  },
  inputLabel: {
    fontSize: 11,
    color: '#728976',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#dce6dc',
    backgroundColor: '#fafcf9',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontSize: 14,
    color: '#344737',
  },
  goalLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1ec',
    gap: 12,
  },
  goalYear: {
    fontSize: 12,
    color: '#96a99a',
    fontWeight: '700',
    width: 40,
  },
  goalName: {
    flex: 1,
    fontSize: 12,
    color: '#38483c',
  },
  goalAmt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#405744',
  },
  mutedPad: {
    fontSize: 12,
    color: '#859687',
    lineHeight: 18,
    marginTop: 12,
    paddingHorizontal: 4,
  },

  // Records Tab (.n69-tiles)
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  recordTile: {
    width: '48.5%',
    minHeight: 118,
    borderRadius: 21,
    padding: 16,
    justifyContent: 'space-between',
  },
  recordTileSelected: {
    borderWidth: 2,
    borderColor: '#63816e',
  },
  tileIcon: {
    fontSize: 26,
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#425b49',
    marginTop: 8,
  },
  tileSubtitle: {
    fontSize: 10,
    color: '#8c9c8f',
  },
  closeCategoryText: {
    fontSize: 13,
    color: '#8d9d8f',
    fontWeight: '600',
  },
  moneyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e7eee5',
    paddingVertical: 12,
    gap: 10,
  },
  moneyRowButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  moneyRowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3d5846',
  },
  moneyRowMeta: {
    fontSize: 10,
    color: '#8b9b90',
    marginTop: 3,
  },
  docButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#e9eee8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docButtonText: {
    fontSize: 18,
    color: '#63816e',
  },
  recordsNote: {
    fontSize: 11,
    color: '#9fab9e',
    marginVertical: 20,
    lineHeight: 16,
  },

  // Modals (.n68-sheet / sheet)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26,35,28,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 22,
    paddingVertical: 16,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#d5dbd3',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 22,
    fontWeight: '500',
    color: '#27372e',
  },
  sheetClose: {
    fontSize: 20,
    color: '#687268',
    padding: 4,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 10,
  },
  optChip: {
    borderWidth: 1,
    borderColor: '#dce7d9',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optChipChosen: {
    backgroundColor: '#dfe9dc',
    borderColor: '#96b698',
  },
  optChipText: {
    fontSize: 12,
    color: '#708371',
  },
  optChipTextChosen: {
    color: '#37523c',
    fontWeight: '600',
  },
  modalBigAmount: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 26,
    fontWeight: '600',
    color: '#4d6654',
    marginVertical: 8,
  },
  modalP: {
    fontSize: 13,
    color: '#465a49',
    lineHeight: 19,
    marginVertical: 3,
  },
  modalMuted: {
    fontSize: 12,
    color: '#859687',
    lineHeight: 18,
    marginTop: 10,
  },
  modalMasked: {
    fontSize: 15,
    fontWeight: '700',
    color: '#344737',
    marginVertical: 4,
  },
  // SMS Integration Styles
  smsSyncContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2ebe0',
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  smsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  smsSyncTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d4133',
  },
  liveBadge: {
    backgroundColor: '#e6f0e4',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b4ceb1',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#385d3f',
  },
  smsSyncSubtitle: {
    fontSize: 11,
    color: '#768779',
    lineHeight: 15,
  },
  smsActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smsViewBtn: {
    backgroundColor: '#f6faf4',
    borderWidth: 1,
    borderColor: '#d2e2ce',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },
  smsViewBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#46664e',
  },
  smsSyncBtn: {
    backgroundColor: '#44644c',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  smsSyncBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  sheetSub: {
    fontSize: 12,
    color: '#778879',
    marginTop: 2,
  },
  smsFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 10,
    flexWrap: 'wrap',
  },
  smsFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#f5f7f3',
    borderWidth: 1,
    borderColor: '#e2eae0',
  },
  smsFilterChipActive: {
    backgroundColor: '#dfe9dc',
    borderColor: '#a3be9f',
  },
  smsFilterChipText: {
    fontSize: 11,
    color: '#657768',
    fontWeight: '500',
  },
  smsFilterChipTextActive: {
    color: '#2f4b36',
    fontWeight: '700',
  },
  smsTxItem: {
    backgroundColor: '#fbfcf9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eaf0e8',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  smsTxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  smsTxBank: {
    fontSize: 12,
    fontWeight: '700',
    color: '#324838',
  },
  smsTxAccount: {
    fontSize: 11,
    color: '#728575',
    backgroundColor: '#eef3eb',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  smsTxDate: {
    fontSize: 10,
    color: '#8d9c8e',
    marginLeft: 'auto',
  },
  smsTxDesc: {
    fontSize: 12,
    color: '#435848',
    marginVertical: 1,
  },
  smsTxBal: {
    fontSize: 10,
    color: '#778a7a',
    fontStyle: 'italic',
  },
  smsTxDue: {
    fontSize: 10,
    color: '#b05938',
    fontWeight: '600',
  },
  smsTxAmountCol: {
    alignItems: 'flex-end',
    gap: 3,
  },
  smsTxAmount: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 15,
    fontWeight: '700',
    color: '#28372b',
  },
  smsTxCredit: {
    color: '#2e7d32',
  },
  smsTxBill: {
    color: '#c25827',
  },
  smsTxTypeBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#809182',
    letterSpacing: 0.5,
  },
  // Progress Modal Styles
  progressCardContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#e2ede0',
  },
  progressIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  progressIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eaf3e8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#c6dfc3',
  },
  progressIconText: {
    fontSize: 20,
    color: '#345e3c',
  },
  progressModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#263b2c',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  progressModalSubtitle: {
    fontSize: 12,
    color: '#6d8170',
    marginTop: 2,
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#edf3ec',
    borderRadius: 999,
    overflow: 'hidden',
    marginVertical: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3f6347',
    borderRadius: 999,
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  progressPercentText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#345e3c',
  },
  progressEtaText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#849687',
  },
  progressStatusBox: {
    backgroundColor: '#f7faf6',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5eee3',
    marginBottom: 16,
  },
  progressStageText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#283c2e',
    marginBottom: 2,
  },
  progressDetailText: {
    fontSize: 11,
    color: '#6c816f',
    lineHeight: 16,
  },
  checklistWrap: {
    gap: 8,
  },
  checkStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#edf2ec',
    color: '#7f9382',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  stepDotDone: {
    backgroundColor: '#44684d',
    color: '#fff',
  },
  stepLabel: {
    fontSize: 12,
    color: '#475d4a',
    fontWeight: '500',
  },
});
