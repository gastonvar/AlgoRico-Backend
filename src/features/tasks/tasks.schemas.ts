import { z } from 'zod';
import { TASK_PRIORITIES } from '../../shared/constants.js';
import { paginationQuerySchema } from '../../shared/pagination.js';
import { idParams, optionalTrimmed } from '../../shared/schemas.js';

export const taskIdParamsSchema = idParams('taskId');

export const listTasksQuerySchema = paginationQuerySchema.extend({
  completed: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  due: z.enum(['overdue', 'today', 'upcoming']).optional(),
  clientId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
});

export const createTaskBodySchema = z.object({
  clientId: z.string().uuid().nullable().optional(),
  orderId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(255),
  description: optionalTrimmed,
  dueAt: z.string().datetime({ offset: true }).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
});

export const updateTaskBodySchema = z
  .object({
    clientId: z.string().uuid().nullable().optional(),
    orderId: z.string().uuid().nullable().optional(),
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(10_000).nullable().optional(),
    dueAt: z.string().datetime({ offset: true }).nullable().optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    completed: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;
