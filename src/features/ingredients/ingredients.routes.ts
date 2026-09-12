import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { create, getById, list, remove, update } from './ingredients.controller.js';
import {
  createIngredientBodySchema,
  ingredientIdParamsSchema,
  listIngredientsQuerySchema,
  updateIngredientBodySchema,
} from './ingredients.schemas.js';

export const ingredientsRoutes = Router();

ingredientsRoutes.get('/', validateQuery(listIngredientsQuerySchema), asyncHandler(list));
ingredientsRoutes.post('/', validateBody(createIngredientBodySchema), asyncHandler(create));
ingredientsRoutes.get(
  '/:ingredientId',
  validateParams(ingredientIdParamsSchema),
  asyncHandler(getById),
);
ingredientsRoutes.patch(
  '/:ingredientId',
  validateParams(ingredientIdParamsSchema),
  validateBody(updateIngredientBodySchema),
  asyncHandler(update),
);
ingredientsRoutes.delete(
  '/:ingredientId',
  validateParams(ingredientIdParamsSchema),
  asyncHandler(remove),
);
