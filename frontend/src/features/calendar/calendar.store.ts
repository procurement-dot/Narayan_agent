import { create } from 'zustand';
import {
  CalendarEvent,
  CreateCalendarEventPayload,
  DayMode,
  MonthOverview,
  UpdateCalendarEventPayload,
} from './calendar.types';
import { calendarApi } from './calendar.api';

function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface CalendarState {
  events: CalendarEvent[];
  mode: DayMode;
  dayOffset: number;
  selectedDate: string; // 'YYYY-MM-DD'
  monthOverview: MonthOverview | null;
  monthViewDate: { year: number; month: number };
  isLoading: boolean;
  isSyncing: boolean;
  isAddTaskOpen: boolean;
  selectedEvent: CalendarEvent | null;

  // Setters
  setMode: (mode: DayMode) => void;
  setDayOffset: (offset: number) => void;
  setSelectedDate: (dateStr: string) => void;
  setMonthViewDate: (year: number, month: number) => void;
  openAddTask: () => void;
  closeAddTask: () => void;
  selectEvent: (event: CalendarEvent | null) => void;

  // API Actions
  fetchDayEvents: (dateStr?: string) => Promise<void>;
  fetchMonthOverview: (year?: number, month?: number) => Promise<void>;
  addEvent: (payload: CreateCalendarEventPayload) => Promise<void>;
  updateEvent: (id: string, payload: UpdateCalendarEventPayload) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  syncGoogleCalendar: () => Promise<{ message: string; result: { synced: number; warning?: string } } | null>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  mode: 'timeline',
  dayOffset: 0,
  selectedDate: getTodayString(),
  monthOverview: null,
  monthViewDate: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  },
  isLoading: false,
  isSyncing: false,
  isAddTaskOpen: false,
  selectedEvent: null,

  setMode: (mode) => set({ mode }),
  setDayOffset: (dayOffset) => set({ dayOffset }),
  setSelectedDate: (selectedDate) => {
    set({ selectedDate });
    get().fetchDayEvents(selectedDate);
  },
  setMonthViewDate: (year, month) => {
    set({ monthViewDate: { year, month } });
    get().fetchMonthOverview(year, month);
  },
  openAddTask: () => set({ isAddTaskOpen: true }),
  closeAddTask: () => set({ isAddTaskOpen: false }),
  selectEvent: (selectedEvent) => set({ selectedEvent }),

  fetchDayEvents: async (dateStr) => {
    const targetDate = dateStr || get().selectedDate;
    try {
      set({ isLoading: true });
      const data = await calendarApi.getDayEvents(targetDate);
      if (Array.isArray(data)) {
        set({ events: data });
      } else {
        set({ events: [] });
      }
    } catch (err) {
      console.warn('[CalendarStore] Could not fetch live events from backend:', err);
      set({ events: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMonthOverview: async (year, month) => {
    const y = year || get().monthViewDate.year;
    const m = month || get().monthViewDate.month;
    try {
      const overview = await calendarApi.getMonthOverview(y, m);
      set({ monthOverview: overview });
    } catch (err) {
      console.warn('[CalendarStore] Could not fetch month overview:', err);
    }
  },

  addEvent: async (payload) => {
    const date = payload.date || get().selectedDate;
    const tempId = `temp-${Date.now()}`;
    const optimisticEvent: CalendarEvent = {
      id: tempId,
      title: payload.title,
      subtitle: payload.subtitle || 'Added to your rhythm',
      start: payload.start,
      end: payload.end,
      date,
      cat: payload.cat || 'peach',
      kind: payload.kind || 'work',
      detail: payload.detail,
      source: payload.syncToGoogle ? 'google_calendar' : 'local',
      status: 'active',
    };

    // Optimistic UI update
    set((state) => ({
      events: [...state.events, optimisticEvent].sort((a, b) => a.start.localeCompare(b.start)),
      isAddTaskOpen: false,
    }));

    try {
      const created = await calendarApi.createEvent({ ...payload, date });
      set((state) => ({
        events: state.events.map((e) => (e.id === tempId ? created : e)),
      }));
      // Refresh month overview dots
      get().fetchMonthOverview();
    } catch (err) {
      console.error('[CalendarStore] Failed to save event to backend:', err);
      // Keep optimistic event in memory
    }
  },

  updateEvent: async (id, payload) => {
    // Optimistic update
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? { ...e, ...payload } : e)),
      selectedEvent: state.selectedEvent?.id === id ? { ...state.selectedEvent, ...payload } : state.selectedEvent,
    }));

    try {
      const updated = await calendarApi.updateEvent(id, payload);
      set((state) => ({
        events: state.events.map((e) => (e.id === id ? updated : e)),
        selectedEvent: state.selectedEvent?.id === id ? updated : state.selectedEvent,
      }));
    } catch (err) {
      console.error('[CalendarStore] Failed to update event on backend:', err);
    }
  },

  deleteEvent: async (id) => {
    // Optimistic delete
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
      selectedEvent: null,
    }));

    try {
      await calendarApi.deleteEvent(id);
      get().fetchMonthOverview();
    } catch (err) {
      console.error('[CalendarStore] Failed to delete event on backend:', err);
    }
  },

  syncGoogleCalendar: async () => {
    try {
      set({ isSyncing: true });
      const res = await calendarApi.syncGoogleCalendar(get().selectedDate);
      await get().fetchDayEvents(get().selectedDate);
      await get().fetchMonthOverview();
      return res;
    } catch (err) {
      console.warn('[CalendarStore] Failed to trigger Google Calendar sync:', err);
      return null;
    } finally {
      set({ isSyncing: false });
    }
  },
}));
