import type { Request, Response } from 'express';
import { currentCompanyId } from '../../middleware/auth.js';
import { deletePayment, getPayment, listOrderPayments, registerPayment, updatePayment } from './payments.service.js';

export async function listForOrder(req: Request, res: Response): Promise<void> {
  const payments = await listOrderPayments(req.params.orderId as string, currentCompanyId(req));
  res.status(200).json({ data: payments });
}

export async function createForOrder(req: Request, res: Response): Promise<void> {
  const order = await registerPayment(req.params.orderId as string, currentCompanyId(req), req.body);
  res.status(201).json({ data: order });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const payment = await getPayment(req.params.paymentId as string, currentCompanyId(req));
  res.status(200).json({ data: payment });
}

export async function update(req: Request, res: Response): Promise<void> {
  const order = await updatePayment(req.params.paymentId as string, currentCompanyId(req), req.body);
  res.status(200).json({ data: order });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const order = await deletePayment(req.params.paymentId as string, currentCompanyId(req));
  res.status(200).json({ data: order });
}
