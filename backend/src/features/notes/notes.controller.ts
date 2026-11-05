import { Request, Response } from 'express';
import { notesService } from './notes.service.js';
import { CreateNoteDto, UpdateNoteDto, VoiceMeetingDto } from './notes.dto.js';

export const notesController = {
  async listNotes(req: Request, res: Response) {
    try {
      const area = typeof req.query.area === 'string' ? req.query.area : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;

      const notes = await notesService.listNotes({ area, search });
      res.json({ success: true, count: notes.length, data: notes });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getNote(req: Request, res: Response) {
    try {
      const note = await notesService.getNote(req.params.id);
      res.json({ success: true, data: note });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  },

  async createNote(req: Request, res: Response) {
    try {
      const parsed = CreateNoteDto.parse(req.body);
      const note = await notesService.createNote(parsed);
      res.status(201).json({ success: true, data: note });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  async updateNote(req: Request, res: Response) {
    try {
      const parsed = UpdateNoteDto.parse(req.body);
      const note = await notesService.updateNote(req.params.id, parsed);
      res.json({ success: true, data: note });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  async deleteNote(req: Request, res: Response) {
    try {
      const result = await notesService.deleteNote(req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  async processVoiceMeeting(req: Request, res: Response) {
    try {
      const parsed = VoiceMeetingDto.parse(req.body);
      const note = await notesService.processVoiceMeeting(parsed);
      res.status(201).json({ success: true, data: note });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  async syncTasks(req: Request, res: Response) {
    try {
      const result = await notesService.syncTasksToCalendar(req.params.id);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },
};
