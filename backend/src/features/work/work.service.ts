import { workRepository } from './work.repository.js';
import {
  WorkOverviewData,
  WorkProject,
  WorkInvoice,
  WorkDeal,
  WorkTeamOps,
  WorkEASignal,
  WorkExternalApp,
} from './work.types.js';
import {
  CreateProjectInput,
  UpdateProjectInput,
  AddTaskInput,
  CreateInvoiceInput,
  CreateDealInput,
  UpdateExternalAppUrlInput,
} from './work.dto.js';

export const workService = {
  async getOverview(): Promise<WorkOverviewData> {
    const [projects, invoices, deals, teamOps, eaSignals, externalApps] = await Promise.all([
      workRepository.getProjects(),
      workRepository.getInvoices(),
      workRepository.getDeals(),
      workRepository.getTeamOps(),
      workRepository.getEASignals(),
      workRepository.getExternalApps(),
    ]);

    // Calculate real dynamic KPIs based on actual database entries
    const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
    const totalReceivablesNumeric = overdueInvoices.reduce((sum, i) => sum + (i.amount_numeric || 0), 0);
    const receivablesDisplay = totalReceivablesNumeric > 0
      ? `₹${(totalReceivablesNumeric / 100000).toFixed(2)} L`
      : '₹0';

    const activeDeals = deals.filter((d) => d.stage !== 'lost');
    const pipelineTotalNumeric = activeDeals.reduce((sum, d) => sum + (d.deal_value_numeric || 0), 0);
    const pipelineDisplay = pipelineTotalNumeric > 0
      ? `₹${(pipelineTotalNumeric / 100000).toFixed(2)} L`
      : '₹0';

    const unresolvedSignals = eaSignals.filter((s) => !s.is_resolved);

    const attendanceRate = teamOps.total_staff > 0
      ? Math.round((teamOps.present_count / teamOps.total_staff) * 100)
      : 0;

    const kpis = [
      {
        label: 'Receivables',
        value: receivablesDisplay,
        detail: overdueInvoices.length > 0 ? `${overdueInvoices.length} invoices overdue` : 'No overdue invoices',
      },
      {
        label: 'Active Pipeline',
        value: pipelineDisplay,
        detail: activeDeals.length > 0 ? `${activeDeals.length} active deals` : 'No open deals',
      },
      {
        label: 'Team Attendance',
        value: teamOps.total_staff > 0 ? `${teamOps.present_count} / ${teamOps.total_staff}` : '0 / 0',
        detail: teamOps.total_staff > 0 ? `${attendanceRate}% present today` : 'No team logs today',
      },
      {
        label: 'Active Projects',
        value: `${projects.length}`,
        detail: projects.length > 0 ? `${projects.filter((p) => p.status === 'active').length} active projects` : 'No active projects',
      },
    ];

    return {
      kpis,
      eaSignals: unresolvedSignals,
      projects: projects.slice(0, 4),
      externalApps,
    };
  },

  // Projects
  async getProjects(): Promise<WorkProject[]> {
    return workRepository.getProjects();
  },

  async getProject(id: string): Promise<WorkProject | null> {
    return workRepository.getProjectById(id);
  },

  async createProject(input: CreateProjectInput): Promise<WorkProject> {
    return workRepository.createProject(input);
  },

  async updateProject(id: string, input: UpdateProjectInput): Promise<WorkProject | null> {
    return workRepository.updateProject(id, input);
  },

  async addTask(projectId: string, input: AddTaskInput): Promise<WorkProject | null> {
    return workRepository.addTaskToProject(projectId, input);
  },

  async toggleTask(projectId: string, taskId: string): Promise<WorkProject | null> {
    return workRepository.toggleProjectTask(projectId, taskId);
  },

  // Finance & Invoices
  async getFinanceSummary() {
    const invoices = await workRepository.getInvoices();
    const paidInvoices = invoices.filter((i) => i.status === 'paid');
    const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
    const totalCollected = paidInvoices.reduce((sum, i) => sum + (i.amount_numeric || 0), 0);
    const totalOverdue = overdueInvoices.reduce((sum, i) => sum + (i.amount_numeric || 0), 0);

    return {
      revenue: totalCollected > 0 ? `₹${(totalCollected / 100000).toFixed(2)} L` : '₹0',
      grossMargin: '₹0',
      monthlyPayroll: '₹0',
      collectionRisk: totalOverdue > 0 ? `₹${(totalOverdue / 100000).toFixed(2)} L` : '₹0',
      invoices,
    };
  },

  async createInvoice(input: CreateInvoiceInput): Promise<WorkInvoice> {
    return workRepository.createInvoice(input);
  },

  async sendPaymentReminder(invoiceId: string) {
    const invoice = await workRepository.markReminderSent(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const messageDraft = `Dear ${invoice.client_name} Team,\n\nThis is a gentle reminder regarding invoice ${invoice.invoice_number} of ${invoice.amount} which was due on ${invoice.due_date}. We appreciate your support in facilitating prompt clearance.\n\nWarm regards,\nManagement`;

    return {
      invoice,
      messageDraft,
      status: 'Reminder dispatched via WhatsApp / Email queue',
    };
  },

  // Sales
  async getSalesPipeline() {
    const deals = await workRepository.getDeals();
    const activeDeals = deals.filter((d) => d.stage !== 'lost');
    const pipelineTotal = activeDeals.reduce((sum, d) => sum + (d.deal_value_numeric || 0), 0);

    return {
      pipelineTotal: pipelineTotal > 0 ? `₹${(pipelineTotal / 100000).toFixed(2)} L` : '₹0',
      activeDealsCount: activeDeals.length,
      deals,
    };
  },

  async createDeal(input: CreateDealInput): Promise<WorkDeal> {
    return workRepository.createDeal(input);
  },

  async updateDealStage(id: string, stage: WorkDeal['stage']): Promise<WorkDeal | null> {
    return workRepository.updateDealStage(id, stage);
  },

  // Team & HR
  async getTeamOps(): Promise<WorkTeamOps> {
    return workRepository.getTeamOps();
  },

  async resolveHRTicket(ticketId: string): Promise<WorkTeamOps> {
    return workRepository.resolveHRTicket(ticketId);
  },

  // EA
  async getEASignals(): Promise<WorkEASignal[]> {
    return workRepository.getEASignals();
  },

  async resolveEASignal(id: string): Promise<WorkEASignal | null> {
    return workRepository.resolveEASignal(id);
  },

  // Connected External Apps (Infra Tracker & Second Software)
  async getExternalApps(): Promise<WorkExternalApp[]> {
    return workRepository.getExternalApps();
  },

  async updateExternalAppUrl(appKey: string, input: UpdateExternalAppUrlInput): Promise<WorkExternalApp | null> {
    return workRepository.updateExternalAppUrl(appKey, input);
  },
};
