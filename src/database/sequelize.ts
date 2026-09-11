import { Sequelize } from 'sequelize';
import { env, isDevelopment, isTest } from '../config/env.js';
import { pinoLogger } from '../lib/pino.js';

export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging: isDevelopment && !isTest ? (sql) => pinoLogger.debug({ sql }, 'sequelize') : false,
  define: {
    underscored: true,
  },
  pool: {
    max: 10,
    min: 0,
    idle: 10_000,
  },
});
