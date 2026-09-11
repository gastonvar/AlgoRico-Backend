import { DataTypes } from 'sequelize';
import type { Migration } from '../migrator.js';

export const up: Migration['up'] = async ({ context: queryInterface }) => {
  await queryInterface.sequelize.query(
    'ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;',
  );
  await queryInterface.removeColumn('order_items', 'product_id');
  await queryInterface.dropTable('products');
};

export const down: Migration['down'] = async ({ context: queryInterface }) => {
  await queryInterface.createTable('products', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    default_price: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('products', ['active'], { name: 'products_active_idx' });
  await queryInterface.addIndex('products', ['name'], { name: 'products_name_idx' });

  await queryInterface.addColumn('order_items', 'product_id', {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'products', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
};
