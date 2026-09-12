import type { Optional } from 'sequelize';
import { DataTypes, Model, type Sequelize } from 'sequelize';

export type RecipeIngredientAttributes = {
  id: string;
  recipeId: string;
  ingredientId: string;
  quantity: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RecipeIngredientCreationAttributes = Optional<
  RecipeIngredientAttributes,
  'id' | 'notes' | 'createdAt' | 'updatedAt'
>;

export class RecipeIngredient extends Model<RecipeIngredientAttributes, RecipeIngredientCreationAttributes> {
  declare id: string;
  declare recipeId: string;
  declare ingredientId: string;
  declare quantity: string;
  declare notes: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initRecipeIngredientModel(sequelize: Sequelize): typeof RecipeIngredient {
  RecipeIngredient.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      recipeId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      ingredientId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      quantity: {
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
      tableName: 'recipe_ingredients',
    },
  );

  return RecipeIngredient;
}
