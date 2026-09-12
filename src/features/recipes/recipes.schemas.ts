import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/pagination.js';
import { idParams, optionalTrimmed } from '../../shared/schemas.js';

export const recipeIdParamsSchema = idParams('recipeId');

export const listRecipesQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(255).optional(),
});

export const recipeIngredientBodySchema = z.object({
  ingredientId: z.string().uuid(),
  quantity: z.coerce.number().positive().finite().max(1_000_000),
  notes: optionalTrimmed,
});

export const createRecipeBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: optionalTrimmed,
  notes: optionalTrimmed,
  ingredients: z.array(recipeIngredientBodySchema).min(1),
});

export const replaceRecipeIngredientBodySchema = recipeIngredientBodySchema.extend({
  id: z.string().uuid().optional(),
});

export const updateRecipeBodySchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(10_000).nullable().optional(),
    notes: z.string().trim().max(10_000).nullable().optional(),
    ingredients: z.array(replaceRecipeIngredientBodySchema).min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export type ListRecipesQuery = z.infer<typeof listRecipesQuerySchema>;
export type CreateRecipeBody = z.infer<typeof createRecipeBodySchema>;
export type UpdateRecipeBody = z.infer<typeof updateRecipeBodySchema>;
export type RecipeIngredientBody = z.infer<typeof recipeIngredientBodySchema>;
export type ReplaceRecipeIngredientBody = z.infer<typeof replaceRecipeIngredientBodySchema>;
