import type { Request, Response } from 'express';
import { AppError } from '../../errors/app-error.js';
import { currentCompanyId } from '../../middleware/auth.js';
import {
  createInteractionAttachments,
  createPaymentAttachments,
  deleteAttachment,
  getAttachment,
} from './attachments.service.js';

function uploadedFiles(req: Request): Express.Multer.File[] {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) {
    throw AppError.validation('At least one file is required');
  }
  return files;
}

export async function createForInteraction(req: Request, res: Response): Promise<void> {
  const attachments = await createInteractionAttachments(
    req.params.interactionId as string,
    currentCompanyId(req),
    uploadedFiles(req),
  );
  res.status(201).json({ data: attachments });
}

export async function createForPayment(req: Request, res: Response): Promise<void> {
  const attachments = await createPaymentAttachments(
    req.params.paymentId as string,
    currentCompanyId(req),
    uploadedFiles(req),
  );
  res.status(201).json({ data: attachments });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const attachment = await getAttachment(req.params.attachmentId as string, currentCompanyId(req));
  res.status(200).json({ data: attachment });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteAttachment(req.params.attachmentId as string, currentCompanyId(req));
  res.status(204).send();
}
