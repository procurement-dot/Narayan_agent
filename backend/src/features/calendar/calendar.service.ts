import { calendarRepository } from './calendar.repository.js';
import { calendarGoogleService } from './calendar.google.js';
import { emailRepository } from '../email/email.repository.js';
import { gmailOAuth } from '../email/gmail.oauth.js';
import {
  CalendarEventDto,
  CreateCalendarEventDto,
  MonthOverviewDto,
  UpdateCalendarEventDto,
} from './calendar.dto.js';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

function formatDateString(d: any, fallback: string = ''): string {
  if (!d) return fallback;
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  const s = String(d);
  if (s.includes('T')) return s.split('T')[0];
  return s;
}

export const calendarService = {
  async getDaySchedule(
    userId: string = DEFAULT_USER_ID,
    dateStr?: string
  ): Promise<CalendarEventDto[]> {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];

    // Try Google Calendar sync in background if account is connected
    this.syncGoogleCalendar(userId, targetDate).catch((err) => {
      console.warn('[CalendarService] Background Google sync failed:', err.message);
    });

    const rows = await calendarRepository.getEventsByDate(userId, targetDate);

    return rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle || '',
      start: r.start_time,
      end: r.end_time,
      date: formatDateString(r.date, targetDate),
      cat: r.cat || 'peach',
      kind: r.kind || 'work',
      detail: r.detail || undefined,
      source: r.source || 'local',
      googleEventId: r.google_event_id || undefined,
      sourceProposalId: r.source_proposal_id || undefined,
      status: r.status || 'active',
    }));
  },

  async getMonthOverview(
    userId: string = DEFAULT_USER_ID,
    year?: number,
    month?: number
  ): Promise<MonthOverviewDto> {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const dots = await calendarRepository.getMonthCounts(userId, targetYear, targetMonth);
    const totalEvents = Object.values(dots).reduce((a, b) => a + b, 0);

    return {
      year: targetYear,
      month: targetMonth,
      dots,
      totalEvents,
    };
  },

  async createEvent(
    userId: string = DEFAULT_USER_ID,
    eventData: CreateCalendarEventDto
  ): Promise<CalendarEventDto> {
    const targetDate = eventData.date || new Date().toISOString().split('T')[0];
    let googleEventId: string | null = null;

    // If requested to sync to Google and account connected
    if (eventData.syncToGoogle) {
      try {
        const account = await emailRepository.getEmailAccount(userId);
        if (account?.refresh_token_enc) {
          const auth = gmailOAuth.getAuthenticatedClient(account.refresh_token_enc);
          googleEventId = await calendarGoogleService.createEvent(auth, {
            title: eventData.title,
            detail: eventData.detail,
            date: targetDate,
            start: eventData.start,
            end: eventData.end,
          });
        }
      } catch (gErr) {
        console.warn('[CalendarService] Failed to sync new event to Google:', gErr);
      }
    }

    const row = await calendarRepository.createEvent(userId, eventData, {
      source: googleEventId ? 'google_calendar' : 'local',
      googleEventId: googleEventId || undefined,
    });

    return {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle || '',
      start: row.start_time,
      end: row.end_time,
      date: formatDateString(row.date, targetDate),
      cat: row.cat,
      kind: row.kind,
      detail: row.detail || undefined,
      source: row.source,
      googleEventId: row.google_event_id || undefined,
      status: row.status,
    };
  },

  async updateEvent(
    userId: string = DEFAULT_USER_ID,
    eventId: string,
    updates: UpdateCalendarEventDto
  ): Promise<CalendarEventDto | null> {
    const row = await calendarRepository.updateEvent(userId, eventId, updates);
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle || '',
      start: row.start_time,
      end: row.end_time,
      date: formatDateString(row.date, ''),
      cat: row.cat,
      kind: row.kind,
      detail: row.detail || undefined,
      source: row.source,
      googleEventId: row.google_event_id || undefined,
      status: row.status,
    };
  },

  async deleteEvent(
    userId: string = DEFAULT_USER_ID,
    eventId: string
  ): Promise<{ success: boolean }> {
    const existing = await calendarRepository.getEventById(userId, eventId);
    if (existing?.google_event_id) {
      try {
        const account = await emailRepository.getEmailAccount(userId);
        if (account?.refresh_token_enc) {
          const auth = gmailOAuth.getAuthenticatedClient(account.refresh_token_enc);
          await calendarGoogleService.deleteEvent(auth, existing.google_event_id);
        }
      } catch (err) {
        console.warn('[CalendarService] Could not delete from Google Calendar:', err);
      }
    }

    await calendarRepository.deleteEvent(userId, eventId);
    return { success: true };
  },

  async syncGoogleCalendar(
    userId: string = DEFAULT_USER_ID,
    _dateStr?: string
  ): Promise<{ synced: number; warning?: string }> {
    try {
      const account = await emailRepository.getEmailAccount(userId);
      if (!account || !account.refresh_token_enc) {
        return { synced: 0 };
      }

      const auth = gmailOAuth.getAuthenticatedClient(account.refresh_token_enc);
      // Fetch -7 days to +30 days window so past week and upcoming month are synced
      const googleItems = await calendarGoogleService.fetchEvents(auth);

      let synced = 0;
      for (const item of googleItems) {
        await calendarRepository.upsertGoogleEvent(userId, {
          googleEventId: item.id,
          title: item.summary,
          detail: item.description,
          date: item.date,
          start: item.start,
          end: item.end,
        });
        synced++;
      }

      return { synced };
    } catch (err: any) {
      console.warn('[CalendarService] Google Calendar sync skipped/failed:', err?.message || err);
      if (err?.code === 'GOOGLE_CALENDAR_DISABLED' || err?.message?.includes('Google Calendar API')) {
        return {
          synced: 0,
          warning: 'GOOGLE_CALENDAR_DISABLED',
        };
      }
      return { synced: 0 };
    }
  },
};
