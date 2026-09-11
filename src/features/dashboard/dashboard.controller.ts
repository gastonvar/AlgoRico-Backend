import type { Request, Response } from 'express';
import { getDashboard } from './dashboard.service.js';

export async function get(_req: Request, res: Response): Promise<void> {
  const data = await getDashboard();
  res.status(200).json({ data });
}
