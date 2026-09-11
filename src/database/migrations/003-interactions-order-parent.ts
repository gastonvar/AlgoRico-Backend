import { DataTypes } from 'sequelize';
import type { Migration } from '../migrator.js';

export const up: Migration['up'] = async ({ context: queryInterface }) => {
  await queryInterface.addColumn('interactions', 'order_id', {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'orders', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addIndex('interactions', ['order_id', 'occurred_at'], {
    name: 'interactions_order_id_occurred_at_idx',
  });
};

export const down: Migration['down'] = async ({ context: queryInterface }) => {
  await queryInterface.removeIndex('interactions', 'interactions_order_id_occurred_at_idx');
  await queryInterface.removeColumn('interactions', 'order_id');
};
