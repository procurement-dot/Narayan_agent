import { Request, Response } from 'express';
import { workService } from './work.service.js';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  AddTaskSchema,
  CreateInvoiceSchema,
  CreateDealSchema,
  UpdateExternalAppUrlSchema,
} from './work.dto.js';

export const workController = {
  // Overview
  async getOverview(_req: Request, res: Response) {
    try {
      const data = await workService.getOverview();
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error('getOverview error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Server error' });
    }
  },

  // Projects
  async getProjects(_req: Request, res: Response) {
    try {
      const data = await workService.getProjects();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async getProject(req: Request, res: Response) {
    try {
      const data = await workService.getProject(req.params.id);
      if (!data) return res.status(404).json({ success: false, error: 'Project not found' });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async createProject(req: Request, res: Response) {
    try {
      const input = CreateProjectSchema.parse(req.body);
      const data = await workService.createProject(input);
      return res.status(201).json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async updateProject(req: Request, res: Response) {
    try {
      const input = UpdateProjectSchema.parse(req.body);
      const data = await workService.updateProject(req.params.id, input);
      if (!data) return res.status(404).json({ success: false, error: 'Project not found' });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async addTask(req: Request, res: Response) {
    try {
      const input = AddTaskSchema.parse(req.body);
      const data = await workService.addTask(req.params.id, input);
      if (!data) return res.status(404).json({ success: false, error: 'Project not found' });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async toggleTask(req: Request, res: Response) {
    try {
      const { projectId, taskId } = req.params;
      const data = await workService.toggleTask(projectId, taskId);
      if (!data) return res.status(404).json({ success: false, error: 'Task or project not found' });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // Finance & Invoices
  async getFinanceSummary(_req: Request, res: Response) {
    try {
      const data = await workService.getFinanceSummary();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async createInvoice(req: Request, res: Response) {
    try {
      const input = CreateInvoiceSchema.parse(req.body);
      const data = await workService.createInvoice(input);
      return res.status(201).json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async sendPaymentReminder(req: Request, res: Response) {
    try {
      const data = await workService.sendPaymentReminder(req.params.id);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // Sales
  async getSalesPipeline(_req: Request, res: Response) {
    try {
      const data = await workService.getSalesPipeline();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async createDeal(req: Request, res: Response) {
    try {
      const input = CreateDealSchema.parse(req.body);
      const data = await workService.createDeal(input);
      return res.status(201).json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async updateDealStage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { stage } = req.body;
      const data = await workService.updateDealStage(id, stage);
      if (!data) return res.status(404).json({ success: false, error: 'Deal not found' });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  // HR & Team
  async getTeamOps(_req: Request, res: Response) {
    try {
      const data = await workService.getTeamOps();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async resolveHRTicket(req: Request, res: Response) {
    try {
      const data = await workService.resolveHRTicket(req.params.id);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // EA Signals
  async getEASignals(_req: Request, res: Response) {
    try {
      const data = await workService.getEASignals();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async resolveEASignal(req: Request, res: Response) {
    try {
      const data = await workService.resolveEASignal(req.params.id);
      if (!data) return res.status(404).json({ success: false, error: 'Signal not found' });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // Connected External Apps
  async getExternalApps(_req: Request, res: Response) {
    try {
      const data = await workService.getExternalApps();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateExternalAppUrl(req: Request, res: Response) {
    try {
      const { appKey } = req.params;
      const input = UpdateExternalAppUrlSchema.parse(req.body);
      const data = await workService.updateExternalAppUrl(appKey, input);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },
};
