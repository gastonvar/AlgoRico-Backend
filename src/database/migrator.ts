import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { QueryInterface } from 'sequelize';
import { SequelizeStorage, Umzug } from 'umzug';
import { pinoLogger } from '../lib/pino.js';
import { sequelize } from './sequelize.js';

const migrationsPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

export const migrator = new Umzug({
  migrations: {
    glob: ['*.ts', { cwd: migrationsPath }],
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'sequelize_meta' }),
  logger: {
    info: (message) => pinoLogger.info(message),
    warn: (message) => pinoLogger.warn(message),
    error: (message) => pinoLogger.error(message),
    debug: (message) => pinoLogger.debug(message),
  },
});

export type Migration = {
  up: (params: { context: QueryInterface }) => Promise<void>;
  down: (params: { context: QueryInterface }) => Promise<void>;
};

const command = process.argv[2];

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const run = async (): Promise<void> => {
    if (command === 'down') {
      await migrator.down();
    } else {
      await migrator.up();
    }
    await sequelize.close();
  };

  run().catch((error: unknown) => {
    pinoLogger.error({ err: error }, 'Migration failed');
    process.exitCode = 1;
  });
}
