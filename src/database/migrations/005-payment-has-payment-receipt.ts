import { DataTypes } from 'sequelize';
import type { Migration } from '../migrator.js';

export const up: Migration['up'] = async ({ context: queryInterface }) => {
  await queryInterface.addColumn('payments', 'has_payment_receipt', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
};

export const down: Migration['down'] = async ({ context: queryInterface }) => {
  await queryInterface.removeColumn('payments', 'has_payment_receipt');
};
