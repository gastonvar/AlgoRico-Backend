import { Op, type Transaction, type WhereOptions } from 'sequelize';
import { sequelize } from '../../database/sequelize.js';
import { AppError } from '../../errors/app-error.js';
import { Ingredient, OrderItem, Recipe, RecipeIngredient } from '../../models/index.js';
import { paginationMeta, paginationOffset } from '../../shared/pagination.js';
import { getIngredientById } from '../ingredients/ingredients.service.js';
import { toPublicRecipe, type PublicRecipe } from './recipes.mappers.js';
import type {
  CreateRecipeBody,
  ListRecipesQuery,
  RecipeIngredientBody,
  ReplaceRecipeIngredientBody,
  UpdateRecipeBody,
} from './recipes.schemas.js';

const recipeInclude = [
  {
    model: RecipeIngredient,
    as: 'ingredients',
    include: [{ model: Ingredient, as: 'ingredient' }],
  },
];

function recipeSearchWhere(query: ListRecipesQuery): WhereOptions {
  if (!query.q) {
    return {};
  }
  return {
    name: { [Op.iLike]: `%${query.q}%` },
  };
}

async function assertUniqueIngredientIds(ingredients: RecipeIngredientBody[]): Promise<void> {
  const ids = ingredients.map((line) => line.ingredientId);
  if (new Set(ids).size !== ids.length) {
    throw AppError.validation('Each ingredient can only appear once in a recipe');
  }
}

async function replaceRecipeIngredients(
  recipeId: string,
  ingredients: ReplaceRecipeIngredientBody[],
  transaction: Transaction,
): Promise<void> {
  await assertUniqueIngredientIds(ingredients);
  for (const line of ingredients) {
    await getIngredientById(line.ingredientId);
  }

  await RecipeIngredient.destroy({ where: { recipeId }, transaction });
  await RecipeIngredient.bulkCreate(
    ingredients.map((line) => ({
      recipeId,
      ingredientId: line.ingredientId,
      quantity: line.quantity.toFixed(4),
      notes: line.notes ?? null,
    })),
    { transaction },
  );
}

export async function listRecipes(query: ListRecipesQuery): Promise<{
  data: PublicRecipe[];
  meta: ReturnType<typeof paginationMeta>;
}> {
  const { limit, offset } = paginationOffset(query);
  const { rows, count } = await Recipe.findAndCountAll({
    where: recipeSearchWhere(query),
    include: recipeInclude,
    order: [['name', 'ASC']],
    limit,
    offset,
    distinct: true,
  });

  return {
    data: rows.map((recipe) => toPublicRecipe(recipe)),
    meta: paginationMeta(query, count),
  };
}

export async function getRecipeRecord(recipeId: string, transaction?: Transaction): Promise<Recipe> {
  const recipe = await Recipe.findByPk(recipeId, {
    include: recipeInclude,
    order: [[{ model: RecipeIngredient, as: 'ingredients' }, 'createdAt', 'ASC']],
    transaction,
  });
  if (!recipe) {
    throw AppError.notFound('Recipe not found');
  }
  return recipe;
}

export async function getRecipe(recipeId: string): Promise<PublicRecipe> {
  return toPublicRecipe(await getRecipeRecord(recipeId));
}

export async function getRecipePrice(recipeId: string): Promise<{ name: string; price: number }> {
  const recipe = await getRecipe(recipeId);
  return { name: recipe.name, price: recipe.price };
}

export async function createRecipe(input: CreateRecipeBody): Promise<PublicRecipe> {
  await assertUniqueIngredientIds(input.ingredients);
  for (const line of input.ingredients) {
    await getIngredientById(line.ingredientId);
  }

  const recipe = await sequelize.transaction(async (transaction) => {
    const created = await Recipe.create(
      {
        name: input.name,
        description: input.description ?? null,
        notes: input.notes ?? null,
      },
      { transaction },
    );

    await RecipeIngredient.bulkCreate(
      input.ingredients.map((line) => ({
        recipeId: created.id,
        ingredientId: line.ingredientId,
        quantity: line.quantity.toFixed(4),
        notes: line.notes ?? null,
      })),
      { transaction },
    );

    return created;
  });

  return getRecipe(recipe.id);
}

export async function updateRecipe(recipeId: string, input: UpdateRecipeBody): Promise<PublicRecipe> {
  await sequelize.transaction(async (transaction) => {
    const recipe = await Recipe.findByPk(recipeId, { transaction });
    if (!recipe) {
      throw AppError.notFound('Recipe not found');
    }

    if (input.name !== undefined) recipe.name = input.name;
    if (input.description !== undefined) recipe.description = input.description;
    if (input.notes !== undefined) recipe.notes = input.notes;
    await recipe.save({ transaction });

    if (input.ingredients !== undefined) {
      await replaceRecipeIngredients(recipe.id, input.ingredients, transaction);
    }
  });

  return getRecipe(recipeId);
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  const recipe = await getRecipeRecord(recipeId);
  const usedCount = await OrderItem.count({ where: { recipeId } });
  if (usedCount > 0) {
    throw AppError.conflict('Recipe is used in orders');
  }
  await recipe.destroy();
}
