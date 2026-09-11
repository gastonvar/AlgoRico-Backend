import { Op, type WhereOptions } from 'sequelize';
import { AppError } from '../../errors/app-error.js';
import { Client, Order, Task } from '../../models/index.js';
import { addZonedDays, endOfZonedDay, startOfZonedDay } from '../../shared/dates.js';
import { paginationMeta, paginationOffset } from '../../shared/pagination.js';
import { getClientById } from '../clients/clients.service.js';
import { getOrderRecord } from '../orders/orders.service.js';
import { toPublicTask, type PublicTask } from './tasks.mappers.js';
import type { CreateTaskBody, ListTasksQuery, UpdateTaskBody } from './tasks.schemas.js';

const taskInclude = [
  { model: Client, as: 'client' },
  { model: Order, as: 'order' },
];

function dueWhere(due: ListTasksQuery['due']): WhereOptions {
  const now = new Date();
  const todayStart = startOfZonedDay(now);
  const todayEnd = endOfZonedDay(now);
  const upcomingEnd = endOfZonedDay(addZonedDays(now, 14));

  if (due === 'overdue') {
    return { dueAt: { [Op.lt]: todayStart } };
  }
  if (due === 'today') {
    return { dueAt: { [Op.between]: [todayStart, todayEnd] } };
  }
  if (due === 'upcoming') {
    return { dueAt: { [Op.gt]: todayEnd, [Op.lte]: upcomingEnd } };
  }
  return {};
}

export async function listTasks(query: ListTasksQuery): Promise<{
  data: PublicTask[];
  meta: ReturnType<typeof paginationMeta>;
}> {
  const where: WhereOptions = {
    ...dueWhere(query.due),
    ...(query.completed !== undefined
      ? { completed: query.completed }
      : query.due
        ? { completed: false }
        : {}),
    ...(query.clientId ? { clientId: query.clientId } : {}),
    ...(query.orderId ? { orderId: query.orderId } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
  };

  const { limit, offset } = paginationOffset(query);
  const { rows, count } = await Task.findAndCountAll({
    where,
    include: taskInclude,
    order: [
      ['dueAt', 'ASC'],
      ['priority', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    limit,
    offset,
    distinct: true,
  });

  return {
    data: rows.map(toPublicTask),
    meta: paginationMeta(query, count),
  };
}

async function assertTaskRelations(clientId: string | null, orderId: string | null): Promise<void> {
  if (clientId) {
    await getClientById(clientId, { includeArchived: true });
  }
  if (orderId) {
    const order = await getOrderRecord(orderId);
    if (clientId && order.clientId !== clientId) {
      throw AppError.conflict('Task order does not belong to the selected client');
    }
  }
}

export async function createTask(userId: string, input: CreateTaskBody): Promise<PublicTask> {
  const clientId = input.clientId ?? null;
  const orderId = input.orderId ?? null;
  await assertTaskRelations(clientId, orderId);

  const task = await Task.create({
    clientId,
    orderId,
    title: input.title,
    description: input.description ?? null,
    dueAt: input.dueAt ? new Date(input.dueAt) : null,
    priority: input.priority ?? 'MEDIUM',
    createdBy: userId,
  });

  return getTask(task.id);
}

export async function getTask(taskId: string): Promise<PublicTask> {
  const task = await Task.findByPk(taskId, { include: taskInclude });
  if (!task) {
    throw AppError.notFound('Task not found');
  }
  return toPublicTask(task);
}

export async function updateTask(taskId: string, input: UpdateTaskBody): Promise<PublicTask> {
  const task = await Task.findByPk(taskId);
  if (!task) {
    throw AppError.notFound('Task not found');
  }

  const nextClientId = input.clientId === undefined ? task.clientId : input.clientId;
  const nextOrderId = input.orderId === undefined ? task.orderId : input.orderId;
  await assertTaskRelations(nextClientId, nextOrderId);

  if (input.clientId !== undefined) task.clientId = input.clientId;
  if (input.orderId !== undefined) task.orderId = input.orderId;
  if (input.title !== undefined) task.title = input.title;
  if (input.description !== undefined) task.description = input.description;
  if (input.dueAt !== undefined) task.dueAt = input.dueAt ? new Date(input.dueAt) : null;
  if (input.priority !== undefined) task.priority = input.priority;
  if (input.completed !== undefined) {
    task.completed = input.completed;
    task.completedAt = input.completed ? task.completedAt ?? new Date() : null;
  }

  await task.save();
  return getTask(task.id);
}

export async function deleteTask(taskId: string): Promise<void> {
  const task = await Task.findByPk(taskId);
  if (!task) {
    throw AppError.notFound('Task not found');
  }
  await task.destroy();
}
