import { create } from 'zustand';
import { HealthGoal, HealthTab, SportsEvent, TrainingDay } from './health.types';
import { HEALTH_GOALS, SPORTS_EVENTS, TRAINING_PLAN } from './health.mock';

interface HealthState {
  currentTab: HealthTab;
  goals: HealthGoal[];
  plan: TrainingDay[];
  events: SportsEvent[];
  journalText: string;
  savedJournals: { date: string; text: string }[];
  selectedPerson: 'Self' | 'Neha' | 'Prayan';
  setTab: (tab: HealthTab) => void;
  setJournalText: (text: string) => void;
  saveJournal: () => void;
  setSelectedPerson: (person: 'Self' | 'Neha' | 'Prayan') => void;
}

export const useHealthStore = create<HealthState>((set, get) => ({
  currentTab: 'today',
  goals: HEALTH_GOALS,
  plan: TRAINING_PLAN,
  events: SPORTS_EVENTS,
  journalText: '',
  savedJournals: [
    {
      date: 'Yesterday',
      text: 'Legs felt fresh after the easy 6k. Good recovery sleep (7h 40m). Ready for intervals.',
    },
  ],
  selectedPerson: 'Self',

  setTab: (tab) => set({ currentTab: tab }),
  setJournalText: (journalText) => set({ journalText }),
  setSelectedPerson: (selectedPerson) => set({ selectedPerson }),

  saveJournal: () => {
    const { journalText, savedJournals } = get();
    if (!journalText.trim()) return;

    set({
      savedJournals: [
        {
          date: 'Today',
          text: journalText.trim(),
        },
        ...savedJournals,
      ],
      journalText: '',
    });
  },
}));
