import { z } from 'zod';
import { PAYMENT_METHODS, PAYMENT_TYPES } from '../../shared/constants.js';
import { idParams, optionalTrimmed } from '../../shared/schemas.js';

export const paymentIdParamsSchema = idParams('paymentId');
export const orderPaymentParamsSchema = idParams('orderId');

export const createPaymentBodySchema = z.object({
  type: z.enum(PAYMENT_TYPES),
  amount: z.coerce.number().positive().finite(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  paidAt: z.string().datetime({ offset: true }).optional(),
  notes: optionalTrimmed,
  hasPaymentReceipt: z.boolean().optional(),
});

export const updatePaymentBodySchema = z
  .object({
    type: z.enum(PAYMENT_TYPES).optional(),
    amount: z.coerce.number().positive().finite().optional(),
    paymentMethod: z.enum(PAYMENT_METHODS).optional(),
    paidAt: z.string().datetime({ offset: true }).optional(),
    notes: z.string().trim().max(10_000).nullable().optional(),
    hasPaymentReceipt: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export type CreatePaymentBody = z.infer<typeof createPaymentBodySchema>;
export type UpdatePaymentBody = z.infer<typeof updatePaymentBodySchema>;
