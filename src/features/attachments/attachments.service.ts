import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { sequelize } from '../../database/sequelize.js';
import { AppError } from '../../errors/app-error.js';
import { pinoLogger } from '../../lib/pino.js';
import { storage } from '../../lib/storage.js';
import {
  assertAllowedImage,
  buildAttachmentStorageKey,
  sanitizeFilename,
  type AttachmentParentKind,
} from '../../lib/uploads.js';
import { Attachment, Order, Payment } from '../../models/index.js';
import { getInteractionById } from '../interactions/interactions.service.js';
import { toPublicAttachment, type PublicAttachment } from './attachments.mappers.js';

export type AttachmentDownload = PublicAttachment & {
  downloadUrl: string;
  expiresInSeconds: number;
};

async function persistFiles(input: {
  files: Express.Multer.File[];
  clientId: string;
  parentKind: AttachmentParentKind;
  parentId: string;
  interactionId: string | null;
  paymentId: string | null;
}): Promise<PublicAttachment[]> {
  if (input.files.length === 0) {
    throw AppError.validation('At least one file is required');
  }

  const created: PublicAttachment[] = [];

  for (const file of input.files) {
    assertAllowedImage(file);
    const attachmentId = randomUUID();
    const storageKey = buildAttachmentStorageKey({
      clientId: input.clientId,
      parentKind: input.parentKind,
      parentId: input.parentId,
      attachmentId,
      mimeType: file.mimetype,
    });

    try {
      await storage.upload({
        storageKey,
        body: file.buffer,
        mimeType: file.mimetype,
      });
    } catch (error) {
      pinoLogger.error(
        { err: error, parentKind: input.parentKind, parentId: input.parentId },
        'MinIO upload failed',
      );
      throw AppError.badRequest('File upload failed');
    }

    try {
      const attachment = await sequelize.transaction(async (transaction) =>
        Attachment.create(
          {
            id: attachmentId,
            interactionId: input.interactionId,
            paymentId: input.paymentId,
            originalFilename: sanitizeFilename(file.originalname),
            mimeType: file.mimetype,
            fileSize: file.size,
            storageKey,
          },
          { transaction },
        ),
      );
      created.push(toPublicAttachment(attachment));
    } catch (error) {
      try {
        await storage.delete(storageKey);
      } catch (cleanupError) {
        pinoLogger.error(
          { err: cleanupError, storageKey, parentId: input.parentId },
          'Failed to clean up MinIO object after attachment persistence failure',
        );
      }
      throw error;
    }
  }

  return created;
}

export async function createInteractionAttachments(
  interactionId: string,
  files: Express.Multer.File[],
): Promise<PublicAttachment[]> {
  const interaction = await getInteractionById(interactionId);
  return persistFiles({
    files,
    clientId: interaction.clientId,
    parentKind: 'interaction',
    parentId: interaction.id,
    interactionId: interaction.id,
    paymentId: null,
  });
}

export async function createPaymentAttachments(
  paymentId: string,
  files: Express.Multer.File[],
): Promise<PublicAttachment[]> {
  const payment = await Payment.findByPk(paymentId, {
    include: [{ model: Order, as: 'order' }],
  });
  if (!payment) {
    throw AppError.notFound('Payment not found');
  }

  const order = payment.get('order') as Order | undefined;
  if (!order) {
    throw AppError.notFound('Payment not found');
  }

  return persistFiles({
    files,
    clientId: order.clientId,
    parentKind: 'payment',
    parentId: payment.id,
    interactionId: null,
    paymentId: payment.id,
  });
}

export async function getAttachment(attachmentId: string): Promise<AttachmentDownload> {
  const attachment = await Attachment.findByPk(attachmentId);
  if (!attachment) {
    throw AppError.notFound('Attachment not found');
  }

  const downloadUrl = await storage.getDownloadUrl(attachment.storageKey);
  return {
    ...toPublicAttachment(attachment),
    downloadUrl,
    expiresInSeconds: env.PRESIGNED_URL_EXPIRES_SECONDS,
  };
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  const attachment = await Attachment.findByPk(attachmentId);
  if (!attachment) {
    throw AppError.notFound('Attachment not found');
  }

  const storageKey = attachment.storageKey;
  await attachment.destroy();

  try {
    await storage.delete(storageKey);
  } catch (error) {
    pinoLogger.error(
      { err: error, storageKey, attachmentId },
      'Failed to delete MinIO object after attachment metadata deletion',
    );
  }
}
