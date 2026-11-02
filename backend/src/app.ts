import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { emailRouter } from './features/email/email.routes.js';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Mount features
app.use('/api/email', emailRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'nryn-backend', time: new Date().toISOString() });
});
