import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { createForOrder, getById, listForOrder, remove, update } from './payments.controller.js';
import {
  createPaymentBodySchema,
  orderPaymentParamsSchema,
  paymentIdParamsSchema,
  updatePaymentBodySchema,
} from './payments.schemas.js';

export const paymentsRoutes = Router();
export const orderPaymentsRoutes = Router({ mergeParams: true });

orderPaymentsRoutes.get(
  '/',
  validateParams(orderPaymentParamsSchema),
  asyncHandler(listForOrder),
);
orderPaymentsRoutes.post(
  '/',
  validateParams(orderPaymentParamsSchema),
  validateBody(createPaymentBodySchema),
  asyncHandler(createForOrder),
);

paymentsRoutes.get(
  '/:paymentId',
  validateParams(paymentIdParamsSchema),
  asyncHandler(getById),
);
paymentsRoutes.patch(
  '/:paymentId',
  validateParams(paymentIdParamsSchema),
  validateBody(updatePaymentBodySchema),
  asyncHandler(update),
);
paymentsRoutes.delete(
  '/:paymentId',
  validateParams(paymentIdParamsSchema),
  asyncHandler(remove),
);
