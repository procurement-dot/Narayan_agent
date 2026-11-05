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

export interface DocumentRecord {
  id: string;
  person_name: PersonName;
  title: string;
  doc_type: string;
  file_url?: string;
  extracted_summary?: string;
  test_date: string;
  created_at: string;
}

export interface ProfileRecord {
  person_name: PersonName;
  resting_hr_baseline: number;
  sleep_target_minutes: number;
  hydration_target_liters: number;
  recovery_baseline: number;
  blood_group: string;
}

interface HealthDatabaseState {
  profiles: Record<PersonName, ProfileRecord>;
  vitals: VitalsRecord[];
  goals: GoalRecord[];
  trainingSessions: TrainingSessionRecord[];
  events: SportsEventRecord[];
  journals: JournalRecord[];
  documents: DocumentRecord[];
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
  const todayStr = new Date().toISOString().split('T')[0];

  return {
    profiles: {
      Self: {
        person_name: 'Self',
        resting_hr_baseline: 52,
        sleep_target_minutes: 450,
        hydration_target_liters: 3.2,
        recovery_baseline: 88,
        blood_group: 'O+',
      },
      Neha: {
        person_name: 'Neha',
        resting_hr_baseline: 64,
        sleep_target_minutes: 480,
        hydration_target_liters: 2.6,
        recovery_baseline: 92,
        blood_group: 'B+',
      },
      Prayan: {
        person_name: 'Prayan',
        resting_hr_baseline: 72,
        sleep_target_minutes: 540,
        hydration_target_liters: 2.2,
        recovery_baseline: 95,
        blood_group: 'O+',
      },
    },
    vitals: [
      {
        id: 'vit-1',
        person_name: 'Self',
        log_date: todayStr,
        resting_hr: 52,
        sleep_duration_minutes: 445, // 7h 25m
        recovery_score: 88,
        steps_count: 8420,
        hydration_liters: 3.2,
        energy_level: 'High',
        source: 'Garmin Venu 2 Plus',
        created_at: now,
      },
      {
        id: 'vit-2',
        person_name: 'Neha',
        log_date: todayStr,
        resting_hr: 63,
        sleep_duration_minutes: 465, // 7h 45m
        recovery_score: 91,
        steps_count: 6780,
        hydration_liters: 2.5,
        energy_level: 'Steady',
        source: 'Apple Health',
        created_at: now,
      },
      {
        id: 'vit-3',
        person_name: 'Prayan',
        log_date: todayStr,
        resting_hr: 70,
        sleep_duration_minutes: 540, // 9h 00m
        recovery_score: 96,
        steps_count: 10450,
        hydration_liters: 2.2,
        energy_level: 'Very Energetic',
        source: 'Kids Garmin Band',
        created_at: now,
      },
    ],
    goals: [
      {
        id: 'g1',
        user_id: '00000000-0000-0000-0000-000000000000',
        name: 'Marathon 42.2 km',
        date: '13 Dec 2026',
        category: '12-week build',
        progress: 72,
        target_metric: '42.195 km',
        current_metric: '32 km long run',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'g2',
        user_id: '00000000-0000-0000-0000-000000000000',
        name: 'Half marathon 1:45',
        date: 'Next target',
        category: 'Speed endurance',
        progress: 51,
        target_metric: '1h 45m',
        current_metric: '1h 52m',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'g3',
        user_id: '00000000-0000-0000-0000-000000000000',
        name: 'Swim technique',
        date: 'Weekly',
        category: 'Consistent practice',
        progress: 63,
        target_metric: '2000m continuous',
        current_metric: '1400m',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'g4',
        user_id: '00000000-0000-0000-0000-000000000000',
        name: 'Strength + mobility',
        date: '10 pull-ups · 100 push-ups',
        category: 'Build gradually',
        progress: 42,
        target_metric: '10 pull-ups',
        current_metric: '7 pull-ups',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ],
    trainingSessions: [
      {
        id: 'ts-1',
        user_id: '00000000-0000-0000-0000-000000000000',
        week_number: 4,
        day_name: 'Mon',
        workout: 'Easy Recovery Run',
        distance: '6 km @ 6:15/km',
        status: 'completed',
        scheduled_time: '06:30',
        intensity: 'Low',
        synced_to_calendar: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'ts-2',
        user_id: '00000000-0000-0000-0000-000000000000',
        week_number: 4,
        day_name: 'Tue',
        workout: 'Strength & Core',
        distance: '45 mins circuit',
        status: 'completed',
        scheduled_time: '07:00',
        intensity: 'Moderate',
        synced_to_calendar: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'ts-3',
        user_id: '00000000-0000-0000-0000-000000000000',
        week_number: 4,
        day_name: 'Wed',
        workout: 'Tempo Interval Session',
        distance: '8 km (4x1km @ 4:50)',
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
        week_number: 4,
        day_name: 'Thu',
        workout: 'Rest & Mobility',
        distance: 'Stretching & foam roller',
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
        week_number: 4,
        day_name: 'Fri',
        workout: 'Aerobic Base Run',
        distance: '7 km @ 6:00/km',
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
        week_number: 4,
        day_name: 'Sat',
        workout: 'Long Run',
        distance: '18 km progressive',
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
        week_number: 4,
        day_name: 'Sun',
        workout: 'Gentle Walk & Swim',
        distance: 'Active recovery',
        status: 'upcoming',
        scheduled_time: '08:00',
        intensity: 'Low',
        synced_to_calendar: false,
        created_at: now,
        updated_at: now,
      },
    ],
    events: [
      {
        id: 'se1',
        user_id: '00000000-0000-0000-0000-000000000000',
        name: 'Pune Half Marathon',
        sport: 'Running',
        region: 'Local',
        date: '08 DEC',
        registered: true,
        target_time: '1h 48m',
        created_at: now,
      },
      {
        id: 'se2',
        user_id: '00000000-0000-0000-0000-000000000000',
        name: 'Tata Mumbai Marathon',
        sport: 'Running',
        region: 'India',
        date: '17 JAN',
        registered: true,
        target_time: '3h 55m',
        created_at: now,
      },
      {
        id: 'se3',
        user_id: '00000000-0000-0000-0000-000000000000',
        name: 'Goa Ironman 70.3',
        sport: 'Triathlon',
        region: 'India',
        date: '08 FEB',
        registered: false,
        target_time: '5h 45m',
        created_at: now,
      },
      {
        id: 'se4',
        user_id: '00000000-0000-0000-0000-000000000000',
        name: 'Berlin Marathon',
        sport: 'Running',
        region: 'International',
        date: '27 SEP',
        registered: false,
        target_time: '3h 45m',
        created_at: now,
      },
    ],
    journals: [
      {
        id: 'j-1',
        person_name: 'Self',
        date: 'Yesterday',
        text: 'Legs felt fresh after the easy 6k. Good recovery sleep (7h 40m). Ready for intervals.',
        energy_level: 'High',
        soreness_level: 'None',
        ai_coach_reflection: 'Great base! Keep cadence light and hydrate well prior to high intensity tempo runs.',
        created_at: now,
      },
    ],
    documents: [
      {
        id: 'doc-1',
        person_name: 'Self',
        title: 'Annual Comprehensive Lab Panel (Lipid, HbA1c, Vit D)',
        doc_type: 'Blood Test',
        file_url: 'https://storage.nryn.internal/reports/annual-panel-2026.pdf',
        extracted_summary: 'All markers optimal. Resting glucose 88 mg/dL, HbA1c 5.2%, Vit D3 at 44 ng/mL. Cardiovascular profile excellent.',
        test_date: '18 Oct 2026',
        created_at: now,
      },
      {
        id: 'doc-2',
        person_name: 'Neha',
        title: 'Routine Health Check & CBC',
        doc_type: 'Lab Report',
        file_url: 'https://storage.nryn.internal/reports/neha-cbc-2026.pdf',
        extracted_summary: 'Hemoglobin 13.4 g/dL (optimal), Thyroid panel normal, Iron stores replenished.',
        test_date: '12 Sep 2026',
        created_at: now,
      },
      {
        id: 'doc-3',
        person_name: 'Prayan',
        title: 'Pediatric Growth & Vision Screening',
        doc_type: 'Pediatric Report',
        file_url: 'https://storage.nryn.internal/reports/prayan-screening.pdf',
        extracted_summary: 'Growth percentiles: 85th percentile height/weight. Vision 20/20. High athletic endurance.',
        test_date: '05 Aug 2026',
        created_at: now,
      },
    ],
  };
}

function loadHealthDatabase(): HealthDatabaseState {
  ensureDataDir();
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && parsed.goals && parsed.trainingSessions) {
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
  async getTrainingSessions(week = 4): Promise<TrainingSessionRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('health_training_sessions')
          .select('*')
          .eq('week_number', week);
        if (!error && data) return data as TrainingSessionRecord[];
      } catch (err) {
        console.warn('Supabase training sessions failed, fallback:', err);
      }
    }

    db = loadHealthDatabase();
    return db.trainingSessions.filter((s) => s.week_number === week);
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
};
