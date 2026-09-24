import { hashPassword } from '../lib/crypto.js';
import { pinoLogger } from '../lib/pino.js';
import { User, initModels } from '../models/index.js';
import { sequelize } from './sequelize.js';

initModels();

async function createOwner(): Promise<void> {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD;

  if (!email || !password) {
    return;
  }

  if (password.length < 12) {
    throw new Error('OWNER_PASSWORD must be at least 12 characters');
  }

  await sequelize.authenticate();

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    pinoLogger.info({ email }, 'Owner user already exists; skipping');
    return;
  }

  await User.create({
    email,
    passwordHash: await hashPassword(password),
    active: true,
  });

  pinoLogger.info({ email }, 'Created initial owner user');
}

createOwner()
  .catch((error: unknown) => {
    pinoLogger.error({ err: error }, 'Owner bootstrap failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
