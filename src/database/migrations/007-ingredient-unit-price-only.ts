import type { Migration } from '../migrator.js';

export const up: Migration['up'] = async ({ context: queryInterface }) => {
  await queryInterface.sequelize.query(`
    ALTER TABLE ingredients
      DROP COLUMN IF EXISTS package_quantity,
      DROP COLUMN IF EXISTS price;
  `);
};

export const down: Migration['down'] = async ({ context: queryInterface }) => {
  await queryInterface.sequelize.query(`
    ALTER TABLE ingredients
      ADD COLUMN IF NOT EXISTS price DECIMAL(12, 2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS package_quantity DECIMAL(12, 4) NOT NULL DEFAULT 1;
  `);
};
