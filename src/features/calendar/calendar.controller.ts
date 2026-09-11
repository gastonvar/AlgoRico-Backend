import type { Request, Response } from 'express';
import { getCalendar } from './calendar.service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const data = await getCalendar(req.query as never);
  res.status(200).json({ data });
}
