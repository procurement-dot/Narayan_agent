import { Router } from 'express';
import { calendarController } from './calendar.controller.js';

export const calendarRouter = Router();

calendarRouter.get('/day', calendarController.getDaySchedule);
calendarRouter.get('/month', calendarController.getMonthOverview);
calendarRouter.post('/events', calendarController.createEvent);
calendarRouter.put('/events/:id', calendarController.updateEvent);
calendarRouter.delete('/events/:id', calendarController.deleteEvent);
calendarRouter.post('/sync', calendarController.syncCalendar);
calendarRouter.get('/notifications', calendarController.getNotifications);
calendarRouter.get('/notifications/count', calendarController.getNotificationsCount);
calendarRouter.post('/notifications/:id/accept', calendarController.acceptNotification);
calendarRouter.post('/notifications/:id/dismiss', calendarController.dismissNotification);
