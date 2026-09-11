import { col, fn, type Transaction } from 'sequelize';
import { OrderItem, Payment } from '../../models/index.js';
import { lineTotal, roundMoney, sumMoney } from '../../shared/money.js';
import { summarizePayments, type PaymentSummary } from '../../shared/payments.js';

export async function paymentsTotalForOrder(
  orderId: string,
  transaction?: Transaction,
): Promise<number> {
  const result = await Payment.findAll({
    where: { orderId },
    attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'paidAmount']],
    raw: true,
    transaction,
  });

  const paid = (result[0] as { paidAmount?: string } | undefined)?.paidAmount ?? '0';
  return roundMoney(paid);
}

export async function paymentsTotalsByOrderIds(
  orderIds: string[],
): Promise<Map<string, number>> {
  const totals = new Map<string, number>();
  if (orderIds.length === 0) {
    return totals;
  }

  const rows = await Payment.findAll({
    where: { orderId: orderIds },
    attributes: ['orderId', [fn('SUM', col('amount')), 'paidAmount']],
    group: ['orderId'],
    raw: true,
  });

  for (const row of rows as unknown as Array<{ orderId: string; paidAmount: string }>) {
    totals.set(row.orderId, roundMoney(row.paidAmount));
  }

  return totals;
}

export function itemsTotal(
  items: Array<{ quantity: number; unitPrice: string | number }>,
): number {
  return roundMoney(sumMoney(items.map((item) => lineTotal(item.quantity, item.unitPrice))));
}

export async function recalculateOrderTotal(
  orderId: string,
  transaction?: Transaction,
): Promise<number> {
  const items = await OrderItem.findAll({ where: { orderId }, transaction });
  return itemsTotal(items);
}

export async function paymentSummaryForOrder(
  orderId: string,
  totalAmount: number | string,
  transaction?: Transaction,
): Promise<PaymentSummary> {
  const paidAmount = await paymentsTotalForOrder(orderId, transaction);
  return summarizePayments(totalAmount, paidAmount);
}
