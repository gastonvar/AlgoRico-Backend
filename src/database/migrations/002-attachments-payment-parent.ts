import { DataTypes } from 'sequelize';
import type { Migration } from '../migrator.js';

export const up: Migration['up'] = async ({ context: queryInterface }) => {
  await queryInterface.changeColumn('attachments', 'interaction_id', {
    type: DataTypes.UUID,
    allowNull: true,
  });

  await queryInterface.addColumn('attachments', 'payment_id', {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'payments', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });

  await queryInterface.addIndex('attachments', ['payment_id'], {
    name: 'attachments_payment_id_idx',
  });

  await queryInterface.sequelize.query(`
    ALTER TABLE attachments
    ADD CONSTRAINT attachments_exactly_one_parent_chk
    CHECK (
      (interaction_id IS NOT NULL AND payment_id IS NULL)
      OR (interaction_id IS NULL AND payment_id IS NOT NULL)
    );
  `);
};

export const down: Migration['down'] = async ({ context: queryInterface }) => {
  await queryInterface.sequelize.query(
    'ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_exactly_one_parent_chk;',
  );
  await queryInterface.removeIndex('attachments', 'attachments_payment_id_idx');
  await queryInterface.removeColumn('attachments', 'payment_id');
  await queryInterface.changeColumn('attachments', 'interaction_id', {
    type: DataTypes.UUID,
    allowNull: false,
  });
};
