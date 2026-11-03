import { app } from './app.js';
import { env } from './config/env.js';

process.on('unhandledRejection', (reason) => {
  console.warn('[Unhandled Rejection caught]:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception caught]:', err);
});

const PORT = Number(env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`[NRYN Backend] Server running on http://localhost:${PORT}`);
});
