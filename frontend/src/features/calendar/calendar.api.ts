import { apiClient } from '../../shared/api/client';
import {
  CalendarEvent,
  CreateCalendarEventPayload,
  MonthOverview,
  UpdateCalendarEventPayload,
} from './calendar.types';

export const calendarApi = {
  async getDayEvents(dateStr?: string): Promise<CalendarEvent[]> {
    const params = dateStr ? { date: dateStr } : {};
    const res = await apiClient.get<CalendarEvent[]>('/calendar/day', { params });
    return res.data;
  },

  async getMonthOverview(year?: number, month?: number): Promise<MonthOverview> {
    const params: Record<string, number> = {};
    if (year) params.year = year;
    if (month) params.month = month;
    const res = await apiClient.get<MonthOverview>('/calendar/month', { params });
    return res.data;
  },

  async createEvent(payload: CreateCalendarEventPayload): Promise<CalendarEvent> {
    const res = await apiClient.post<CalendarEvent>('/calendar/events', payload);
    return res.data;
  },

  async updateEvent(id: string, payload: UpdateCalendarEventPayload): Promise<CalendarEvent> {
    const res = await apiClient.put<CalendarEvent>(`/calendar/events/${id}`, payload);
    return res.data;
  },

  async deleteEvent(id: string): Promise<{ success: boolean }> {
    const res = await apiClient.delete<{ success: boolean }>(`/calendar/events/${id}`);
    return res.data;
  },

  async syncGoogleCalendar(dateStr?: string): Promise<{ message: string; result: { synced: number; warning?: string } }> {
    const res = await apiClient.post<{ message: string; result: { synced: number; warning?: string } }>(
      '/calendar/sync',
      { date: dateStr }
    );
    return res.data;
  },
};
