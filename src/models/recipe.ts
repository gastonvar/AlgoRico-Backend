import type { Optional } from 'sequelize';
import { DataTypes, Model, type Sequelize } from 'sequelize';

export type RecipeAttributes = {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RecipeCreationAttributes = Optional<
  RecipeAttributes,
  'id' | 'description' | 'notes' | 'createdAt' | 'updatedAt'
>;

export class Recipe extends Model<RecipeAttributes, RecipeCreationAttributes> {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare notes: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initRecipeModel(sequelize: Sequelize): typeof Recipe {
  Recipe.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      tableName: 'recipes',
    },
  );

  return Recipe;
}
