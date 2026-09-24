import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { migrator } from '../../src/database/migrator.js';
import { sequelize } from '../../src/database/sequelize.js';
import { hashPassword } from '../../src/lib/crypto.js';
import { User, initModels } from '../../src/models/index.js';
import { ALGORICO_COMPANY_ID } from '../../src/shared/companies.js';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

const app = createApp();

let dbAvailable = true;

function cookieHeader(response: request.Response): string[] {
  const header = response.headers['set-cookie'];
  if (!header) {
    return [];
  }
  return Array.isArray(header) ? header : [header];
}

describe('Algo Rico API', () => {
  beforeAll(async () => {
    try {
      initModels();
      await sequelize.authenticate();
      await sequelize.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
      await migrator.up();
      await User.create({
        email: 'victoriavanoli@hotmail.com',
        passwordHash: await hashPassword('AlgoRicoDev1!'),
        active: true,
        companyId: ALGORICO_COMPANY_ID,
      });
    } catch {
      dbAvailable = false;
    }
  });

  afterAll(async () => {
    if (dbAvailable) {
      await sequelize.close();
    }
  });

  it('rejects unauthenticated access to business data', async ({ skip }) => {
    if (!dbAvailable) skip();
    const response = await request(app).get('/api/clients');
    expect(response.status).toBe(401);
  });

  it('logs in and returns the current user without a password hash', async ({ skip }) => {
    if (!dbAvailable) skip();
    const response = await request(app).post('/api/auth/login').send({
      email: 'victoriavanoli@hotmail.com',
      password: 'AlgoRicoDev1!',
    });
    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe('victoriavanoli@hotmail.com');
    expect(response.body.data.user.passwordHash).toBeUndefined();

    const me = await request(app).get('/api/auth/me').set('Cookie', cookieHeader(response));
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe('victoriavanoli@hotmail.com');

    const clients = await request(app)
      .get('/api/clients')
      .query({ page: 1, pageSize: 20 })
      .set('Cookie', cookieHeader(response));
    expect(clients.status).toBe(200);
    expect(clients.body.data).toEqual([]);
    expect(clients.body.meta).toMatchObject({ page: 1, pageSize: 20, total: 0 });
  });

  it('supports the pastry order workflow end to end', async ({ skip }) => {
    if (!dbAvailable) skip();

    const agent = request.agent(app);
    const loginResponse = await agent.post('/api/auth/login').send({
      email: 'victoriavanoli@hotmail.com',
      password: 'AlgoRicoDev1!',
    });
    expect(loginResponse.status).toBe(200);
    const csrfToken = loginResponse.body.data.csrfToken as string;

    const clientResponse = await agent
      .post('/api/clients')
      .set('x-csrf-token', csrfToken)
      .send({
        name: 'Camila Diaz',
        phone: '+5491199990000',
        instagramUsername: 'cami.diaz',
        needsFollowUp: true,
      });
    expect(clientResponse.status).toBe(201);
    const clientId = clientResponse.body.data.id as string;

    const interactionResponse = await agent
      .post(`/api/clients/${clientId}/interactions`)
      .set('x-csrf-token', csrfToken)
      .send({
        channel: 'WHATSAPP',
        content: 'Customer sent cake references from Instagram.',
      });
    expect(interactionResponse.status).toBe(201);
    const interactionId = interactionResponse.body.data.id as string;

    const attachmentResponse = await agent
      .post(`/api/interactions/${interactionId}/attachments`)
      .set('x-csrf-token', csrfToken)
      .attach('files', TINY_PNG, { filename: 'reference.png', contentType: 'image/png' });
    expect(attachmentResponse.status).toBe(201);
    const attachmentId = attachmentResponse.body.data[0].id as string;

    const download = await agent.get(`/api/attachments/${attachmentId}`);
    expect(download.status).toBe(200);
    expect(download.body.data.downloadUrl).toBeTruthy();
    expect(download.body.data.storageKey).toBeUndefined();

    const orderResponse = await agent
      .post(`/api/clients/${clientId}/orders`)
      .set('x-csrf-token', csrfToken)
      .send({
        fulfillmentType: 'PICKUP',
        eventDate: '2026-09-20',
        eventTime: '15:00',
        items: [
          {
            description: 'Custom Tart',
            quantity: 1,
            unitPrice: 22000,
          },
          {
            description: 'Cookie box',
            quantity: 2,
            unitPrice: 4000,
          },
        ],
      });
    expect(orderResponse.status).toBe(201);
    expect(orderResponse.body.data.totalAmount).toBe(30000);
    expect(orderResponse.body.data.paymentStatus).toBe('UNPAID');
    const orderId = orderResponse.body.data.id as string;

    const depositResponse = await agent
      .post(`/api/orders/${orderId}/payments`)
      .set('x-csrf-token', csrfToken)
      .send({
        type: 'DEPOSIT',
        amount: 10000,
        paymentMethod: 'CASH',
        hasPaymentReceipt: true,
      });
    expect(depositResponse.status).toBe(201);
    expect(depositResponse.body.data.status).toBe('CONFIRMED');
    expect(depositResponse.body.data.paymentStatus).toBe('PARTIALLY_PAID');
    expect(depositResponse.body.data.remainingBalance).toBe(20000);
    expect(depositResponse.body.data.payments[0].hasPaymentReceipt).toBe(true);
    const paymentId = depositResponse.body.data.payments[0].id as string;

    const paymentAttachment = await agent
      .post(`/api/payments/${paymentId}/attachments`)
      .set('x-csrf-token', csrfToken)
      .attach('files', TINY_PNG, { filename: 'transfer.png', contentType: 'image/png' });
    expect(paymentAttachment.status).toBe(201);
    expect(paymentAttachment.body.data[0].paymentId).toBe(paymentId);
    expect(paymentAttachment.body.data[0].interactionId).toBeNull();

    const paymentDetail = await agent.get(`/api/payments/${paymentId}`);
    expect(paymentDetail.status).toBe(200);
    expect(paymentDetail.body.data.attachments).toHaveLength(1);

    const overpay = await agent
      .post(`/api/orders/${orderId}/payments`)
      .set('x-csrf-token', csrfToken)
      .send({
        type: 'FINAL',
        amount: 25000,
        paymentMethod: 'CASH',
      });
    expect(overpay.status).toBe(409);

    const calendar = await agent.get('/api/calendar').query({
      from: '2026-09-01',
      to: '2026-09-30',
    });
    expect(calendar.status).toBe(200);
    expect(calendar.body.data.some((entry: { id: string }) => entry.id === orderId)).toBe(true);

    const taskResponse = await agent
      .post('/api/tasks')
      .set('x-csrf-token', csrfToken)
      .send({
        clientId,
        orderId,
        title: 'Prepare Camila tart',
        dueAt: new Date('2026-09-19T12:00:00.000Z').toISOString(),
        priority: 'HIGH',
      });
    expect(taskResponse.status).toBe(201);
    const taskId = taskResponse.body.data.id as string;

    const completedTask = await agent
      .patch(`/api/tasks/${taskId}`)
      .set('x-csrf-token', csrfToken)
      .send({ completed: true });
    expect(completedTask.status).toBe(200);
    expect(completedTask.body.data.completed).toBe(true);
    expect(completedTask.body.data.completedAt).toBeTruthy();

    const dashboard = await agent.get('/api/dashboard');
    expect(dashboard.status).toBe(200);
    expect(
      dashboard.body.data.needsAttention.followUpClients.some((client: { id: string }) => client.id === clientId),
    ).toBe(true);

    const finalPayment = await agent
      .post(`/api/orders/${orderId}/payments`)
      .set('x-csrf-token', csrfToken)
      .send({
        type: 'FINAL',
        amount: 20000,
        paymentMethod: 'BANK_TRANSFER',
      });
    expect(finalPayment.status).toBe(201);
    expect(finalPayment.body.data.paymentStatus).toBe('PAID');
    expect(finalPayment.body.data.remainingBalance).toBe(0);
    const finalRecord = finalPayment.body.data.payments.find(
      (payment: { type: string }) => payment.type === 'FINAL',
    );
    expect(finalRecord.hasPaymentReceipt).toBe(false);

    const inProduction = await agent
      .patch(`/api/orders/${orderId}`)
      .set('x-csrf-token', csrfToken)
      .send({ status: 'IN_PRODUCTION' });
    expect(inProduction.status).toBe(200);
    const ready = await agent
      .patch(`/api/orders/${orderId}`)
      .set('x-csrf-token', csrfToken)
      .send({ status: 'READY' });
    expect(ready.status).toBe(200);
    const pickedUp = await agent
      .patch(`/api/orders/${orderId}`)
      .set('x-csrf-token', csrfToken)
      .send({ status: 'PICKED_UP' });
    expect(pickedUp.status).toBe(200);
    const done = await agent
      .patch(`/api/orders/${orderId}`)
      .set('x-csrf-token', csrfToken)
      .send({ status: 'COMPLETED' });
    expect(done.status).toBe(200);
    expect(done.body.data.status).toBe('COMPLETED');

    const invalidJump = await agent
      .patch(`/api/orders/${orderId}`)
      .set('x-csrf-token', csrfToken)
      .send({ status: 'LEAD' });
    expect(invalidJump.status).toBe(409);

    const timeline = await agent.get(`/api/clients/${clientId}/interactions`);
    expect(timeline.status).toBe(200);
    expect(timeline.body.data[0].id).toBe(interactionId);
    expect(timeline.body.data[0].orderId).toBeNull();

    const orderInteractionResponse = await agent
      .post(`/api/orders/${orderId}/interactions`)
      .set('x-csrf-token', csrfToken)
      .send({
        channel: 'WHATSAPP',
        content: 'Confirmed pickup time for the tart.',
      });
    expect(orderInteractionResponse.status).toBe(201);
    expect(orderInteractionResponse.body.data.orderId).toBe(orderId);
    expect(orderInteractionResponse.body.data.clientId).toBe(clientId);
    const orderInteractionId = orderInteractionResponse.body.data.id as string;

    const orderTimeline = await agent.get(`/api/orders/${orderId}/interactions`);
    expect(orderTimeline.status).toBe(200);
    expect(orderTimeline.body.data).toHaveLength(1);
    expect(orderTimeline.body.data[0].id).toBe(orderInteractionId);

    const clientTimelineAfterOrder = await agent.get(`/api/clients/${clientId}/interactions`);
    expect(clientTimelineAfterOrder.body.data).toHaveLength(2);

    const clientDetail = await agent.get(`/api/clients/${clientId}`);
    expect(clientDetail.body.data.orderCount).toBe(1);
    expect(clientDetail.body.data.interactionCount).toBe(2);

    const updatedInteraction = await agent
      .patch(`/api/interactions/${orderInteractionId}`)
      .set('x-csrf-token', csrfToken)
      .send({ content: 'Pickup moved to 16:00.' });
    expect(updatedInteraction.status).toBe(200);
    expect(updatedInteraction.body.data.content).toBe('Pickup moved to 16:00.');

    const deletedInteraction = await agent
      .delete(`/api/interactions/${orderInteractionId}`)
      .set('x-csrf-token', csrfToken);
    expect(deletedInteraction.status).toBe(204);

    const editedPayment = await agent
      .patch(`/api/payments/${paymentId}`)
      .set('x-csrf-token', csrfToken)
      .send({ amount: 8000, notes: 'Adjusted deposit', hasPaymentReceipt: false });
    expect(editedPayment.status).toBe(200);
    expect(editedPayment.body.data.paidAmount).toBe(28000);
    expect(editedPayment.body.data.remainingBalance).toBe(2000);
    expect(
      editedPayment.body.data.payments.find((payment: { id: string }) => payment.id === paymentId)
        .hasPaymentReceipt,
    ).toBe(false);

    const deletedPayment = await agent
      .delete(`/api/payments/${paymentId}`)
      .set('x-csrf-token', csrfToken);
    expect(deletedPayment.status).toBe(200);
    expect(deletedPayment.body.data.paidAmount).toBe(20000);

    const editedOrder = await agent
      .patch(`/api/orders/${orderId}`)
      .set('x-csrf-token', csrfToken)
      .send({
        description: 'Custom tart with berries',
        items: [
          {
            id: orderResponse.body.data.items[0].id as string,
            description: 'Custom Tart',
            quantity: 1,
            unitPrice: 22000,
          },
        ],
      });
    expect(editedOrder.status).toBe(200);
    expect(editedOrder.body.data.description).toBe('Custom tart with berries');
    expect(editedOrder.body.data.items).toHaveLength(1);

    const deletedOrder = await agent.delete(`/api/orders/${orderId}`).set('x-csrf-token', csrfToken);
    expect(deletedOrder.status).toBe(204);
    const missingOrder = await agent.get(`/api/orders/${orderId}`);
    expect(missingOrder.status).toBe(404);

    const archived = await agent
      .patch(`/api/clients/${clientId}`)
      .set('x-csrf-token', csrfToken)
      .send({ archived: true });
    expect(archived.status).toBe(200);
    expect(archived.body.data.archivedAt).toBeTruthy();
  });

  it('stores an editable order total independent of item prices', async ({ skip }) => {
    if (!dbAvailable) skip();

    const agent = request.agent(app);
    const loginResponse = await agent.post('/api/auth/login').send({
      email: 'victoriavanoli@hotmail.com',
      password: 'AlgoRicoDev1!',
    });
    expect(loginResponse.status).toBe(200);
    const csrfToken = loginResponse.body.data.csrfToken as string;

    const clientResponse = await agent
      .post('/api/clients')
      .set('x-csrf-token', csrfToken)
      .send({ name: 'Ana Torres' });
    expect(clientResponse.status).toBe(201);
    const clientId = clientResponse.body.data.id as string;

    const created = await agent
      .post(`/api/clients/${clientId}/orders`)
      .set('x-csrf-token', csrfToken)
      .send({
        eventDate: '2026-10-01',
        items: [{ description: 'Torta', quantity: 2, unitPrice: 4000 }],
        totalAmount: 15000,
      });
    expect(created.status).toBe(201);
    expect(created.body.data.totalAmount).toBe(15000);
    expect(created.body.data.items[0].productId).toBeUndefined();

    const updated = await agent
      .patch(`/api/orders/${created.body.data.id as string}`)
      .set('x-csrf-token', csrfToken)
      .send({ totalAmount: 12000 });
    expect(updated.status).toBe(200);
    expect(updated.body.data.totalAmount).toBe(12000);
    expect(updated.body.data.remainingBalance).toBe(12000);
  });

  it('costs recipes from ingredients and orders from recipe quantity', async ({ skip }) => {
    if (!dbAvailable) skip();

    const agent = request.agent(app);
    const loginResponse = await agent.post('/api/auth/login').send({
      email: 'victoriavanoli@hotmail.com',
      password: 'AlgoRicoDev1!',
    });
    expect(loginResponse.status).toBe(200);
    const csrfToken = loginResponse.body.data.csrfToken as string;

    const flour = await agent.post('/api/ingredients').set('x-csrf-token', csrfToken).send({
      name: 'Harina',
      unit: 'kg',
      pricePerUnit: 100,
    });
    expect(flour.status).toBe(201);
    expect(flour.body.data.pricePerUnit).toBe(100);
    expect(flour.body.data.packageQuantity).toBeUndefined();

    const eggs = await agent.post('/api/ingredients').set('x-csrf-token', csrfToken).send({
      name: 'Huevos',
      unit: 'un',
      pricePerUnit: 20,
    });
    expect(eggs.status).toBe(201);
    expect(eggs.body.data.pricePerUnit).toBe(20);

    const recipe = await agent.post('/api/recipes').set('x-csrf-token', csrfToken).send({
      name: 'Torta simple',
      ingredients: [
        { ingredientId: flour.body.data.id, quantity: 0.5 },
        { ingredientId: eggs.body.data.id, quantity: 4 },
      ],
    });
    expect(recipe.status).toBe(201);
    expect(recipe.body.data.price).toBe(130);
    expect(recipe.body.data.ingredients).toHaveLength(2);

    const blockedIngredient = await agent
      .delete(`/api/ingredients/${flour.body.data.id as string}`)
      .set('x-csrf-token', csrfToken);
    expect(blockedIngredient.status).toBe(409);

    const client = await agent.post('/api/clients').set('x-csrf-token', csrfToken).send({ name: 'Nora Cake' });
    expect(client.status).toBe(201);

    const order = await agent
      .post(`/api/clients/${client.body.data.id as string}/orders`)
      .set('x-csrf-token', csrfToken)
      .send({
        eventDate: '2026-11-01',
        items: [{ recipeId: recipe.body.data.id, quantity: 2 }],
      });
    expect(order.status).toBe(201);
    expect(order.body.data.totalAmount).toBe(260);
    expect(order.body.data.items[0].recipeId).toBe(recipe.body.data.id);
    expect(order.body.data.items[0].description).toBe('Torta simple');
    expect(order.body.data.items[0].unitPrice).toBe(130);
    expect(order.body.data.items[0].lineTotal).toBe(260);

    const blockedRecipe = await agent
      .delete(`/api/recipes/${recipe.body.data.id as string}`)
      .set('x-csrf-token', csrfToken);
    expect(blockedRecipe.status).toBe(409);
  });
});
