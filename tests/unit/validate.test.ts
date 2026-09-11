import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AppError } from '../../src/errors/app-error.js';
import { validateQuery } from '../../src/middleware/validate.js';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

function createApp() {
  const app = express();
  app.get('/items', validateQuery(querySchema), (req, res) => {
    res.status(200).json({ query: req.query });
  });
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = error instanceof AppError ? error.statusCode : 500;
    res.status(status).json({
      error: {
        message: error instanceof Error ? error.message : 'Internal server error',
      },
    });
  });
  return app;
}

describe('validateQuery', () => {
  it('replaces Express 5 read-only query with coerced values', async () => {
    const response = await request(createApp()).get('/items').query({ page: '1', pageSize: '20' });

    expect(response.status).toBe(200);
    expect(response.body.query).toEqual({ page: 1, pageSize: 20 });
  });

  it('rejects invalid query values without crashing', async () => {
    const response = await request(createApp()).get('/items').query({ page: '0' });

    expect(response.status).toBe(422);
  });
});
