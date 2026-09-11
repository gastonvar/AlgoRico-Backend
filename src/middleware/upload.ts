import type { Request } from 'express';
import multer from 'multer';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { ALLOWED_IMAGE_MIME_TYPES } from '../shared/constants.js';
import type { AllowedImageMimeType } from '../shared/constants.js';

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_BYTES,
    files: 10,
  },
  fileFilter: (_req: Request, file, callback) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype as AllowedImageMimeType)) {
      callback(
        AppError.validation('Unsupported file type. Allowed types: image/jpeg, image/png, image/webp'),
      );
      return;
    }
    callback(null, true);
  },
});
