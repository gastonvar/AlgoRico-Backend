import { z } from 'zod';
import { INGREDIENT_UNITS } from '../../shared/constants.js';
import { paginationQuerySchema } from '../../shared/pagination.js';
import { idParams, optionalTrimmed } from '../../shared/schemas.js';

export const ingredientIdParamsSchema = idParams('ingredientId');

export const listIngredientsQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(255).optional(),
});

const unitPriceSchema = z.coerce.number().nonnegative().finite();

export const createIngredientBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  unit: z.enum(INGREDIENT_UNITS),
  pricePerUnit: unitPriceSchema,
  notes: optionalTrimmed,
});

export const updateIngredientBodySchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    unit: z.enum(INGREDIENT_UNITS).optional(),
    pricePerUnit: unitPriceSchema.optional(),
    notes: z.string().trim().max(10_000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export type ListIngredientsQuery = z.infer<typeof listIngredientsQuerySchema>;
export type CreateIngredientBody = z.infer<typeof createIngredientBodySchema>;
export type UpdateIngredientBody = z.infer<typeof updateIngredientBodySchema>;
