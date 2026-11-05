export type HealthTab =
  | 'today'
  | 'nutrition'
  | 'plan'
  | 'goals'
  | 'body'
  | 'events'
  | 'journal';

export type PersonName = 'Self' | 'Neha' | 'Prayan';
export type TrackingSource = 'watch' | 'phone';

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

export interface Biomarker {
  name: string;
  value: string;
  unit: string;
  status: 'Optimal' | 'Normal' | 'High' | 'Low' | 'Alert' | string;
  reference_range?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  doc_type: string;
  file_url?: string;
  extracted_summary?: string;
  biomarkers?: Biomarker[];
  test_date: string;
}

export interface MealLog {
  id: string;
  person_name: PersonName;
  meal_title: string;
  image_url?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number;
  detected_items: string[];
  micronutrients: string[];
  runner_insight: string;
  logged_at: string;
}

export interface WearableStatus {
  connected: boolean;
  brand?: string;
  device_name: string;
  battery_level: number;
  last_synced: string;
  sync_mode: string;
}

export interface DiscoveredBleDevice {
  id: string;
  name: string;
  brand: string;
  rssi: number;
  signal: string;
}

export interface ConnectWearablePayload {
  person_name?: PersonName;
  brand: string;
  device_name: string;
  connection_type: 'bluetooth_ble' | 'health_connect' | 'apple_health' | 'cloud_sync';
  battery_level?: number;
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
  meals: MealLog[];
  wearableStatus: WearableStatus;
}
