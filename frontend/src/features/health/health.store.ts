import { create } from 'zustand';
import {
  CoachSuggestion,
  DocumentItem,
  HealthGoal,
  HealthTab,
  JournalEntry,
  MealLog,
  PersonName,
  SportsEvent,
  TrainingDay,
  VitalsSummary,
  WearableStatus,
  WeeklyRhythmBar,
  TrackingSource,
  DiscoveredBleDevice,
} from './health.types';
import { HEALTH_GOALS, SPORTS_EVENTS, TRAINING_PLAN } from './health.mock';
import { healthApi } from './api/health.api';
import { useCalendarStore } from '../calendar/calendar.store';

interface HealthState {
  currentTab: HealthTab;
  selectedPerson: PersonName;
  isLoading: boolean;
  isRefreshing: boolean;
  isSyncingWearable: boolean;
  isAnalyzingReport: boolean;
  isAnalyzingMeal: boolean;
  error: string | null;

  vitals: VitalsSummary;
  weeklyRhythm: WeeklyRhythmBar[];
  coachSuggestion: CoachSuggestion;
  goals: HealthGoal[];
  plan: TrainingDay[];
  events: SportsEvent[];
  savedJournals: JournalEntry[];
  documents: DocumentItem[];
  meals: MealLog[];
  wearableStatus: WearableStatus;

  journalText: string;

  // Actions
  fetchDashboard: (person?: PersonName) => Promise<void>;
  refreshDashboard: () => Promise<void>;
  setTab: (tab: HealthTab) => void;
  setSelectedPerson: (person: PersonName) => void;
  setJournalText: (text: string) => void;
  saveJournal: () => Promise<void>;
  toggleTrainingStatus: (id: string) => Promise<void>;
  syncWorkoutToCalendar: (workoutId?: string) => Promise<string>;
  updateGoalProgress: (id: string, newProgress: number) => Promise<void>;
  addGoal: (name: string, date: string, category: string) => Promise<void>;
  uploadDocument: (title: string, docType?: string) => Promise<void>;

  // Wearables & AI Multimodal Actions
  isConnectModalOpen: boolean;
  isPairingWearable: boolean;
  isScanningDevices: boolean;
  discoveredDevices: DiscoveredBleDevice[];

  openConnectModal: () => void;
  closeConnectModal: () => void;
  scanDevices: (brand?: string) => Promise<void>;
  pairAndConnectDevice: (
    brand: string,
    deviceName: string,
    connectionType?: 'bluetooth_ble' | 'health_connect' | 'apple_health' | 'cloud_sync'
  ) => Promise<string>;
  disconnectWearableDevice: () => Promise<string>;
  syncWearableData: () => Promise<string>;
  uploadAndAnalyzeReport: (
    file: { name: string; base64: string; mimeType: string },
    title?: string
  ) => Promise<DocumentItem>;
  scanAndAnalyzeMeal: (
    file: { name: string; base64: string; mimeType: string },
    mealTitle?: string
  ) => Promise<MealLog>;

  // Phone Sensors (No Watch Mode) State & Actions
  trackingSource: TrackingSource;
  phoneSteps: number;
  isMeasuringPulse: boolean;
  lastCameraBpm: number | null;
  isRecordingPhoneRun: boolean;

  setTrackingSource: (source: TrackingSource) => void;
  syncPhoneSteps: (addedSteps?: number) => Promise<string>;
  measureCameraPulse: (bpm: number) => Promise<string>;
  recordPhoneRun: (distance_km: number, duration_seconds: number, pace?: string) => Promise<string>;
}

