import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import {
  createForOrder as createInteraction,
  listForOrder as listInteractions,
} from '../interactions/interactions.controller.js';
import {
  createInteractionBodySchema,
  listInteractionsQuerySchema,
  orderInteractionParamsSchema,
} from '../interactions/interactions.schemas.js';
import {
  addItem,
  getById,
  list,
  remove,
  removeItem,
  update,
  updateItem,
} from './orders.controller.js';
import {
  listOrdersQuerySchema,
  orderIdParamsSchema,
  orderItemBodySchema,
  orderItemParamsSchema,
  updateOrderBodySchema,
  updateOrderItemBodySchema,
} from './orders.schemas.js';

export const ordersRoutes = Router();

ordersRoutes.get('/', validateQuery(listOrdersQuerySchema), asyncHandler(list));
ordersRoutes.get('/:orderId', validateParams(orderIdParamsSchema), asyncHandler(getById));
ordersRoutes.patch(
  '/:orderId',
  validateParams(orderIdParamsSchema),
  validateBody(updateOrderBodySchema),
  asyncHandler(update),
);
ordersRoutes.delete('/:orderId', validateParams(orderIdParamsSchema), asyncHandler(remove));
ordersRoutes.get(
  '/:orderId/interactions',
  validateParams(orderInteractionParamsSchema),
  validateQuery(listInteractionsQuerySchema),
  asyncHandler(listInteractions),
);
ordersRoutes.post(
  '/:orderId/interactions',
  validateParams(orderInteractionParamsSchema),
  validateBody(createInteractionBodySchema),
  asyncHandler(createInteraction),
);
ordersRoutes.post(
  '/:orderId/items',
  validateParams(orderIdParamsSchema),
  validateBody(orderItemBodySchema),
  asyncHandler(addItem),
);
ordersRoutes.patch(
  '/:orderId/items/:itemId',
  validateParams(orderItemParamsSchema),
  validateBody(updateOrderItemBodySchema),
  asyncHandler(updateItem),
);
ordersRoutes.delete(
  '/:orderId/items/:itemId',
  validateParams(orderItemParamsSchema),
  asyncHandler(removeItem),
);
