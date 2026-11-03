import { Router } from 'express';
import { notesController } from './notes.controller.js';

export const notesRouter = Router();

notesRouter.get('/', notesController.listNotes);
notesRouter.get('/:id', notesController.getNote);
notesRouter.post('/', notesController.createNote);
notesRouter.put('/:id', notesController.updateNote);
notesRouter.delete('/:id', notesController.deleteNote);
notesRouter.post('/voice-meeting', notesController.processVoiceMeeting);
notesRouter.post('/:id/sync-tasks', notesController.syncTasks);
