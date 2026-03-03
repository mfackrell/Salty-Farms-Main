import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use((helmet as any)());
  app.use((cors as any)({ origin: env.CORS_ORIGIN.split(',') }));
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger }));

  app.get('/health', (_req, res) => res.json({ data: { status: 'ok' }, error: null }));
  app.use('/api', routes);
  app.use(errorHandler);

  return app;
}

export default createApp();
