export type WorkTab = 'overview' | 'projects' | 'finance' | 'hr' | 'sales' | 'ea';

export interface WorkProjectTask {
  id: string;
  title: string;
  is_completed: boolean;
  due_date?: string;
}

export interface WorkProject {
  id: string;
  name: string;
  subtitle: string;
  tag: string;
  progress: number;
  next_action: string;
  owner: string;
  budget?: string;
  status: 'active' | 'completed' | 'on_hold';
  tasks: WorkProjectTask[];
}

export interface WorkKpi {
  label: string;
  value: string;
  detail: string;
}

export interface WorkInvoice {
  id: string;
  invoice_number: string;
  client_name: string;
  vertical: string;
  amount: string;
  amount_numeric: number;
  due_date: string;
  status: 'pending' | 'overdue' | 'paid';
  reminder_sent_at?: string | null;
}

export interface WorkDeal {
  id: string;
  client_name: string;
  deal_value: string;
  deal_value_numeric: number;
  stage: 'lead' | 'demo' | 'proposal' | 'negotiation' | 'won' | 'lost';
  contact_person?: string;
  notes?: string;
  next_action?: string;
}

export interface HRDepartment {
  name: string;
  count: number;
  percent: number;
}

export interface HRTicket {
  id: string;
  title: string;
  detail: string;
  tag: string;
  status: 'pending' | 'resolved';
}

export interface WorkTeamOps {
  total_staff: number;
  present_count: number;
  departments: HRDepartment[];
  tickets: HRTicket[];
}

export interface WorkEASignal {
  id: string;
  title: string;
  description: string;
  source: 'Email' | 'WhatsApp' | 'Calendar' | 'System';
  category: 'incident' | 'review' | 'decision' | 'schedule';
  priority: 'high' | 'medium' | 'low';
  is_resolved: boolean;
}

export interface WorkExternalApp {
  id: string;
  name: string;
  app_key: string;
  subtitle: string;
  tag: string;
  deploy_url: string;
  status: 'connected' | 'offline';
  summary_metrics: Record<string, any>;
  is_active: boolean;
}

export interface WorkOverviewData {
  kpis: WorkKpi[];
  eaSignals: WorkEASignal[];
  projects: WorkProject[];
  externalApps: WorkExternalApp[];
}
