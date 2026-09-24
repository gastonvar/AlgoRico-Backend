import { DataTypes } from 'sequelize';
import type { Migration } from '../migrator.js';
import { ALGORICO_COMPANY_ID } from '../../shared/companies.js';

const TABLES = [
  'users',
  'clients',
  'ingredients',
  'recipes',
  'tasks',
  'orders',
  'interactions',
  'payments',
  'attachments',
] as const;

export const up: Migration['up'] = async ({ context: queryInterface }) => {
  for (const table of TABLES) {
    // 1. Add the column nullable first so it can be backfilled on tables that
    //    already have rows (local dev fixtures and, importantly, production
    //    data that predates multi-tenancy).
    await queryInterface.addColumn(table, 'company_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'companies', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });

    // 2. Every row that already exists in this database belongs to the
    //    original single tenant, Algo Rico.
    await queryInterface.sequelize.query(
      `UPDATE "${table}" SET company_id = :companyId WHERE company_id IS NULL;`,
      { replacements: { companyId: ALGORICO_COMPANY_ID } },
    );

    // 3. Now that every row has a value, enforce it going forward.
    await queryInterface.changeColumn(table, 'company_id', {
      type: DataTypes.UUID,
      allowNull: false,
    });

    await queryInterface.addIndex(table, ['company_id'], {
      name: `${table}_company_id_idx`,
    });
  }

  // Users must be unique per email within the whole system (login is by
  // email only, not scoped by company), so no change needed there beyond
  // the index above.
};

export const down: Migration['down'] = async ({ context: queryInterface }) => {
  for (const table of [...TABLES].reverse()) {
    await queryInterface.removeIndex(table, `${table}_company_id_idx`);
    await queryInterface.removeColumn(table, 'company_id');
  }
};
