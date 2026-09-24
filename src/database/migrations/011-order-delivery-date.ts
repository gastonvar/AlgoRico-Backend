import { DataTypes } from 'sequelize';
import type { Migration } from '../migrator.js';

export const up: Migration['up'] = async ({ context: queryInterface }) => {
  await queryInterface.addColumn('orders', 'delivery_date', {
    type: DataTypes.DATEONLY,
    allowNull: true,
  });
};

export const down: Migration['down'] = async ({ context: queryInterface }) => {
  await queryInterface.removeColumn('orders', 'delivery_date');
};
