import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from './appError.js';
import { logger } from '../logger.js';

export const errorHandler: ErrorRequestHandler = (error: unknown, request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: { code: error.code, message: error.message, ...(error.details === undefined ? {} : { details: error.details }) },
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details: error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })),
      },
    });
    return;
  }

  logger.error({ err: error, method: request.method, path: request.path }, 'Unhandled request error');
  response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
};