import { literal, Op, type Transaction, type WhereOptions } from 'sequelize';
import { sequelize } from '../../database/sequelize.js';
import { AppError } from '../../errors/app-error.js';
import { pinoLogger } from '../../lib/pino.js';
import { storage } from '../../lib/storage.js';
import { Attachment, Client, Order, OrderItem, Payment, Recipe } from '../../models/index.js';
import { paginationMeta, paginationOffset } from '../../shared/pagination.js';
import { summarizePayments } from '../../shared/payments.js';
import {
  assertFulfillmentStatus,
  assertOrderStatusTransition,
} from '../../shared/order-status.js';
import { getClientById } from '../clients/clients.service.js';
import { getRecipePrice } from '../recipes/recipes.service.js';
import { roundMoney } from '../../shared/money.js';
import {
  paymentSummaryForOrder,
  paymentsTotalsByOrderIds,
  recalculateOrderTotal,
} from './order-finance.js';
import { toPublicOrder, type PublicOrder } from './orders.mappers.js';
import type {
  CreateOrderBody,
  ListOrdersQuery,
  OrderItemBody,
  ReplaceOrderItemBody,
  UpdateOrderBody,
  UpdateOrderItemBody,
} from './orders.schemas.js';

async function deleteStoredObjects(
  storageKeys: string[],
  context: { orderId: string },
): Promise<void> {
  for (const storageKey of storageKeys) {
    try {
      await storage.delete(storageKey);
    } catch (error) {
      pinoLogger.error({ err: error, storageKey, ...context }, 'Failed to delete MinIO object after order deletion');
    }
  }
}

async function replaceOrderItems(
  orderId: string,
  companyId: string,
  items: ReplaceOrderItemBody[],
  transaction: Transaction,
): Promise<void> {
  const existingItems = await OrderItem.findAll({ where: { orderId }, transaction });
  const existingById = new Map(existingItems.map((item) => [item.id, item]));
  const keepIds = new Set(items.flatMap((item) => (item.id ? [item.id] : [])));

  for (const item of existingItems) {
    if (!keepIds.has(item.id)) {
      await item.destroy({ transaction });
    }
  }

  for (const itemInput of items) {
    if (itemInput.id) {
      const item = existingById.get(itemInput.id);
      if (!item) {
        throw AppError.notFound('Order item not found');
      }
      const resolved = await resolveItemInput(itemInput, companyId, item);
      item.recipeId = resolved.recipeId;
      item.description = resolved.description;
      item.quantity = resolved.quantity;
      item.unitPrice = resolved.unitPrice;
      item.notes = resolved.notes;
      await item.save({ transaction });
    } else {
      const resolved = await resolveItemInput(itemInput, companyId);
      await OrderItem.create({ orderId, ...resolved }, { transaction });
    }
  }
}

function paidAmountSql(): string {
  return `COALESCE((SELECT SUM(payments.amount) FROM payments WHERE payments.order_id = "Order"."id"), 0)`;
}

function listWhere(companyId: string, query: ListOrdersQuery): WhereOptions {
  const clauses: WhereOptions[] = [{ companyId }];

  if (query.status) {
    clauses.push({ status: query.status });
  }
  if (query.fulfillmentType) {
    clauses.push({ fulfillmentType: query.fulfillmentType });
  }
  if (query.clientId) {
    clauses.push({ clientId: query.clientId });
  }
  if (query.from || query.to) {
    clauses.push({
      eventDate: {
        ...(query.from ? { [Op.gte]: query.from } : {}),
        ...(query.to ? { [Op.lte]: query.to } : {}),
      },
    });
  }

  const paid = paidAmountSql();
  if (query.paymentStatus === 'UNPAID') {
    clauses.push(literal(`${paid} = 0`));
    clauses.push({ totalAmount: { [Op.gt]: 0 } });
  } else if (query.paymentStatus === 'PARTIALLY_PAID') {
    clauses.push(literal(`${paid} > 0`));
    clauses.push(literal(`${paid} < "Order"."total_amount"`));
  } else if (query.paymentStatus === 'PAID') {
    clauses.push(literal(`(${paid} >= "Order"."total_amount")`));
  }

  return { [Op.and]: clauses };
}

