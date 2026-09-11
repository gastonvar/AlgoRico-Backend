import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { UniqueConstraintError, ValidationError as SequelizeValidationError } from 'sequelize';
import { ZodError } from 'zod';
import { isProduction } from '../config/env.js';
import { pinoLogger } from '../lib/pino.js';
import { AppError } from './app-error.js';

function formatZodError(error: ZodError): unknown {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    if (!error.expose) {
      pinoLogger.error({ err: error }, error.message);
    } else if (error.statusCode >= 500) {
      pinoLogger.error({ err: error }, error.message);
    }

    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: formatZodError(error),
      },
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    const tooLarge = error.code === 'LIMIT_FILE_SIZE';
    res.status(tooLarge ? 413 : 400).json({
      error: {
        code: tooLarge ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST',
        message: tooLarge ? 'File is too large' : 'Invalid file upload',
      },
    });
    return;
  }

  if (error instanceof UniqueConstraintError) {
    res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'A record with that value already exists',
      },
    });
    return;
  }

  if (error instanceof SequelizeValidationError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.errors.map((item) => ({
          path: item.path,
          message: item.message,
        })),
      },
    });
    return;
  }

  pinoLogger.error({ err: error }, 'Unhandled application error');

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction ? 'An unexpected error occurred' : 'Internal server error',
    },
  });
}
