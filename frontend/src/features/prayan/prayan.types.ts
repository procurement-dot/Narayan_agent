export type PrayanTab = 'world' | 'ideas' | 'journey' | 'community' | 'parent';

export interface CubingRecord {
  event: string;
  best: string;
  average: string;
  date: string;
}

export interface PrayanMilestone {
  title: string;
  category: string;
  date: string;
  desc: string;
}
