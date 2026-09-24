import type { Optional } from 'sequelize';
import { DataTypes, Model, type Sequelize } from 'sequelize';
import type { IngredientUnit } from '../shared/constants.js';

export type IngredientAttributes = {
  id: string;
  companyId: string;
  name: string;
  unit: IngredientUnit;
  pricePerUnit: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type IngredientCreationAttributes = Optional<
  IngredientAttributes,
  'id' | 'notes' | 'createdAt' | 'updatedAt'
>;

export class Ingredient extends Model<IngredientAttributes, IngredientCreationAttributes> {
  declare id: string;
  declare companyId: string;
  declare name: string;
  declare unit: IngredientUnit;
  declare pricePerUnit: string;
  declare notes: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initIngredientModel(sequelize: Sequelize): typeof Ingredient {
  Ingredient.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      companyId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      unit: {
        type: DataTypes.STRING(8),
        allowNull: false,
      },
      pricePerUnit: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      tableName: 'ingredients',
    },
  );

  return Ingredient;
}
