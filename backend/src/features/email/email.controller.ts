import { Request, Response } from 'express';
import { emailService } from './email.service.js';

export const emailController = {
  getOAuthUrl(req: Request, res: Response) {
    const userId = (req.query.userId as string) || (req as any).userId || '00000000-0000-0000-0000-000000000001';
    
    // Auto-detect production redirect URI if on Render or public server
    const host = req.get('host') || '';
    let redirectUri: string | undefined;
    if (host.includes('onrender.com') || host.includes('narayan-agent') || process.env.NODE_ENV === 'production') {
      redirectUri = `https://${host}/api/email/oauth/callback`;
    }

    const url = emailService.getOAuthUrl(userId, redirectUri);
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
      const host = req.get('host') || '';
      let redirectUri: string | undefined;
      if (host.includes('onrender.com') || host.includes('narayan-agent') || process.env.NODE_ENV === 'production') {
        redirectUri = `https://${host}/api/email/oauth/callback`;
      }

      const account = await emailService.handleOAuthCallback(code, userId, redirectUri);
      const safeEmail = account?.email || 'User';

      res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
      res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');

      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
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
                padding: 20px;
                box-sizing: border-box;
              }
              .card {
                background: #ffffff;
                padding: 36px 28px;
                border-radius: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.06);
                text-align: center;
                max-width: 440px;
                width: 100%;
                border: 1px solid #e3e1d8;
                box-sizing: border-box;
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
                padding: 14px 28px;
                border-radius: 12px;
                text-decoration: none;
                font-size: 14px;
                font-weight: 600;
                display: inline-block;
                cursor: pointer;
                border: none;
                width: 100%;
                box-sizing: border-box;
                margin-bottom: 12px;
              }
              .btn-secondary {
                background: transparent;
                color: #838883;
                padding: 10px 20px;
                border-radius: 10px;
                font-size: 13px;
                cursor: pointer;
                border: 1px solid #e3e1d8;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="badge">✓</div>
              <h2>Gmail Connected!</h2>
              <p>Successfully linked <strong>${safeEmail}</strong> with Narayan Agent.</p>
              <a href="nryn://email?connected=true" class="btn">Open Narayan App ➔</a>
              <div><button class="btn-secondary" onclick="window.close();">Close Window ✕</button></div>
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

              // 4. Auto-redirect on mobile to app
              try {
                setTimeout(function() {
                  window.location.href = "nryn://email?connected=true";
                }, 600);
              } catch (e) {}

              // 5. Attempt to close popup window
              setTimeout(function() { window.close(); }, 800);
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
    const email = (req.body?.email as string) || (req.query?.email as string) || undefined;
    const result = await emailService.disconnectAccount(userId, email);
    res.json(result);
  },

  async syncEmails(req: Request, res: Response) {
    const userId = (req as any).userId || '00000000-0000-0000-0000-000000000001';
    const maxResults = req.body.maxResults ? Number(req.body.maxResults) : 15;

    try {
      const result = await emailService.syncEmails(userId, maxResults);
      res.json({ message: 'Sync completed successfully.', result });
    } catch (err: any) {
      const errorDetail =
        err.response?.data?.error_description ||
        err.response?.data?.error ||
        err.message ||
        'Email sync failed.';
      console.error(`[EmailSync] Failed: ${errorDetail}`);
      res.status(err.response?.status || 500).json({ error: errorDetail });
    }
  },

  async getSummary(req: Request, res: Response) {
    const userId = (req as any).userId || '00000000-0000-0000-0000-000000000001';
    const accountEmail = req.query.accountEmail as string | undefined;
    const summary = await emailService.getSummary(userId, accountEmail);
    res.json(summary);
  },

  async listEmails(req: Request, res: Response) {
    const userId = (req as any).userId || '00000000-0000-0000-0000-000000000001';
    const tab = req.query.tab as string | undefined;
    const accountEmail = req.query.accountEmail as string | undefined;
    const emails = await emailService.listEmails(userId, tab, accountEmail);
    res.json(emails);
  },

  async saveDraft(req: Request, res: Response) {
    const { id } = req.params;
    const { body } = req.body;
    const userId = (req as any).userId || '00000000-0000-0000-0000-000000000001';

    if (body === undefined || body === null) {
      return res.status(400).json({ error: 'Draft body is required' });
    }

    const safeBody = typeof body === 'string' ? body : '';
    const result = await emailService.saveDraft(id, userId, safeBody);
    res.json({ message: 'Draft saved locally; nothing sent.', result });
  },

  async generateDraft(req: Request, res: Response) {
    const { id } = req.params;
    const { instruction, subject, content, fromName, fromEmail } = req.body;
    const userId = (req as any).userId || '00000000-0000-0000-0000-000000000001';

    try {
      const result = await emailService.generateDraft(id, userId, instruction, {
        subject,
        content,
        fromName,
        fromEmail,
      });
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
