export type HealthTab =
  | 'today'
  | 'goals'
  | 'plan'
  | 'body'
  | 'records'
  | 'nutrition'
  | 'events'
  | 'journal';

export interface HealthGoal {
  id: string;
  name: string;
  date: string;
  category: string;
  progress: number;
}

export interface TrainingDay {
  day: string;
  workout: string;
  distance: string;
  status: 'completed' | 'today' | 'upcoming';
}

export interface SportsEvent {
  id: string;
  name: string;
  sport: string;
  region: string;
  date: string;
}
