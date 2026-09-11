import pino from 'pino';
import { env, isDevelopment } from '../config/env.js';

export const pinoLogger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'req.headers["x-csrf-token"]',
      'password',
      'passwordHash',
      '*.password',
      '*.passwordHash',
      'MINIO_ACCESS_KEY',
      'MINIO_SECRET_KEY',
      'SESSION_SECRET',
    ],
    remove: true,
  },
  ...(isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      }
    : {}),
});
