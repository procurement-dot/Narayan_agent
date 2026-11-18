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
  autoSyncCalendar: boolean;
  isSyncingAllCalendar: boolean;
  toggleAutoSyncCalendar: () => void;
  syncEntirePlanToCalendar: (silent?: boolean) => Promise<{ count: number; message: string }>;
  updateGoalProgress: (id: string, newProgress: number) => Promise<void>;
  addGoal: (name: string, date: string, category: string) => Promise<void>;
  selectTargetRace: (eventId: string) => Promise<string>;
  isSyncingEvents: boolean;
  eventsSource: string;
  syncLiveEvents: () => Promise<string>;
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
    connectionType?: 'bluetooth_ble' | 'health_connect' | 'apple_health' | 'cloud_sync',
    batteryLevel?: number
  ) => Promise<string>;
  disconnectWearableDevice: () => Promise<string>;
  syncWearableData: (options?: {
    heart_rate?: number;
    battery_level?: number;
    steps?: number;
    simulate_active_run?: boolean;
  }) => Promise<string>;
  uploadAndAnalyzeReport: (
    file: { name: string; base64: string; mimeType: string },
    title?: string
  ) => Promise<DocumentItem>;
  exchangeLabReport: (
    oldDocId: string,
    file: { name: string; base64: string; mimeType: string },
    title?: string
  ) => Promise<DocumentItem>;
  deleteDocument: (id: string) => Promise<void>;
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
  autoSyncCalendar: true,
  isSyncingAllCalendar: false,
  isSyncingEvents: false,
  eventsSource: 'IndiaRunning & Townscript',
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
      const sessions = data.trainingSessions?.length ? data.trainingSessions : get().plan;
      set({
        vitals: data.vitals,
        weeklyRhythm: data.weeklyRhythm || get().weeklyRhythm,
        coachSuggestion: data.coachSuggestion,
        goals: data.goals?.length ? data.goals : get().goals,
        plan: sessions,
        events: data.events?.length ? data.events : get().events,
        savedJournals: data.journals || [],
        documents: data.documents || [],
        meals: data.meals || [],
        wearableStatus: data.wearableStatus || get().wearableStatus,
        isLoading: false,
      });

      if (get().autoSyncCalendar) {
        const needsSync = sessions.some((s: any) => !s.synced_to_calendar);
        if (needsSync) {
          setTimeout(() => {
            get().syncEntirePlanToCalendar(true);
          }, 300);
        }
      }
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
        events: data.events?.length ? data.events : get().events,
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
  },

  closeConnectModal: () => set({ isConnectModalOpen: false }),

  scanDevices: async (_brand) => {
    // Only real devices detected via Web Bluetooth are set; do NOT load fake/dummy devices
    set({ isScanningDevices: false });
  },

  pairAndConnectDevice: async (brand, deviceName, connectionType = 'bluetooth_ble', batteryLevel?: number) => {
    const { selectedPerson } = get();
    set({ isPairingWearable: true });
    try {
      const res = await healthApi.connectWearable({
        person_name: selectedPerson,
        brand,
        device_name: deviceName,
        connection_type: connectionType,
        battery_level: batteryLevel,
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
  syncWearableData: async (options?: {
    heart_rate?: number;
    battery_level?: number;
    steps?: number;
    simulate_active_run?: boolean;
  }) => {
    const { selectedPerson, wearableStatus } = get();
    set({ isSyncingWearable: true });
    try {
      const sourceName = wearableStatus.connected ? wearableStatus.device_name : 'Smartwatch';
      const res = await healthApi.syncWearables({
        person_name: selectedPerson,
        source: sourceName,
        simulate_active_run: options?.simulate_active_run ?? false,
        heart_rate: options?.heart_rate,
        battery_level: options?.battery_level,
        steps: options?.steps,
      });

      set((state) => ({
        vitals: res.vitals,
        wearableStatus: {
          ...state.wearableStatus,
          last_synced: 'Just now',
          battery_level: options?.battery_level !== undefined ? options.battery_level : state.wearableStatus.battery_level,
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
        set((state) => ({
          plan: state.plan.map((s) => (s.id === session.id ? { ...s, synced_to_calendar: true } : s)),
        }));
      } catch (e) {
        console.warn('Backend sync session failed:', e);
      }
    }

    return title;
  },

  toggleAutoSyncCalendar: () => {
    const next = !get().autoSyncCalendar;
    set({ autoSyncCalendar: next });
    if (next) {
      get().syncEntirePlanToCalendar();
    }
  },

  syncEntirePlanToCalendar: async (silent = false) => {
    const { plan } = get();
    set({ isSyncingAllCalendar: true });

    // Calculate dates for Mon through Sun of the current week
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMon);

    const dayOffsets: Record<string, number> = {
      Mon: 0,
      Tue: 1,
      Wed: 2,
      Thu: 3,
      Fri: 4,
      Sat: 5,
      Sun: 6,
    };

    // Add each workout into useCalendarStore with exact dates
    const calendarStore = useCalendarStore.getState();
    for (const s of plan) {
      const offset = dayOffsets[s.day] ?? 0;
      const sessionDate = new Date(monday);
      sessionDate.setDate(monday.getDate() + offset);
      const dateStr = sessionDate.toISOString().split('T')[0];

      calendarStore.addEvent({
        title: s.workout,
        subtitle: `${s.distance} · 12-Wk Plan (${s.day})`,
        start: s.scheduled_time || '06:30',
        end: '07:30',
        date: dateStr,
        cat: 'green',
        kind: 'health',
        detail: `12-Week Endurance Training: ${s.workout} (${s.distance})`,
      });
    }

    try {
      const res = await healthApi.syncAllSessionsToCalendar();
      set((state) => ({
        plan: state.plan.map((s) => ({ ...s, synced_to_calendar: true })),
        isSyncingAllCalendar: false,
      }));
      return { count: res.syncedCount || plan.length, message: res.message };
    } catch (err: any) {
      console.warn('Backend sync all sessions notice:', err);
      set((state) => ({
        plan: state.plan.map((s) => ({ ...s, synced_to_calendar: true })),
        isSyncingAllCalendar: false,
      }));
      return { count: plan.length, message: 'All weekly workouts scheduled in calendar!' };
    }
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

  selectTargetRace: async (eventId: string) => {
    try {
      const res = await healthApi.selectTargetRace(eventId);
      set((state) => ({
        events: state.events.map((e) => ({
          ...e,
          registered: e.id === eventId,
        })),
        goals: state.goals.map((g) =>
          g.category.toLowerCase().includes('marathon') || g.is_active
            ? { ...g, name: res.event.name, date: res.event.date }
            : g
        ),
      }));

      // Auto-schedule race day into Calendar
      useCalendarStore.getState().addEvent({
        title: `🏁 ${res.event.name}`,
        subtitle: `${res.event.sport} · ${res.event.region}`,
        start: '05:30',
        end: '10:30',
        date: res.event.date,
        cat: 'green',
        kind: 'health',
        detail: `Official Target Race Day! Target finish: ${res.event.target_time || 'Sub 4:15 hrs'}`,
      });

      return res.message;
    } catch (err: any) {
      console.warn('Failed to lock in target race:', err);
      throw err;
    }
  },

  syncLiveEvents: async () => {
    set({ isSyncingEvents: true });
    try {
      const res = await healthApi.syncLiveEvents();
      if (res?.events && res.events.length > 0) {
        set({
          events: res.events,
          eventsSource: res.source || 'IndiaRunning & Townscript',
          isSyncingEvents: false,
        });
      } else {
        set({ isSyncingEvents: false });
      }
      return `Synced ${res?.count || res?.events?.length || 0} races from ${res?.source || 'IndiaRunning & Townscript'}!`;
    } catch (err: any) {
      set({ isSyncingEvents: false });
      console.warn('Failed to sync live events:', err);
      throw err;
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

  deleteDocument: async (id: string) => {
    set((state) => ({ documents: state.documents.filter((d) => d.id !== id) }));
    try {
      await healthApi.deleteDocument(id);
    } catch (e) {
      console.warn('Failed to delete document on server:', e);
    }
  },

  exchangeLabReport: async (oldDocId, file, title) => {
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
        documents: documents.map((d) => (d.id === oldDocId ? doc : d)),
        isAnalyzingReport: false,
      });

      try {
        await healthApi.deleteDocument(oldDocId);
      } catch (e) {
        // quiet fallback
      }

      return doc;
    } catch (err: any) {
      set({ isAnalyzingReport: false });
      throw err;
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
