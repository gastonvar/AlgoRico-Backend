import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { requireAuth } from '../../middleware/auth.js';
import { loginRateLimiter } from '../../middleware/rate-limit.js';
import { validateBody } from '../../middleware/validate.js';
import { login, logout, me } from './auth.controller.js';
import { loginBodySchema } from './auth.schemas.js';

export const authRoutes = Router();

authRoutes.post('/login', loginRateLimiter, validateBody(loginBodySchema), asyncHandler(login));
authRoutes.post('/logout', requireAuth, asyncHandler(logout));
authRoutes.get('/me', requireAuth, asyncHandler(me));
