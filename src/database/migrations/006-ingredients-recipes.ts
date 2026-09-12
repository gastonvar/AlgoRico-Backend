import { DataTypes } from 'sequelize';
import type { Migration } from '../migrator.js';

export const up: Migration['up'] = async ({ context: queryInterface }) => {
  await queryInterface.createTable('ingredients', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    unit: { type: DataTypes.STRING(8), allowNull: false },
    price_per_unit: { type: DataTypes.DECIMAL(12, 4), allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('recipes', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('recipe_ingredients', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    recipe_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'recipes', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    ingredient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'ingredients', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    quantity: { type: DataTypes.DECIMAL(12, 4), allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addColumn('order_items', 'recipe_id', {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'recipes', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  await queryInterface.addIndex('ingredients', ['name'], { name: 'ingredients_name_idx' });
  await queryInterface.addIndex('recipes', ['name'], { name: 'recipes_name_idx' });
  await queryInterface.addIndex('recipe_ingredients', ['recipe_id'], {
    name: 'recipe_ingredients_recipe_id_idx',
  });
  await queryInterface.addIndex('recipe_ingredients', ['ingredient_id'], {
    name: 'recipe_ingredients_ingredient_id_idx',
  });
  await queryInterface.addIndex('recipe_ingredients', ['recipe_id', 'ingredient_id'], {
    name: 'recipe_ingredients_recipe_ingredient_unique',
    unique: true,
  });
  await queryInterface.addIndex('order_items', ['recipe_id'], { name: 'order_items_recipe_id_idx' });

  await queryInterface.sequelize.query(
    'CREATE INDEX ingredients_name_trgm_idx ON ingredients USING gin (name gin_trgm_ops);',
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX recipes_name_trgm_idx ON recipes USING gin (name gin_trgm_ops);',
  );
};

export const down: Migration['down'] = async ({ context: queryInterface }) => {
  await queryInterface.sequelize.query('DROP INDEX IF EXISTS recipes_name_trgm_idx;');
  await queryInterface.sequelize.query('DROP INDEX IF EXISTS ingredients_name_trgm_idx;');
  await queryInterface.removeIndex('order_items', 'order_items_recipe_id_idx');
  await queryInterface.removeColumn('order_items', 'recipe_id');
  await queryInterface.dropTable('recipe_ingredients');
  await queryInterface.dropTable('recipes');
  await queryInterface.dropTable('ingredients');
};
