import fs from 'fs';
import path from 'path';
import { supabase } from '../../config/supabase.js';
import { env } from '../../config/env.js';
import {
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

const ROOT_DIR = fs.existsSync(path.resolve(process.cwd(), 'backend'))
  ? path.resolve(process.cwd(), 'backend')
  : process.cwd();
const DATA_DIR = path.resolve(ROOT_DIR, 'data');
const DATA_FILE = path.join(DATA_DIR, 'work.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface WorkDataStructure {
  projects: WorkProject[];
  invoices: WorkInvoice[];
  deals: WorkDeal[];
  team_ops: WorkTeamOps;
  ea_signals: WorkEASignal[];
  external_apps: WorkExternalApp[];
}

function loadData(): WorkDataStructure {
  ensureDataFile();
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.warn('Could not read work.json, returning empty structure:', e);
    }
  }
  return {
    projects: [],
    invoices: [],
    deals: [],
    team_ops: { total_staff: 20, present_count: 18, departments: [], tickets: [] },
    ea_signals: [],
    external_apps: [],
  };
}

function saveData(data: WorkDataStructure) {
  ensureDataFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write work.json:', e);
  }
}

const isSupabaseConfigured = () =>
  Boolean(
    env.SUPABASE_URL &&
    !env.SUPABASE_URL.includes('placeholder') &&
    env.SUPABASE_SERVICE_ROLE_KEY &&
    !env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder') &&
    !env.SUPABASE_SERVICE_ROLE_KEY.includes('sample_')
  );

