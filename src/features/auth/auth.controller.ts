import type { Request, Response } from 'express';
import {
  clearCookieOptions,
  csrfCookieOptions,
  CSRF_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from '../../lib/cookies.js';
import { csrfTokenFor } from '../../lib/session.js';
import { currentUserId } from '../../middleware/auth.js';
import { getCurrentUser, loginUser, logoutUser } from './auth.service.js';

export async function login(req: Request, res: Response): Promise<void> {
  const result = await loginUser(req.body);
  res.cookie(SESSION_COOKIE_NAME, result.sessionToken, sessionCookieOptions());
  res.cookie(CSRF_COOKIE_NAME, result.csrfToken, csrfCookieOptions());
  res.status(200).json({
    data: {
      user: result.user,
      csrfToken: result.csrfToken,
    },
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await getCurrentUser(currentUserId(req));
  const csrfToken = req.auth ? csrfTokenFor(req.auth.sessionToken) : undefined;
  if (csrfToken) {
    res.cookie(CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions());
  }
  res.status(200).json({
    data: {
      user,
      csrfToken,
    },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (req.auth?.sessionId) {
    await logoutUser(req.auth.sessionId);
  }
  res.clearCookie(SESSION_COOKIE_NAME, clearCookieOptions());
  res.clearCookie(CSRF_COOKIE_NAME, { ...clearCookieOptions(), httpOnly: false });
  res.status(204).send();
}
