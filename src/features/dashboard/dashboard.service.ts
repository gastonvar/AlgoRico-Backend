import { Op } from 'sequelize';
import { Client, Order, Task } from '../../models/index.js';
import { ACTIVE_ORDER_STATUSES } from '../../shared/constants.js';
import { addZonedDays, endOfZonedDay, formatDateOnly, startOfZonedDay } from '../../shared/dates.js';
import { summarizePayments } from '../../shared/payments.js';
import { toPublicClient, type PublicClient } from '../clients/clients.mappers.js';
import { paymentsTotalsByOrderIds } from '../orders/order-finance.js';
import { toPublicOrder, type PublicOrder } from '../orders/orders.mappers.js';
import { toPublicTask, type PublicTask } from '../tasks/tasks.mappers.js';

type MissingInfoOrder = {
  id: string;
  clientName: string;
  status: string;
  eventDate: string | null;
  issues: string[];
};

export type DashboardPayload = {
  today: {
    date: string;
    orderCount: number;
    orders: PublicOrder[];
    pickups: PublicOrder[];
    deliveries: PublicOrder[];
  };
  needsAttention: {
    overdueTasks: PublicTask[];
    tasksDueToday: PublicTask[];
    followUpClients: PublicClient[];
    ordersMissingInformation: MissingInfoOrder[];
  };
  upcoming: {
    orders: PublicOrder[];
    tasks: PublicTask[];
  };
  payments: {
    outstandingOrderCount: number;
    outstandingTotal: number;
    outstandingOrders: PublicOrder[];
  };
};

function orderIssues(order: Order): string[] {
  const issues: string[] = [];
  if (!order.eventDate) {
    issues.push('Missing event date');
  }
  if (!order.eventTime) {
    issues.push('Missing event time');
  }
  if (order.fulfillmentType === 'DELIVERY' && !order.deliveryAddress) {
    issues.push('Missing delivery address');
  }
  if (order.fulfillmentType === 'DELIVERY' && !order.deliveryTime) {
    issues.push('Missing delivery time');
  }
  return issues;
}

function toListOrder(
  order: Order,
  paidAmount: number,
): PublicOrder {
  return toPublicOrder(order, summarizePayments(order.totalAmount, paidAmount), {
    includeItems: false,
    includePayments: false,
  });
}

export async function getDashboard(companyId: string): Promise<DashboardPayload> {
  const now = new Date();
  const today = formatDateOnly(now);
  const todayStart = startOfZonedDay(now);
  const todayEnd = endOfZonedDay(now);
  const upcomingEndDate = formatDateOnly(addZonedDays(now, 14));
  const upcomingTaskEnd = endOfZonedDay(addZonedDays(now, 14));

  const [
    todaysOrders,
    upcomingOrders,
    incompleteActiveOrders,
    overdueTasks,
    tasksDueToday,
    upcomingTasks,
    followUpClients,
    outstandingCandidateOrders,
  ] = await Promise.all([
    Order.findAll({
      where: { companyId, eventDate: today, status: { [Op.ne]: 'CANCELLED' } },
      include: [{ model: Client, as: 'client' }],
      order: [['eventTime', 'ASC']],
    }),
    Order.findAll({
      where: {
        companyId,
        eventDate: { [Op.gt]: today, [Op.lte]: upcomingEndDate },
        status: { [Op.notIn]: ['CANCELLED', 'COMPLETED'] },
      },
      include: [{ model: Client, as: 'client' }],
      order: [['eventDate', 'ASC']],
      limit: 20,
    }),
    Order.findAll({
      where: {
        companyId,
        status: { [Op.in]: [...ACTIVE_ORDER_STATUSES] },
      },
      include: [{ model: Client, as: 'client' }],
    }),
    Task.findAll({
      where: { companyId, completed: false, dueAt: { [Op.lt]: todayStart } },
      include: [
        { model: Client, as: 'client' },
        { model: Order, as: 'order' },
      ],
      order: [['dueAt', 'ASC']],
      limit: 20,
    }),
    Task.findAll({
      where: { companyId, completed: false, dueAt: { [Op.between]: [todayStart, todayEnd] } },
      include: [
        { model: Client, as: 'client' },
        { model: Order, as: 'order' },
      ],
      order: [['dueAt', 'ASC']],
      limit: 20,
    }),
    Task.findAll({
      where: {
        companyId,
        completed: false,
        dueAt: { [Op.gt]: todayEnd, [Op.lte]: upcomingTaskEnd },
      },
      include: [
        { model: Client, as: 'client' },
        { model: Order, as: 'order' },
      ],
      order: [['dueAt', 'ASC']],
      limit: 20,
    }),
    Client.findAll({
      where: { companyId, needsFollowUp: true, archivedAt: null },
      order: [['updatedAt', 'DESC']],
      limit: 20,
    }),
    Order.findAll({
      where: {
        companyId,
        status: { [Op.notIn]: ['CANCELLED'] },
        totalAmount: { [Op.gt]: 0 },
      },
      include: [{ model: Client, as: 'client' }],
      order: [['eventDate', 'ASC']],
    }),
  ]);

  const financeOrderIds = [
    ...todaysOrders,
    ...upcomingOrders,
    ...outstandingCandidateOrders,
  ].map((order) => order.id);
  const paidMap = await paymentsTotalsByOrderIds(financeOrderIds);

  const mappedToday = todaysOrders.map((order) => toListOrder(order, paidMap.get(order.id) ?? 0));
  const mappedUpcoming = upcomingOrders.map((order) =>
    toListOrder(order, paidMap.get(order.id) ?? 0),
  );

  const outstandingOrders = outstandingCandidateOrders
    .map((order) => toListOrder(order, paidMap.get(order.id) ?? 0))
    .filter((order) => order.remainingBalance > 0)
    .slice(0, 20);

  const outstandingTotal = outstandingOrders.reduce(
    (total, order) => total + order.remainingBalance,
    0,
  );

  const ordersMissingInformation = incompleteActiveOrders.flatMap((order) => {
    const issues = orderIssues(order);
    if (issues.length === 0) {
      return [];
    }
    const client = order.get('client') as Client | undefined;
    return [
      {
        id: order.id,
        clientName: client?.name ?? 'Unknown client',
        status: order.status,
        eventDate: order.eventDate,
        issues,
      },
    ];
  });

  return {
    today: {
      date: today,
      orderCount: mappedToday.length,
      orders: mappedToday,
      pickups: mappedToday.filter((order) => order.fulfillmentType === 'PICKUP'),
      deliveries: mappedToday.filter((order) => order.fulfillmentType === 'DELIVERY'),
    },
    needsAttention: {
      overdueTasks: overdueTasks.map(toPublicTask),
      tasksDueToday: tasksDueToday.map(toPublicTask),
      followUpClients: followUpClients.map(toPublicClient),
      ordersMissingInformation,
    },
    upcoming: {
      orders: mappedUpcoming,
      tasks: upcomingTasks.map(toPublicTask),
    },
    payments: {
      outstandingOrderCount: outstandingOrders.length,
      outstandingTotal,
      outstandingOrders,
    },
  };
}