export const useHealthStore = create<HealthState>((set, get) => ({
  currentTab: 'today',
  selectedPerson: 'Self',
  isLoading: false,
  isRefreshing: false,
  isSyncingWearable: false,
  isAnalyzingReport: false,
  isAnalyzingMeal: false,
  isConnectModalOpen: false,
  isPairingWearable: false,
  isScanningDevices: false,
  discoveredDevices: [],
  error: null,

  vitals: {
    resting_hr: 0,
    sleep_duration_minutes: 0,
    recovery_score: 0,
    steps_count: 0,
    hydration_liters: 0,
    energy_level: 'Pending Data',
    source: 'No Telemetry Yet',
  },
  weeklyRhythm: [
    { day: 'M', load: 0 },
    { day: 'T', load: 0 },
    { day: 'W', load: 0 },
    { day: 'T', load: 0 },
    { day: 'F', load: 0 },
    { day: 'S', load: 0 },
    { day: 'S', load: 0 },
  ],
  coachSuggestion: {
    title: 'Awaiting Health Signals',
    description: 'Record steps, measure pulse with camera, or pair your watch to calculate training readiness.',
    category: 'READINESS STATUS',
  },
  goals: HEALTH_GOALS,
  plan: TRAINING_PLAN,
  events: SPORTS_EVENTS,
  savedJournals: [],
  documents: [],
  meals: [],
  wearableStatus: {
    connected: false,
    brand: 'None',
    device_name: 'No Watch Connected',
    battery_level: 0,
    last_synced: 'Never',
    sync_mode: 'Disconnected',
  },
  trackingSource: 'watch',
  phoneSteps: 0,
  isMeasuringPulse: false,
  lastCameraBpm: null,
  isRecordingPhoneRun: false,
  journalText: '',

  setTab: (tab) => set({ currentTab: tab }),
  setJournalText: (journalText) => set({ journalText }),

  setSelectedPerson: async (selectedPerson) => {
    set({ selectedPerson });
    await get().fetchDashboard(selectedPerson);
  },

  fetchDashboard: async (person) => {
    const targetPerson = person || get().selectedPerson;
    try {
      set({ isLoading: true, error: null });
      const data = await healthApi.getDashboard(targetPerson);
      set({
        vitals: data.vitals,
        weeklyRhythm: data.weeklyRhythm || get().weeklyRhythm,
        coachSuggestion: data.coachSuggestion,
        goals: data.goals?.length ? data.goals : get().goals,
        plan: data.trainingSessions?.length ? data.trainingSessions : get().plan,
        events: data.events || [],
        savedJournals: data.journals || [],
        documents: data.documents || [],
        meals: data.meals || [],
        wearableStatus: data.wearableStatus || get().wearableStatus,
        isLoading: false,
      });
    } catch (err: any) {
      console.warn('Could not load remote health dashboard, using local store data:', err.message);
      set({ isLoading: false });
    }
  },

  refreshDashboard: async () => {
    try {
      set({ isRefreshing: true, error: null });
      const data = await healthApi.getDashboard(get().selectedPerson);
      set({
        vitals: data.vitals,
        weeklyRhythm: data.weeklyRhythm || get().weeklyRhythm,
        coachSuggestion: data.coachSuggestion,
        goals: data.goals?.length ? data.goals : get().goals,
        plan: data.trainingSessions?.length ? data.trainingSessions : get().plan,
        events: data.events || [],
        savedJournals: data.journals || [],
        documents: data.documents || [],
        meals: data.meals || [],
        wearableStatus: data.wearableStatus || get().wearableStatus,
        isRefreshing: false,
      });
    } catch (err: any) {
      set({ isRefreshing: false });
    }
  },

  // Wearables Connection & Pairing Actions
  openConnectModal: () => {
    set({ isConnectModalOpen: true });
    get().scanDevices();
  },

  closeConnectModal: () => set({ isConnectModalOpen: false }),

  scanDevices: async (brand) => {
    set({ isScanningDevices: true });
    try {
      const list = await healthApi.scanNearbyDevices(brand);
      set({ discoveredDevices: list, isScanningDevices: false });
    } catch (e) {
      set({ isScanningDevices: false });
    }
  },

  pairAndConnectDevice: async (brand, deviceName, connectionType = 'bluetooth_ble') => {
    const { selectedPerson } = get();
    set({ isPairingWearable: true });
    try {
      const res = await healthApi.connectWearable({
        person_name: selectedPerson,
        brand,
        device_name: deviceName,
        connection_type: connectionType,
      });

      set({
        wearableStatus: res.wearable,
        vitals: res.vitals,
        isPairingWearable: false,
        isConnectModalOpen: false,
      });
      return res.message;
    } catch (err: any) {
      set({ isPairingWearable: false });
      throw err;
    }
  },

  disconnectWearableDevice: async () => {
    const { selectedPerson } = get();
    try {
      const res = await healthApi.disconnectWearable(selectedPerson);
      set({ wearableStatus: res.wearable });
      return res.message;
    } catch (err: any) {
      throw err;
    }
  },

  // Wearables Real-time Ingestion Sync
  syncWearableData: async () => {
    const { selectedPerson, wearableStatus } = get();
    set({ isSyncingWearable: true });
    try {
      const sourceName = wearableStatus.connected ? wearableStatus.device_name : 'Smartwatch';
      const res = await healthApi.syncWearables({
        person_name: selectedPerson,
        source: sourceName,
        simulate_active_run: true,
      });

      set((state) => ({
        vitals: res.vitals,
        wearableStatus: {
          ...state.wearableStatus,
          last_synced: 'Just now',
          battery_level: Math.max(10, state.wearableStatus.battery_level - 1),
        },
        plan: res.updatedSession
          ? state.plan.map((s) => (s.id === res.updatedSession.id ? res.updatedSession : s))
          : state.plan,
        isSyncingWearable: false,
      }));

      return res.message;
    } catch (err: any) {
      set({ isSyncingWearable: false });
      throw err;
    }
  },

  // Lab Report Real Upload & Multimodal AI Analysis
  uploadAndAnalyzeReport: async (file, title) => {
    const { selectedPerson, documents } = get();
    set({ isAnalyzingReport: true });
    try {
      const doc = await healthApi.analyzeLabReport({
        person_name: selectedPerson,
        title: title || file.name || 'Medical Diagnostic Report',
        file_name: file.name,
        file_base64: file.base64,
        mime_type: file.mimeType,
      });

      set({
        documents: [doc, ...documents],
        isAnalyzingReport: false,
      });
      return doc;
    } catch (err: any) {
      set({ isAnalyzingReport: false });
      throw err;
    }
  },

  // Food Photo Real Snap & Multimodal AI Analysis
  scanAndAnalyzeMeal: async (file, mealTitle) => {
    const { selectedPerson, meals } = get();
    set({ isAnalyzingMeal: true });
    try {
      const meal = await healthApi.analyzeMealPlate({
        person_name: selectedPerson,
        meal_title: mealTitle || 'Fresh Meal Plate',
        image_base64: file.base64,
        mime_type: file.mimeType,
      });

      set({
        meals: [meal, ...meals],
        isAnalyzingMeal: false,
      });
      return meal;
    } catch (err: any) {
      set({ isAnalyzingMeal: false });
      throw err;
    }
  },

  saveJournal: async () => {
    const { journalText, savedJournals, selectedPerson } = get();
    const trimmed = journalText.trim();
    if (!trimmed) return;

    const tempEntry: JournalEntry = {
      id: `local-${Date.now()}`,
      date: 'Today',
      text: trimmed,
      ai_coach_reflection: 'Analyzing recovery signals...',
    };

    set({
      savedJournals: [tempEntry, ...savedJournals],
      journalText: '',
    });

    try {
      const saved = await healthApi.saveJournal({
        person_name: selectedPerson,
        text: trimmed,
      });
      set((state) => ({
        savedJournals: state.savedJournals.map((j) =>
          j.id === tempEntry.id ? { ...saved, date: 'Today' } : j
        ),
      }));
    } catch (err: any) {
      console.warn('Failed to sync journal to backend:', err);
    }
  },

  toggleTrainingStatus: async (id: string) => {
    const { plan } = get();
    const sessionIndex = plan.findIndex((s) => s.id === id || s.day === id);
    if (sessionIndex === -1) return;

    const current = plan[sessionIndex];
    const nextStatus: 'completed' | 'today' | 'upcoming' =
      current.status === 'completed'
        ? 'upcoming'
        : current.status === 'today'
        ? 'completed'
        : 'today';

    const updatedPlan = [...plan];
    updatedPlan[sessionIndex] = { ...current, status: nextStatus };
    set({ plan: updatedPlan });

    if (current.id) {
      try {
        await healthApi.updateTrainingSession(current.id, { status: nextStatus });
      } catch (e) {
        console.warn('Failed to update session status on backend:', e);
      }
    }
  },

  syncWorkoutToCalendar: async (workoutId) => {
    const { plan, coachSuggestion } = get();
    const session = workoutId
      ? plan.find((s) => s.id === workoutId)
      : plan.find((s) => s.status === 'today') || plan[0];

    const title = session?.workout || coachSuggestion.title;
    const distance = session?.distance || '8 km interval session';

    useCalendarStore.getState().addEvent({
      title,
      subtitle: `${distance} · Marathon 12-wk build`,
      start: session?.scheduled_time || '07:00',
      end: '08:00',
      cat: 'green',
      kind: 'health',
      detail: 'Added from Health module Coach suggestion',
    });

    if (session?.id) {
      try {
        await healthApi.syncSessionToCalendar(session.id);
      } catch (e) {
        console.warn('Backend sync session failed:', e);
      }
    }

    return title;
  },

  updateGoalProgress: async (id: string, newProgress: number) => {
    const clamped = Math.max(0, Math.min(100, newProgress));
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, progress: clamped } : g)),
    }));

    try {
      await healthApi.updateGoal(id, { progress: clamped });
    } catch (e) {
      console.warn('Failed to update goal progress on server:', e);
    }
  },

  addGoal: async (name: string, date: string, category: string) => {
    const tempId = `g-temp-${Date.now()}`;
    const newGoal: HealthGoal = {
      id: tempId,
      name,
      date,
      category,
      progress: 0,
    };

    set((state) => ({ goals: [...state.goals, newGoal] }));

    try {
      const created = await healthApi.createGoal({
        name,
        date,
        category,
        progress: 0,
      });
      set((state) => ({
        goals: state.goals.map((g) => (g.id === tempId ? created : g)),
      }));
    } catch (e) {
      console.warn('Failed to create goal on server:', e);
    }
  },

  uploadDocument: async (title: string, docType = 'Lab Report') => {
    const { selectedPerson } = get();
    const tempDoc: DocumentItem = {
      id: `doc-temp-${Date.now()}`,
      title,
      doc_type: docType,
      extracted_summary: 'Report uploaded and indexed into health memory.',
      test_date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    };

    set((state) => ({ documents: [tempDoc, ...state.documents] }));

    try {
      const created = await healthApi.uploadDocument({
        person_name: selectedPerson,
        title,
        doc_type: docType,
        extracted_summary: 'Report uploaded and indexed into health memory.',
      });
      set((state) => ({
        documents: state.documents.map((d) => (d.id === tempDoc.id ? created : d)),
      }));
    } catch (e) {
      console.warn('Failed to sync document to server:', e);
    }
  },

  // Phone Sensors Standalone Actions
  setTrackingSource: (trackingSource) => set({ trackingSource }),

  syncPhoneSteps: async (addedSteps = 1000) => {
    const { phoneSteps, selectedPerson } = get();
    const newTotal = phoneSteps + addedSteps;
    set({ phoneSteps: newTotal });
    try {
      const res = await healthApi.syncPhoneSteps(newTotal, selectedPerson);
      set((state) => ({ vitals: res.vitals }));
      return res.message;
    } catch (e: any) {
      return `Updated steps to ${newTotal.toLocaleString()}`;
    }
  },

  measureCameraPulse: async (bpm) => {
    const { selectedPerson } = get();
    set({ isMeasuringPulse: true });
    try {
      const res = await healthApi.measureCameraPulse(bpm, selectedPerson);
      set((state) => ({
        vitals: res.vitals,
        lastCameraBpm: bpm,
        isMeasuringPulse: false,
      }));
      return res.message;
    } catch (e) {
      set({ isMeasuringPulse: false });
      throw e;
    }
  },

  recordPhoneRun: async (distance_km, duration_seconds, pace = '5:10/km') => {
    const { selectedPerson } = get();
    set({ isRecordingPhoneRun: true });
    try {
      const res = await healthApi.recordPhoneRun(
        {
          distance_km,
          duration_seconds,
          pace,
        },
        selectedPerson
      );

      if (res.updatedSession) {
        set((state) => ({
          plan: state.plan.map((s) => (s.id === res.updatedSession.id ? res.updatedSession : s)),
        }));
      }

      useCalendarStore.getState().addEvent({
        title: 'Phone GPS Run',
        subtitle: `${res.run.distance} in ${res.run.duration} (${res.run.pace})`,
        start: '07:00',
        end: '07:45',
        cat: 'green',
        kind: 'health',
        detail: 'Recorded directly via Phone GPS motion tracker',
      });

      set({ isRecordingPhoneRun: false });
      return res.message;
    } catch (e) {
      set({ isRecordingPhoneRun: false });
      throw e;
    }
  },
}));
