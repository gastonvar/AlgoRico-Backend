import { randomUUID } from 'node:crypto';
import type { Migration } from '../migrator.js';
import { AROME_COMPANY_ID } from '../../shared/companies.js';
import { hashPassword } from '../../lib/crypto.js';

/**
 * Creates the two Arome accounts in every environment this migration runs
 * in (including production). Passwords are temporary; each person should
 * change theirs after first login once that flow exists.
 */
const AROME_USERS = [
  { email: 'antonelita260107@gmail.com', password: 'Dune7969%' },
  { email: 'hallerjanire8@gmail.com', password: 'Nube4433!' },
] as const;

export const up: Migration['up'] = async ({ context: queryInterface }) => {
  const now = new Date();

  for (const account of AROME_USERS) {
    const [existing] = (await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE email = :email LIMIT 1;',
      { replacements: { email: account.email } },
    )) as [Array<{ id: string }>, unknown];

    if (existing.length > 0) {
      continue;
    }

    await queryInterface.bulkInsert('users', [
      {
        id: randomUUID(),
        email: account.email,
        password_hash: await hashPassword(account.password),
        active: true,
        company_id: AROME_COMPANY_ID,
        created_at: now,
        updated_at: now,
      },
    ]);
  }
};

export const down: Migration['down'] = async ({ context: queryInterface }) => {
  await queryInterface.bulkDelete('users', {
    email: AROME_USERS.map((account) => account.email),
  });
};
