import { z } from 'zod';
import { INTERACTION_CHANNELS } from '../../shared/constants.js';
import { paginationQuerySchema } from '../../shared/pagination.js';
import { idParams } from '../../shared/schemas.js';

export const interactionIdParamsSchema = idParams('interactionId');

export const clientInteractionParamsSchema = idParams('clientId');

export const orderInteractionParamsSchema = idParams('orderId');

export const listInteractionsQuerySchema = paginationQuerySchema;

export const createInteractionBodySchema = z.object({
  channel: z.enum(INTERACTION_CHANNELS),
  content: z.string().trim().min(1).max(20_000),
  occurredAt: z.string().datetime({ offset: true }).optional(),
});

export const updateInteractionBodySchema = z
  .object({
    channel: z.enum(INTERACTION_CHANNELS).optional(),
    content: z.string().trim().min(1).max(20_000).optional(),
    occurredAt: z.string().datetime({ offset: true }).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export type CreateInteractionBody = z.infer<typeof createInteractionBodySchema>;
export type UpdateInteractionBody = z.infer<typeof updateInteractionBodySchema>;
