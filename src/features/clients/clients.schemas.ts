import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/pagination.js';
import { idParams, optionalEmail, optionalTrimmed } from '../../shared/schemas.js';

export const clientIdParamsSchema = idParams('clientId');

export const listClientsQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(255).optional(),
  needsFollowUp: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  includeArchived: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

export const createClientBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  phone: optionalTrimmed,
  instagramUsername: optionalTrimmed,
  email: optionalEmail,
  notes: optionalTrimmed,
  needsFollowUp: z.boolean().optional(),
});

export const updateClientBodySchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    phone: z.string().trim().max(50).nullable().optional(),
    instagramUsername: z.string().trim().max(255).nullable().optional(),
    email: z.string().trim().email().max(255).nullable().optional().or(z.literal('').transform(() => null)),
    notes: z.string().trim().max(10_000).nullable().optional(),
    needsFollowUp: z.boolean().optional(),
    archived: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;
export type CreateClientBody = z.infer<typeof createClientBodySchema>;
export type UpdateClientBody = z.infer<typeof updateClientBodySchema>;
