import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { imageUpload } from '../../middleware/upload.js';
import { validateParams } from '../../middleware/validate.js';
import { idParams } from '../../shared/schemas.js';
import { createForInteraction, createForPayment, getById, remove } from './attachments.controller.js';

export const attachmentIdParamsSchema = idParams('attachmentId');
export const interactionAttachmentParamsSchema = idParams('interactionId');
export const paymentAttachmentParamsSchema = idParams('paymentId');

export const attachmentsRoutes = Router();
export const interactionAttachmentsRoutes = Router({ mergeParams: true });
export const paymentAttachmentsRoutes = Router({ mergeParams: true });

interactionAttachmentsRoutes.post(
  '/',
  validateParams(interactionAttachmentParamsSchema),
  imageUpload.array('files', 10),
  asyncHandler(createForInteraction),
);

paymentAttachmentsRoutes.post(
  '/',
  validateParams(paymentAttachmentParamsSchema),
  imageUpload.array('files', 10),
  asyncHandler(createForPayment),
);

attachmentsRoutes.get(
  '/:attachmentId',
  validateParams(attachmentIdParamsSchema),
  asyncHandler(getById),
);
attachmentsRoutes.delete(
  '/:attachmentId',
  validateParams(attachmentIdParamsSchema),
  asyncHandler(remove),
);
