import type { Transaction } from 'sequelize';
import { sequelize } from '../../database/sequelize.js';
import { AppError } from '../../errors/app-error.js';
import { pinoLogger } from '../../lib/pino.js';
import { storage } from '../../lib/storage.js';
import { Attachment, Payment } from '../../models/index.js';
import { assertPaymentDoesNotOverpay } from '../../shared/payments.js';
import { isPreConfirmationStatus } from '../../shared/order-status.js';
import { paymentSummaryForOrder } from '../orders/order-finance.js';
import { getOrder, getOrderRecord } from '../orders/orders.service.js';
import { toPublicPayment, type PublicOrder, type PublicPayment } from '../orders/orders.mappers.js';
import type { CreatePaymentBody, UpdatePaymentBody } from './payments.schemas.js';

export async function listOrderPayments(orderId: string): Promise<PublicPayment[]> {
  await getOrderRecord(orderId);
  const payments = await Payment.findAll({
    where: { orderId },
    include: [{ model: Attachment, as: 'attachments' }],
    order: [
      ['paidAt', 'ASC'],
      [{ model: Attachment, as: 'attachments' }, 'createdAt', 'ASC'],
    ],
  });
  return payments.map(toPublicPayment);
}

export async function registerPayment(
  orderId: string,
  input: CreatePaymentBody,
): Promise<PublicOrder> {
  await sequelize.transaction(async (transaction) => {
    const order = await getOrderRecord(orderId, transaction);
    const summary = await paymentSummaryForOrder(order.id, order.totalAmount, transaction);
    assertPaymentDoesNotOverpay(summary.remainingBalance, input.amount);

    await Payment.create(
      {
        orderId: order.id,
        type: input.type,
        amount: input.amount.toFixed(2),
        paymentMethod: input.paymentMethod,
        paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
        notes: input.notes ?? null,
        hasPaymentReceipt: input.hasPaymentReceipt ?? false,
      },
      { transaction },
    );

    if (input.type === 'DEPOSIT' && isPreConfirmationStatus(order.status)) {
      order.status = 'CONFIRMED';
      await order.save({ transaction });
      pinoLogger.info({ orderId: order.id }, 'Order confirmed after deposit');
    }
  });

  return getOrder(orderId);
}

async function getPaymentRecord(paymentId: string, transaction?: Transaction): Promise<Payment> {
  const payment = await Payment.findByPk(paymentId, {
    include: [{ model: Attachment, as: 'attachments' }],
    transaction,
  });
  if (!payment) {
    throw AppError.notFound('Payment not found');
  }
  return payment;
}

export async function getPayment(paymentId: string): Promise<PublicPayment> {
  const payment = await getPaymentRecord(paymentId);
  return toPublicPayment(payment);
}

export async function updatePayment(
  paymentId: string,
  input: UpdatePaymentBody,
): Promise<PublicOrder> {
  const orderId = await sequelize.transaction(async (transaction) => {
    const payment = await getPaymentRecord(paymentId, transaction);
    const order = await getOrderRecord(payment.orderId, transaction);
    const summary = await paymentSummaryForOrder(order.id, order.totalAmount, transaction);

    if (input.amount !== undefined) {
      const currentAmount = Number(payment.amount);
      assertPaymentDoesNotOverpay(summary.remainingBalance + currentAmount, input.amount);
      payment.amount = input.amount.toFixed(2);
    }
    if (input.type !== undefined) payment.type = input.type;
    if (input.paymentMethod !== undefined) payment.paymentMethod = input.paymentMethod;
    if (input.paidAt !== undefined) payment.paidAt = new Date(input.paidAt);
    if (input.notes !== undefined) payment.notes = input.notes;
    if (input.hasPaymentReceipt !== undefined) payment.hasPaymentReceipt = input.hasPaymentReceipt;
    await payment.save({ transaction });
    return payment.orderId;
  });

  return getOrder(orderId);
}

export async function deletePayment(paymentId: string): Promise<PublicOrder> {
  const payment = await getPaymentRecord(paymentId);
  const orderId = payment.orderId;
  const attachments = (payment.get('attachments') as Attachment[] | undefined) ?? [];
  const storageKeys = attachments.map((attachment) => attachment.storageKey);

  await sequelize.transaction(async (transaction) => {
    await Attachment.destroy({ where: { paymentId }, transaction });
    await payment.destroy({ transaction });
  });

  for (const storageKey of storageKeys) {
    try {
      await storage.delete(storageKey);
    } catch (error) {
      pinoLogger.error(
        { err: error, storageKey, paymentId },
        'Failed to delete MinIO object after payment deletion',
      );
    }
  }

  return getOrder(orderId);
}
