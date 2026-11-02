import { create } from 'zustand';
import { SpiritTab, StillnessPractice } from './spirit.types';
import { STILLNESS_PRACTICES, TEACHERS_LIST } from './spirit.mock';

interface SpiritState {
  currentTab: SpiritTab;
  thoughtText: string;
  selectedTeacher: string;
  perspectiveResponse: string | null;
  practices: StillnessPractice[];
  meditationDuration: number; // in minutes
  isMeditating: boolean;
  meditationSecondsLeft: number;
  setTab: (tab: SpiritTab) => void;
  setThoughtText: (text: string) => void;
  setSelectedTeacher: (teacher: string) => void;
  seekPerspective: () => void;
  clearThought: () => void;
  setMeditationDuration: (mins: number) => void;
  toggleMeditation: () => void;
}

export const useSpiritStore = create<SpiritState>((set, get) => ({
  currentTab: 'mind',
  thoughtText: '',
  selectedTeacher: TEACHERS_LIST[0],
  perspectiveResponse: null,
  practices: STILLNESS_PRACTICES,
  meditationDuration: 3,
  isMeditating: false,
  meditationSecondsLeft: 180,

  setTab: (tab) => set({ currentTab: tab }),
  setThoughtText: (thoughtText) => set({ thoughtText }),
  setSelectedTeacher: (selectedTeacher) => set({ selectedTeacher }),

  seekPerspective: () => {
    const { thoughtText, selectedTeacher } = get();
    if (!thoughtText.trim()) return;

    set({
      perspectiveResponse: `A gentle perspective from ${selectedTeacher}:\n"Notice the one who is anxious or striving. Is awareness itself agitated, or is it merely observing the thought? When you give attention without judgment, clarity emerges effortlessly."`,
    });
  },

  clearThought: () => set({ thoughtText: '', perspectiveResponse: null }),

  setMeditationDuration: (mins) =>
    set({
      meditationDuration: mins,
      meditationSecondsLeft: mins * 60,
      isMeditating: false,
    }),

  toggleMeditation: () =>
    set((state) => ({ isMeditating: !state.isMeditating })),
}));
