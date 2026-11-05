import { Router } from 'express';
import { workController } from './work.controller.js';

export const workRouter = Router();

// Overview
workRouter.get('/overview', workController.getOverview);

// Projects
workRouter.get('/projects', workController.getProjects);
workRouter.get('/projects/:id', workController.getProject);
workRouter.post('/projects', workController.createProject);
workRouter.put('/projects/:id', workController.updateProject);
workRouter.post('/projects/:id/tasks', workController.addTask);
workRouter.patch('/projects/:projectId/tasks/:taskId/toggle', workController.toggleTask);

// Commercial Finance
workRouter.get('/finance', workController.getFinanceSummary);
workRouter.post('/finance/invoices', workController.createInvoice);
workRouter.post('/finance/invoices/:id/remind', workController.sendPaymentReminder);

// Sales Pipeline
workRouter.get('/sales', workController.getSalesPipeline);
workRouter.post('/sales/deals', workController.createDeal);
workRouter.patch('/sales/deals/:id/stage', workController.updateDealStage);

// HR & Operations
workRouter.get('/hr', workController.getTeamOps);
workRouter.patch('/hr/tickets/:id/resolve', workController.resolveHRTicket);

// EA Assistant
workRouter.get('/ea/signals', workController.getEASignals);
workRouter.patch('/ea/signals/:id/resolve', workController.resolveEASignal);

// External Apps (Infra Project Tracker & Second Software)
workRouter.get('/external-apps', workController.getExternalApps);
workRouter.put('/external-apps/:appKey/url', workController.updateExternalAppUrl);
