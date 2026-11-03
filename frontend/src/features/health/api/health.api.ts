import { apiClient } from '../../../shared/api/client';
import {
  HealthDashboardData,
  HealthGoal,
  JournalEntry,
  PersonName,
  SportsEvent,
  TrainingDay,
  DocumentItem,
  VitalsSummary,
} from '../health.types';

export const healthApi = {
  async getDashboard(person: PersonName = 'Self'): Promise<HealthDashboardData> {
    const res = await apiClient.get('/health/dashboard', { params: { person } });
    const raw = res.data?.data;
    return {
      person: raw.person || person,
      vitals: raw.vitals || {
        resting_hr: 52,
        sleep_duration_minutes: 445,
        recovery_score: 88,
        steps_count: 8420,
        hydration_liters: 3.2,
      },
      weeklyRhythm: raw.weeklyRhythm || [],
      coachSuggestion: raw.coachSuggestion || {
        title: 'Tempo interval session',
        description: 'Recovery is optimal. Good day for training.',
        category: 'COACH SUGGESTION',
      },
      goals: raw.goals || [],
      trainingSessions: (raw.trainingSessions || []).map((s: any) => ({
        id: s.id,
        day: s.day_name || s.day,
        workout: s.workout,
        distance: s.distance,
        status: s.status,
        scheduled_time: s.scheduled_time,
        intensity: s.intensity,
        synced_to_calendar: s.synced_to_calendar,
      })),
      events: raw.events || [],
      journals: (raw.journals || []).map((j: any) => ({
        id: j.id,
        date: j.date || 'Today',
        text: j.text,
        energy_level: j.energy_level,
        soreness_level: j.soreness_level,
        ai_coach_reflection: j.ai_coach_reflection,
      })),
      documents: raw.documents || [],
    };
  },

  async logVitals(payload: Partial<VitalsSummary> & { person_name: PersonName }): Promise<any> {
    const res = await apiClient.post('/health/vitals', payload);
    return res.data?.data;
  },

  async getGoals(): Promise<HealthGoal[]> {
    const res = await apiClient.get('/health/goals');
    return res.data?.data || [];
  },

  async createGoal(payload: Omit<HealthGoal, 'id'>): Promise<HealthGoal> {
    const res = await apiClient.post('/health/goals', payload);
    return res.data?.data;
  },

  async updateGoal(id: string, payload: Partial<HealthGoal>): Promise<HealthGoal> {
    const res = await apiClient.put(`/health/goals/${id}`, payload);
    return res.data?.data;
  },

  async deleteGoal(id: string): Promise<void> {
    await apiClient.delete(`/health/goals/${id}`);
  },

  async getTrainingPlan(week = 4): Promise<TrainingDay[]> {
    const res = await apiClient.get('/health/training-plan', { params: { week } });
    return (res.data?.data || []).map((s: any) => ({
      id: s.id,
      day: s.day_name || s.day,
      workout: s.workout,
      distance: s.distance,
      status: s.status,
      scheduled_time: s.scheduled_time,
      intensity: s.intensity,
      synced_to_calendar: s.synced_to_calendar,
    }));
  },

  async updateTrainingSession(
    id: string,
    payload: { status?: string; notes?: string; synced_to_calendar?: boolean }
  ): Promise<any> {
    const res = await apiClient.patch(`/health/training-plan/sessions/${id}`, payload);
    return res.data?.data;
  },

  async syncSessionToCalendar(id: string): Promise<{ calendarEvent: any; message: string }> {
    const res = await apiClient.post(`/health/training-plan/sessions/${id}/sync-calendar`);
    return res.data?.data;
  },

  async getEvents(): Promise<SportsEvent[]> {
    const res = await apiClient.get('/health/events');
    return res.data?.data || [];
  },

  async createEvent(payload: Omit<SportsEvent, 'id'>): Promise<SportsEvent> {
    const res = await apiClient.post('/health/events', payload);
    return res.data?.data;
  },

  async getJournals(person: PersonName = 'Self'): Promise<JournalEntry[]> {
    const res = await apiClient.get('/health/journals', { params: { person } });
    return res.data?.data || [];
  },

  async saveJournal(payload: {
    person_name: PersonName;
    text: string;
    energy_level?: string;
    soreness_level?: string;
  }): Promise<JournalEntry> {
    const res = await apiClient.post('/health/journals', payload);
    return res.data?.data;
  },

  async getDocuments(person: PersonName = 'Self'): Promise<DocumentItem[]> {
    const res = await apiClient.get('/health/documents', { params: { person } });
    return res.data?.data || [];
  },

  async uploadDocument(payload: {
    person_name: PersonName;
    title: string;
    doc_type?: string;
    file_url?: string;
    extracted_summary?: string;
  }): Promise<DocumentItem> {
    const res = await apiClient.post('/health/documents', payload);
    return res.data?.data;
  },
};
