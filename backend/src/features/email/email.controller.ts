import { Request, Response } from 'express';
import { emailService } from './email.service.js';

export const emailController = {
  async getSummary(_req: Request, res: Response) {
    const summary = await emailService.getSummary();
    res.json(summary);
  },

  async listEmails(req: Request, res: Response) {
    const tab = req.query.tab as string | undefined;
    const emails = await emailService.listEmails(tab);
    res.json(emails);
  },

  async saveDraft(req: Request, res: Response) {
    const { id } = req.params;
    const { body } = req.body;
    const userId = (req as any).userId || '00000000-0000-0000-0000-000000000001';

    if (!body) {
      return res.status(400).json({ error: 'Draft body is required' });
    }

    const result = await emailService.saveDraft(id, userId, body);
    res.json({ message: 'Draft saved locally; nothing sent.', result });
  },

  async archiveEmail(req: Request, res: Response) {
    const { id } = req.params;
    const result = await emailService.archiveEmail(id);
    res.json({ message: 'Marked for archiving in demo. No email changed.', result });
  },

  async getProposal(req: Request, res: Response) {
    const { id } = req.params;
    const proposal = await emailService.getProposal(id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    res.json(proposal);
  },

  async approveProposal(req: Request, res: Response) {
    const { id } = req.params;
    const { title, start, end, detail } = req.body;
    const userId = (req as any).userId || '00000000-0000-0000-0000-000000000001';

    if (!title || !start || !end || end <= start) {
      return res.status(400).json({ message: 'Please enter a valid title and time range.' });
    }

    try {
      const task = await emailService.approveProposal(id, userId, { title, start, end, detail });
      res.json({ message: 'Approved and added to your rolling clock.', task });
    } catch (err: any) {
      if (err.statusCode === 409) {
        return res.status(409).json({ message: 'Already on your day; duplicate prevented.' });
      }
      res.status(500).json({ error: err.message });
    }
  },

  async dismissProposal(req: Request, res: Response) {
    const { id } = req.params;
    await emailService.dismissProposal(id);
    res.json({ message: 'Dismissed. Your calendar is unchanged.' });
  },
};
