import { z } from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().default('*'),
});

export interface AppConfig {
  port: number;
  environment: 'development' | 'test' | 'production';
  corsOrigins: string[] | '*';
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const config = configSchema.parse(environment);
  return {
    port: config.PORT,
    environment: config.NODE_ENV,
    corsOrigins: config.CORS_ORIGIN === '*' ? '*' : config.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean),
  };
}