import { create } from 'zustand';
import {
  CoachSuggestion,
  DocumentItem,
  HealthGoal,
  HealthTab,
  JournalEntry,
  PersonName,
  SportsEvent,
  TrainingDay,
  VitalsSummary,
  WeeklyRhythmBar,
} from './health.types';
import { HEALTH_GOALS, SPORTS_EVENTS, TRAINING_PLAN } from './health.mock';
import { healthApi } from './api/health.api';
import { useCalendarStore } from '../calendar/calendar.store';

interface HealthState {
  currentTab: HealthTab;
  selectedPerson: PersonName;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  vitals: VitalsSummary;
  weeklyRhythm: WeeklyRhythmBar[];
  coachSuggestion: CoachSuggestion;
  goals: HealthGoal[];
  plan: TrainingDay[];
  events: SportsEvent[];
  savedJournals: JournalEntry[];
  documents: DocumentItem[];

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
}

export const useHealthStore = create<HealthState>((set, get) => ({
  currentTab: 'today',
  selectedPerson: 'Self',
  isLoading: false,
  isRefreshing: false,
  error: null,

  vitals: {
    resting_hr: 52,
    sleep_duration_minutes: 445,
    recovery_score: 88,
    steps_count: 8420,
    hydration_liters: 3.2,
    energy_level: 'High',
    source: 'Garmin Venu 2 Plus',
  },
  weeklyRhythm: [
    { day: 'M', load: 55 },
    { day: 'T', load: 68 },
    { day: 'W', load: 85 },
    { day: 'T', load: 45 },
    { day: 'F', load: 70 },
    { day: 'S', load: 92 },
    { day: 'S', load: 40 },
  ],
  coachSuggestion: {
    title: 'Tempo interval session',
    description: 'Recovery is optimal. Good day for 8 km including 4 × 1 km at 4:50/km pace.',
    category: 'COACH SUGGESTION',
  },
  goals: HEALTH_GOALS,
  plan: TRAINING_PLAN,
  events: SPORTS_EVENTS,
  savedJournals: [
    {
      id: 'init-j1',
      date: 'Yesterday',
      text: 'Legs felt fresh after the easy 6k. Good recovery sleep (7h 40m). Ready for intervals.',
      ai_coach_reflection: 'Great base! Keep cadence light and hydrate well prior to high intensity tempo runs.',
    },
  ],
  documents: [
    {
      id: 'doc-init',
      title: 'Annual Comprehensive Lab Panel (Lipid, HbA1c, Vit D)',
      doc_type: 'Blood Test',
      file_url: 'https://storage.nryn.internal/reports/annual-panel-2026.pdf',
      extracted_summary: 'All markers optimal. Resting glucose 88 mg/dL, HbA1c 5.2%, Vit D3 at 44 ng/mL.',
      test_date: '18 Oct 2026',
    },
  ],
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
        weeklyRhythm: data.weeklyRhythm.length > 0 ? data.weeklyRhythm : get().weeklyRhythm,
        coachSuggestion: data.coachSuggestion,
        goals: data.goals.length > 0 ? data.goals : get().goals,
        plan: data.trainingSessions.length > 0 ? data.trainingSessions : get().plan,
        events: data.events.length > 0 ? data.events : get().events,
        savedJournals: data.journals.length > 0 ? data.journals : get().savedJournals,
        documents: data.documents.length > 0 ? data.documents : get().documents,
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
        weeklyRhythm: data.weeklyRhythm.length > 0 ? data.weeklyRhythm : get().weeklyRhythm,
        coachSuggestion: data.coachSuggestion,
        goals: data.goals.length > 0 ? data.goals : get().goals,
        plan: data.trainingSessions.length > 0 ? data.trainingSessions : get().plan,
        events: data.events.length > 0 ? data.events : get().events,
        savedJournals: data.journals.length > 0 ? data.journals : get().savedJournals,
        documents: data.documents.length > 0 ? data.documents : get().documents,
        isRefreshing: false,
      });
    } catch (err: any) {
      set({ isRefreshing: false });
    }
  },

  saveJournal: async () => {
    const { journalText, savedJournals, selectedPerson } = get();
    const trimmed = journalText.trim();
    if (!trimmed) return;

    // Optimistic entry
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
      // Update with server entry and AI insight
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

    // 1. Cross-module Calendar Store Integration
    useCalendarStore.getState().addEvent({
      title,
      subtitle: `${distance} · Marathon 12-wk build`,
      start: session?.scheduled_time || '07:00',
      end: '08:00',
      cat: 'green',
      kind: 'health',
      detail: 'Added from Health module Coach suggestion',
    });

    // 2. Sync to Backend
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
}));
