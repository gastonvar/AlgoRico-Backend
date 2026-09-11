import { env } from './config/env.js';
import { sequelize } from './database/sequelize.js';
import { createApp } from './app.js';
import { pinoLogger } from './lib/pino.js';
import { storage } from './lib/storage.js';

const app = createApp();

async function start(): Promise<void> {
  await sequelize.authenticate();
  await storage.ensureReady();

  const server = app.listen(env.PORT, () => {
    pinoLogger.info({ port: env.PORT }, 'Algo Rico API listening');
  });

  const shutdown = (signal: string) => {
    pinoLogger.info({ signal }, 'Shutting down');
    server.close(() => {
      void sequelize.close().finally(() => process.exit(0));
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error: unknown) => {
  pinoLogger.error({ err: error }, 'Failed to start server');
  process.exit(1);
});
