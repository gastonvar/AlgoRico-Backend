import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { getById, remove, update } from './interactions.controller.js';
import {
  interactionIdParamsSchema,
  updateInteractionBodySchema,
} from './interactions.schemas.js';

export const interactionsRoutes = Router();

interactionsRoutes.get(
  '/:interactionId',
  validateParams(interactionIdParamsSchema),
  asyncHandler(getById),
);
interactionsRoutes.patch(
  '/:interactionId',
  validateParams(interactionIdParamsSchema),
  validateBody(updateInteractionBodySchema),
  asyncHandler(update),
);
interactionsRoutes.delete(
  '/:interactionId',
  validateParams(interactionIdParamsSchema),
  asyncHandler(remove),
);
