export type HealthTab =
  | 'today'
  | 'goals'
  | 'plan'
  | 'body'
  | 'records'
  | 'nutrition'
  | 'events'
  | 'journal';

export type PersonName = 'Self' | 'Neha' | 'Prayan';

export interface HealthGoal {
  id: string;
  name: string;
  date: string;
  category: string;
  progress: number;
  target_metric?: string;
  current_metric?: string;
  is_active?: boolean;
}

export interface TrainingDay {
  id?: string;
  day: string;
  workout: string;
  distance: string;
  status: 'completed' | 'today' | 'upcoming' | 'skipped';
  scheduled_time?: string;
  intensity?: string;
  notes?: string;
  synced_to_calendar?: boolean;
}

export interface SportsEvent {
  id: string;
  name: string;
  sport: string;
  region: string;
  date: string;
  registered?: boolean;
  target_time?: string;
}

export interface JournalEntry {
  id?: string;
  date: string;
  text: string;
  energy_level?: string;
  soreness_level?: string;
  ai_coach_reflection?: string;
}

export interface VitalsSummary {
  resting_hr: number;
  sleep_duration_minutes: number;
  recovery_score: number;
  steps_count: number;
  hydration_liters: number;
  energy_level?: string;
  source?: string;
}

export interface CoachSuggestion {
  title: string;
  description: string;
  category: string;
  recommendedWorkoutId?: string;
}

export interface WeeklyRhythmBar {
  day: string;
  load: number;
}

export interface DocumentItem {
  id: string;
  title: string;
  doc_type: string;
  file_url?: string;
  extracted_summary?: string;
  test_date: string;
}

export interface HealthDashboardData {
  person: PersonName;
  vitals: VitalsSummary;
  weeklyRhythm: WeeklyRhythmBar[];
  coachSuggestion: CoachSuggestion;
  goals: HealthGoal[];
  trainingSessions: TrainingDay[];
  events: SportsEvent[];
  journals: JournalEntry[];
  documents: DocumentItem[];
}
