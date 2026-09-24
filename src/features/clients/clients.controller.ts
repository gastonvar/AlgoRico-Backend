import type { Request, Response } from 'express';
import { currentCompanyId } from '../../middleware/auth.js';
import {
  createClient,
  getClientDetail,
  listClients,
  updateClient,
} from './clients.service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const result = await listClients(currentCompanyId(req), req.query as never);
  res.status(200).json(result);
}

export async function create(req: Request, res: Response): Promise<void> {
  const client = await createClient(currentCompanyId(req), req.body);
  res.status(201).json({ data: client });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const client = await getClientDetail(req.params.clientId as string, currentCompanyId(req));
  res.status(200).json({ data: client });
}

export async function update(req: Request, res: Response): Promise<void> {
  const client = await updateClient(req.params.clientId as string, currentCompanyId(req), req.body);
  res.status(200).json({ data: client });
}
