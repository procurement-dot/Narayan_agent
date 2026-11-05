import { Router } from 'express';
import { calendarController } from './calendar.controller.js';

export const calendarRouter = Router();

calendarRouter.get('/day', calendarController.getDaySchedule);
calendarRouter.get('/month', calendarController.getMonthOverview);
calendarRouter.post('/events', calendarController.createEvent);
calendarRouter.put('/events/:id', calendarController.updateEvent);
calendarRouter.delete('/events/:id', calendarController.deleteEvent);
calendarRouter.post('/sync', calendarController.syncCalendar);
