import type { Attachment } from '../../models/attachment.js';

export type PublicAttachment = {
  id: string;
  interactionId: string | null;
  paymentId: string | null;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
};

export function toPublicAttachment(attachment: Attachment): PublicAttachment {
  return {
    id: attachment.id,
    interactionId: attachment.interactionId,
    paymentId: attachment.paymentId,
    originalFilename: attachment.originalFilename,
    mimeType: attachment.mimeType,
    fileSize: attachment.fileSize,
    createdAt: attachment.createdAt.toISOString(),
    updatedAt: attachment.updatedAt.toISOString(),
  };
}
