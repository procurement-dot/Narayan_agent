import { create } from 'zustand';
import { CalendarEvent, DayMode } from './calendar.types';
import { INITIAL_CALENDAR_EVENTS } from './calendar.mock';

interface CalendarState {
  events: CalendarEvent[];
  mode: DayMode;
  dayOffset: number;
  isAddTaskOpen: boolean;
  selectedEvent: CalendarEvent | null;
  setMode: (mode: DayMode) => void;
  setDayOffset: (offset: number) => void;
  openAddTask: () => void;
  closeAddTask: () => void;
  selectEvent: (event: CalendarEvent | null) => void;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  events: INITIAL_CALENDAR_EVENTS,
  mode: 'timeline',
  dayOffset: 0,
  isAddTaskOpen: false,
  selectedEvent: null,

  setMode: (mode) => set({ mode }),
  setDayOffset: (dayOffset) => set({ dayOffset }),
  openAddTask: () => set({ isAddTaskOpen: true }),
  closeAddTask: () => set({ isAddTaskOpen: false }),
  selectEvent: (selectedEvent) => set({ selectedEvent }),

  addEvent: (eventData) =>
    set((state) => ({
      events: [
        ...state.events,
        {
          ...eventData,
          id: `custom-${Date.now()}`,
        },
      ],
      isAddTaskOpen: false,
    })),
}));
