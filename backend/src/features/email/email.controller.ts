import { Request, Response } from 'express';
import { emailService } from './email.service.js';

export const emailController = {
  getOAuthUrl(req: Request, res: Response) {
    const userId = (req as any).userId || '00000000-0000-0000-0000-000000000001';
    const url = emailService.getOAuthUrl(userId);
    res.json({ url });
  },

  async handleOAuthCallback(req: Request, res: Response) {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const userId = state || (req as any).userId || '00000000-0000-0000-0000-000000000001';

    if (!code) {
      return res.status(400).send('OAuth authorization code missing.');
    }

    try {
      const account = await emailService.handleOAuthCallback(code, userId);
      const safeEmail = account?.email || 'User';

      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>NRYN · Gmail Connected</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background-color: #f7f6f2;
                color: #2b332b;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
              }
              .card {
                background: #ffffff;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.06);
                text-align: center;
                max-width: 440px;
                border: 1px solid #e3e1d8;
              }
              .badge {
                display: inline-block;
                width: 50px;
                height: 50px;
                line-height: 50px;
                border-radius: 50%;
                background: #e2ede5;
                color: #2e603d;
                font-size: 24px;
                margin-bottom: 16px;
              }
              h2 { margin: 0 0 10px 0; font-size: 22px; }
              p { color: #6e756e; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0; }
              .btn {
                background: #2b332b;
                color: #ffffff;
                padding: 12px 24px;
                border-radius: 12px;
                text-decoration: none;
                font-size: 14px;
                font-weight: 500;
                display: inline-block;
                cursor: pointer;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="badge">✓</div>
              <h2>Gmail Connected!</h2>
              <p>Connected as <strong>${safeEmail}</strong>.<br/>This window will close automatically.</p>
              <button class="btn" onclick="window.close();">Close Window ✕</button>
            </div>
            <script>
              // 1. Notify via BroadcastChannel
              try {
                var bc = new BroadcastChannel('nryn_oauth');
                bc.postMessage({ type: 'GMAIL_CONNECTED', email: '${safeEmail}' });
              } catch (e) {}

              // 2. Notify via localStorage storage event
              try {
                localStorage.setItem('nryn_gmail_connected', String(Date.now()));
              } catch (e) {}

              // 3. Notify via postMessage if opener exists
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({ type: 'GMAIL_CONNECTED', email: '${safeEmail}' }, '*');
                }
              } catch (e) {}

              // 4. Attempt to close window immediately
              window.close();
              setTimeout(function() { window.close(); }, 400);
              setTimeout(function() { window.close(); }, 1200);
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error('OAuth Callback Failed:', err);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h2>OAuth Connection Failed</h2>
            <p style="color: red;">${err.message}</p>
            <a href="http://localhost:8081">Return to NRYN</a>
          </body>
        </html>
      `);
    }
  },

  async getOAuthStatus(req: Request, res: Response) {
    const userId = (req as any).userId || '00000000-0000-0000-0000-000000000001';
    const status = await emailService.getOAuthStatus(userId);
    res.json(status);
  },

  async disconnectAccount(req: Request, res: Response) {
    const userId = (req as any).userId || '00000000-0000-0000-0000-000000000001';
    const result = await emailService.disconnectAccount(userId);
    res.json(result);
  },

  async syncEmails(req: Request, res: Response) {
    const userId = (req as any).userId || '00000000-0000-0000-0000-000000000001';
    const maxResults = req.body.maxResults ? Number(req.body.maxResults) : 15;

    try {
      const result = await emailService.syncEmails(userId, maxResults);
      res.json({ message: 'Sync completed successfully.', result });
    } catch (err: any) {
      console.error('Email sync failed:', err);
      res.status(500).json({ error: err.message || 'Email sync failed.' });
    }
  },

  async getSummary(req: Request, res: Response) {
    const userId = (req as any).userId || '00000000-0000-0000-0000-000000000001';
    const summary = await emailService.getSummary(userId);
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

  async generateDraft(req: Request, res: Response) {
    const { id } = req.params;
    const { instruction } = req.body;
    const userId = (req as any).userId || '00000000-0000-0000-0000-000000000001';

    try {
      const result = await emailService.generateDraft(id, userId, instruction);
      res.json(result);
    } catch (err: any) {
      console.error('Failed to generate draft:', err);
      res.status(500).json({ error: err.message || 'Draft generation failed' });
    }
  },

  async sendReply(req: Request, res: Response) {
    const { id } = req.params;
    const { body } = req.body;
    const userId = (req as any).userId || '00000000-0000-0000-0000-000000000001';

    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Reply body cannot be empty' });
    }

    try {
      const result = await emailService.sendReply(id, userId, body);
      res.json(result);
    } catch (err: any) {
      console.error('Failed to send reply:', err);
      res.status(500).json({ error: err.message || 'Sending reply failed' });
    }
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
