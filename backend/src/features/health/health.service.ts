import { healthRepository } from './health.repository.js';
import {
  CreateEventInput,
  CreateGoalInput,
  CreateTrainingSessionInput,
  LogVitalsInput,
  PersonName,
  SaveJournalInput,
  UpdateGoalInput,
  UpdateTrainingSessionInput,
  UploadDocumentInput,
} from './health.dto.js';

export const healthService = {
  async getDashboard(person: PersonName = 'Self') {
    const [profile, vitals, goals, trainingSessions, events, journals, documents] = await Promise.all([
      healthRepository.getProfile(person),
      healthRepository.getLatestVitals(person),
      healthRepository.getGoals(),
      healthRepository.getTrainingSessions(4),
      healthRepository.getSportsEvents(),
      healthRepository.getJournals(person),
      healthRepository.getDocuments(person),
    ]);

    const recoveryScore = vitals?.recovery_score ?? profile.recovery_baseline ?? 85;

    // AI Coach Suggestion based on Recovery & Fatigue
    let coachSuggestion = {
      title: 'Tempo interval session',
      description: 'Recovery is optimal. Good day for 8 km including 4 × 1 km at 4:50/km pace.',
      category: 'COACH SUGGESTION',
      recommendedWorkoutId: trainingSessions.find((s) => s.status === 'today')?.id || trainingSessions[2]?.id,
    };

    if (recoveryScore < 60) {
      coachSuggestion = {
        title: 'Rest & Mobility Session',
        description: 'Recovery is suppressed. Shift priority to gentle mobility, foam rolling, and 8+ hours sleep tonight.',
        category: 'RECOVERY EMPHASIS',
        recommendedWorkoutId: trainingSessions.find((s) => s.day_name === 'Thu')?.id || trainingSessions[3]?.id,
      };
    } else if (recoveryScore < 78) {
      coachSuggestion = {
        title: 'Aerobic Base Maintenance',
        description: 'Moderate recovery profile. Keep heart rate in Zone 2 with a comfortable 6 km aerobic run.',
        category: 'AEROBIC BASE',
        recommendedWorkoutId: trainingSessions.find((s) => s.day_name === 'Fri')?.id || trainingSessions[4]?.id,
      };
    }

    // 7-day load rhythm
    const weeklyRhythm = [
      { day: 'M', load: 55 },
      { day: 'T', load: 68 },
      { day: 'W', load: 85 },
      { day: 'T', load: 45 },
      { day: 'F', load: 70 },
      { day: 'S', load: 92 },
      { day: 'S', load: 40 },
    ];

    return {
      person,
      profile,
      vitals: vitals || {
        resting_hr: profile.resting_hr_baseline,
        sleep_duration_minutes: profile.sleep_target_minutes,
        recovery_score: profile.recovery_baseline,
        steps_count: 8000,
        hydration_liters: profile.hydration_target_liters,
        energy_level: 'Optimal',
        source: 'Garmin Venu 2 Plus',
      },
      weeklyRhythm,
      coachSuggestion,
      goals,
      trainingSessions,
      events,
      journals,
      documents,
    };
  },

  async logVitals(input: LogVitalsInput) {
    return healthRepository.logVitals(input);
  },

  // Goals
  async listGoals() {
    return healthRepository.getGoals();
  },

  async createGoal(input: CreateGoalInput) {
    return healthRepository.createGoal(input);
  },

  async updateGoal(id: string, input: UpdateGoalInput) {
    const updated = await healthRepository.updateGoal(id, input);
    if (!updated) throw new Error(`Goal with id ${id} not found`);
    return updated;
  },

  async deleteGoal(id: string) {
    const deleted = await healthRepository.deleteGoal(id);
    if (!deleted) throw new Error(`Goal with id ${id} not found`);
    return { success: true, message: 'Goal removed successfully' };
  },

  // Training Sessions
  async getTrainingPlan(week = 4) {
    return healthRepository.getTrainingSessions(week);
  },

  async updateTrainingSession(id: string, input: UpdateTrainingSessionInput) {
    const updated = await healthRepository.updateTrainingSession(id, input);
    if (!updated) throw new Error(`Training session with id ${id} not found`);
    return updated;
  },

  async syncSessionToCalendar(id: string) {
    const sessions = await healthRepository.getTrainingSessions(4);
    const session = sessions.find((s) => s.id === id);
    if (!session) throw new Error(`Training session ${id} not found`);

    // Mark as synced
    const updated = await healthRepository.updateTrainingSession(id, {
      synced_to_calendar: true,
    });

    // Provide calendar event payload
    return {
      session: updated,
      calendarEvent: {
        id: `cal-workout-${session.id}`,
        title: session.workout,
        start: session.scheduled_time || '06:30',
        end: '07:30',
        cat: 'green',
        kind: 'health',
        subtitle: `${session.distance} · Training block Week 4`,
      },
      message: `Workout '${session.workout}' synced to daily calendar`,
    };
  },

  // Events
  async listSportsEvents() {
    return healthRepository.getSportsEvents();
  },

  async createSportsEvent(input: CreateEventInput) {
    return healthRepository.createSportsEvent(input);
  },

  // Journals & AI Coach reflection
  async listJournals(person: PersonName = 'Self') {
    return healthRepository.getJournals(person);
  },

  async saveJournal(input: SaveJournalInput) {
    const lower = input.text.toLowerCase();
    let aiReflection = 'Noticed your reflection. Consistent training build creates resilient physiology.';

    if (lower.includes('sore') || lower.includes('pain') || lower.includes('tight')) {
      aiReflection =
        'Identified mild muscle soreness or tightness. Recommended: 10 mins targeted foam rolling, post-run hydration, and magnesium rich dinner.';
    } else if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('fatigue')) {
      aiReflection =
        'Fatigue registered. Your body is adapting to the cumulative training volume. Prioritize 8+ hours uninterrupted sleep tonight.';
    } else if (lower.includes('fresh') || lower.includes('strong') || lower.includes('fast') || lower.includes('good')) {
      aiReflection =
        'Optimal adaptation noted! You are in an ascending aerobic readiness phase. Keep hydration steady and pace controlled.';
    }

    return healthRepository.saveJournal(input, aiReflection);
  },

  // Documents
  async listDocuments(person: PersonName = 'Self') {
    return healthRepository.getDocuments(person);
  },

  async uploadDocument(input: UploadDocumentInput) {
    return healthRepository.saveDocument(input);
  },

  async getFamilyProfiles() {
    return healthRepository.getAllProfiles();
  },
};
