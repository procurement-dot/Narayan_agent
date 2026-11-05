import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { useWorkStore } from './work.store';
import { AppHeader } from '../navigation/AppHeader';
import { PillTabs } from '../../shared/components/PillTabs';
import { WorkTab, WorkExternalApp } from './work.types';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';
import { useToast } from '../../shared/components/Toast';

const WORK_TABS: { id: WorkTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'projects', label: 'Projects' },
  { id: 'finance', label: 'Financial' },
  { id: 'hr', label: 'HR & Team' },
  { id: 'sales', label: 'Sales' },
  { id: 'ea', label: 'My EA' },
];

export const WorkScreen: React.FC = () => {
  const {
    currentTab,
    setTab,
    overviewData,
    projects,
    selectedProject,
    selectProject,
    invoices,
    financeMetrics,
    deals,
    salesMetrics,
    teamOps,
    eaSignals,
    externalApps,
    activeExternalApp,
    setActiveExternalApp,
    editingAppUrl,
    setEditingAppUrl,
    fetchOverview,
    fetchProjects,
    fetchFinance,
    fetchSales,
    fetchHR,
    fetchEA,
    createProject,
    toggleTask,
    addTask,
    createInvoice,
    sendPaymentReminder,
    createDeal,
    resolveHRTicket,
    resolveEASignal,
    updateExternalAppUrl,
  } = useWorkStore();

  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState<string | null>(null);

  // Form states
  const [newProjName, setNewProjName] = useState('');
  const [newProjSubtitle, setNewProjSubtitle] = useState('');
  const [newProjTag, setNewProjTag] = useState('');
  const [newProjNext, setNewProjNext] = useState('');

  const [newInvNumber, setNewInvNumber] = useState('');
  const [newInvClient, setNewInvClient] = useState('');
  const [newInvAmount, setNewInvAmount] = useState('');
  const [newInvDueDate, setNewInvDueDate] = useState('');
  const [newInvStatus, setNewInvStatus] = useState<'pending' | 'overdue' | 'paid'>('overdue');

  const [newDealClient, setNewDealClient] = useState('');
  const [newDealValue, setNewDealValue] = useState('');
  const [newDealStage, setNewDealStage] = useState<'lead' | 'demo' | 'proposal' | 'negotiation' | 'won'>('demo');
  const [newDealContact, setNewDealContact] = useState('');
  const [newDealNotes, setNewDealNotes] = useState('');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [customAppName, setCustomAppName] = useState('');

  // Initial fetch on mount
  useEffect(() => {
    fetchOverview();
    fetchProjects();
    fetchFinance();
    fetchSales();
    fetchHR();
    fetchEA();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchOverview(),
      fetchProjects(),
      fetchFinance(),
      fetchSales(),
      fetchHR(),
      fetchEA(),
    ]);
    setRefreshing(false);
    showToast('Real workspace synchronized', 'info');
  };

  const handleOpenApp = (app: WorkExternalApp) => {
    if (!app.deploy_url) {
      setEditingAppUrl(app);
      setCustomUrlInput('');
      setCustomAppName(app.name);
      showToast('Please set your deployed software URL first', 'info');
      return;
    }
    setActiveExternalApp(app);
  };

  const handleOpenInBrowser = (url: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {
      showToast('Could not open external browser', 'error');
    });
  };

  const handleSaveAppUrl = async () => {
    if (!editingAppUrl || !customUrlInput.trim()) {
      showToast('Please enter a valid deployed URL', 'error');
      return;
    }
    await updateExternalAppUrl(
      editingAppUrl.app_key,
      customUrlInput.trim(),
      customAppName.trim() || editingAppUrl.name
    );
    showToast(`${editingAppUrl.name} URL connected!`, 'success');
    setEditingAppUrl(null);
  };

  const handleCreateProjectSubmit = async () => {
    if (!newProjName.trim()) {
      showToast('Project name is required', 'error');
      return;
    }
    await createProject({
      name: newProjName.trim(),
      subtitle: newProjSubtitle.trim(),
      tag: newProjTag.trim() || 'General',
      next_action: newProjNext.trim() || 'Define next milestone',
    });
    setNewProjName('');
    setNewProjSubtitle('');
    setNewProjTag('');
    setNewProjNext('');
    setShowAddProjectModal(false);
    showToast('Real project created successfully!', 'success');
  };

  const handleCreateInvoiceSubmit = async () => {
    if (!newInvNumber.trim() || !newInvClient.trim() || !newInvAmount.trim()) {
      showToast('Invoice number, client and amount are required', 'error');
      return;
    }
    await createInvoice({
      invoice_number: newInvNumber.trim(),
      client_name: newInvClient.trim(),
      vertical: 'Commercial',
      amount: newInvAmount.trim().startsWith('₹') ? newInvAmount.trim() : `₹${newInvAmount.trim()}`,
      due_date: newInvDueDate.trim() || new Date().toISOString().split('T')[0],
      status: newInvStatus,
    });
    setNewInvNumber('');
    setNewInvClient('');
    setNewInvAmount('');
    setNewInvDueDate('');
    setShowAddInvoiceModal(false);
    showToast('Real invoice added successfully!', 'success');
  };

  const handleCreateDealSubmit = async () => {
    if (!newDealClient.trim() || !newDealValue.trim()) {
      showToast('Client name and deal value are required', 'error');
      return;
    }
    await createDeal({
      client_name: newDealClient.trim(),
      deal_value: newDealValue.trim().startsWith('₹') ? newDealValue.trim() : `₹${newDealValue.trim()}`,
      stage: newDealStage,
      contact_person: newDealContact.trim(),
      notes: newDealNotes.trim(),
    });
    setNewDealClient('');
    setNewDealValue('');
    setNewDealContact('');
    setNewDealNotes('');
    setShowAddDealModal(false);
    showToast('Real sales deal added!', 'success');
  };

  const handleAddTaskSubmit = async (projectId: string) => {
    if (!newTaskTitle.trim()) return;
    await addTask(projectId, newTaskTitle.trim());
    setNewTaskTitle('');
    setShowAddTaskModal(null);
    showToast('New milestone added', 'success');
  };

  const handleSendReminders = async () => {
    const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
    if (overdueInvoices.length === 0) {
      showToast('No overdue invoices pending reminders', 'info');
      return;
    }
    for (const inv of overdueInvoices) {
      await sendPaymentReminder(inv.id);
    }
    showToast(`Payment reminders dispatched for ${overdueInvoices.length} invoices!`, 'success');
  };

  const kpis = overviewData?.kpis || [];
  const signals = overviewData?.eaSignals || eaSignals;
  const activeApps = externalApps.length ? externalApps : (overviewData?.externalApps || []);

  return (
    <View style={styles.container}>
      <AppHeader
        kicker="ENTERPRISE & PROJECTS · FOCUS"
        title="Leadership clarity."
        subtitle="Active ventures, real commitments and live operational signals."
      />

      <View style={styles.tabsContainer}>
        <PillTabs
          tabs={WORK_TABS}
          activeTab={currentTab}
          onSelect={(t) => setTab(t as WorkTab)}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
      >
        {/* TAB 1: OVERVIEW */}
        {currentTab === 'overview' && (
          <View style={styles.section}>
            {/* KPI Grid */}
            <View style={styles.kpiGrid}>
              {kpis.map((kpi, idx) => (
                <View key={idx} style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>{kpi.label}</Text>
                  <Text style={styles.kpiValue}>{kpi.value}</Text>
                  <Text style={styles.kpiDetail}>{kpi.detail}</Text>
                </View>
              ))}
            </View>

            {/* CONNECTED EXTERNAL SOFTWARE SECTION */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Connected Live Software</Text>
              <Text style={styles.sectionSubtitleBadge}>LIVE COCKPIT</Text>
            </View>

            {activeApps.map((app) => (
              <View key={app.id} style={styles.externalAppCard}>
                <View style={styles.externalAppHeader}>
                  <View style={styles.externalAppInfo}>
                    <View style={styles.tagBadgeRow}>
                      <Text style={styles.externalAppTag}>{app.tag}</Text>
                      <View style={styles.statusLivePill}>
                        <View
                          style={[
                            styles.statusLiveDot,
                            !app.deploy_url && { backgroundColor: '#8b928b' },
                          ]}
                        />
                        <Text style={styles.statusLiveText}>
                          {app.deploy_url ? 'Live Connected' : 'Ready to Connect'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.externalAppName}>{app.name}</Text>
                    <Text style={styles.externalAppSubtitle}>{app.subtitle}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.settingsIconBtn}
                    onPress={() => {
                      setEditingAppUrl(app);
                      setCustomUrlInput(app.deploy_url || '');
                      setCustomAppName(app.name);
                    }}
                  >
                    <Text style={styles.settingsIconText}>
                      {app.deploy_url ? '⚙️ Edit URL' : '🔗 Set Link'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Live Metrics Summary */}
                <View style={styles.externalMetricsBox}>
                  <Text style={styles.externalMetricsKicker}>MAIN DASHBOARD PULSE</Text>
                  <Text style={styles.externalMetricsSummary}>
                    {app.deploy_url
                      ? app.summary_metrics?.latestUpdate || 'Live portal connected · Tap Launch below'
                      : 'Paste your deployed link using the button above to view live pulse'}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.externalAppActionsRow}>
                  <TouchableOpacity
                    style={styles.openExternalBtn}
                    onPress={() => handleOpenApp(app)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.openExternalBtnText}>
                      {app.deploy_url ? '🚀 Open Full Software ↗' : '🔗 Connect Deploy Link ↗'}
                    </Text>
                  </TouchableOpacity>

                  {!!app.deploy_url && (
                    <TouchableOpacity
                      style={styles.browserLinkBtn}
                      onPress={() => handleOpenInBrowser(app.deploy_url)}
                    >
                      <Text style={styles.browserLinkText}>Web View ↗</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {/* EA Signals Card */}
            {signals.length > 0 && (
              <View style={styles.cardLilac}>
                <Text style={styles.cardKicker}>EXECUTIVE ASSISTANT · SIGNALS</Text>
                <Text style={styles.eaTitle}>
                  {signals.length} unresolved signals requiring attention
                </Text>
                <Text style={styles.eaDesc}>
                  {signals.map((s) => s.title).join(' · ')}
                </Text>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setTab('ea')}
                >
                  <Text style={styles.actionBtnText}>Review signals ({signals.length}) ↗</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Active Projects List */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Active Projects Portfolio</Text>
              <TouchableOpacity
                style={styles.miniAddBtn}
                onPress={() => setShowAddProjectModal(true)}
              >
                <Text style={styles.miniAddBtnText}>+ Add Real Project</Text>
              </TouchableOpacity>
            </View>

            {projects.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No Projects Created Yet</Text>
                <Text style={styles.emptyDesc}>
                  Dummy data has been removed. Add your genuine project to track real milestones.
                </Text>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setShowAddProjectModal(true)}
                >
                  <Text style={styles.actionBtnText}>+ Add Real Project</Text>
                </TouchableOpacity>
              </View>
            ) : (
              projects.map((proj) => (
                <TouchableOpacity
                  key={proj.id}
                  style={styles.projectCard}
                  onPress={() => selectProject(proj)}
                  activeOpacity={0.7}
                >
                  <View style={styles.projHeader}>
                    <View style={{ flex: 1, paddingRight: spacing.sm }}>
                      <Text style={styles.projName}>{proj.name}</Text>
                      <Text style={styles.projTag}>
                        {proj.tag} {proj.subtitle ? `· ${proj.subtitle}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.projProgress}>{proj.progress}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${proj.progress}%` }]} />
                  </View>
                  <Text style={styles.projNext}>Next: {proj.next_action}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* TAB 2: PROJECTS */}
        {currentTab === 'projects' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>All Active Portfolios</Text>
              <TouchableOpacity
                style={styles.miniAddBtn}
                onPress={() => setShowAddProjectModal(true)}
              >
                <Text style={styles.miniAddBtnText}>+ Add Real Project</Text>
              </TouchableOpacity>
            </View>

            {projects.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Your Portfolio is Clean</Text>
                <Text style={styles.emptyDesc}>
                  Create your first real project with title, milestones, and progress tracking.
                </Text>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setShowAddProjectModal(true)}
                >
                  <Text style={styles.actionBtnText}>+ Create Real Project</Text>
                </TouchableOpacity>
              </View>
            ) : (
              projects.map((proj) => (
                <View key={proj.id} style={styles.card}>
                  <View style={styles.projHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.projName}>{proj.name}</Text>
                      <Text style={styles.projTag}>
                        {proj.subtitle ? `${proj.subtitle} · ` : ''}{proj.owner}
                      </Text>
                    </View>
                    <Text style={styles.projProgress}>{proj.progress}%</Text>
                  </View>

                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${proj.progress}%` }]} />
                  </View>

                  <Text style={styles.nextStepHeader}>Next Action: {proj.next_action}</Text>

                  <View style={styles.taskTitleRow}>
                    <Text style={styles.taskTitle}>Milestones & Tasks Checklist:</Text>
                    <TouchableOpacity
                      style={styles.miniAddBtn}
                      onPress={() => setShowAddTaskModal(proj.id)}
                    >
                      <Text style={styles.miniAddBtnText}>+ Add Milestone</Text>
                    </TouchableOpacity>
                  </View>

                  {proj.tasks.length === 0 ? (
                    <Text style={styles.noTasksText}>No milestones yet. Tap "+ Add Milestone" above.</Text>
                  ) : (
                    proj.tasks.map((task) => (
                      <TouchableOpacity
                        key={task.id}
                        style={styles.taskInteractiveRow}
                        onPress={() => toggleTask(proj.id, task.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.checkbox, task.is_completed && styles.checkboxActive]}>
                          {task.is_completed && <Text style={styles.checkboxCheck}>✓</Text>}
                        </View>
                        <Text
                          style={[
                            styles.taskInteractiveText,
                            task.is_completed && styles.taskInteractiveTextDone,
                          ]}
                        >
                          {task.title}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 3: FINANCIAL */}
        {currentTab === 'finance' && (
          <View style={styles.section}>
            {/* Financial Stats */}
            <View style={styles.card}>
              <Text style={styles.cardKicker}>COMMERCIAL CASHFLOW</Text>
              <Text style={styles.kpiValue}>
                {invoices.filter((i) => i.status === 'overdue').length > 0
                  ? `${invoices
                      .filter((i) => i.status === 'overdue')
                      .reduce((sum, i) => sum + (i.amount_numeric || 0), 0)
                      .toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} Outstanding`
                  : 'All Invoices Cleared'}
              </Text>
              <Text style={styles.eaDesc}>
                {invoices.length > 0
                  ? `${invoices.length} total invoices registered in the system.`
                  : 'No invoices logged yet. Add your genuine commercial invoices below.'}
              </Text>
              {invoices.filter((i) => i.status === 'overdue').length > 0 && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleSendReminders}
                >
                  <Text style={styles.actionBtnText}>Send polite payment reminders ↗</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Invoices List Header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Invoices & Receivables Queue</Text>
              <TouchableOpacity
                style={styles.miniAddBtn}
                onPress={() => setShowAddInvoiceModal(true)}
              >
                <Text style={styles.miniAddBtnText}>+ Add Invoice</Text>
              </TouchableOpacity>
            </View>

            {invoices.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No Invoices Recorded</Text>
                <Text style={styles.emptyDesc}>
                  Add an invoice to track receivables and trigger automated payment follow-ups.
                </Text>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setShowAddInvoiceModal(true)}
                >
                  <Text style={styles.actionBtnText}>+ Add Invoice</Text>
                </TouchableOpacity>
              </View>
            ) : (
              invoices.map((inv) => (
                <View key={inv.id} style={styles.invoiceCard}>
                  <View style={styles.invoiceHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.invoiceNumber}>{inv.invoice_number}</Text>
                      <Text style={styles.invoiceClient}>{inv.client_name}</Text>
                    </View>
                    <View
                      style={[
                        styles.invoiceBadge,
                        inv.status === 'overdue'
                          ? styles.badgeOverdue
                          : inv.status === 'paid'
                          ? styles.badgePaid
                          : styles.badgePending,
                      ]}
                    >
                      <Text style={styles.invoiceBadgeText}>{inv.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.invoiceBottom}>
                    <Text style={styles.invoiceAmount}>{inv.amount}</Text>
                    <Text style={styles.invoiceDue}>Due: {inv.due_date}</Text>
                  </View>
                  {inv.reminder_sent_at && (
                    <Text style={styles.reminderSentText}>
                      ✓ Polite reminder sent on {new Date(inv.reminder_sent_at).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 4: HR & TEAM */}
        {currentTab === 'hr' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardKicker}>TEAM & ATTENDANCE</Text>
              <Text style={styles.kpiValue}>
                {teamOps && teamOps.total_staff > 0
                  ? `${teamOps.present_count} / ${teamOps.total_staff} Active Today`
                  : 'No Team Attendance Logged'}
              </Text>
              <Text style={styles.eaDesc}>
                {teamOps && teamOps.total_staff > 0
                  ? `${Math.round((teamOps.present_count / teamOps.total_staff) * 100)}% attendance logged today.`
                  : 'Fictional attendance numbers removed. Log genuine daily team deployment.'}
              </Text>
            </View>

            {/* Department Attendance Bars */}
            {teamOps && teamOps.departments && teamOps.departments.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Deployment by Vertical</Text>
                {teamOps.departments.map((dept, i) => (
                  <View key={i} style={styles.deptCard}>
                    <View style={styles.deptHeader}>
                      <Text style={styles.deptName}>{dept.name}</Text>
                      <Text style={styles.deptCount}>{dept.count} staff</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${dept.percent}%` }]} />
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Operational Issues & Requests */}
            <Text style={styles.sectionTitle}>HR & Operational Requests</Text>
            {!teamOps || !teamOps.tickets || teamOps.tickets.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No Pending Operational Requests</Text>
                <Text style={styles.emptyDesc}>All operational and HR tickets are clear.</Text>
              </View>
            ) : (
              teamOps.tickets.map((t) => (
                <View key={t.id} style={styles.ticketCard}>
                  <View style={styles.ticketHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ticketTitle}>{t.title}</Text>
                      <Text style={styles.ticketDetail}>{t.detail}</Text>
                    </View>
                    <View style={styles.ticketTag}>
                      <Text style={styles.ticketTagText}>{t.tag}</Text>
                    </View>
                  </View>
                  {t.status === 'pending' ? (
                    <TouchableOpacity
                      style={styles.resolveBtn}
                      onPress={() => {
                        resolveHRTicket(t.id);
                        showToast(`Resolved: ${t.title}`, 'success');
                      }}
                    >
                      <Text style={styles.resolveBtnText}>Mark Resolved ✓</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.resolvedLabel}>✓ Resolved</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 5: SALES */}
        {currentTab === 'sales' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardKicker}>INSTITUTIONAL PIPELINE</Text>
              <Text style={styles.kpiValue}>
                {salesMetrics?.pipelineTotal && salesMetrics.pipelineTotal !== '₹0'
                  ? `${salesMetrics.pipelineTotal} Active Pipeline`
                  : '₹0 Active Pipeline'}
              </Text>
              <Text style={styles.eaDesc}>
                {deals.length > 0
                  ? `${deals.length} active opportunities tracked in sales pipeline.`
                  : 'Dummy schools removed. Add your genuine prospective deals below.'}
              </Text>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Deals & Opportunities</Text>
              <TouchableOpacity
                style={styles.miniAddBtn}
                onPress={() => setShowAddDealModal(true)}
              >
                <Text style={styles.miniAddBtnText}>+ Add Deal</Text>
              </TouchableOpacity>
            </View>

            {deals.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Pipeline Clean</Text>
                <Text style={styles.emptyDesc}>Add genuine prospective client deals or institutional proposals.</Text>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setShowAddDealModal(true)}
                >
                  <Text style={styles.actionBtnText}>+ Add Deal</Text>
                </TouchableOpacity>
              </View>
            ) : (
              deals.map((deal) => (
                <View key={deal.id} style={styles.card}>
                  <View style={styles.projHeader}>
                    <Text style={styles.projName}>{deal.client_name}</Text>
                    <View style={styles.dealStageBadge}>
                      <Text style={styles.dealStageText}>{deal.stage.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.dealAmount}>{deal.deal_value}</Text>
                  {!!deal.notes && <Text style={styles.eaDesc}>{deal.notes}</Text>}
                  {!!deal.contact_person && (
                    <Text style={styles.dealContact}>Contact: {deal.contact_person}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 6: MY EA */}
        {currentTab === 'ea' && (
          <View style={styles.section}>
            <View style={styles.cardWarm}>
              <Text style={styles.cardKicker}>MY EXECUTIVE ASSISTANT</Text>
              <Text style={styles.eaTitle}>Actionable Signal Queue</Text>
              <Text style={styles.eaDesc}>
                Priority items extracted from connected communications and active projects.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Unresolved Commitments</Text>
            {signals.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>All Commitments Clear</Text>
                <Text style={styles.emptyDesc}>
                  No pending signals or unresolved executive commitments.
                </Text>
              </View>
            ) : (
              signals.map((sig) => (
                <View key={sig.id} style={styles.signalCard}>
                  <View style={styles.signalHeader}>
                    <View style={styles.signalSourcePill}>
                      <Text style={styles.signalSourceText}>{sig.source}</Text>
                    </View>
                    <Text style={styles.signalPriority}>Priority: {sig.priority.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.signalTitle}>{sig.title}</Text>
                  <Text style={styles.signalDesc}>{sig.description}</Text>

                  <View style={styles.signalActionsRow}>
                    <TouchableOpacity
                      style={styles.signalDoneBtn}
                      onPress={() => {
                        resolveEASignal(sig.id);
                        showToast('Signal resolved and archived', 'success');
                      }}
                    >
                      <Text style={styles.signalDoneBtnText}>Mark Resolved ✓</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.signalCalendarBtn}
                      onPress={() => showToast('Scheduled on Calendar', 'info')}
                    >
                      <Text style={styles.signalCalendarBtnText}>Schedule in Day 📅</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* MODAL 1: FULL-SCREEN IN-APP VIEWER */}
      <Modal visible={!!activeExternalApp} animationType="slide" transparent={false}>
        <View style={styles.inAppViewerContainer}>
          <View style={styles.inAppViewerHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.tagBadgeRow}>
                <View style={styles.statusLiveDot} />
                <Text style={styles.inAppViewerLive}>Live Connected Cockpit</Text>
              </View>
              <Text style={styles.inAppViewerTitle}>{activeExternalApp?.name}</Text>
              <Text style={styles.inAppViewerUrl} numberOfLines={1}>
                {activeExternalApp?.deploy_url}
              </Text>
            </View>

            <View style={styles.inAppViewerHeaderActions}>
              <TouchableOpacity
                style={styles.inAppBrowserBtn}
                onPress={() => activeExternalApp && handleOpenInBrowser(activeExternalApp.deploy_url)}
              >
                <Text style={styles.inAppBrowserBtnText}>Open Browser ↗</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inAppCloseBtn}
                onPress={() => setActiveExternalApp(null)}
              >
                <Text style={styles.inAppCloseBtnText}>✕ Close</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inAppFrame}>
            {Platform.OS === 'web' ? (
              // @ts-ignore
              <iframe
                src={activeExternalApp?.deploy_url}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={activeExternalApp?.name}
              />
            ) : (
              <View style={styles.nativeViewerNotice}>
                <Text style={styles.nativeNoticeIcon}>🏗️</Text>
                <Text style={styles.nativeNoticeTitle}>{activeExternalApp?.name}</Text>
                <Text style={styles.nativeNoticeDesc}>
                  Live web connection ready at:{'\n'}
                  <Text style={{ fontFamily: typography.fontFamily.uiMedium }}>
                    {activeExternalApp?.deploy_url}
                  </Text>
                </Text>
                <TouchableOpacity
                  style={styles.openExternalBtn}
                  onPress={() => activeExternalApp && handleOpenInBrowser(activeExternalApp.deploy_url)}
                >
                  <Text style={styles.openExternalBtnText}>Launch Live Portal Now ↗</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL 2: EDIT EXTERNAL APP DEPLOY URL */}
      <Modal visible={!!editingAppUrl} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Connect Your Live Software</Text>
            <Text style={styles.projTag}>
              Paste your deployed web link below to connect it directly into NRYN.
            </Text>

            <Text style={styles.inputLabel}>Software Name</Text>
            <TextInput
              style={styles.textInput}
              value={customAppName}
              onChangeText={setCustomAppName}
              placeholder="e.g. Infra Project Tracker"
              placeholderTextColor={colors.inkMuted}
            />

            <Text style={styles.inputLabel}>Deploy URL (Vercel, Netlify, Render, etc.)</Text>
            <TextInput
              style={styles.textInput}
              value={customUrlInput}
              onChangeText={setCustomUrlInput}
              placeholder="https://your-infra-tracker.vercel.app"
              placeholderTextColor={colors.inkMuted}
              autoCapitalize="none"
              keyboardType="url"
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditingAppUrl(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveAppUrl}
              >
                <Text style={styles.saveBtnText}>Save & Connect ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: ADD REAL PROJECT */}
      <Modal visible={showAddProjectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add Real Project</Text>
            <Text style={styles.projTag}>Enter your real active project details</Text>

            <Text style={styles.inputLabel}>Project Name *</Text>
            <TextInput
              style={styles.textInput}
              value={newProjName}
              onChangeText={setNewProjName}
              placeholder="e.g. Site-A Commercial Complex"
              placeholderTextColor={colors.inkMuted}
            />

            <Text style={styles.inputLabel}>Subtitle / Scope</Text>
            <TextInput
              style={styles.textInput}
              value={newProjSubtitle}
              onChangeText={setNewProjSubtitle}
              placeholder="e.g. Civil construction & foundation"
              placeholderTextColor={colors.inkMuted}
            />

            <Text style={styles.inputLabel}>Tag / Category</Text>
            <TextInput
              style={styles.textInput}
              value={newProjTag}
              onChangeText={setNewProjTag}
              placeholder="e.g. Infra / Construction"
              placeholderTextColor={colors.inkMuted}
            />

            <Text style={styles.inputLabel}>Next Immediate Action</Text>
            <TextInput
              style={styles.textInput}
              value={newProjNext}
              onChangeText={setNewProjNext}
              placeholder="e.g. Material approval from client"
              placeholderTextColor={colors.inkMuted}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddProjectModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleCreateProjectSubmit}
              >
                <Text style={styles.saveBtnText}>Create Project</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: ADD REAL INVOICE */}
      <Modal visible={showAddInvoiceModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add Real Invoice</Text>
            <Text style={styles.projTag}>Register a real client invoice for payment follow-up</Text>

            <Text style={styles.inputLabel}>Invoice Number *</Text>
            <TextInput
              style={styles.textInput}
              value={newInvNumber}
              onChangeText={setNewInvNumber}
              placeholder="e.g. INV-2026-001"
              placeholderTextColor={colors.inkMuted}
            />

            <Text style={styles.inputLabel}>Client / Entity Name *</Text>
            <TextInput
              style={styles.textInput}
              value={newInvClient}
              onChangeText={setNewInvClient}
              placeholder="e.g. L&T Infrastructure Partner"
              placeholderTextColor={colors.inkMuted}
            />

            <Text style={styles.inputLabel}>Amount (₹) *</Text>
            <TextInput
              style={styles.textInput}
              value={newInvAmount}
              onChangeText={setNewInvAmount}
              placeholder="e.g. 5,50,000"
              placeholderTextColor={colors.inkMuted}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Due Date</Text>
            <TextInput
              style={styles.textInput}
              value={newInvDueDate}
              onChangeText={setNewInvDueDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.inkMuted}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddInvoiceModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleCreateInvoiceSubmit}
              >
                <Text style={styles.saveBtnText}>Save Invoice</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 5: ADD REAL DEAL */}
      <Modal visible={showAddDealModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add Sales Opportunity</Text>
            <Text style={styles.projTag}>Record a prospective institutional contract</Text>

            <Text style={styles.inputLabel}>Client / School / Entity Name *</Text>
            <TextInput
              style={styles.textInput}
              value={newDealClient}
              onChangeText={setNewDealClient}
              placeholder="e.g. Greenfield Sports Academy"
              placeholderTextColor={colors.inkMuted}
            />

            <Text style={styles.inputLabel}>Deal Value (₹) *</Text>
            <TextInput
              style={styles.textInput}
              value={newDealValue}
              onChangeText={setNewDealValue}
              placeholder="e.g. 25,00,000"
              placeholderTextColor={colors.inkMuted}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Contact Person</Text>
            <TextInput
              style={styles.textInput}
              value={newDealContact}
              onChangeText={setNewDealContact}
              placeholder="e.g. Director Mr. Patil"
              placeholderTextColor={colors.inkMuted}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddDealModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleCreateDealSubmit}
              >
                <Text style={styles.saveBtnText}>Save Deal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 6: ADD MILESTONE TO PROJECT */}
      <Modal visible={!!showAddTaskModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add Milestone / Task</Text>
            <Text style={styles.projTag}>Enter the milestone to track for this project</Text>

            <TextInput
              style={[styles.textInput, { marginTop: spacing.md }]}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              placeholder="e.g. Soil testing report completion"
              placeholderTextColor={colors.inkMuted}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowAddTaskModal(null);
                  setNewTaskTitle('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => showAddTaskModal && handleAddTaskSubmit(showAddTaskModal)}
              >
                <Text style={styles.saveBtnText}>Add Milestone</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 7: PROJECT DETAIL */}
      <Modal visible={!!selectedProject} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{selectedProject?.name}</Text>
            <Text style={styles.projTag}>
              {selectedProject?.tag} {selectedProject?.subtitle ? `· ${selectedProject?.subtitle}` : ''}
            </Text>
            <Text style={styles.nextStepHeader}>Next Immediate Action:</Text>
            <Text style={styles.nextStepText}>{selectedProject?.next_action}</Text>

            <Text style={[styles.taskTitle, { marginTop: spacing.md }]}>Checklist & Tasks:</Text>
            {selectedProject?.tasks.length === 0 ? (
              <Text style={styles.noTasksText}>No tasks yet.</Text>
            ) : (
              selectedProject?.tasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskInteractiveRow}
                  onPress={() => toggleTask(selectedProject.id, task.id)}
                >
                  <View style={[styles.checkbox, task.is_completed && styles.checkboxActive]}>
                    {task.is_completed && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text
                    style={[
                      styles.taskInteractiveText,
                      task.is_completed && styles.taskInteractiveTextDone,
                    ]}
                  >
                    {task.title}
                  </Text>
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => selectProject(null)}
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginVertical: spacing.xs,
  },
  sectionSubtitleBadge: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.accentDark,
    backgroundColor: colors.accentWash,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  kpiLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.inkMuted,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 20,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginVertical: spacing.xs,
  },
  kpiDetail: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.inkSecondary,
  },

  // Empty Cards
  emptyCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  emptyDesc: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xs,
  },

  // External App Card
  externalAppCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  externalAppHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  externalAppInfo: {
    flex: 1,
  },
  tagBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  externalAppTag: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.sage,
  },
  statusLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sageWash,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
    gap: 5,
  },
  statusLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2e7d32',
  },
  statusLiveText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#2e7d32',
  },
  externalAppName: {
    fontSize: 16,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  externalAppSubtitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.inkMuted,
    marginTop: 2,
  },
  settingsIconBtn: {
    backgroundColor: colors.iconBg,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  settingsIconText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.inkSecondary,
  },
  externalMetricsBox: {
    backgroundColor: colors.noticeBg,
    padding: spacing.sm,
    borderRadius: radii.md,
    gap: 4,
  },
  externalMetricsKicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.inkMuted,
    letterSpacing: 0.5,
  },
  externalMetricsSummary: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.ink,
    lineHeight: 17,
  },
  externalAppActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  openExternalBtn: {
    flex: 1,
    backgroundColor: colors.ink,
    paddingVertical: 10,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  openExternalBtnText: {
    color: colors.paper,
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
  },
  browserLinkBtn: {
    backgroundColor: colors.accentWash,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  browserLinkText: {
    color: colors.accentDark,
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
  },

  // Cards
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.xs,
  },
  cardLilac: {
    backgroundColor: '#f5f0f7',
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: '#e8dff0',
    gap: spacing.xs,
  },
  cardWarm: {
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: '#ecdcd3',
    gap: spacing.xs,
  },
  cardKicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.accentDark,
    letterSpacing: 0.5,
  },
  eaTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  eaDesc: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.inkSecondary,
    lineHeight: 18,
    marginVertical: spacing.xs,
  },
  actionBtn: {
    backgroundColor: colors.ink,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  actionBtnText: {
    color: colors.paper,
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
  },
  projectCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.xs,
  },
  projHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  projName: {
    fontSize: 15,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  projTag: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.inkMuted,
    marginTop: 2,
  },
  projProgress: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.noticeBg,
    borderRadius: radii.pill,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
  },
  projNext: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.inkSecondary,
  },

  // Interactive Checklist
  taskTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  taskTitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  miniAddBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: colors.iconBg,
    borderRadius: radii.pill,
  },
  miniAddBtnText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  noTasksText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.inkMuted,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  taskInteractiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 5,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.inkMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkboxCheck: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  taskInteractiveText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.ink,
    flex: 1,
  },
  taskInteractiveTextDone: {
    textDecorationLine: 'line-through',
    color: colors.inkMuted,
  },

  // Finance Invoices
  invoiceCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.xs,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceNumber: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.inkMuted,
  },
  invoiceClient: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  invoiceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  badgeOverdue: {
    backgroundColor: '#fde8e8',
  },
  badgePaid: {
    backgroundColor: colors.sageWash,
  },
  badgePending: {
    backgroundColor: colors.noticeBg,
  },
  invoiceBadgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#b71c1c',
  },
  invoiceBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  invoiceAmount: {
    fontSize: 15,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  invoiceDue: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.inkMuted,
  },
  reminderSentText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiRegular,
    color: '#2e7d32',
    marginTop: 2,
  },

  // HR & Operations
  deptCard: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 4,
  },
  deptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deptName: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  deptCount: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.inkMuted,
  },
  ticketCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.xs,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  ticketDetail: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.inkSecondary,
    marginTop: 2,
  },
  ticketTag: {
    backgroundColor: colors.iconBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  ticketTagText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.inkSecondary,
  },
  resolveBtn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.noticeBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    marginTop: 4,
  },
  resolveBtnText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  resolvedLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#2e7d32',
    alignSelf: 'flex-end',
  },

  // Sales
  dealStageBadge: {
    backgroundColor: colors.accentWash,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  dealStageText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.accentDark,
  },
  dealAmount: {
    fontSize: 16,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  dealContact: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.inkMuted,
    marginTop: 2,
  },

  // EA Signals
  signalCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.xs,
  },
  signalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signalSourcePill: {
    backgroundColor: colors.accentWash,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  signalSourceText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.accentDark,
  },
  signalPriority: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.inkMuted,
  },
  signalTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  signalDesc: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.inkSecondary,
    lineHeight: 17,
  },
  signalActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  signalDoneBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  signalDoneBtnText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.paper,
  },
  signalCalendarBtn: {
    backgroundColor: colors.noticeBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  signalCalendarBtnText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },

  // In-App Viewer Modal
  inAppViewerContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inAppViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  inAppViewerLive: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#2e7d32',
  },
  inAppViewerTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  inAppViewerUrl: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.inkMuted,
    maxWidth: 220,
  },
  inAppViewerHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  inAppBrowserBtn: {
    backgroundColor: colors.accentWash,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  inAppBrowserBtnText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.accentDark,
  },
  inAppCloseBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  inAppCloseBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.paper,
  },
  inAppFrame: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  nativeViewerNotice: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  nativeNoticeIcon: {
    fontSize: 48,
  },
  nativeNoticeTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  nativeNoticeDesc: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlayBg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  nextStepHeader: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.accentDark,
    marginTop: spacing.sm,
  },
  nextStepText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.ink,
    lineHeight: 18,
  },
  doneBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.ink,
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  doneBtnText: {
    color: colors.paper,
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.noticeBg,
    borderRadius: radii.md,
    padding: spacing.sm,
    fontSize: 13,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.noticeBg,
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.inkSecondary,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.ink,
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.paper,
  },
});
