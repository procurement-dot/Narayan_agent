import React, { useState } from 'react';
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
import { syncAllBankTransactions } from './sms/smsReader.service';
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
  } = useFinanceStore();

  const { showToast } = useToast();
  const { addEvent } = useCalendarStore();

  // SMS Sync state
  const [isSmsTransactionsModalOpen, setIsSmsTransactionsModalOpen] = useState(false);
  const [smsFilter, setSmsFilter] = useState<'all' | 'debit' | 'credit' | 'bill'>('all');

  const handleSyncBankSms = async () => {
    try {
      setIsSyncingSms(true);
      showToast('Scanning all bank SMS history...', 'info');
      const summary = await syncAllBankTransactions();
      showToast(`Synced ${summary.bankSmsCount} bank transactions across history!`, 'success');
    } catch (e: any) {
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

  // Calculations
  const totalAssetsNet = assets.reduce((sum, a) => sum + Number(a.value || 0), 0);
  const totalLending = loans.reduce((sum, l) => sum + Number(l.principal || 0), 0);
  const totalRentExpected = assets.reduce((sum, a) => sum + Number(a.expectedRent || 0), 0);
  const totalRentReceived = assets.reduce((sum, a) => sum + Number(a.receivedRent || 0), 0);

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

            {/* Feature Banner: Sage */}
            <View style={[styles.featureCard, styles.featureSage]}>
              <Text style={styles.featureSmall}>Illustrative financial picture</Text>
              <Text style={styles.featureBig}>{formatMoney(totalAssetsNet + totalLending)}</Text>
              <Text style={styles.featureSpan}>Assets + loans receivable · excludes liabilities</Text>
            </View>

            {/* Stat Grid 2x2 */}
            <View style={styles.statGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Property & land</Text>
                <Text style={styles.statValue}>{formatMoney(propertyLandTotal)}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Investments</Text>
                <Text style={styles.statValue}>{formatMoney(investmentsTotal)}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Loans receivable</Text>
                <Text style={styles.statValue}>{formatMoney(totalLending)}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Rent gap / month</Text>
                <Text style={styles.statValue}>{formatMoney(monthlyRentGap)}</Text>
              </View>
            </View>

            {/* Section: Monthly cash flow */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Monthly cash flow</Text>
              <View style={styles.card}>
                <View style={styles.barChartContainer}>
                  {CASH_FLOW_SERIES.map((v, i) => {
                    const barHeight = Math.round((v / 65) * 105);
                    return (
                      <View key={i} style={styles.barCol}>
                        <View style={[styles.barFill, { height: Math.max(barHeight, 10) }]} />
                        <Text style={styles.barLabel}>{DAYS_OF_WEEK[i]}</Text>
                      </View>
                    );
                  })}
                </View>
                <View style={styles.legendRow}>
                  <Text style={styles.legendItem}>● Income trend</Text>
                  <Text style={styles.legendItem}>Sample data</Text>
                </View>
              </View>
            </View>

            {/* Section: Needs your attention */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Needs your attention</Text>
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
                      {formatMoney(x.expectedRent - x.receivedRent)} opportunity cost this month · investigate first
                    </Text>
                  </View>
                  <Text style={styles.rowArrow}>↗</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.n68Row}
                activeOpacity={0.7}
                onPress={() => setTab('lending')}
              >
                <View style={styles.rowIcon}>
                  <Text style={styles.rowIconText}>₹</Text>
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>3 lending records</Text>
                  <Text style={styles.rowSubtitle}>Upcoming interest: ₹8,000 + other dues</Text>
                </View>
                <Text style={styles.rowArrow}>↗</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.n68Row}
                activeOpacity={0.7}
                onPress={() => setTab('retire')}
              >
                <View style={styles.rowIcon}>
                  <Text style={styles.rowIconText}>◎</Text>
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>Retirement goal pathway</Text>
                  <Text style={styles.rowSubtitle}>View milestone funding and projected shortfall</Text>
                </View>
                <Text style={styles.rowArrow}>↗</Text>
              </TouchableOpacity>
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
});
