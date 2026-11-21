import { create } from 'zustand';
import {
  CalendarEvent,
  CalendarNotificationItem,
  CreateCalendarEventPayload,
  DayMode,
  MonthOverview,
  UpdateCalendarEventPayload,
} from './calendar.types';
import { calendarApi } from './calendar.api';
import { INITIAL_CALENDAR_EVENTS, INITIAL_CALENDAR_NOTIFICATIONS } from './calendar.mock';

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

  // Notifications State
  notifications: CalendarNotificationItem[];
  unreadNotificationsCount: number;
  isNotificationsOpen: boolean;
  isLoadingNotifications: boolean;

  // Setters
  setMode: (mode: DayMode) => void;
  setDayOffset: (offset: number) => void;
  setSelectedDate: (dateStr: string) => void;
  setMonthViewDate: (year: number, month: number) => void;
  openAddTask: () => void;
  closeAddTask: () => void;
  selectEvent: (event: CalendarEvent | null) => void;
  openNotifications: () => void;
  closeNotifications: () => void;

  // API Actions
  fetchDayEvents: (dateStr?: string) => Promise<void>;
  fetchMonthOverview: (year?: number, month?: number) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchNotificationsCount: () => Promise<void>;
  acceptNotification: (notif: CalendarNotificationItem) => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  addEvent: (payload: CreateCalendarEventPayload) => Promise<void>;
  updateEvent: (id: string, payload: UpdateCalendarEventPayload) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  syncGoogleCalendar: () => Promise<{ message: string; result: { synced: number; warning?: string } } | null>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: INITIAL_CALENDAR_EVENTS,
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

  notifications: INITIAL_CALENDAR_NOTIFICATIONS,
  unreadNotificationsCount: INITIAL_CALENDAR_NOTIFICATIONS.length,
  isNotificationsOpen: false,
  isLoadingNotifications: false,

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
  openNotifications: () => {
    set({ isNotificationsOpen: true });
    get().fetchNotifications();
  },
  closeNotifications: () => set({ isNotificationsOpen: false }),

  fetchDayEvents: async (dateStr) => {
    const targetDate = dateStr || get().selectedDate;
    try {
      set({ isLoading: true });
      const data = await calendarApi.getDayEvents(targetDate);
      if (Array.isArray(data) && data.length > 0) {
        set({ events: data });
      } else {
        set((state) => ({
          events: state.events && state.events.length > 0 ? state.events : INITIAL_CALENDAR_EVENTS,
        }));
      }
    } catch (err) {
      console.warn('[CalendarStore] Could not fetch live events from backend:', err);
      set((state) => ({
        events: state.events && state.events.length > 0 ? state.events : INITIAL_CALENDAR_EVENTS,
      }));
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

  fetchNotifications: async () => {
    try {
      set({ isLoadingNotifications: true });
      const data = await calendarApi.getNotifications();
      if (Array.isArray(data) && data.length > 0) {
        set({ notifications: data, unreadNotificationsCount: data.length });
      } else {
        set((state) => ({
          notifications: state.notifications.length > 0 ? state.notifications : INITIAL_CALENDAR_NOTIFICATIONS,
          unreadNotificationsCount: state.notifications.length > 0 ? state.notifications.length : INITIAL_CALENDAR_NOTIFICATIONS.length,
        }));
      }
    } catch (err) {
      console.warn('[CalendarStore] Could not fetch live notifications from backend:', err);
      set((state) => ({
        notifications: state.notifications.length > 0 ? state.notifications : INITIAL_CALENDAR_NOTIFICATIONS,
        unreadNotificationsCount: state.notifications.length > 0 ? state.notifications.length : INITIAL_CALENDAR_NOTIFICATIONS.length,
      }));
    } finally {
      set({ isLoadingNotifications: false });
    }
  },

  fetchNotificationsCount: async () => {
    try {
      const res = await calendarApi.getNotificationsCount();
      if (typeof res?.count === 'number') {
        set({ unreadNotificationsCount: res.count });
      }
    } catch {
      // ignore
    }
  },

  acceptNotification: async (notif: CalendarNotificationItem) => {
    const id = notif.id;
    // 1. Optimistic removal from notifications
    set((state) => {
      const filtered = state.notifications.filter((n) => n.id !== id);
      return {
        notifications: filtered,
        unreadNotificationsCount: Math.max(0, filtered.length),
      };
    });

    // 2. Optimistic add to events
    const tempEvent: CalendarEvent = {
      id: `accepted-${Date.now()}`,
      title: notif.title,
      subtitle: notif.subtitle,
      start: notif.startTime,
      end: notif.endTime,
      date: notif.date || get().selectedDate,
      cat: notif.type === 'meeting' ? 'peach' : (notif.type === 'bill' ? 'peach' : 'purple'),
      kind: notif.type === 'bill' ? 'finance' : 'work',
      detail: notif.detail,
      source: notif.source,
      status: 'active',
    };

    set((state) => ({
      events: [...state.events, tempEvent].sort((a, b) => a.start.localeCompare(b.start)),
    }));

    try {
      const res = await calendarApi.acceptNotification(id, {
        title: notif.title,
        subtitle: notif.subtitle,
        start: notif.startTime,
        end: notif.endTime,
        date: notif.date || get().selectedDate,
        detail: notif.detail,
        cat: tempEvent.cat,
        kind: tempEvent.kind,
        syncToGoogle: true,
      });

      if (res?.event) {
        set((state) => ({
          events: state.events.map((e) => (e.id === tempEvent.id ? res.event : e)),
        }));
      }
      get().fetchDayEvents();
      get().fetchMonthOverview();
    } catch (err) {
      console.error('[CalendarStore] Failed to accept notification on backend:', err);
    }
  },

  dismissNotification: async (id: string) => {
    // 1. Optimistic removal from notifications
    set((state) => {
      const filtered = state.notifications.filter((n) => n.id !== id);
      return {
        notifications: filtered,
        unreadNotificationsCount: Math.max(0, filtered.length),
      };
    });

    try {
      await calendarApi.dismissNotification(id);
    } catch (err) {
      console.error('[CalendarStore] Failed to dismiss notification on backend:', err);
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
