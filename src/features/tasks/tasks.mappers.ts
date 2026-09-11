import type { Client } from '../../models/client.js';
import type { Order } from '../../models/order.js';
import type { Task } from '../../models/task.js';

export type PublicTask = {
  id: string;
  clientId: string | null;
  orderId: string | null;
  clientName: string | null;
  orderStatus: string | null;
  title: string;
  description: string | null;
  dueAt: string | null;
  priority: string;
  completed: boolean;
  completedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export function toPublicTask(task: Task): PublicTask {
  const client = (task.get('client') as Client | undefined) ?? null;
  const order = (task.get('order') as Order | undefined) ?? null;

  return {
    id: task.id,
    clientId: task.clientId,
    orderId: task.orderId,
    clientName: client?.name ?? null,
    orderStatus: order?.status ?? null,
    title: task.title,
    description: task.description,
    dueAt: task.dueAt ? task.dueAt.toISOString() : null,
    priority: task.priority,
    completed: task.completed,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    createdBy: task.createdBy,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
