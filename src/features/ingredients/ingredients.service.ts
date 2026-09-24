import { Op, type WhereOptions } from 'sequelize';
import { AppError } from '../../errors/app-error.js';
import { Ingredient, RecipeIngredient } from '../../models/index.js';
import { paginationMeta, paginationOffset } from '../../shared/pagination.js';
import { roundUnitPrice } from '../../shared/money.js';
import { toPublicIngredient, type PublicIngredient } from './ingredients.mappers.js';
import type {
  CreateIngredientBody,
  ListIngredientsQuery,
  UpdateIngredientBody,
} from './ingredients.schemas.js';

function ingredientSearchWhere(companyId: string, query: ListIngredientsQuery): WhereOptions {
  const where: WhereOptions = { companyId };
  if (query.q) {
    where.name = { [Op.iLike]: `%${query.q}%` };
  }
  return where;
}

export async function listIngredients(
  companyId: string,
  query: ListIngredientsQuery,
): Promise<{
  data: PublicIngredient[];
  meta: ReturnType<typeof paginationMeta>;
}> {
  const { limit, offset } = paginationOffset(query);
  const { rows, count } = await Ingredient.findAndCountAll({
    where: ingredientSearchWhere(companyId, query),
    order: [['name', 'ASC']],
    limit,
    offset,
  });

  return {
    data: rows.map(toPublicIngredient),
    meta: paginationMeta(query, count),
  };
}

export async function getIngredientById(ingredientId: string, companyId: string): Promise<Ingredient> {
  const ingredient = await Ingredient.findOne({ where: { id: ingredientId, companyId } });
  if (!ingredient) {
    throw AppError.notFound('Ingredient not found');
  }
  return ingredient;
}

export async function getIngredient(ingredientId: string, companyId: string): Promise<PublicIngredient> {
  return toPublicIngredient(await getIngredientById(ingredientId, companyId));
}

export async function createIngredient(
  companyId: string,
  input: CreateIngredientBody,
): Promise<PublicIngredient> {
  const ingredient = await Ingredient.create({
    companyId,
    name: input.name,
    unit: input.unit,
    pricePerUnit: roundUnitPrice(input.pricePerUnit).toFixed(4),
    notes: input.notes ?? null,
  });
  return toPublicIngredient(ingredient);
}

export async function updateIngredient(
  ingredientId: string,
  companyId: string,
  input: UpdateIngredientBody,
): Promise<PublicIngredient> {
  const ingredient = await getIngredientById(ingredientId, companyId);

  if (input.name !== undefined) ingredient.name = input.name;
  if (input.unit !== undefined) ingredient.unit = input.unit;
  if (input.notes !== undefined) ingredient.notes = input.notes;
  if (input.pricePerUnit !== undefined) {
    ingredient.pricePerUnit = roundUnitPrice(input.pricePerUnit).toFixed(4);
  }

  await ingredient.save();
  return toPublicIngredient(ingredient);
}

export async function deleteIngredient(ingredientId: string, companyId: string): Promise<void> {
  const ingredient = await getIngredientById(ingredientId, companyId);
  const usedCount = await RecipeIngredient.count({ where: { ingredientId } });
  if (usedCount > 0) {
    throw AppError.conflict('Ingredient is used in recipes');
  }
  await ingredient.destroy();
}
