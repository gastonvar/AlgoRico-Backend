import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { create, getById, list, remove, update } from './tasks.controller.js';
import {
  createTaskBodySchema,
  listTasksQuerySchema,
  taskIdParamsSchema,
  updateTaskBodySchema,
} from './tasks.schemas.js';

export const tasksRoutes = Router();

tasksRoutes.get('/', validateQuery(listTasksQuerySchema), asyncHandler(list));
tasksRoutes.post('/', validateBody(createTaskBodySchema), asyncHandler(create));
tasksRoutes.get('/:taskId', validateParams(taskIdParamsSchema), asyncHandler(getById));
tasksRoutes.patch(
  '/:taskId',
  validateParams(taskIdParamsSchema),
  validateBody(updateTaskBodySchema),
  asyncHandler(update),
);
tasksRoutes.delete('/:taskId', validateParams(taskIdParamsSchema), asyncHandler(remove));
