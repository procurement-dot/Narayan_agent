import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleCalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  start: string; // 'HH:mm'
  end: string;   // 'HH:mm'
  date: string;  // 'YYYY-MM-DD'
}

export const calendarGoogleService = {
  async fetchEvents(
    auth: OAuth2Client,
    timeMinStr?: string,
    timeMaxStr?: string
  ): Promise<GoogleCalendarEventItem[]> {
    try {
      const calendar = google.calendar({ version: 'v3', auth });

      const timeMin = timeMinStr || new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const timeMax = timeMaxStr || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const items = response.data.items || [];
      const parsed: GoogleCalendarEventItem[] = [];

      for (const item of items) {
        if (!item.id || !item.summary) continue;

        let startTime = '09:00';
        let endTime = '10:00';
        let eventDate = new Date().toISOString().split('T')[0];

        if (item.start?.dateTime) {
          const startDate = new Date(item.start.dateTime);
          startTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
          eventDate = startDate.toISOString().split('T')[0];
        } else if (item.start?.date) {
          startTime = '09:00';
          endTime = '17:00';
          eventDate = item.start.date;
        }

        if (item.end?.dateTime) {
          const endDate = new Date(item.end.dateTime);
          endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
        }

        parsed.push({
          id: item.id,
          summary: item.summary,
          description: item.description || undefined,
          start: startTime,
          end: endTime,
          date: eventDate,
        });
      }

      return parsed;
    } catch (err: any) {
      console.warn('[CalendarGoogle] Could not fetch Google Calendar events:', err.message);
      if (
        err.message?.includes('Google Calendar API has not been used') ||
        err.message?.includes('disabled') ||
        err.response?.data?.error?.message?.includes('Google Calendar API has not been used')
      ) {
        const apiError = new Error('Google Calendar API is not enabled in your Google Cloud Project. Please enable it in Google Cloud Console.');
        (apiError as any).code = 'GOOGLE_CALENDAR_DISABLED';
        throw apiError;
      }
      return [];
    }
  },

  async createEvent(
    auth: OAuth2Client,
    event: {
      title: string;
      detail?: string;
      date: string; // 'YYYY-MM-DD'
      start: string; // 'HH:mm'
      end: string;   // 'HH:mm'
    }
  ): Promise<string | null> {
    try {
      const calendar = google.calendar({ version: 'v3', auth });

      const startDateTime = new Date(`${event.date}T${event.start}:00`).toISOString();
      const endDateTime = new Date(`${event.date}T${event.end}:00`).toISOString();

      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: event.title,
          description: event.detail || 'Scheduled via NRYN Assistant',
          start: { dateTime: startDateTime },
          end: { dateTime: endDateTime },
        },
      });

      return res.data.id || null;
    } catch (err: any) {
      console.warn('[CalendarGoogle] Could not create Google Calendar event:', err.message);
      return null;
    }
  },

  async deleteEvent(auth: OAuth2Client, googleEventId: string): Promise<boolean> {
    try {
      const calendar = google.calendar({ version: 'v3', auth });
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: googleEventId,
      });
      return true;
    } catch (err: any) {
      console.warn('[CalendarGoogle] Could not delete Google Calendar event:', err.message);
      return false;
    }
  },
};
