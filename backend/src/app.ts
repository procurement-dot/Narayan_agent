import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { emailRouter } from './features/email/email.routes.js';
import { travelRouter } from './features/travel/travel.routes.js';
import { notesRouter } from './features/notes/notes.routes.js';
import { healthRouter } from './features/health/health.routes.js';
import { calendarRouter } from './features/calendar/calendar.routes.js';
import { workRouter } from './features/work/work.routes.js';
import { growthRoutes } from './features/growth/growth.routes.js';
import { kickstartRoutes } from './features/kickstart/kickstart.routes.js';
import { financeRouter } from './features/finance/finance.routes.js';

export const app = express();

app.use(
  helmet({
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  })
);
app.use(cors());
// Support up to 25MB for audio base64 uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Multi-tenant device/user isolation middleware
app.use((req, _res, next) => {
  const headerUserId = req.headers['x-user-id'] as string | undefined;
  const queryUserId = req.query.userId as string | undefined;
  const bodyUserId = req.body && typeof req.body === 'object' ? req.body.userId : undefined;
  const raw = headerUserId || queryUserId || bodyUserId;

  if (
    raw &&
    typeof raw === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw.trim())
  ) {
    (req as any).userId = raw.trim();
  } else {
    (req as any).userId = '00000000-0000-0000-0000-000000000001';
  }
  next();
});

// Mount features
app.use('/api/email', emailRouter);
app.use('/api/travel', travelRouter);
app.use('/api/notes', notesRouter);
app.use('/api/health', healthRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/work', workRouter);
app.use('/api/growth', growthRoutes);
app.use('/api/kickstart', kickstartRoutes);
app.use('/api/finance', financeRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'nryn-backend', time: new Date().toISOString() });
});
