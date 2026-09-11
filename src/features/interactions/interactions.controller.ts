import type { Request, Response } from 'express';
import { currentUserId } from '../../middleware/auth.js';
import {
  createInteraction,
  createOrderInteraction,
  deleteInteraction,
  getInteraction,
  listClientInteractions,
  listOrderInteractions,
  updateInteraction,
} from './interactions.service.js';

export async function listForClient(req: Request, res: Response): Promise<void> {
  const result = await listClientInteractions(req.params.clientId as string, req.query as never);
  res.status(200).json(result);
}

export async function createForClient(req: Request, res: Response): Promise<void> {
  const interaction = await createInteraction(
    req.params.clientId as string,
    currentUserId(req),
    req.body,
  );
  res.status(201).json({ data: interaction });
}

export async function listForOrder(req: Request, res: Response): Promise<void> {
  const result = await listOrderInteractions(req.params.orderId as string, req.query as never);
  res.status(200).json(result);
}

export async function createForOrder(req: Request, res: Response): Promise<void> {
  const interaction = await createOrderInteraction(
    req.params.orderId as string,
    currentUserId(req),
    req.body,
  );
  res.status(201).json({ data: interaction });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const interaction = await getInteraction(req.params.interactionId as string);
  res.status(200).json({ data: interaction });
}

export async function update(req: Request, res: Response): Promise<void> {
  const interaction = await updateInteraction(req.params.interactionId as string, req.body);
  res.status(200).json({ data: interaction });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteInteraction(req.params.interactionId as string);
  res.status(204).send();
}
