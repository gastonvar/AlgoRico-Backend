import type { Ingredient } from '../../models/ingredient.js';
import { roundUnitPrice } from '../../shared/money.js';
import type { IngredientUnit } from '../../shared/constants.js';

export type PublicIngredient = {
  id: string;
  name: string;
  unit: IngredientUnit;
  pricePerUnit: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export function toPublicIngredient(ingredient: Ingredient): PublicIngredient {
  return {
    id: ingredient.id,
    name: ingredient.name,
    unit: ingredient.unit,
    pricePerUnit: roundUnitPrice(ingredient.pricePerUnit),
    notes: ingredient.notes,
    createdAt: ingredient.createdAt.toISOString(),
    updatedAt: ingredient.updatedAt.toISOString(),
  };
}
