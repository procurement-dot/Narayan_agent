import { app } from './app.js';
import { env } from './config/env.js';
import { emailService } from './features/email/email.service.js';
import { freePort } from './shared/utils/port.js';
import { seedAllData } from './db/seed_all.js';

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

const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[NRYN Backend] Server running on http://localhost:${PORT}`);
  emailService.startBackgroundSync(15000);
  try {
    await seedAllData();
  } catch (seedErr) {
    console.warn('[NRYN Backend] Seed verification skipped:', seedErr);
  }
});

let portRetries = 0;
const MAX_PORT_RETRIES = 3;

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    if (portRetries >= MAX_PORT_RETRIES) {
      console.error(`[NRYN Backend] Port ${PORT} is occupied by another process and could not be released.`);
      console.error(`[NRYN Backend] Please run: npx kill-port ${PORT} and restart.`);
      process.exit(1);
    }
    portRetries++;
    console.warn(`[NRYN Backend] Port ${PORT} is busy (attempt ${portRetries}/${MAX_PORT_RETRIES}). Re-attempting release...`);
    try {
      freePort(PORT);
      setTimeout(() => {
        try { server.close(); } catch {}
        server.listen(PORT, '0.0.0.0', async () => {
          console.log(`[NRYN Backend] Recovered and server running on http://localhost:${PORT}`);
          emailService.startBackgroundSync(15000);
          try {
            await seedAllData();
          } catch {}
        });
      }, 700);
    } catch (killErr) {
      console.error(`[NRYN Backend] Failed to auto-release port ${PORT}:`, killErr);
    }
  } else {
    console.error('[NRYN Backend] Server error:', err);
  }
});
