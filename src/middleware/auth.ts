import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import { csrfTokensMatch } from '../lib/crypto.js';
import { SESSION_COOKIE_NAME } from '../lib/cookies.js';
import { csrfTokenFor, findValidSession } from '../lib/session.js';
import { CSRF_HEADER_NAME } from '../shared/constants.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  if (!token) {
    next(AppError.unauthorized());
    return;
  }

  findValidSession(token)
    .then((result) => {
      if (!result) {
        next(AppError.unauthorized());
        return;
      }

      req.auth = {
        sub: result.user.id,
        sessionId: result.session.id,
        sessionToken: token,
      };
      next();
    })
    .catch(next);
}

export function requireCsrf(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  if (!req.auth?.sessionToken) {
    next(AppError.unauthorized());
    return;
  }

  const headerToken = req.header(CSRF_HEADER_NAME);
  const expected = csrfTokenFor(req.auth.sessionToken);

  if (!headerToken || !csrfTokensMatch(expected, headerToken)) {
    next(AppError.forbidden('Invalid CSRF token'));
    return;
  }

  next();
}

export function currentUserId(req: Request): string {
  if (!req.auth?.sub) {
    throw AppError.unauthorized();
  }
  return req.auth.sub;
}
