import type { Request, Response } from 'express';
import {
  createClient,
  getClientDetail,
  listClients,
  updateClient,
} from './clients.service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const result = await listClients(req.query as never);
  res.status(200).json(result);
}

export async function create(req: Request, res: Response): Promise<void> {
  const client = await createClient(req.body);
  res.status(201).json({ data: client });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const client = await getClientDetail(req.params.clientId as string);
  res.status(200).json({ data: client });
}

export async function update(req: Request, res: Response): Promise<void> {
  const client = await updateClient(req.params.clientId as string, req.body);
  res.status(200).json({ data: client });
}
