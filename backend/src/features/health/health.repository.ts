import fs from 'fs';
import path from 'path';
import { supabase } from '../../config/supabase.js';
import { env } from '../../config/env.js';
import {
  CreateGoalInput,
  CreateEventInput,
  CreateTrainingSessionInput,
  LogVitalsInput,
  PersonName,
  SaveJournalInput,
  UpdateGoalInput,
  UpdateTrainingSessionInput,
  UploadDocumentInput,
} from './health.dto.js';
export { PersonName };

export interface VitalsRecord {
  id: string;
  person_name: PersonName;
  log_date: string;
  resting_hr: number;
  sleep_duration_minutes: number;
  recovery_score: number;
  steps_count: number;
  hydration_liters: number;
  energy_level: string;
  source: string;
  created_at: string;
}

export interface GoalRecord {
  id: string;
  user_id: string;
  name: string;
  date: string;
  category: string;
  progress: number;
  target_metric?: string;
  current_metric?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainingSessionRecord {
  id: string;
  user_id: string;
  week_number: number;
  day_name: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  workout: string;
  distance: string;
  status: 'completed' | 'today' | 'upcoming' | 'skipped';
  scheduled_time: string;
  intensity: string;
  notes?: string;
  synced_to_calendar: boolean;
  created_at: string;
  updated_at: string;
}

export interface SportsEventRecord {
  id: string;
  user_id: string;
  name: string;
  sport: string;
  region: 'Local' | 'India' | 'International';
  date: string;
  registered: boolean;
  target_time?: string;
  created_at: string;
}

export interface JournalRecord {
  id: string;
  person_name: PersonName;
  date: string;
  text: string;
  energy_level: string;
  soreness_level: string;
  ai_coach_reflection?: string;
  created_at: string;
}

export interface Biomarker {
  name: string;
  value: string;
  unit: string;
  status: 'Optimal' | 'Normal' | 'High' | 'Low' | 'Alert';
  reference_range?: string;
}

export interface DocumentRecord {
  id: string;
  person_name: PersonName;
  title: string;
  doc_type: string;
  file_url?: string;
  extracted_summary?: string;
  biomarkers?: Biomarker[];
  raw_analysis?: any;
  test_date: string;
  created_at: string;
}

export interface MealLogRecord {
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

export interface WearableDeviceState {
  connected: boolean;
  brand: string;
  device_name: string;
  battery_level: number;
  last_synced: string;
  sync_mode: string;
}

export interface ProfileRecord {
  person_name: PersonName;
  resting_hr_baseline: number;
  sleep_target_minutes: number;
  hydration_target_liters: number;
  recovery_baseline: number;
  blood_group: string;
  connected_wearable?: WearableDeviceState;
}

interface HealthDatabaseState {
  profiles: Record<PersonName, ProfileRecord>;
  vitals: VitalsRecord[];
  goals: GoalRecord[];
  trainingSessions: TrainingSessionRecord[];
  events: SportsEventRecord[];
  journals: JournalRecord[];
  documents: DocumentRecord[];
  meals: MealLogRecord[];
}

// Consistent data directory location
const ROOT_DIR = fs.existsSync(path.resolve(process.cwd(), 'backend'))
  ? path.resolve(process.cwd(), 'backend')
  : process.cwd();
const DATA_DIR = path.resolve(ROOT_DIR, 'data');
const DATA_FILE = path.join(DATA_DIR, 'health.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDefaultHealthData(): HealthDatabaseState {
  const now = new Date().toISOString();

  return {
    profiles: {
      Self: {
        person_name: 'Self',
        resting_hr_baseline: 0,
        sleep_target_minutes: 480,
        hydration_target_liters: 3.0,
        recovery_baseline: 0,
        blood_group: 'O+',
        connected_wearable: {
          connected: false,
          brand: 'None',
          device_name: 'No Watch Connected',
          battery_level: 0,
          last_synced: 'Never',
          sync_mode: 'Disconnected',
        },
      },
      Neha: {
        person_name: 'Neha',
        resting_hr_baseline: 0,
        sleep_target_minutes: 480,
        hydration_target_liters: 2.5,
        recovery_baseline: 0,
        blood_group: 'B+',
        connected_wearable: {
          connected: false,
          brand: 'None',
          device_name: 'No Watch Connected',
          battery_level: 0,
          last_synced: 'Never',
          sync_mode: 'Disconnected',
        },
      },
      Prayan: {
        person_name: 'Prayan',
        resting_hr_baseline: 0,
        sleep_target_minutes: 540,
        hydration_target_liters: 2.0,
        recovery_baseline: 0,
        blood_group: 'O+',
        connected_wearable: {
          connected: false,
          brand: 'None',
          device_name: 'No Watch Connected',
          battery_level: 0,
          last_synced: 'Never',
          sync_mode: 'Disconnected',
        },
      },
    },
    vitals: [],
    goals: [
      {
        id: 'g1',
        user_id: '00000000-0000-0000-0000-000000000000',
        name: 'Marathon 42.2 km',
        date: '12-Week Target',
        category: 'Marathon build',
        progress: 0,
        target_metric: '42.195 km',
        current_metric: '0 km',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ],
    trainingSessions: [
      {
        id: 'ts-1',
        user_id: '00000000-0000-0000-0000-000000000000',
        week_number: 1,
        day_name: 'Mon',
        workout: 'Easy Aerobic Base Run',
        distance: '5 km @ easy conversational pace',
        status: 'upcoming',
        scheduled_time: '06:30',
        intensity: 'Low',
        synced_to_calendar: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'ts-2',
        user_id: '00000000-0000-0000-0000-000000000000',
        week_number: 1,
        day_name: 'Tue',
        workout: 'Strength & Core Conditioning',
        distance: '40 mins bodyweight & stability',
        status: 'upcoming',
        scheduled_time: '07:00',
        intensity: 'Moderate',
        synced_to_calendar: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'ts-3',
        user_id: '00000000-0000-0000-0000-000000000000',
        week_number: 1,
        day_name: 'Wed',
        workout: 'Interval Cadence Building',
        distance: '6 km (5x800m fast strides)',
        status: 'today',
        scheduled_time: '06:30',
        intensity: 'High',
        synced_to_calendar: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'ts-4',
        user_id: '00000000-0000-0000-0000-000000000000',
        week_number: 1,
        day_name: 'Thu',
        workout: 'Rest & Active Mobility',
        distance: 'Stretching & foam rolling',
        status: 'upcoming',
        scheduled_time: '07:30',
        intensity: 'Recovery',
        synced_to_calendar: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'ts-5',
        user_id: '00000000-0000-0000-0000-000000000000',
        week_number: 1,
        day_name: 'Fri',
        workout: 'Aerobic Foundation Run',
        distance: '6 km @ steady aerobic pace',
        status: 'upcoming',
        scheduled_time: '06:30',
        intensity: 'Moderate',
        synced_to_calendar: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'ts-6',
        user_id: '00000000-0000-0000-0000-000000000000',
        week_number: 1,
        day_name: 'Sat',
        workout: 'Long Endurance Run',
        distance: '12 km continuous endurance',
        status: 'upcoming',
        scheduled_time: '06:00',
        intensity: 'High Endurance',
        synced_to_calendar: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'ts-7',
        user_id: '00000000-0000-0000-0000-000000000000',
        week_number: 1,
        day_name: 'Sun',
        workout: 'Gentle Walk & Recovery',
        distance: '45 mins light active recovery',
        status: 'upcoming',
        scheduled_time: '08:00',
        intensity: 'Low',
        synced_to_calendar: false,
        created_at: now,
        updated_at: now,
      },
    ],
    events: [],
    journals: [],
    documents: [],
    meals: [],
  };
}

function loadHealthDatabase(): HealthDatabaseState {
  ensureDataDir();
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && parsed.goals && parsed.trainingSessions) {
        if (!parsed.meals) parsed.meals = [];
        return parsed as HealthDatabaseState;
      }
    } catch (e) {
      console.warn('Failed to parse health.json, recreating defaults:', e);
    }
  }

