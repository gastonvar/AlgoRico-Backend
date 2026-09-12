import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { create, getById, list, remove, update } from './recipes.controller.js';
import {
  createRecipeBodySchema,
  listRecipesQuerySchema,
  recipeIdParamsSchema,
  updateRecipeBodySchema,
} from './recipes.schemas.js';

export const recipesRoutes = Router();

recipesRoutes.get('/', validateQuery(listRecipesQuerySchema), asyncHandler(list));
recipesRoutes.post('/', validateBody(createRecipeBodySchema), asyncHandler(create));
recipesRoutes.get('/:recipeId', validateParams(recipeIdParamsSchema), asyncHandler(getById));
recipesRoutes.patch(
  '/:recipeId',
  validateParams(recipeIdParamsSchema),
  validateBody(updateRecipeBodySchema),
  asyncHandler(update),
);
recipesRoutes.delete('/:recipeId', validateParams(recipeIdParamsSchema), asyncHandler(remove));
