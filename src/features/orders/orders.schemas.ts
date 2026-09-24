import { z } from 'zod';
import {
  FULFILLMENT_TYPES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from '../../shared/constants.js';
import { paginationQuerySchema } from '../../shared/pagination.js';
import { dateOnlySchema, idParams, optionalTrimmed, timeSchema } from '../../shared/schemas.js';


export const orderIdParamsSchema = idParams('orderId');
export const orderItemParamsSchema = z.object({
  orderId: z.string().uuid(),
  itemId: z.string().uuid(),
});

const moneyAmountSchema = z.coerce.number().nonnegative().finite();

export const orderItemBodySchema = z.object({
  recipeId: z.string().uuid().optional(),
  description: z.string().trim().min(1).max(500).optional(),
  quantity: z.coerce.number().int().positive().max(10_000),
  unitPrice: z.coerce.number().nonnegative().finite().optional(),
  notes: optionalTrimmed,
});

export const createOrderBodySchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  eventDate: dateOnlySchema.optional(),
  eventTime: timeSchema.optional(),
  description: optionalTrimmed,
  fulfillmentType: z.enum(FULFILLMENT_TYPES).optional(),
  deliveryDate: dateOnlySchema.optional(),
  deliveryAddress: optionalTrimmed,
  deliveryTime: timeSchema.optional(),
  notes: optionalTrimmed,
  totalAmount: moneyAmountSchema,
  items: z.array(orderItemBodySchema).optional(),
});


export const replaceOrderItemBodySchema = orderItemBodySchema.extend({
  id: z.string().uuid().optional(),
});

export const updateOrderBodySchema = z
  .object({
    status: z.enum(ORDER_STATUSES).optional(),
    eventDate: dateOnlySchema.nullable().optional(),
    eventTime: timeSchema.nullable().optional(),
    description: z.string().trim().max(10_000).nullable().optional(),
    fulfillmentType: z.enum(FULFILLMENT_TYPES).optional(),
    deliveryDate: dateOnlySchema.nullable().optional(),
    deliveryAddress: z.string().trim().max(10_000).nullable().optional(),
    deliveryTime: timeSchema.nullable().optional(),
    notes: z.string().trim().max(10_000).nullable().optional(),
    totalAmount: moneyAmountSchema.optional(),
    items: z.array(replaceOrderItemBodySchema).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export const updateOrderItemBodySchema = z
  .object({
    recipeId: z.string().uuid().nullable().optional(),
    description: z.string().trim().min(1).max(500).optional(),
    quantity: z.coerce.number().int().positive().max(10_000).optional(),
    unitPrice: z.coerce.number().nonnegative().finite().optional(),
    notes: z.string().trim().max(10_000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export const listOrdersQuerySchema = paginationQuerySchema.extend({
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  fulfillmentType: z.enum(FULFILLMENT_TYPES).optional(),
  clientId: z.string().uuid().optional(),
  q: z.string().trim().max(255).optional(),
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
});

export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;
export type UpdateOrderBody = z.infer<typeof updateOrderBodySchema>;
export type OrderItemBody = z.infer<typeof orderItemBodySchema>;
export type ReplaceOrderItemBody = z.infer<typeof replaceOrderItemBodySchema>;
export type UpdateOrderItemBody = z.infer<typeof updateOrderItemBodySchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