  const initial = getDefaultHealthData();
  saveHealthDatabase(initial);
  return initial;
}

function saveHealthDatabase(data: HealthDatabaseState) {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write health.json:', e);
  }
}

let db = loadHealthDatabase();

const isSupabaseConfigured = () =>
  env.SUPABASE_URL &&
  !env.SUPABASE_URL.includes('placeholder') &&
  env.SUPABASE_SERVICE_ROLE_KEY &&
  !env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder');

export const healthRepository = {
  // Profiles
  async getProfile(person: PersonName): Promise<ProfileRecord> {
    db = loadHealthDatabase();
    return db.profiles[person] || db.profiles['Self'];
  },

  async getAllProfiles(): Promise<ProfileRecord[]> {
    db = loadHealthDatabase();
    return Object.values(db.profiles);
  },

  // Today's Vitals
  async getLatestVitals(person: PersonName): Promise<VitalsRecord | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('health_vitals')
          .select('*')
          .eq('person_name', person)
          .order('log_date', { ascending: false })
          .limit(1)
          .single();
        if (!error && data) return data as VitalsRecord;
      } catch (err) {
        console.warn('Supabase vitals query failed, using local db fallback:', err);
      }
    }

    db = loadHealthDatabase();
    const vitals = db.vitals.filter((v) => v.person_name === person);
    return vitals[vitals.length - 1] || null;
  },

  async logVitals(input: LogVitalsInput): Promise<VitalsRecord> {
    const todayStr = new Date().toISOString().split('T')[0];
    const newRecord: VitalsRecord = {
      id: `vit-${Date.now()}`,
      person_name: input.person_name,
      log_date: todayStr,
      resting_hr: input.resting_hr ?? 52,
      sleep_duration_minutes: input.sleep_duration_minutes ?? 445,
      recovery_score: input.recovery_score ?? 88,
      steps_count: input.steps_count ?? 8000,
      hydration_liters: input.hydration_liters ?? 3.0,
      energy_level: input.energy_level || 'Good',
      source: input.source || 'Garmin Venu 2 Plus',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('health_vitals').insert(newRecord).select().single();
        if (!error && data) return data as VitalsRecord;
      } catch (err) {
        console.warn('Supabase logVitals failed, saving to local json:', err);
      }
    }

    db = loadHealthDatabase();
    // Replace or add today's entry
    const existingIdx = db.vitals.findIndex(
      (v) => v.person_name === input.person_name && v.log_date === todayStr
    );
    if (existingIdx >= 0) {
      db.vitals[existingIdx] = { ...db.vitals[existingIdx], ...newRecord };
    } else {
      db.vitals.push(newRecord);
    }
    saveHealthDatabase(db);
    return newRecord;
  },

  // Goals
  async getGoals(): Promise<GoalRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('health_goals')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true });
        if (!error && data) return data as GoalRecord[];
      } catch (err) {
        console.warn('Supabase goals failed, using local db:', err);
      }
    }

    db = loadHealthDatabase();
    return db.goals.filter((g) => g.is_active);
  },

  async createGoal(input: CreateGoalInput): Promise<GoalRecord> {
    const now = new Date().toISOString();
    const newGoal: GoalRecord = {
      id: `g-${Date.now()}`,
      user_id: '00000000-0000-0000-0000-000000000000',
      name: input.name,
      date: input.date,
      category: input.category,
      progress: input.progress,
      target_metric: input.target_metric,
      current_metric: input.current_metric,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('health_goals').insert(newGoal).select().single();
        if (!error && data) return data as GoalRecord;
      } catch (err) {
        console.warn('Supabase createGoal failed, fallback:', err);
      }
    }

    db = loadHealthDatabase();
    db.goals.push(newGoal);
    saveHealthDatabase(db);
    return newGoal;
  },

  async updateGoal(id: string, input: UpdateGoalInput): Promise<GoalRecord | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('health_goals')
          .update({ ...input, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as GoalRecord;
      } catch (err) {
        console.warn('Supabase updateGoal failed, fallback:', err);
      }
    }

    db = loadHealthDatabase();
    const idx = db.goals.findIndex((g) => g.id === id);
    if (idx === -1) return null;

    db.goals[idx] = {
      ...db.goals[idx],
      ...input,
      updated_at: new Date().toISOString(),
    };
    saveHealthDatabase(db);
    return db.goals[idx];
  },

  async deleteGoal(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('health_goals').update({ is_active: false }).eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase deleteGoal failed, fallback:', err);
      }
    }

    db = loadHealthDatabase();
    const idx = db.goals.findIndex((g) => g.id === id);
    if (idx === -1) return false;
    db.goals[idx].is_active = false;
    saveHealthDatabase(db);
    return true;
  },

  // Training Sessions
  async getTrainingSessions(week?: number): Promise<TrainingSessionRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('health_training_sessions').select('*');
        if (week) query = query.eq('week_number', week);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data as TrainingSessionRecord[];
      } catch (err) {
        console.warn('Supabase training sessions failed, fallback:', err);
      }
    }

    db = loadHealthDatabase();
    if (week) {
      const filtered = db.trainingSessions.filter((s) => s.week_number === week);
      if (filtered.length > 0) return filtered;
    }
    return db.trainingSessions;
  },

  async updateTrainingSession(id: string, input: UpdateTrainingSessionInput): Promise<TrainingSessionRecord | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('health_training_sessions')
          .update({ ...input, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as TrainingSessionRecord;
      } catch (err) {
        console.warn('Supabase update session failed, fallback:', err);
      }
    }

    db = loadHealthDatabase();
    const idx = db.trainingSessions.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    db.trainingSessions[idx] = {
      ...db.trainingSessions[idx],
      ...input,
      updated_at: new Date().toISOString(),
    };
    saveHealthDatabase(db);
    return db.trainingSessions[idx];
  },

  // Sports Events
  async getSportsEvents(): Promise<SportsEventRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('health_sports_events').select('*');
        if (!error && data) return data as SportsEventRecord[];
      } catch (err) {
        console.warn('Supabase events failed, fallback:', err);
      }
    }

    db = loadHealthDatabase();
    return db.events;
  },

  async createSportsEvent(input: CreateEventInput): Promise<SportsEventRecord> {
    const newEvent: SportsEventRecord = {
      id: `se-${Date.now()}`,
      user_id: '00000000-0000-0000-0000-000000000000',
      name: input.name,
      sport: input.sport,
      region: input.region,
      date: input.date,
      registered: input.registered,
      target_time: input.target_time,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('health_sports_events').insert(newEvent).select().single();
        if (!error && data) return data as SportsEventRecord;
      } catch (err) {
        console.warn('Supabase createEvent failed, fallback:', err);
      }
    }

    db = loadHealthDatabase();
    db.events.push(newEvent);
    saveHealthDatabase(db);
    return newEvent;
  },

  // Journals
  async getJournals(person: PersonName): Promise<JournalRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('health_journals')
          .select('*')
          .eq('person_name', person)
          .order('created_at', { ascending: false });
        if (!error && data) return data as JournalRecord[];
      } catch (err) {
        console.warn('Supabase journals failed, fallback:', err);
      }
    }

    db = loadHealthDatabase();
    return db.journals
      .filter((j) => j.person_name === person)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async saveJournal(input: SaveJournalInput, aiReflection?: string): Promise<JournalRecord> {
    const newJournal: JournalRecord = {
      id: `j-${Date.now()}`,
      person_name: input.person_name,
      date: 'Today',
      text: input.text,
      energy_level: input.energy_level,
      soreness_level: input.soreness_level,
      ai_coach_reflection: aiReflection,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('health_journals').insert(newJournal).select().single();
        if (!error && data) return data as JournalRecord;
      } catch (err) {
        console.warn('Supabase saveJournal failed, fallback:', err);
      }
    }

    db = loadHealthDatabase();
    db.journals.unshift(newJournal);
    saveHealthDatabase(db);
    return newJournal;
  },

  // Documents / Lab Reports
  async getDocuments(person: PersonName): Promise<DocumentRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('health_documents')
          .select('*')
          .eq('person_name', person)
          .order('created_at', { ascending: false });
        if (!error && data) return data as DocumentRecord[];
      } catch (err) {
        console.warn('Supabase documents failed, fallback:', err);
      }
    }

    db = loadHealthDatabase();
    return db.documents.filter((d) => d.person_name === person);
  },

  async saveDocument(input: UploadDocumentInput): Promise<DocumentRecord> {
    const newDoc: DocumentRecord = {
      id: `doc-${Date.now()}`,
      person_name: input.person_name,
      title: input.title,
      doc_type: input.doc_type,
      file_url: input.file_url || 'https://storage.nryn.internal/reports/uploaded_report.pdf',
      extracted_summary: input.extracted_summary || 'Document uploaded and indexed successfully into health memory.',
      test_date: input.test_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('health_documents').insert(newDoc).select().single();
        if (!error && data) return data as DocumentRecord;
      } catch (err) {
        console.warn('Supabase saveDocument failed, fallback:', err);
      }
    }

    db = loadHealthDatabase();
    db.documents.unshift(newDoc);
    saveHealthDatabase(db);
    return newDoc;
  },

  async saveDocumentWithBiomarkers(doc: Omit<DocumentRecord, 'id' | 'created_at'>): Promise<DocumentRecord> {
    const newDoc: DocumentRecord = {
      id: `doc-${Date.now()}`,
      ...doc,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('health_documents').insert(newDoc).select().single();
        if (!error && data) return data as DocumentRecord;
      } catch (err) {
        console.warn('Supabase saveDocumentWithBiomarkers failed, fallback:', err);
      }
    }

    db = loadHealthDatabase();
    db.documents.unshift(newDoc);
    saveHealthDatabase(db);
    return newDoc;
  },

  // Nutrition / Smart Plate Meal Logs
  async getMealLogs(person: PersonName): Promise<MealLogRecord[]> {
    db = loadHealthDatabase();
    if (!db.meals) db.meals = [];
    return db.meals.filter((m) => m.person_name === person);
  },

  async saveMealLog(meal: Omit<MealLogRecord, 'id'>): Promise<MealLogRecord> {
    const newMeal: MealLogRecord = {
      id: `meal-${Date.now()}`,
      ...meal,
    };

    db = loadHealthDatabase();
    if (!db.meals) db.meals = [];
    db.meals.unshift(newMeal);
    saveHealthDatabase(db);
    return newMeal;
  },

  // Wearable Device Connection & Pairing Management
  getWearable(person: PersonName): WearableDeviceState {
    db = loadHealthDatabase();
    const profile = db.profiles?.[person];
    if (profile?.connected_wearable) {
      return profile.connected_wearable;
    }
    return {
      connected: false,
      brand: 'None',
      device_name: 'No Watch Connected',
      battery_level: 0,
      last_synced: 'Never',
      sync_mode: 'Disconnected',
    };
  },

  async connectWearable(
    person: PersonName,
    data: { brand: string; device_name: string; connection_type: string; battery_level?: number }
  ): Promise<WearableDeviceState> {
    db = loadHealthDatabase();
    if (!db.profiles) db.profiles = {} as any;
    if (!db.profiles[person]) {
      db.profiles[person] = {
        person_name: person,
        resting_hr_baseline: 55,
        sleep_target_minutes: 480,
        hydration_target_liters: 3.0,
        recovery_baseline: 85,
        blood_group: 'O+',
      };
    }

    const modeLabel =
      data.connection_type === 'bluetooth_ble'
        ? 'Bluetooth BLE'
        : data.connection_type === 'health_connect'
        ? 'Google Health Connect'
        : data.connection_type === 'apple_health'
        ? 'Apple HealthKit'
        : 'Cloud Sync API';

    const wearable: WearableDeviceState = {
      connected: true,
      brand: data.brand || 'Smartwatch',
      device_name: data.device_name,
      battery_level: data.battery_level || Math.floor(Math.random() * 15) + 82, // 82% - 97%
      last_synced: 'Just now',
      sync_mode: `${modeLabel} (Active)`,
    };

    db.profiles[person].connected_wearable = wearable;
    saveHealthDatabase(db);
    return wearable;
  },

  async disconnectWearable(person: PersonName): Promise<WearableDeviceState> {
    db = loadHealthDatabase();
    const disconnected: WearableDeviceState = {
      connected: false,
      brand: 'None',
      device_name: 'No Watch Connected',
      battery_level: 0,
      last_synced: 'Never',
      sync_mode: 'Disconnected',
    };
    if (db.profiles?.[person]) {
      db.profiles[person].connected_wearable = disconnected;
      saveHealthDatabase(db);
    }
    return disconnected;
  },
};
