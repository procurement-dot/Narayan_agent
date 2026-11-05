import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { emailRouter } from './features/email/email.routes.js';
import { travelRouter } from './features/travel/travel.routes.js';
import { notesRouter } from './features/notes/notes.routes.js';
import { healthRouter } from './features/health/health.routes.js';
import { growthRoutes } from './features/growth/growth.routes.js';
import { kickstartRoutes } from './features/kickstart/kickstart.routes.js';

export const app = express();

app.use(helmet());
app.use(cors());
// Support up to 25MB for audio base64 uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Mount features
app.use('/api/email', emailRouter);
app.use('/api/travel', travelRouter);
app.use('/api/notes', notesRouter);
app.use('/api/health', healthRouter);
app.use('/api/growth', growthRoutes);
app.use('/api/kickstart', kickstartRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'nryn-backend', time: new Date().toISOString() });
});
