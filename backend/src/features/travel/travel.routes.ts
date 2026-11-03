import { Router } from 'express';
import { travelController } from './travel.controller.js';

export const travelRouter = Router();

// 1. Overview Dashboard
travelRouter.get('/overview', travelController.getOverview);

// 2. Trips
travelRouter.get('/trips', travelController.listTrips);
travelRouter.post('/trips', travelController.createTrip);
travelRouter.get('/trips/:id', travelController.getTripById);
travelRouter.put('/trips/:id', travelController.updateTrip);
travelRouter.delete('/trips/:id', travelController.deleteTrip);
travelRouter.post('/trips/:id/segments', travelController.addSegment);

// 3. Airfare Alerts
travelRouter.get('/fares', travelController.listFares);
travelRouter.post('/fares', travelController.createFare);
travelRouter.delete('/fares/:id', travelController.deleteFare);

// 4. Documents & Passports
travelRouter.get('/documents', travelController.listDocuments);
travelRouter.post('/documents', travelController.createDocument);

// 5. IRCTC Tatkal Assistant
travelRouter.get('/tatkal', travelController.listTatkal);
travelRouter.post('/tatkal', travelController.createTatkal);
