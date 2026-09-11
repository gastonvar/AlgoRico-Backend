import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { ALLOWED_IMAGE_MIME_TYPES, MIME_EXTENSIONS } from '../shared/constants.js';
import type { AllowedImageMimeType } from '../shared/constants.js';

export function assertAllowedImage(file: Express.Multer.File): asserts file is Express.Multer.File {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype as AllowedImageMimeType)) {
    throw AppError.validation('Unsupported file type. Allowed types: image/jpeg, image/png, image/webp');
  }

  if (file.size <= 0) {
    throw AppError.validation('Uploaded file is empty');
  }

  if (file.size > env.MAX_UPLOAD_BYTES) {
    throw AppError.payloadTooLarge();
  }

  if (!file.originalname || file.originalname.trim().length === 0) {
    throw AppError.validation('Filename is required');
  }
}

export function sanitizeFilename(originalFilename: string): string {
  const base = originalFilename.replaceAll('\\', '/').split('/').pop()?.trim() ?? '';
  return base.slice(0, 255) || 'upload';
}

export function extensionForMime(mimeType: string): string {
  if (mimeType in MIME_EXTENSIONS) {
    return MIME_EXTENSIONS[mimeType as AllowedImageMimeType];
  }
  return 'bin';
}

export type AttachmentParentKind = 'interaction' | 'payment';

export function buildAttachmentStorageKey(input: {
  clientId: string;
  parentKind: AttachmentParentKind;
  parentId: string;
  attachmentId: string;
  mimeType: string;
}): string {
  const folder = input.parentKind === 'payment' ? 'payments' : 'interactions';
  return `clients/${input.clientId}/${folder}/${input.parentId}/${input.attachmentId}.${extensionForMime(input.mimeType)}`;
}
