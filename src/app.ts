import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env, frontendOrigins } from './config/env.js';
import { errorHandler } from './errors/error-handler.js';
import { attachmentsRoutes, interactionAttachmentsRoutes, paymentAttachmentsRoutes } from './features/attachments/attachments.routes.js';
import { authRoutes } from './features/auth/auth.routes.js';
import { calendarRoutes } from './features/calendar/calendar.routes.js';
import { clientsRoutes } from './features/clients/clients.routes.js';
import { dashboardRoutes } from './features/dashboard/dashboard.routes.js';
import { interactionsRoutes } from './features/interactions/interactions.routes.js';
import { ordersRoutes } from './features/orders/orders.routes.js';
import { orderPaymentsRoutes, paymentsRoutes } from './features/payments/payments.routes.js';
import { tasksRoutes } from './features/tasks/tasks.routes.js';
import { pinoLogger } from './lib/pino.js';
import { requireAuth, requireCsrf } from './middleware/auth.js';
import { initModels } from './models/index.js';

initModels();

export function createApp() {
  const app = express();

  if (env.TRUST_PROXY) {
    app.set('trust proxy', 1);
  }

  app.disable('x-powered-by');
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin: frontendOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(
    pinoHttp({
      logger: pinoLogger,
      serializers: {
        req(request) {
          return {
            id: request.id,
            method: request.method,
            url: request.url,
          };
        },
        res(response) {
          return {
            statusCode: response.statusCode,
          };
        },
      },
    }),
  );

  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      data: {
        status: 'ok',
      },
    });
  });

  app.use('/api/auth', authRoutes);

  const api = express.Router();
  api.use(requireAuth);
  api.use(requireCsrf);

  api.use('/clients', clientsRoutes);
  api.use('/interactions', interactionsRoutes);
  api.use('/interactions/:interactionId/attachments', interactionAttachmentsRoutes);
  api.use('/attachments', attachmentsRoutes);
  api.use('/orders', ordersRoutes);
  api.use('/orders/:orderId/payments', orderPaymentsRoutes);
  api.use('/payments/:paymentId/attachments', paymentAttachmentsRoutes);
  api.use('/payments', paymentsRoutes);
  api.use('/tasks', tasksRoutes);
  api.use('/dashboard', dashboardRoutes);
  api.use('/calendar', calendarRoutes);

  app.use('/api', api);

  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    });
  });

  app.use(errorHandler);

  return app;
}