export const workRepository = {
  // Projects
  async getProjects(): Promise<WorkProject[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('work_projects')
          .select('*, tasks:work_project_tasks(*)')
          .order('created_at', { ascending: false });
        if (!error && data) return data as WorkProject[];
      } catch (err) {
        console.warn('Supabase projects query failed, falling back to local store:', err);
      }
    }
    const store = loadData();
    return store.projects;
  },

  async getProjectById(id: string): Promise<WorkProject | null> {
    const projects = await this.getProjects();
    return projects.find((p) => p.id === id) || null;
  },

  async createProject(input: CreateProjectInput): Promise<WorkProject> {
    const store = loadData();
    const newProject: WorkProject = {
      id: `proj-${Date.now()}`,
      name: input.name,
      subtitle: input.subtitle || '',
      tag: input.tag || 'General',
      progress: input.progress || 0,
      next_action: input.next_action || 'Review milestones',
      owner: input.owner || 'Narayan',
      budget: input.budget || '₹10 L',
      status: 'active',
      tasks: (input.tasks || []).map((t, idx) => ({
        id: `t-${Date.now()}-${idx}`,
        title: t,
        is_completed: false,
      })),
    };
    store.projects.unshift(newProject);
    saveData(store);
    return newProject;
  },

  async updateProject(id: string, input: UpdateProjectInput): Promise<WorkProject | null> {
    const store = loadData();
    const idx = store.projects.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    store.projects[idx] = {
      ...store.projects[idx],
      ...input,
    };
    saveData(store);
    return store.projects[idx];
  },

  async addTaskToProject(projectId: string, input: AddTaskInput): Promise<WorkProject | null> {
    const store = loadData();
    const project = store.projects.find((p) => p.id === projectId);
    if (!project) return null;

    const newTask = {
      id: `t-${Date.now()}`,
      title: input.title,
      is_completed: false,
      due_date: input.due_date,
    };
    project.tasks.push(newTask);
    saveData(store);
    return project;
  },

  async toggleProjectTask(projectId: string, taskId: string): Promise<WorkProject | null> {
    const store = loadData();
    const project = store.projects.find((p) => p.id === projectId);
    if (!project) return null;

    const task = project.tasks.find((t) => t.id === taskId);
    if (task) {
      task.is_completed = !task.is_completed;
      // Auto-recalculate progress
      const completed = project.tasks.filter((t) => t.is_completed).length;
      project.progress = Math.round((completed / project.tasks.length) * 100);
      saveData(store);
    }
    return project;
  },

  // Invoices & Receivables
  async getInvoices(): Promise<WorkInvoice[]> {
    const store = loadData();
    return store.invoices;
  },

  async createInvoice(input: CreateInvoiceInput): Promise<WorkInvoice> {
    const store = loadData();
    const num = parseFloat(input.amount.replace(/[^0-9.]/g, '')) || 0;
    const newInvoice: WorkInvoice = {
      id: `inv-${Date.now()}`,
      invoice_number: input.invoice_number,
      client_name: input.client_name,
      vertical: input.vertical,
      amount: input.amount,
      amount_numeric: num,
      due_date: input.due_date,
      status: input.status || 'pending',
      reminder_sent_at: null,
    };
    store.invoices.unshift(newInvoice);
    saveData(store);
    return newInvoice;
  },

  async markReminderSent(invoiceId: string): Promise<WorkInvoice | null> {
    const store = loadData();
    const inv = store.invoices.find((i) => i.id === invoiceId);
    if (inv) {
      inv.reminder_sent_at = new Date().toISOString();
      saveData(store);
    }
    return inv || null;
  },

  // Sales Deals
  async getDeals(): Promise<WorkDeal[]> {
    const store = loadData();
    return store.deals;
  },

  async createDeal(input: CreateDealInput): Promise<WorkDeal> {
    const store = loadData();
    const num = parseFloat(input.deal_value.replace(/[^0-9.]/g, '')) || 0;
    const newDeal: WorkDeal = {
      id: `deal-${Date.now()}`,
      client_name: input.client_name,
      deal_value: input.deal_value,
      deal_value_numeric: num,
      stage: input.stage || 'demo',
      contact_person: input.contact_person,
      notes: input.notes,
      next_action: input.next_action,
    };
    store.deals.unshift(newDeal);
    saveData(store);
    return newDeal;
  },

  async updateDealStage(id: string, stage: WorkDeal['stage']): Promise<WorkDeal | null> {
    const store = loadData();
    const deal = store.deals.find((d) => d.id === id);
    if (deal) {
      deal.stage = stage;
      saveData(store);
    }
    return deal || null;
  },

  // Team & HR
  async getTeamOps(): Promise<WorkTeamOps> {
    const store = loadData();
    return store.team_ops;
  },

  async resolveHRTicket(ticketId: string): Promise<WorkTeamOps> {
    const store = loadData();
    const ticket = store.team_ops.tickets.find((t) => t.id === ticketId);
    if (ticket) {
      ticket.status = 'resolved';
      saveData(store);
    }
    return store.team_ops;
  },

  // EA Signals
  async getEASignals(): Promise<WorkEASignal[]> {
    const store = loadData();
    return store.ea_signals;
  },

  async resolveEASignal(id: string): Promise<WorkEASignal | null> {
    const store = loadData();
    const sig = store.ea_signals.find((s) => s.id === id);
    if (sig) {
      sig.is_resolved = true;
      saveData(store);
    }
    return sig || null;
  },

  // Connected External Apps
  async getExternalApps(): Promise<WorkExternalApp[]> {
    const store = loadData();
    return store.external_apps;
  },

  async updateExternalAppUrl(appKey: string, input: UpdateExternalAppUrlInput): Promise<WorkExternalApp | null> {
    const store = loadData();
    let app = store.external_apps.find((a) => a.app_key === appKey);
    if (app) {
      app.deploy_url = input.deploy_url;
      if (input.name) app.name = input.name;
      if (input.subtitle) app.subtitle = input.subtitle;
      app.status = 'connected';
      saveData(store);
    } else {
      app = {
        id: `ext-${Date.now()}`,
        app_key: appKey,
        name: input.name || (appKey === 'infra_tracker' ? 'Infra Project Tracker' : 'Second Software'),
        subtitle: input.subtitle || 'Connected Live System',
        tag: 'External Live App',
        deploy_url: input.deploy_url,
        status: 'connected',
        summary_metrics: { activeProjects: 1, lastSync: 'Connected just now' },
        is_active: true,
      };
      store.external_apps.push(app);
      saveData(store);
    }
    return app;
  },
};
