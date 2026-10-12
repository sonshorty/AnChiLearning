import cors from 'cors';
import express from 'express';
import { pinoHttp } from 'pino-http';
import { loadConfig, type AppConfig } from './config.js';
import { AppError } from './errors/appError.js';
import { errorHandler } from './errors/errorHandler.js';
import { logger } from './logger.js';
import { createApiRouter } from './routes/apiRoutes.js';
import { createServices, type AppServices } from './services/registry.js';

export function createApp(services: AppServices = createServices(), config: AppConfig = loadConfig()) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger, redact: ['req.headers.authorization'] }));
  app.use('/api', createApiRouter(services));
  app.use((_request, _response, next) => next(new AppError(404, 'NOT_FOUND', 'Route was not found.')));
  app.use(errorHandler);
  return app;
}