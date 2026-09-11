import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { validateQuery } from '../../middleware/validate.js';
import { list } from './calendar.controller.js';
import { calendarQuerySchema } from './calendar.schemas.js';

export const calendarRoutes = Router();

calendarRoutes.get('/', validateQuery(calendarQuerySchema), asyncHandler(list));
