import { app } from './app.js';
import { env } from './config/env.js';
import { emailService } from './features/email/email.service.js';
import { freePort } from './shared/utils/port.js';

process.on('unhandledRejection', (reason) => {
  console.warn('[Unhandled Rejection caught]:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception caught]:', err);
});

const PORT = Number(env.PORT) || 4000;

// Proactively free port if a stale process is lingering
try {
  freePort(PORT);
} catch (e) {
  // Continue even if freePort fails
}

const server = app.listen(PORT, () => {
  console.log(`[NRYN Backend] Server running on http://localhost:${PORT}`);
  emailService.startBackgroundSync(15000);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[NRYN Backend] Port ${PORT} was still busy. Re-attempting automatic port release...`);
    try {
      freePort(PORT);
      setTimeout(() => {
        server.close();
        server.listen(PORT, () => {
          console.log(`[NRYN Backend] Recovered and server running on http://localhost:${PORT}`);
          emailService.startBackgroundSync(15000);
        });
      }, 600);
    } catch (killErr) {
      console.error(`[NRYN Backend] Failed to auto-release port ${PORT}:`, killErr);
    }
  } else {
    console.error('[NRYN Backend] Server error:', err);
  }
});
