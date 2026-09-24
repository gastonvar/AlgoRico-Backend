import { hashPassword } from '../lib/crypto.js';
import { pinoLogger } from '../lib/pino.js';
import {
  Client,
  Ingredient,
  Interaction,
  Order,
  OrderItem,
  Payment,
  Recipe,
  RecipeIngredient,
  Task,
  User,
  initModels,
} from '../models/index.js';
import { sequelize } from './sequelize.js';
import { addZonedDays, formatDateOnly, startOfZonedDay } from '../shared/dates.js';
import { ALGORICO_COMPANY_ID } from '../shared/companies.js';

initModels();

async function seed(): Promise<void> {
  await sequelize.authenticate();

  const existing = await User.findOne({ where: { email: 'victoriavanoli@hotmail.com' } });
  if (existing) {
    pinoLogger.info('Seed data already present; skipping');
    return;
  }

  const companyId = ALGORICO_COMPANY_ID;

  const now = new Date();
  const today = formatDateOnly(now);
  const yesterday = formatDateOnly(addZonedDays(now, -1));
  const tomorrow = formatDateOnly(addZonedDays(now, 2));
  const nextWeek = formatDateOnly(addZonedDays(now, 8));
  const lastWeek = formatDateOnly(addZonedDays(now, -5));

  const owner = await User.create({
    email: 'victoriavanoli@hotmail.com',
    passwordHash: await hashPassword('AlgoRicoDev1!'),
    active: true,
    companyId,
  });

  const maria = await Client.create({
    companyId,
    name: 'Maria Lopez',
    phone: '+5491100000001',
    instagramUsername: 'maria.bakes',
    email: 'maria@example.com',
    notes: 'Prefers chocolate and fresh flowers',
    needsFollowUp: false,
  });

  const juan = await Client.create({
    companyId,
    name: 'Juan Perez',
    phone: '+5491100000002',
    instagramUsername: 'juan.p',
    notes: 'Contacted via WhatsApp for a weekend delivery',
    needsFollowUp: false,
  });

  const sofia = await Client.create({
    companyId,
    name: 'Sofia Gomez',
    phone: '+5491100000003',
    instagramUsername: 'sofi.gomez',
    email: 'sofia@example.com',
    needsFollowUp: false,
  });

  const lucia = await Client.create({
    companyId,
    name: 'Lucia Fernandez',
    phone: '+5491100000004',
    instagramUsername: 'lu.fer',
    notes: 'Asked for a quote and has not replied',
    needsFollowUp: true,
  });

  const andres = await Client.create({
    companyId,
    name: 'Andres Ruiz',
    phone: '+5491100000005',
    instagramUsername: 'andres.r',
    needsFollowUp: false,
  });

  const harina = await Ingredient.create({
    companyId,
    name: 'Harina 000',
    unit: 'kg',
    pricePerUnit: '100.0000',
  });
  const azucar = await Ingredient.create({
    companyId,
    name: 'Azúcar',
    unit: 'kg',
    pricePerUnit: '180.0000',
  });
  const huevos = await Ingredient.create({
    companyId,
    name: 'Huevos',
    unit: 'un',
    pricePerUnit: '20.0000',
  });
  const manteca = await Ingredient.create({
    companyId,
    name: 'Manteca',
    unit: 'kg',
    pricePerUnit: '3200.0000',
  });
  const chocolate = await Ingredient.create({
    companyId,
    name: 'Chocolate',
    unit: 'kg',
    pricePerUnit: '4500.0000',
  });
  const vainilla = await Ingredient.create({
    companyId,
    name: 'Esencia de vainilla',
    unit: 'ml',
    pricePerUnit: '8.0000',
  });

  const chocolateCake = await Recipe.create({
    companyId,
    name: 'Torta de chocolate',
    description: 'Torta de cumpleaños con ganache',
  });
  await RecipeIngredient.bulkCreate([
    { recipeId: chocolateCake.id, ingredientId: harina.id, quantity: '0.5000' },
    { recipeId: chocolateCake.id, ingredientId: azucar.id, quantity: '0.3000' },
    { recipeId: chocolateCake.id, ingredientId: huevos.id, quantity: '4.0000' },
    { recipeId: chocolateCake.id, ingredientId: manteca.id, quantity: '0.2000' },
    { recipeId: chocolateCake.id, ingredientId: chocolate.id, quantity: '0.3000' },
  ]);

  const vanillaCupcakes = await Recipe.create({
    companyId,
    name: 'Cupcakes de vainilla',
    description: 'Docena de cupcakes con buttercream',
  });
  await RecipeIngredient.bulkCreate([
    { recipeId: vanillaCupcakes.id, ingredientId: harina.id, quantity: '0.2500' },
    { recipeId: vanillaCupcakes.id, ingredientId: azucar.id, quantity: '0.2000' },
    { recipeId: vanillaCupcakes.id, ingredientId: huevos.id, quantity: '2.0000' },
    { recipeId: vanillaCupcakes.id, ingredientId: manteca.id, quantity: '0.1000' },
    { recipeId: vanillaCupcakes.id, ingredientId: vainilla.id, quantity: '10.0000' },
  ]);

  const cookieBox = await Recipe.create({
    companyId,
    name: 'Caja de cookies',
    description: 'Caja surtida de cookies',
  });
  await RecipeIngredient.bulkCreate([
    { recipeId: cookieBox.id, ingredientId: harina.id, quantity: '0.4000' },
    { recipeId: cookieBox.id, ingredientId: azucar.id, quantity: '0.2000' },
    { recipeId: cookieBox.id, ingredientId: huevos.id, quantity: '1.0000' },
    { recipeId: cookieBox.id, ingredientId: manteca.id, quantity: '0.1500' },
  ]);

  const brownies = await Recipe.create({
    companyId,
    name: 'Bandeja de brownies',
  });
  await RecipeIngredient.bulkCreate([
    { recipeId: brownies.id, ingredientId: harina.id, quantity: '0.3000' },
    { recipeId: brownies.id, ingredientId: azucar.id, quantity: '0.4000' },
    { recipeId: brownies.id, ingredientId: huevos.id, quantity: '3.0000' },
    { recipeId: brownies.id, ingredientId: chocolate.id, quantity: '0.4000' },
    { recipeId: brownies.id, ingredientId: manteca.id, quantity: '0.2000' },
  ]);

  const rainbowCupcakes = await Recipe.create({
    companyId,
    name: 'Cupcakes arcoíris',
  });
  await RecipeIngredient.bulkCreate([
    { recipeId: rainbowCupcakes.id, ingredientId: harina.id, quantity: '0.2500' },
    { recipeId: rainbowCupcakes.id, ingredientId: azucar.id, quantity: '0.2000' },
    { recipeId: rainbowCupcakes.id, ingredientId: huevos.id, quantity: '2.0000' },
    { recipeId: rainbowCupcakes.id, ingredientId: manteca.id, quantity: '0.1000' },
  ]);

  const weddingCake = await Recipe.create({
    companyId,
    name: 'Torta de casamiento',
    description: 'Dos pisos',
  });
  await RecipeIngredient.bulkCreate([
    { recipeId: weddingCake.id, ingredientId: harina.id, quantity: '1.2000' },
    { recipeId: weddingCake.id, ingredientId: azucar.id, quantity: '0.8000' },
    { recipeId: weddingCake.id, ingredientId: huevos.id, quantity: '10.0000' },
    { recipeId: weddingCake.id, ingredientId: manteca.id, quantity: '0.5000' },
    { recipeId: weddingCake.id, ingredientId: chocolate.id, quantity: '0.4000' },
  ]);

  await Interaction.bulkCreate([
    {
      companyId,
      clientId: maria.id,
      userId: owner.id,
      channel: 'INSTAGRAM',
      content: 'Customer asked for a chocolate birthday cake for 20 people.',
      occurredAt: addZonedDays(now, -10),
    },
    {
      companyId,
      clientId: maria.id,
      userId: owner.id,
      channel: 'WHATSAPP',
      content: 'Sent quote for 45,000 plus a dozen cupcakes. Customer approved the design.',
      occurredAt: addZonedDays(now, -8),
    },
    {
      companyId,
      clientId: maria.id,
      userId: owner.id,
      channel: 'WHATSAPP',
      content: 'Customer sent three screenshot references of floral cakes.',
      occurredAt: addZonedDays(now, -7),
    },
    {
      companyId,
      clientId: juan.id,
      userId: owner.id,
      channel: 'WHATSAPP',
      content: 'Requested a delivery of cookies and brownies for Saturday.',
      occurredAt: addZonedDays(now, -3),
    },
    {
      companyId,
      clientId: lucia.id,
      userId: owner.id,
      channel: 'INSTAGRAM',
      content: 'Asked for a wedding cake quote. Waiting for guest count.',
      occurredAt: addZonedDays(now, -4),
    },
    {
      companyId,
      clientId: sofia.id,
      userId: owner.id,
      channel: 'PHONE',
      content: 'Confirmed pickup for last weekend order.',
      occurredAt: addZonedDays(now, -6),
    },
  ]);

  const mariaOrder = await Order.create({
    companyId,
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
      recipeId: chocolateCake.id,
      description: 'Torta de chocolate',
      quantity: 1,
      unitPrice: '2174.00',
    },
    {
      orderId: mariaOrder.id,
      recipeId: vanillaCupcakes.id,
      description: 'Cupcakes de vainilla',
      quantity: 12,
      unitPrice: '501.00',
    },
  ]);
  mariaOrder.totalAmount = '63000.00';
  await mariaOrder.save();
  await Payment.create({
    companyId,
    orderId: mariaOrder.id,
    type: 'DEPOSIT',
    amount: '20000.00',
    paymentMethod: 'BANK_TRANSFER',
    paidAt: addZonedDays(now, -6),
    notes: 'Sena / deposit',
    hasPaymentReceipt: true,
  });

  const juanOrder = await Order.create({
    companyId,
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
      recipeId: cookieBox.id,
      description: 'Caja de cookies',
      quantity: 2,
      unitPrice: '576.00',
    },
    {
      orderId: juanOrder.id,
      recipeId: brownies.id,
      description: 'Bandeja de brownies',
      quantity: 1,
      unitPrice: '2602.00',
    },
  ]);
  juanOrder.totalAmount = '32000.00';
  await juanOrder.save();
  await Payment.create({
    companyId,
    orderId: juanOrder.id,
    type: 'DEPOSIT',
    amount: '32000.00',
    paymentMethod: 'CASH',
    paidAt: addZonedDays(now, -1),
    notes: 'Paid in full',
  });

  const sofiaOrder = await Order.create({
    companyId,
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
    recipeId: rainbowCupcakes.id,
    description: 'Cupcakes arcoíris',
    quantity: 12,
    unitPrice: '421.00',
  });
  sofiaOrder.totalAmount = '18000.00';
  await sofiaOrder.save();
  await Payment.bulkCreate([
    {
      companyId,
      orderId: sofiaOrder.id,
      type: 'DEPOSIT',
      amount: '8000.00',
      paymentMethod: 'CASH',
      paidAt: addZonedDays(now, -12),
    },
    {
      companyId,
      orderId: sofiaOrder.id,
      type: 'FINAL',
      amount: '10000.00',
      paymentMethod: 'CARD',
      paidAt: addZonedDays(now, -5),
    },
  ]);

  const luciaOrder = await Order.create({
    companyId,
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
    recipeId: weddingCake.id,
    description: 'Torta de casamiento',
    quantity: 1,
    unitPrice: '5484.00',
  });
  luciaOrder.totalAmount = '120000.00';
  await luciaOrder.save();

  const andresOrder = await Order.create({
    companyId,
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
    recipeId: chocolateCake.id,
    description: 'Torta de chocolate',
    quantity: 1,
    unitPrice: '2174.00',
  });
  await Payment.create({
    companyId,
    orderId: andresOrder.id,
    type: 'DEPOSIT',
    amount: '15000.00',
    paymentMethod: 'BANK_TRANSFER',
    paidAt: addZonedDays(now, -2),
    hasPaymentReceipt: true,
  });

  await Task.bulkCreate([
    {
      companyId,
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
      companyId,
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
      companyId,
      clientId: juan.id,
      orderId: juanOrder.id,
      title: 'Confirm delivery address',
      dueAt: addZonedDays(now, 1),
      priority: 'MEDIUM',
      completed: false,
      createdBy: owner.id,
    },
    {
      companyId,
      clientId: andres.id,
      orderId: andresOrder.id,
      title: 'Collect remaining payment from Andres',
      dueAt: addZonedDays(now, 1),
      priority: 'HIGH',
      completed: false,
      createdBy: owner.id,
    },
    {
      companyId,
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
      user: 'victoriavanoli@hotmail.com',
      clients: 5,
      ingredients: 6,
      recipes: 6,
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
