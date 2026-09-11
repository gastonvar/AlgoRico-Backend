import { Op } from 'sequelize';
import { Client, Order } from '../../models/index.js';
import { summarizePayments } from '../../shared/payments.js';
import { paymentsTotalsByOrderIds } from '../orders/order-finance.js';
import type { CalendarQuery } from './calendar.schemas.js';

export type CalendarEntry = {
  id: string;
  clientId: string;
  clientName: string;
  status: string;
  eventDate: string;
  eventTime: string | null;
  fulfillmentType: string;
  description: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  paymentStatus: string;
};

export async function getCalendar(query: CalendarQuery): Promise<CalendarEntry[]> {
  const orders = await Order.findAll({
    where: {
      eventDate: { [Op.between]: [query.from, query.to] },
      ...(query.includeCancelled ? {} : { status: { [Op.ne]: 'CANCELLED' } }),
    },
    include: [{ model: Client, as: 'client' }],
    order: [
      ['eventDate', 'ASC'],
      ['eventTime', 'ASC'],
    ],
  });

  const paidMap = await paymentsTotalsByOrderIds(orders.map((order) => order.id));

  return orders.flatMap((order) => {
    if (!order.eventDate) {
      return [];
    }
    const client = order.get('client') as Client | undefined;
    const summary = summarizePayments(order.totalAmount, paidMap.get(order.id) ?? 0);
    return [
      {
        id: order.id,
        clientId: order.clientId,
        clientName: client?.name ?? 'Unknown client',
        status: order.status,
        eventDate: order.eventDate,
        eventTime: order.eventTime,
        fulfillmentType: order.fulfillmentType,
        description: order.description,
        totalAmount: summary.totalAmount,
        paidAmount: summary.paidAmount,
        remainingBalance: summary.remainingBalance,
        paymentStatus: summary.paymentStatus,
      },
    ];
  });
}
