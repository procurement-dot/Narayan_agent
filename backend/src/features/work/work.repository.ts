import fs from 'fs';
import path from 'path';
import { db } from '../../db/db.js';
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
    team_ops: { total_staff: 0, present_count: 0, departments: [], tickets: [] },
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

export const workRepository = {
  // Projects
  async getProjects(): Promise<WorkProject[]> {
    try {
      const rows = await db.query(`
        SELECT p.*, COALESCE(
          (SELECT json_agg(t.* ORDER BY t.sort_order ASC) FROM work_project_tasks t WHERE t.project_id = p.id),
          '[]'::json
        ) as tasks
        FROM work_projects p
        ORDER BY p.created_at DESC
      `);
      if (rows) return rows as WorkProject[];
    } catch (err) {
      console.warn('DB getProjects failed, falling back to local store:', err);
    }
    const store = loadData();
    return store.projects;
  },

  async getProjectById(id: string): Promise<WorkProject | null> {
    try {
      const project = await db.queryOne(`
        SELECT p.*, COALESCE(
          (SELECT json_agg(t.* ORDER BY t.sort_order ASC) FROM work_project_tasks t WHERE t.project_id = p.id),
          '[]'::json
        ) as tasks
        FROM work_projects p
        WHERE p.id = $1
      `, [id]);
      if (project) return project as WorkProject;
    } catch (err) {}
    const projects = await this.getProjects();
    return projects.find((p) => p.id === id) || null;
  },

  async createProject(input: CreateProjectInput): Promise<WorkProject> {
    try {
      const p = await db.queryOne(
        `INSERT INTO work_projects (user_id, name, subtitle, tag, progress, next_action, owner, budget, status)
         VALUES ('00000000-0000-0000-0000-000000000001', $1, $2, $3, $4, $5, $6, $7, 'active')
         RETURNING *`,
        [input.name, input.subtitle || '', input.tag || 'General', input.progress || 0, input.next_action || 'Review milestones', input.owner || 'Narayan', input.budget || '₹10 L']
      );
      if (p) {
        if (input.tasks && input.tasks.length > 0) {
          for (let i = 0; i < input.tasks.length; i++) {
            await db.query(
              `INSERT INTO work_project_tasks (project_id, title, is_completed, sort_order) VALUES ($1, $2, false, $3)`,
              [p.id, input.tasks[i], i + 1]
            );
          }
        }
        return (await this.getProjectById(p.id)) || p;
      }
    } catch (err) {
      console.warn('DB createProject failed, saving locally:', err);
    }

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
    try {
      await db.query(
        `UPDATE work_projects SET name = COALESCE($2, name), subtitle = COALESCE($3, subtitle), progress = COALESCE($4, progress), updated_at = NOW() WHERE id = $1`,
        [id, input.name, input.subtitle, input.progress]
      );
      return await this.getProjectById(id);
    } catch (err) {}

    const store = loadData();
    const idx = store.projects.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    store.projects[idx] = { ...store.projects[idx], ...input };
    saveData(store);
    return store.projects[idx];
  },

  async addTaskToProject(projectId: string, input: AddTaskInput): Promise<WorkProject | null> {
    try {
      await db.query(
        `INSERT INTO work_project_tasks (project_id, title, is_completed, due_date) VALUES ($1, $2, false, $3)`,
        [projectId, input.title, input.due_date || null]
      );
      return await this.getProjectById(projectId);
    } catch (err) {}

    const store = loadData();
    const project = store.projects.find((p) => p.id === projectId);
    if (!project) return null;
    project.tasks.push({ id: `t-${Date.now()}`, title: input.title, is_completed: false, due_date: input.due_date });
    saveData(store);
    return project;
  },

  async toggleProjectTask(projectId: string, taskId: string): Promise<WorkProject | null> {
    try {
      await db.query(
        `UPDATE work_project_tasks SET is_completed = NOT is_completed WHERE id = $1 AND project_id = $2`,
        [taskId, projectId]
      );
      return await this.getProjectById(projectId);
    } catch (err) {}

    const store = loadData();
    const project = store.projects.find((p) => p.id === projectId);
    if (!project) return null;
    const task = project.tasks.find((t) => t.id === taskId);
    if (task) {
      task.is_completed = !task.is_completed;
      const completed = project.tasks.filter((t) => t.is_completed).length;
      project.progress = Math.round((completed / project.tasks.length) * 100);
      saveData(store);
    }
    return project;
  },

  // Invoices & Receivables
  async getInvoices(): Promise<WorkInvoice[]> {
    try {
      const rows = await db.query('SELECT * FROM work_invoices ORDER BY due_date ASC');
      if (rows) return rows as WorkInvoice[];
    } catch (err) {}
    const store = loadData();
    return store.invoices;
  },

  async createInvoice(input: CreateInvoiceInput): Promise<WorkInvoice> {
    const num = parseFloat(input.amount.replace(/[^0-9.]/g, '')) || 0;
    try {
      const row = await db.queryOne(
        `INSERT INTO work_invoices (user_id, invoice_number, client_name, vertical, amount, amount_numeric, due_date, status)
         VALUES ('00000000-0000-0000-0000-000000000001', $1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [input.invoice_number, input.client_name, input.vertical, input.amount, num, input.due_date, input.status || 'pending']
      );
      if (row) return row as WorkInvoice;
    } catch (err) {}

    const store = loadData();
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
    try {
      const row = await db.queryOne(
        `UPDATE work_invoices SET reminder_sent_at = NOW() WHERE id = $1 RETURNING *`,
        [invoiceId]
      );
      if (row) return row as WorkInvoice;
    } catch (err) {}

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
    try {
      const rows = await db.query('SELECT * FROM work_deals ORDER BY created_at DESC');
      if (rows) return rows as WorkDeal[];
    } catch (err) {}
    const store = loadData();
    return store.deals;
  },

  async createDeal(input: CreateDealInput): Promise<WorkDeal> {
    const num = parseFloat(input.deal_value.replace(/[^0-9.]/g, '')) || 0;
    try {
      const row = await db.queryOne(
        `INSERT INTO work_deals (user_id, client_name, deal_value, deal_value_numeric, stage, contact_person, notes, next_action)
         VALUES ('00000000-0000-0000-0000-000000000001', $1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [input.client_name, input.deal_value, num, input.stage || 'demo', input.contact_person || null, input.notes || null, input.next_action || null]
      );
      if (row) return row as WorkDeal;
    } catch (err) {}

    const store = loadData();
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
    try {
      const row = await db.queryOne(
        `UPDATE work_deals SET stage = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id, stage]
      );
      if (row) return row as WorkDeal;
    } catch (err) {}

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
    try {
      const row = await db.queryOne('SELECT * FROM work_team_ops ORDER BY log_date DESC LIMIT 1');
      if (row) {
        return {
          total_staff: Number(row.total_staff || 0),
          present_count: Number(row.present_count || 0),
          departments: [],
          tickets: row.tickets || [],
        };
      }
    } catch (err) {}
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
    try {
      const rows = await db.query('SELECT * FROM work_ea_signals WHERE is_resolved = false ORDER BY created_at DESC');
      if (rows) return rows as WorkEASignal[];
    } catch (err) {}
    const store = loadData();
    return store.ea_signals;
  },

  async resolveEASignal(id: string): Promise<WorkEASignal | null> {
    try {
      const row = await db.queryOne(
        `UPDATE work_ea_signals SET is_resolved = true, resolved_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
      );
      if (row) return row as WorkEASignal;
    } catch (err) {}

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
    try {
      const rows = await db.query('SELECT * FROM work_external_apps WHERE is_active = true ORDER BY name ASC');
      if (rows) return rows as WorkExternalApp[];
    } catch (err) {}
    const store = loadData();
    return store.external_apps;
  },

  async updateExternalAppUrl(appKey: string, input: UpdateExternalAppUrlInput): Promise<WorkExternalApp | null> {
    try {
      const row = await db.queryOne(
        `UPDATE work_external_apps SET deploy_url = $2, name = COALESCE($3, name), updated_at = NOW() WHERE app_key = $1 RETURNING *`,
        [appKey, input.deploy_url, input.name || null]
      );
      if (row) return row as WorkExternalApp;
    } catch (err) {}

    const store = loadData();
    const app = store.external_apps.find((a) => a.app_key === appKey);
    if (app) {
      app.deploy_url = input.deploy_url;
      if (input.name) app.name = input.name;
      saveData(store);
    }
    return app || null;
  },
};