async function resolveItemInput(
  input: OrderItemBody | UpdateOrderItemBody,
  companyId: string,
  existing?: OrderItem,
): Promise<{
  recipeId: string | null;
  description: string;
  quantity: number;
  unitPrice: string;
  notes: string | null;
}> {
  const recipeId =
    input.recipeId === undefined ? (existing?.recipeId ?? null) : input.recipeId;
  const recipe = recipeId ? await getRecipePrice(recipeId, companyId) : null;
  const description = input.description ?? recipe?.name ?? existing?.description;
  const unitPrice =
    input.unitPrice === undefined
      ? recipe
        ? recipe.price
        : existing
          ? Number(existing.unitPrice)
          : 0
      : input.unitPrice;
  const quantity = input.quantity ?? existing?.quantity;
  const notes = input.notes === undefined ? (existing?.notes ?? null) : input.notes;

  if (!description) {
    throw AppError.validation('Order item description is required');
  }
  if (quantity === undefined) {
    throw AppError.validation('Order item quantity is required');
  }

  return {
    recipeId,
    description,
    quantity,
    unitPrice: unitPrice.toFixed(2),
    notes,
  };
}

async function applyOrderTotal(
  order: Order,
  amount: number,
  transaction: Transaction,
): Promise<void> {
  const rounded = roundMoney(amount);
  const paid = await paymentSummaryForOrder(order.id, rounded, transaction);
  if (paid.paidAmount > rounded) {
    throw AppError.conflict('New total would be lower than existing payments');
  }
  order.totalAmount = rounded.toFixed(2);
  await order.save({ transaction });
}

export async function createOrder(
  clientId: string,
  companyId: string,
  input: CreateOrderBody,
): Promise<PublicOrder> {
  await getClientById(clientId, companyId);

  const fulfillmentType = input.fulfillmentType ?? 'PICKUP';
  const status = input.status ?? 'LEAD';
  assertFulfillmentStatus(status, fulfillmentType);

  const order = await sequelize.transaction(async (transaction) => {
    const created = await Order.create(
      {
        companyId,
        clientId,
        status,
        eventDate: input.eventDate ?? null,
        eventTime: input.eventTime ?? null,
        description: input.description ?? null,
        fulfillmentType,
        deliveryAddress: input.deliveryAddress ?? null,
        deliveryTime: input.deliveryTime ?? null,
        notes: input.notes ?? null,
        totalAmount: '0.00',
      },
      { transaction },
    );

    for (const item of input.items ?? []) {
      const resolved = await resolveItemInput(item, companyId);
      await OrderItem.create(
        {
          orderId: created.id,
          ...resolved,
        },
        { transaction },
      );
    }

    const computed = await recalculateOrderTotal(created.id, transaction);
    const total = input.totalAmount === undefined ? computed : input.totalAmount;
    await applyOrderTotal(created, total, transaction);
    return created;
  });

  return getOrder(order.id, companyId);
}

export async function listOrders(
  companyId: string,
  query: ListOrdersQuery,
): Promise<{
  data: PublicOrder[];
  meta: ReturnType<typeof paginationMeta>;
}> {
  const { limit, offset } = paginationOffset(query);
  const include = [
    {
      model: Client,
      as: 'client',
      required: Boolean(query.q),
      where: query.q
        ? {
            [Op.or]: [
              { name: { [Op.iLike]: `%${query.q}%` } },
              { phone: { [Op.iLike]: `%${query.q}%` } },
              { instagramUsername: { [Op.iLike]: `%${query.q}%` } },
            ],
          }
        : undefined,
    },
  ];

  const { rows, count } = await Order.findAndCountAll({
    where: listWhere(companyId, query),
    include,
    order: [
      ['eventDate', 'ASC'],
      ['createdAt', 'DESC'],
    ],
    limit,
    offset,
    distinct: true,
  });

  const paidMap = await paymentsTotalsByOrderIds(rows.map((order) => order.id));
  return {
    data: rows.map((order) =>
      toPublicOrder(order, summarizePayments(order.totalAmount, paidMap.get(order.id) ?? 0), {
        includeItems: false,
        includePayments: false,
      }),
    ),
    meta: paginationMeta(query, count),
  };
}

export async function getOrderRecord(
  orderId: string,
  companyId: string,
  transaction?: Transaction,
): Promise<Order> {
  const order = await Order.findOne({
    where: { id: orderId, companyId },
    include: [
      { model: Client, as: 'client' },
      {
        model: OrderItem,
        as: 'items',
        include: [{ model: Recipe, as: 'recipe' }],
      },
      {
        model: Payment,
        as: 'payments',
        include: [{ model: Attachment, as: 'attachments' }],
      },
    ],
    order: [
      [{ model: OrderItem, as: 'items' }, 'createdAt', 'ASC'],
      [{ model: Payment, as: 'payments' }, 'paidAt', 'ASC'],
    ],
    transaction,
  });
  if (!order) {
    throw AppError.notFound('Order not found');
  }
  return order;
}

