import { Request, Response } from 'express';
import { financeService } from './finance.service.js';
import {
  createAssetSchema,
  createLoanSchema,
  createRecordSchema,
  syncSmsBatchSchema,
  updateAssetRentSchema,
  updateRetirementSchema,
} from './finance.dto.js';

export const financeController = {
  async getOverview(req: Request, res: Response) {
    try {
      const data = await financeService.getOverview();
      return res.json(data);
    } catch (err: any) {
      console.error('[FinanceController] getOverview error:', err);
      return res.status(500).json({ error: 'Failed to fetch finance overview' });
    }
  },

  async getAssets(req: Request, res: Response) {
    try {
      const data = await financeService.getAllAssets();
      return res.json(data);
    } catch (err: any) {
      console.error('[FinanceController] getAssets error:', err);
      return res.status(500).json({ error: 'Failed to fetch assets' });
    }
  },

  async createAsset(req: Request, res: Response) {
    try {
      const parsed = createAssetSchema.parse(req.body);
      const created = await financeService.createAsset(undefined, parsed);
      return res.status(201).json(created);
    } catch (err: any) {
      return res.status(400).json({ error: err.errors || err.message });
    }
  },

  async updateAssetRent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = updateAssetRentSchema.parse(req.body);
      const updated = await financeService.updateAssetRentStatus(id, undefined, parsed.status, parsed.receivedRent);
      if (!updated) {
        return res.status(404).json({ error: 'Asset not found' });
      }
      return res.json(updated);
    } catch (err: any) {
      return res.status(400).json({ error: err.errors || err.message });
    }
  },

  async deleteAsset(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await financeService.deleteAsset(id);
      return res.json({ success: true, id });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to delete asset' });
    }
  },

  async getLoans(req: Request, res: Response) {
    try {
      const data = await financeService.getAllLoans();
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch loans' });
    }
  },

  async createLoan(req: Request, res: Response) {
    try {
      const parsed = createLoanSchema.parse(req.body);
      const created = await financeService.createLoan(undefined, parsed);
      return res.status(201).json(created);
    } catch (err: any) {
      return res.status(400).json({ error: err.errors || err.message });
    }
  },

  async toggleLoanPaid(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await financeService.toggleLoanPaid(id);
      if (!updated) {
        return res.status(404).json({ error: 'Loan not found' });
      }
      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to toggle loan' });
    }
  },

  async deleteLoan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await financeService.deleteLoan(id);
      return res.json({ success: true, id });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to delete loan' });
    }
  },

  async syncSmsTransactions(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const parsed = syncSmsBatchSchema.parse(req.body);
      const result = await financeService.syncSmsTransactions(userId, parsed.transactions);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('[FinanceController] syncSmsTransactions error:', err);
      return res.status(400).json({ error: err.errors || err.message });
    }
  },

  async getTransactions(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const type = req.query.type as string | undefined;
      const limit = Number(req.query.limit) || 100;
      const data = await financeService.getTransactions(userId, type, limit);
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  },

  async getRetirement(req: Request, res: Response) {
    try {
      const data = await financeService.getRetirementParams();
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch retirement params' });
    }
  },

  async updateRetirement(req: Request, res: Response) {
    try {
      const parsed = updateRetirementSchema.parse(req.body);
      const updated = await financeService.updateRetirementParams(undefined, parsed);
      return res.json(updated);
    } catch (err: any) {
      return res.status(400).json({ error: err.errors || err.message });
    }
  },

  async getRecords(req: Request, res: Response) {
    try {
      const data = await financeService.getAllRecords();
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch records vault' });
    }
  },

  async createRecord(req: Request, res: Response) {
    try {
      const parsed = createRecordSchema.parse(req.body);
      const created = await financeService.createRecord(undefined, parsed);
      return res.status(201).json(created);
    } catch (err: any) {
      return res.status(400).json({ error: err.errors || err.message });
    }
  },

  async attachDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { documentName, documentUrl } = req.body;
      if (!documentName) {
        return res.status(400).json({ error: 'documentName is required' });
      }
      const updated = await financeService.attachDocumentToRecord(id, undefined, documentName, documentUrl);
      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to attach document' });
    }
  },
};
