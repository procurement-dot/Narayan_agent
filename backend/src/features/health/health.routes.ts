import { Router } from 'express';
import { healthController } from './health.controller.js';

export const healthRouter = Router();

// Dashboard & Today Overview
healthRouter.get('/dashboard', healthController.getDashboard);
healthRouter.post('/vitals', healthController.logVitals);

// Wearables Live Sync & Pairing
healthRouter.post('/wearables/sync', healthController.syncWearables);
healthRouter.post('/wearables/connect', healthController.connectWearable);
healthRouter.post('/wearables/disconnect', healthController.disconnectWearable);
healthRouter.get('/wearables/scan', healthController.scanNearbyWearables);

// Phone Sensors (No-Watch Mode)
healthRouter.post('/phone/sync-steps', healthController.syncPhoneSteps);
healthRouter.post('/phone/measure-pulse', healthController.measurePulse);
healthRouter.post('/phone/record-run', healthController.recordPhoneRun);

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

// Documents & Lab Reports (Manual & AI Multimodal OCR)
healthRouter.get('/documents', healthController.listDocuments);
healthRouter.post('/documents', healthController.uploadDocument);
healthRouter.post('/documents/analyze-report', healthController.analyzeLabReport);

// Smart Plate Food Photo Nutrition AI
healthRouter.post('/nutrition/analyze-meal', healthController.analyzeMealPlate);
healthRouter.get('/nutrition/meals', healthController.getMealLogs);

// Profiles
healthRouter.get('/profiles', healthController.getFamilyProfiles);
