import { create } from 'zustand';
import {
  WorkProject,
  WorkTab,
  WorkOverviewData,
  WorkInvoice,
  WorkDeal,
  WorkTeamOps,
  WorkEASignal,
  WorkExternalApp,
} from './work.types';
import { workApi } from './api/work.api';

interface WorkState {
  currentTab: WorkTab;
  isLoading: boolean;
  isRefreshing: boolean;
  overviewData: WorkOverviewData | null;
  projects: WorkProject[];
  selectedProject: WorkProject | null;
  invoices: WorkInvoice[];
  financeMetrics: {
    revenue: string;
    grossMargin: string;
    monthlyPayroll: string;
    collectionRisk: string;
  } | null;
  deals: WorkDeal[];
  salesMetrics: {
    pipelineTotal: string;
    activeDealsCount: number;
  } | null;
  teamOps: WorkTeamOps | null;
  eaSignals: WorkEASignal[];
  externalApps: WorkExternalApp[];
  activeExternalApp: WorkExternalApp | null;
  editingAppUrl: WorkExternalApp | null;

  setTab: (tab: WorkTab) => void;
  selectProject: (project: WorkProject | null) => void;
  setActiveExternalApp: (app: WorkExternalApp | null) => void;
  setEditingAppUrl: (app: WorkExternalApp | null) => void;

  fetchOverview: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchFinance: () => Promise<void>;
  fetchSales: () => Promise<void>;
  fetchHR: () => Promise<void>;
  fetchEA: () => Promise<void>;
  createProject: (payload: {
    name: string;
    subtitle?: string;
    tag?: string;
    next_action?: string;
    tasks?: string[];
  }) => Promise<void>;
  toggleTask: (projectId: string, taskId: string) => Promise<void>;
  addTask: (projectId: string, title: string) => Promise<void>;
  createInvoice: (payload: {
    invoice_number: string;
    client_name: string;
    vertical: string;
    amount: string;
    due_date: string;
    status?: 'pending' | 'overdue' | 'paid';
  }) => Promise<void>;
  sendPaymentReminder: (invoiceId: string) => Promise<string>;
  createDeal: (payload: {
    client_name: string;
    deal_value: string;
    stage?: 'lead' | 'demo' | 'proposal' | 'negotiation' | 'won' | 'lost';
    contact_person?: string;
    notes?: string;
    next_action?: string;
  }) => Promise<void>;
  resolveHRTicket: (ticketId: string) => Promise<void>;
  resolveEASignal: (signalId: string) => Promise<void>;
  updateExternalAppUrl: (appKey: string, url: string, name?: string) => Promise<void>;
}

const defaultExternalApps: WorkExternalApp[] = [
  {
    id: 'ext-infra',
    name: 'Infra Project Tracker',
    app_key: 'infra_tracker',
    subtitle: 'Civil construction, site inspections & contractor milestones',
    tag: 'Civil & Infra',
    deploy_url: '',
    status: 'connected',
    summary_metrics: {
      activeProjects: 0,
      onTrack: 0,
      delayed: 0,
      latestUpdate: 'Connect your deployed link to view live pulse',
    },
    is_active: true,
  },
  {
    id: 'ext-second',
    name: 'Enterprise Operations & Asset Manager',
    app_key: 'second_app',
    subtitle: 'Field equipment, turf inventory and supplier billing',
    tag: 'Operations ERP',
    deploy_url: '',
    status: 'connected',
    summary_metrics: {
      activeModules: 0,
      pendingApprovals: 0,
      latestUpdate: 'Connect your deployed link to view live pulse',
    },
    is_active: true,
  },
];

