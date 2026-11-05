import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { loadEnv } from './config/env.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { router } from './routes/index.js';

export function createApp() {
  const env = loadEnv();
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: [env.FRONTEND_ORIGIN], credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use('/api', router);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
