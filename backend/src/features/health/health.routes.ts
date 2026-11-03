import { Router } from 'express';
import { healthController } from './health.controller.js';

export const healthRouter = Router();

// Dashboard & Today Overview
healthRouter.get('/dashboard', healthController.getDashboard);
healthRouter.post('/vitals', healthController.logVitals);

// Goals
healthRouter.get('/goals', healthController.listGoals);
healthRouter.post('/goals', healthController.createGoal);
healthRouter.put('/goals/:id', healthController.updateGoal);
healthRouter.delete('/goals/:id', healthController.deleteGoal);

// Training Plan Sessions
healthRouter.get('/training-plan', healthController.getTrainingPlan);
healthRouter.patch('/training-plan/sessions/:id', healthController.updateTrainingSession);
healthRouter.post('/training-plan/sessions/:id/sync-calendar', healthController.syncSessionToCalendar);

// Events
healthRouter.get('/events', healthController.listSportsEvents);
healthRouter.post('/events', healthController.createSportsEvent);

// Journals & Reflections
healthRouter.get('/journals', healthController.listJournals);
healthRouter.post('/journals', healthController.saveJournal);

// Documents & Lab Reports
healthRouter.get('/documents', healthController.listDocuments);
healthRouter.post('/documents', healthController.uploadDocument);

// Profiles
healthRouter.get('/profiles', healthController.getFamilyProfiles);