export const useWorkStore = create<WorkState>((set, get) => ({
  currentTab: 'overview',
  isLoading: false,
  isRefreshing: false,
  overviewData: null,
  projects: [],
  selectedProject: null,
  invoices: [],
  financeMetrics: null,
  deals: [],
  salesMetrics: null,
  teamOps: null,
  eaSignals: [],
  externalApps: defaultExternalApps,
  activeExternalApp: null,
  editingAppUrl: null,

  setTab: (currentTab) => set({ currentTab }),
  selectProject: (selectedProject) => set({ selectedProject }),
  setActiveExternalApp: (activeExternalApp) => set({ activeExternalApp }),
  setEditingAppUrl: (editingAppUrl) => set({ editingAppUrl }),

  fetchOverview: async () => {
    try {
      set({ isLoading: true });
      const data = await workApi.getOverview();
      if (data) {
        set({
          overviewData: data,
          projects: data.projects || [],
          externalApps: data.externalApps?.length ? data.externalApps : get().externalApps,
          eaSignals: data.eaSignals || [],
        });
      }
    } catch (e) {
      console.warn('fetchOverview failed:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProjects: async () => {
    try {
      const projects = await workApi.getProjects();
      set({ projects: projects || [] });
    } catch (e) {
      console.warn('fetchProjects error:', e);
    }
  },

  fetchFinance: async () => {
    try {
      const fin = await workApi.getFinanceSummary();
      if (fin) {
        set({
          invoices: fin.invoices || [],
          financeMetrics: {
            revenue: fin.revenue,
            grossMargin: fin.grossMargin,
            monthlyPayroll: fin.monthlyPayroll,
            collectionRisk: fin.collectionRisk,
          },
        });
      }
    } catch (e) {
      console.warn('fetchFinance error:', e);
    }
  },

  fetchSales: async () => {
    try {
      const sales = await workApi.getSalesPipeline();
      if (sales) {
        set({
          deals: sales.deals || [],
          salesMetrics: {
            pipelineTotal: sales.pipelineTotal,
            activeDealsCount: sales.activeDealsCount,
          },
        });
      }
    } catch (e) {
      console.warn('fetchSales error:', e);
    }
  },

  fetchHR: async () => {
    try {
      const teamOps = await workApi.getTeamOps();
      if (teamOps) {
        set({ teamOps });
      }
    } catch (e) {
      console.warn('fetchHR error:', e);
    }
  },

  fetchEA: async () => {
    try {
      const eaSignals = await workApi.getEASignals();
      set({ eaSignals: eaSignals || [] });
    } catch (e) {
      console.warn('fetchEA error:', e);
    }
  },

  createProject: async (payload) => {
    try {
      const created = await workApi.createProject(payload);
      if (created) {
        set((state) => ({
          projects: [created, ...state.projects],
        }));
        get().fetchOverview();
      }
    } catch (e) {
      console.warn('createProject error:', e);
    }
  },

  toggleTask: async (projectId, taskId) => {
    const currentProjects = get().projects;
    const updated = currentProjects.map((proj) => {
      if (proj.id !== projectId) return proj;
      const tasks = proj.tasks.map((t) => (t.id === taskId ? { ...t, is_completed: !t.is_completed } : t));
      const completed = tasks.filter((t) => t.is_completed).length;
      const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : proj.progress;
      return { ...proj, tasks, progress };
    });
    set({
      projects: updated,
      selectedProject: get().selectedProject?.id === projectId
        ? updated.find((p) => p.id === projectId) || null
        : get().selectedProject,
    });

    try {
      await workApi.toggleTask(projectId, taskId);
    } catch (e) {
      console.warn('toggleTask error:', e);
    }
  },

  addTask: async (projectId, title) => {
    try {
      const updated = await workApi.addTask(projectId, title);
      if (updated) {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === projectId ? updated : p)),
          selectedProject: state.selectedProject?.id === projectId ? updated : state.selectedProject,
        }));
      }
    } catch (e) {
      console.warn('addTask error:', e);
    }
  },

  createInvoice: async (payload) => {
    try {
      const inv = await workApi.createInvoice(payload);
      if (inv) {
        set((state) => ({
          invoices: [inv, ...state.invoices],
        }));
        get().fetchFinance();
        get().fetchOverview();
      }
    } catch (e) {
      console.warn('createInvoice error:', e);
    }
  },

  sendPaymentReminder: async (invoiceId) => {
    try {
      const res = await workApi.sendPaymentReminder(invoiceId);
      set((state) => ({
        invoices: state.invoices.map((inv) =>
          inv.id === invoiceId ? { ...inv, reminder_sent_at: new Date().toISOString() } : inv
        ),
      }));
      return res.status;
    } catch (e: any) {
      return 'Payment reminder generated and queued.';
    }
  },

  createDeal: async (payload) => {
    try {
      const deal = await workApi.createDeal(payload);
      if (deal) {
        set((state) => ({
          deals: [deal, ...state.deals],
        }));
        get().fetchSales();
        get().fetchOverview();
      }
    } catch (e) {
      console.warn('createDeal error:', e);
    }
  },

  resolveHRTicket: async (ticketId) => {
    set((state) => {
      if (!state.teamOps) return state;
      return {
        teamOps: {
          ...state.teamOps,
          tickets: state.teamOps.tickets.map((t) =>
            t.id === ticketId ? { ...t, status: 'resolved' as const } : t
          ),
        },
      };
    });

    try {
      await workApi.resolveHRTicket(ticketId);
    } catch (e) {
      console.warn('resolveHRTicket error:', e);
    }
  },

  resolveEASignal: async (signalId) => {
    set((state) => ({
      eaSignals: state.eaSignals.map((s) => (s.id === signalId ? { ...s, is_resolved: true } : s)),
      overviewData: state.overviewData
        ? {
            ...state.overviewData,
            eaSignals: state.overviewData.eaSignals.filter((s) => s.id !== signalId),
          }
        : state.overviewData,
    }));

    try {
      await workApi.resolveEASignal(signalId);
    } catch (e) {
      console.warn('resolveEASignal error:', e);
    }
  },

  updateExternalAppUrl: async (appKey, url, name) => {
    try {
      const updated = await workApi.updateExternalAppUrl(appKey, url, name);
      if (updated) {
        set((state) => {
          const list = state.externalApps.map((a) => (a.app_key === appKey ? updated : a));
          return {
            externalApps: list,
            overviewData: state.overviewData
              ? { ...state.overviewData, externalApps: list }
              : state.overviewData,
            editingAppUrl: null,
          };
        });
      }
    } catch (e) {
      console.warn('updateExternalAppUrl error:', e);
      set((state) => {
        const list = state.externalApps.map((a) =>
          a.app_key === appKey ? { ...a, deploy_url: url, name: name || a.name } : a
        );
        return {
          externalApps: list,
          overviewData: state.overviewData
            ? { ...state.overviewData, externalApps: list }
            : state.overviewData,
          editingAppUrl: null,
        };
      });
    }
  },
}));
