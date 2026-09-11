import { hashPassword } from '../lib/crypto.js';
import { pinoLogger } from '../lib/pino.js';
import {
  Client,
  Interaction,
  Order,
  OrderItem,
  Payment,
  Task,
  User,
  initModels,
} from '../models/index.js';
import { sequelize } from './sequelize.js';
import { addZonedDays, formatDateOnly, startOfZonedDay } from '../shared/dates.js';

initModels();

async function seed(): Promise<void> {
  await sequelize.authenticate();

  const existing = await User.findOne({ where: { email: 'owner@algorico.local' } });
  if (existing) {
    pinoLogger.info('Seed data already present; skipping');
    return;
  }

  const now = new Date();
  const today = formatDateOnly(now);
  const yesterday = formatDateOnly(addZonedDays(now, -1));
  const tomorrow = formatDateOnly(addZonedDays(now, 2));
  const nextWeek = formatDateOnly(addZonedDays(now, 8));
  const lastWeek = formatDateOnly(addZonedDays(now, -5));

  const owner = await User.create({
    email: 'owner@algorico.local',
    passwordHash: await hashPassword('AlgoRicoDev1!'),
    active: true,
  });

  const maria = await Client.create({
    name: 'Maria Lopez',
    phone: '+5491100000001',
    instagramUsername: 'maria.bakes',
    email: 'maria@example.com',
    notes: 'Prefers chocolate and fresh flowers',
    needsFollowUp: false,
  });

  const juan = await Client.create({
    name: 'Juan Perez',
    phone: '+5491100000002',
    instagramUsername: 'juan.p',
    notes: 'Contacted via WhatsApp for a weekend delivery',
    needsFollowUp: false,
  });

  const sofia = await Client.create({
    name: 'Sofia Gomez',
    phone: '+5491100000003',
    instagramUsername: 'sofi.gomez',
    email: 'sofia@example.com',
    needsFollowUp: false,
  });

  const lucia = await Client.create({
    name: 'Lucia Fernandez',
    phone: '+5491100000004',
    instagramUsername: 'lu.fer',
    notes: 'Asked for a quote and has not replied',
    needsFollowUp: true,
  });

  const andres = await Client.create({
    name: 'Andres Ruiz',
    phone: '+5491100000005',
    instagramUsername: 'andres.r',
    needsFollowUp: false,
  });

  await Interaction.bulkCreate([
    {
      clientId: maria.id,
      userId: owner.id,
      channel: 'INSTAGRAM',
      content: 'Customer asked for a chocolate birthday cake for 20 people.',
      occurredAt: addZonedDays(now, -10),
    },
    {
      clientId: maria.id,
      userId: owner.id,
      channel: 'WHATSAPP',
      content: 'Sent quote for 45,000 plus a dozen cupcakes. Customer approved the design.',
      occurredAt: addZonedDays(now, -8),
    },
    {
      clientId: maria.id,
      userId: owner.id,
      channel: 'WHATSAPP',
      content: 'Customer sent three screenshot references of floral cakes.',
      occurredAt: addZonedDays(now, -7),
    },
    {
      clientId: juan.id,
      userId: owner.id,
      channel: 'WHATSAPP',
      content: 'Requested a delivery of cookies and brownies for Saturday.',
      occurredAt: addZonedDays(now, -3),
    },
    {
      clientId: lucia.id,
      userId: owner.id,
      channel: 'INSTAGRAM',
      content: 'Asked for a wedding cake quote. Waiting for guest count.',
      occurredAt: addZonedDays(now, -4),
    },
    {
      clientId: sofia.id,
      userId: owner.id,
      channel: 'PHONE',
      content: 'Confirmed pickup for last weekend order.',
      occurredAt: addZonedDays(now, -6),
    },
  ]);

  const mariaOrder = await Order.create({
    clientId: maria.id,
    status: 'CONFIRMED',
    eventDate: today,
    eventTime: '16:00',
    description: 'Chocolate birthday cake and cupcakes',
    fulfillmentType: 'PICKUP',
    totalAmount: '0.00',
  });
  await OrderItem.bulkCreate([
    {
      orderId: mariaOrder.id,
      description: 'Chocolate birthday cake with flowers',
      quantity: 1,
      unitPrice: '45000.00',
    },
    {
      orderId: mariaOrder.id,
      description: 'Vanilla cupcakes with buttercream',
      quantity: 12,
      unitPrice: '1500.00',
    },
  ]);
  mariaOrder.totalAmount = '63000.00';
  await mariaOrder.save();
  await Payment.create({
    orderId: mariaOrder.id,
    type: 'DEPOSIT',
    amount: '20000.00',
    paymentMethod: 'BANK_TRANSFER',
    paidAt: addZonedDays(now, -6),
    notes: 'Sena / deposit',
    hasPaymentReceipt: true,
  });

  const juanOrder = await Order.create({
    clientId: juan.id,
    status: 'IN_PRODUCTION',
    eventDate: tomorrow,
    eventTime: '11:00',
    description: 'Office delivery',
    fulfillmentType: 'DELIVERY',
    deliveryAddress: 'Av. Corrientes 1234, CABA',
    deliveryTime: '11:30',
    totalAmount: '0.00',
  });
  await OrderItem.bulkCreate([
    {
      orderId: juanOrder.id,
      description: 'Assorted cookie box',
      quantity: 2,
      unitPrice: '9000.00',
    },
    {
      orderId: juanOrder.id,
      description: 'Custom brownie tray',
      quantity: 1,
      unitPrice: '14000.00',
    },
  ]);
  juanOrder.totalAmount = '32000.00';
  await juanOrder.save();
  await Payment.create({
    orderId: juanOrder.id,
    type: 'DEPOSIT',
    amount: '32000.00',
    paymentMethod: 'CASH',
    paidAt: addZonedDays(now, -1),
    notes: 'Paid in full',
  });

  const sofiaOrder = await Order.create({
    clientId: sofia.id,
    status: 'COMPLETED',
    eventDate: lastWeek,
    eventTime: '10:00',
    description: 'Kids party cookies',
    fulfillmentType: 'PICKUP',
    totalAmount: '18000.00',
  });
  await OrderItem.create({
    orderId: sofiaOrder.id,
    description: 'Rainbow cupcakes',
    quantity: 12,
    unitPrice: '1500.00',
  });
  sofiaOrder.totalAmount = '18000.00';
  await sofiaOrder.save();
  await Payment.bulkCreate([
    {
      orderId: sofiaOrder.id,
      type: 'DEPOSIT',
      amount: '8000.00',
      paymentMethod: 'CASH',
      paidAt: addZonedDays(now, -12),
    },
    {
      orderId: sofiaOrder.id,
      type: 'FINAL',
      amount: '10000.00',
      paymentMethod: 'CARD',
      paidAt: addZonedDays(now, -5),
    },
  ]);

  const luciaOrder = await Order.create({
    clientId: lucia.id,
    status: 'QUOTED',
    eventDate: nextWeek,
    description: 'Wedding cake quote in progress',
    fulfillmentType: 'DELIVERY',
    totalAmount: '0.00',
    notes: 'Waiting on guest count',
  });
  await OrderItem.create({
    orderId: luciaOrder.id,
    description: 'Two-tier wedding cake',
    quantity: 1,
    unitPrice: '120000.00',
  });
  luciaOrder.totalAmount = '120000.00';
  await luciaOrder.save();

  const andresOrder = await Order.create({
    clientId: andres.id,
    status: 'CONFIRMED',
    eventDate: yesterday,
    eventTime: '18:00',
    description: 'Delivery cake missing address',
    fulfillmentType: 'DELIVERY',
    totalAmount: '45000.00',
  });
  await OrderItem.create({
    orderId: andresOrder.id,
    description: 'Birthday Cake',
    quantity: 1,
    unitPrice: '45000.00',
  });
  await Payment.create({
    orderId: andresOrder.id,
    type: 'DEPOSIT',
    amount: '15000.00',
    paymentMethod: 'BANK_TRANSFER',
    paidAt: addZonedDays(now, -2),
    hasPaymentReceipt: true,
  });

  await Task.bulkCreate([
    {
      clientId: lucia.id,
      orderId: luciaOrder.id,
      title: 'Follow up with Lucia',
      description: 'Need guest count before confirming the wedding cake.',
      dueAt: addZonedDays(now, -1),
      priority: 'HIGH',
      completed: false,
      createdBy: owner.id,
    },
    {
      clientId: maria.id,
      orderId: mariaOrder.id,
      title: 'Prepare Maria order',
      description: 'Finish floral decoration before afternoon pickup.',
      dueAt: new Date(startOfZonedDay(now).getTime() + 12 * 60 * 60 * 1000),
      priority: 'HIGH',
      completed: false,
      createdBy: owner.id,
    },
    {
      clientId: juan.id,
      orderId: juanOrder.id,
      title: 'Confirm delivery address',
      dueAt: addZonedDays(now, 1),
      priority: 'MEDIUM',
      completed: false,
      createdBy: owner.id,
    },
    {
      clientId: andres.id,
      orderId: andresOrder.id,
      title: 'Collect remaining payment from Andres',
      dueAt: addZonedDays(now, 1),
      priority: 'HIGH',
      completed: false,
      createdBy: owner.id,
    },
    {
      title: 'Order boxes and ribbons',
      description: 'General studio supplies',
      dueAt: addZonedDays(now, 5),
      priority: 'LOW',
      completed: false,
      createdBy: owner.id,
    },
  ]);

  pinoLogger.info(
    {
      user: 'owner@algorico.local',
      clients: 5,
      orders: 5,
    },
    'Development seed data created',
  );
}

seed()
  .catch((error: unknown) => {
    pinoLogger.error({ err: error }, 'Seed failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
