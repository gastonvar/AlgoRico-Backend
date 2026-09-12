import type { Ingredient } from '../../models/ingredient.js';
import type { Recipe } from '../../models/recipe.js';
import type { RecipeIngredient } from '../../models/recipe-ingredient.js';
import { quantityCost, roundMoney, roundUnitPrice, sumMoney } from '../../shared/money.js';
import { toPublicIngredient, type PublicIngredient } from '../ingredients/ingredients.mappers.js';

export type PublicRecipeIngredient = {
  id: string;
  recipeId: string;
  ingredientId: string;
  ingredient: PublicIngredient | null;
  quantity: number;
  lineCost: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicRecipe = {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  ingredients: PublicRecipeIngredient[];
  price: number;
  createdAt: string;
  updatedAt: string;
};

export function recipePriceFromLines(
  lines: Array<{ quantity: number | string; pricePerUnit: number | string }>,
): number {
  return roundMoney(sumMoney(lines.map((line) => quantityCost(line.quantity, line.pricePerUnit))));
}

export function toPublicRecipeIngredient(line: RecipeIngredient): PublicRecipeIngredient {
  const ingredient = (line.get('ingredient') as Ingredient | undefined) ?? null;
  const quantity = Number(line.quantity);
  const pricePerUnit = ingredient ? roundUnitPrice(ingredient.pricePerUnit) : 0;
  return {
    id: line.id,
    recipeId: line.recipeId,
    ingredientId: line.ingredientId,
    ingredient: ingredient ? toPublicIngredient(ingredient) : null,
    quantity,
    lineCost: quantityCost(quantity, pricePerUnit),
    notes: line.notes,
    createdAt: line.createdAt.toISOString(),
    updatedAt: line.updatedAt.toISOString(),
  };
}

export function toPublicRecipe(recipe: Recipe, options?: { includeIngredients?: boolean }): PublicRecipe {
  const lines = (recipe.get('ingredients') as RecipeIngredient[] | undefined) ?? [];
  const ingredients = lines.map(toPublicRecipeIngredient);
  return {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    notes: recipe.notes,
    ingredients: options?.includeIngredients === false ? [] : ingredients,
    price: recipePriceFromLines(
      ingredients.map((line) => ({
        quantity: line.quantity,
        pricePerUnit: line.ingredient?.pricePerUnit ?? 0,
      })),
    ),
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
  };
}
