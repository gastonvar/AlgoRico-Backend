import { z } from 'zod';
import { dateOnlySchema } from '../../shared/schemas.js';

export const calendarQuerySchema = z
  .object({
    from: dateOnlySchema,
    to: dateOnlySchema,
    includeCancelled: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => value === 'true'),
  })
  .refine((value) => value.from <= value.to, {
    message: 'from must be on or before to',
    path: ['from'],
  });

export type CalendarQuery = z.infer<typeof calendarQuerySchema>;
