import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { get } from './dashboard.controller.js';

export const dashboardRoutes = Router();

dashboardRoutes.get('/', asyncHandler(get));