export async function getOrder(orderId: string, companyId: string): Promise<PublicOrder> {
  const order = await getOrderRecord(orderId, companyId);
  const summary = await paymentSummaryForOrder(order.id, order.totalAmount);
  return toPublicOrder(order, summary);
}

export async function updateOrder(
  orderId: string,
  companyId: string,
  input: UpdateOrderBody,
): Promise<PublicOrder> {
  const order = await sequelize.transaction(async (transaction) => {
    const current = await Order.findOne({ where: { id: orderId, companyId }, transaction });
    if (!current) {
      throw AppError.notFound('Order not found');
    }

    if (input.status !== undefined && input.status !== current.status) {
      assertOrderStatusTransition(current.status, input.status);
      current.status = input.status;
    }

    if (input.eventDate !== undefined) current.eventDate = input.eventDate;
    if (input.eventTime !== undefined) current.eventTime = input.eventTime;
    if (input.description !== undefined) current.description = input.description;
    if (input.fulfillmentType !== undefined) current.fulfillmentType = input.fulfillmentType;
    if (input.deliveryAddress !== undefined) current.deliveryAddress = input.deliveryAddress;
    if (input.deliveryTime !== undefined) current.deliveryTime = input.deliveryTime;
    if (input.notes !== undefined) current.notes = input.notes;

    assertFulfillmentStatus(current.status, current.fulfillmentType);

    if (input.items !== undefined) {
      await replaceOrderItems(current.id, companyId, input.items, transaction);
    }

    if (input.totalAmount !== undefined) {
      await applyOrderTotal(current, input.totalAmount, transaction);
    } else {
      await current.save({ transaction });
    }
    return current;
  });

  return getOrder(order.id, companyId);
}

export async function deleteOrder(orderId: string, companyId: string): Promise<void> {
  const order = await getOrderRecord(orderId, companyId);
  const payments = (order.get('payments') as Payment[] | undefined) ?? [];
  const storageKeys = payments.flatMap((payment) => {
    const attachments = (payment.get('attachments') as Attachment[] | undefined) ?? [];
    return attachments.map((attachment) => attachment.storageKey);
  });
  const paymentIds = payments.map((payment) => payment.id);

  await sequelize.transaction(async (transaction) => {
    if (paymentIds.length > 0) {
      await Attachment.destroy({ where: { paymentId: { [Op.in]: paymentIds } }, transaction });
      await Payment.destroy({ where: { orderId }, transaction });
    }
    await order.destroy({ transaction });
  });

  await deleteStoredObjects(storageKeys, { orderId });
}

export async function addOrderItem(
  orderId: string,
  companyId: string,
  input: OrderItemBody,
): Promise<PublicOrder> {
  await sequelize.transaction(async (transaction) => {
    const order = await Order.findOne({ where: { id: orderId, companyId }, transaction });
    if (!order) {
      throw AppError.notFound('Order not found');
    }
    const resolved = await resolveItemInput(input, companyId);
    await OrderItem.create({ orderId: order.id, ...resolved }, { transaction });
  });

  return getOrder(orderId, companyId);
}

export async function updateOrderItem(
  orderId: string,
  companyId: string,
  itemId: string,
  input: UpdateOrderItemBody,
): Promise<PublicOrder> {
  await sequelize.transaction(async (transaction) => {
    const order = await Order.findOne({ where: { id: orderId, companyId }, transaction });
    if (!order) {
      throw AppError.notFound('Order not found');
    }
    const item = await OrderItem.findOne({ where: { id: itemId, orderId }, transaction });
    if (!item) {
      throw AppError.notFound('Order item not found');
    }
    const resolved = await resolveItemInput(input, companyId, item);
    item.recipeId = resolved.recipeId;
    item.description = resolved.description;
    item.quantity = resolved.quantity;
    item.unitPrice = resolved.unitPrice;
    item.notes = resolved.notes;
    await item.save({ transaction });
  });

  return getOrder(orderId, companyId);
}

export async function deleteOrderItem(
  orderId: string,
  companyId: string,
  itemId: string,
): Promise<PublicOrder> {
  await sequelize.transaction(async (transaction) => {
    const order = await Order.findOne({ where: { id: orderId, companyId }, transaction });
    if (!order) {
      throw AppError.notFound('Order not found');
    }
    const item = await OrderItem.findOne({ where: { id: itemId, orderId }, transaction });
    if (!item) {
      throw AppError.notFound('Order item not found');
    }

    await item.destroy({ transaction });
  });

  return getOrder(orderId, companyId);
}
