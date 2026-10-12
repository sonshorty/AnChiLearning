import pino from 'pino';

export const logger = pino({
  level: 'info',
  redact: ['req.headers.authorization', 'password', 'token'],
});