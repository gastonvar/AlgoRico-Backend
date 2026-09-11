import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../errors/app-error.js';

function parseWithSchema<T>(schema: ZodType<T>, value: unknown, location: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw AppError.validation(`${location} validation failed`, result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })));
  }
  return result.data;
}

function replaceRequestValue<K extends 'query' | 'params'>(req: Request, key: K, value: Request[K]): void {
  Object.defineProperty(req, key, {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  });
}

export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = parseWithSchema(schema, req.body, 'Body');
    next();
  };
}

export function validateParams<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    replaceRequestValue(req, 'params', parseWithSchema(schema, req.params, 'Path') as Request['params']);
    next();
  };
}

export function validateQuery<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    replaceRequestValue(req, 'query', parseWithSchema(schema, req.query, 'Query') as Request['query']);
    next();
  };
}
