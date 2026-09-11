import type { Request, Response } from 'express';
import {
  addOrderItem,
  createOrder,
  deleteOrder,
  deleteOrderItem,
  getOrder,
  listOrders,
  updateOrder,
  updateOrderItem,
} from './orders.service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const result = await listOrders(req.query as never);
  res.status(200).json(result);
}

export async function createForClient(req: Request, res: Response): Promise<void> {
  const order = await createOrder(req.params.clientId as string, req.body);
  res.status(201).json({ data: order });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const order = await getOrder(req.params.orderId as string);
  res.status(200).json({ data: order });
}

export async function update(req: Request, res: Response): Promise<void> {
  const order = await updateOrder(req.params.orderId as string, req.body);
  res.status(200).json({ data: order });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteOrder(req.params.orderId as string);
  res.status(204).send();
}

export async function addItem(req: Request, res: Response): Promise<void> {
  const order = await addOrderItem(req.params.orderId as string, req.body);
  res.status(201).json({ data: order });
}

export async function updateItem(req: Request, res: Response): Promise<void> {
  const order = await updateOrderItem(
    req.params.orderId as string,
    req.params.itemId as string,
    req.body,
  );
  res.status(200).json({ data: order });
}

export async function removeItem(req: Request, res: Response): Promise<void> {
  const order = await deleteOrderItem(req.params.orderId as string, req.params.itemId as string);
  res.status(200).json({ data: order });
}
