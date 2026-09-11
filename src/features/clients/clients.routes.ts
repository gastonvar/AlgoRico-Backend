import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { createForClient as createInteraction, listForClient as listInteractions } from '../interactions/interactions.controller.js';
import {
  clientInteractionParamsSchema,
  createInteractionBodySchema,
  listInteractionsQuerySchema,
} from '../interactions/interactions.schemas.js';
import { createForClient as createOrder } from '../orders/orders.controller.js';
import { createOrderBodySchema } from '../orders/orders.schemas.js';
import { create, getById, list, update } from './clients.controller.js';
import {
  clientIdParamsSchema,
  createClientBodySchema,
  listClientsQuerySchema,
  updateClientBodySchema,
} from './clients.schemas.js';

export const clientsRoutes = Router();

clientsRoutes.get('/', validateQuery(listClientsQuerySchema), asyncHandler(list));
clientsRoutes.post('/', validateBody(createClientBodySchema), asyncHandler(create));
clientsRoutes.get(
  '/:clientId',
  validateParams(clientIdParamsSchema),
  asyncHandler(getById),
);
clientsRoutes.patch(
  '/:clientId',
  validateParams(clientIdParamsSchema),
  validateBody(updateClientBodySchema),
  asyncHandler(update),
);
clientsRoutes.get(
  '/:clientId/interactions',
  validateParams(clientInteractionParamsSchema),
  validateQuery(listInteractionsQuerySchema),
  asyncHandler(listInteractions),
);
clientsRoutes.post(
  '/:clientId/interactions',
  validateParams(clientInteractionParamsSchema),
  validateBody(createInteractionBodySchema),
  asyncHandler(createInteraction),
);
clientsRoutes.post(
  '/:clientId/orders',
  validateParams(clientIdParamsSchema),
  validateBody(createOrderBodySchema),
  asyncHandler(createOrder),
);
