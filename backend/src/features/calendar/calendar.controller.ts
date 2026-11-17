import { Request, Response } from 'express';
import { calendarService } from './calendar.service.js';

export const calendarController = {
  async getDaySchedule(req: Request, res: Response) {
    const userId = (req as any).userId || '00000000-0000-0000-0000-000000000001';
    const dateStr = req.query.date as string | undefined;

    try {
      const events = await calendarService.getDaySchedule(userId, dateStr);
      res.json(events);
    } catch (err: any) {
      console.error('Failed to get day schedule:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch calendar schedule' });
    }
  },

  async getMonthOverview(req: Request, res: Response) {
    const userId = (req as any).userId || '00000000-0000-0000-0000-000000000001';
    const year = req.query.year ? Number(req.query.year) : undefined;
    const month = req.query.month ? Number(req.query.month) : undefined;

    try {
      const overview = await calendarService.getMonthOverview(userId, year, month);
      res.json(overview);
    } catch (err: any) {
      console.error('Failed to get month overview:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch month overview' });
    }
  },

  async createEvent(req: Request, res: Response) {
    const userId = (req as any).userId || '00000000-0000-0000-0000-000000000001';
    const { title, subtitle, start, end, date, cat, kind, detail, syncToGoogle } = req.body;

    if (!title || !start || !end) {
      return res.status(400).json({ error: 'Title, start time, and end time are required' });
    }

    try {
      const event = await calendarService.createEvent(userId, {
        title,
        subtitle,
        start,
        end,
        date,
        cat,
        kind,
        detail,
        syncToGoogle,
      });
      res.status(201).json(event);
    } catch (err: any) {
      console.error('Failed to create calendar event:', err);
      res.status(500).json({ error: err.message || 'Failed to create event' });
    }
  },

  async updateEvent(req: Request, res: Response) {
    const userId = (req as any).userId || '00000000-0000-0000-0000-000000000001';
    const { id } = req.params;

    try {
      const updated = await calendarService.updateEvent(userId, id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(updated);
    } catch (err: any) {
      console.error('Failed to update event:', err);
      res.status(500).json({ error: err.message || 'Failed to update event' });
    }
  },

  async deleteEvent(req: Request, res: Response) {
    const userId = (req as any).userId || '00000000-0000-0000-0000-000000000001';
    const { id } = req.params;

    try {
      const result = await calendarService.deleteEvent(userId, id);
      res.json(result);
    } catch (err: any) {
      console.error('Failed to delete event:', err);
      res.status(500).json({ error: err.message || 'Failed to delete event' });
    }
  },

  async syncCalendar(req: Request, res: Response) {
    const userId = (req as any).userId || '00000000-0000-0000-0000-000000000001';
    const dateStr = req.body.date as string | undefined;

    try {
      const result = await calendarService.syncGoogleCalendar(userId, dateStr);
      res.json({ message: 'Google Calendar sync completed', result });
    } catch (err: any) {
      console.error('Failed to sync Google Calendar:', err);
      res.status(500).json({ error: err.message || 'Failed to sync Google Calendar' });
    }
  },
};
