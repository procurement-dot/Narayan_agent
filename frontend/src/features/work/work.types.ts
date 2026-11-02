export type WorkTab = 'overview' | 'finance' | 'hr' | 'projects' | 'sales' | 'ea';

export interface WorkProject {
  id: string;
  name: string;
  subtitle: string;
  tag: string;
  progress: number;
  next: string;
  tasks: string[];
}

export interface WorkKpi {
  label: string;
  value: string;
  detail: string;
}
