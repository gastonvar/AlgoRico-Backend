import type { CookieOptions } from 'express';
import { env, isProduction } from '../config/env.js';
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } from '../shared/constants.js';

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE || isProduction,
    sameSite: env.COOKIE_SAMESITE,
    domain: env.COOKIE_DOMAIN,
    path: '/',
    maxAge: env.SESSION_TTL_MS,
  };
}

export function csrfCookieOptions(): CookieOptions {
  return {
    httpOnly: false,
    secure: env.COOKIE_SECURE || isProduction,
    sameSite: env.COOKIE_SAMESITE,
    domain: env.COOKIE_DOMAIN,
    path: '/',
    maxAge: env.SESSION_TTL_MS,
  };
}

export function clearCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE || isProduction,
    sameSite: env.COOKIE_SAMESITE,
    domain: env.COOKIE_DOMAIN,
    path: '/',
    maxAge: 0,
  };
}

export { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME };
