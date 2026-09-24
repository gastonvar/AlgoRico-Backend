import type { Request, Response } from 'express';
import { currentCompanyId } from '../../middleware/auth.js';
import { getCalendar } from './calendar.service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const data = await getCalendar(currentCompanyId(req), req.query as never);
  res.status(200).json({ data });
}
