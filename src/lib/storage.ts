import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { pinoLogger } from './pino.js';

export type StoredObject = {
  storageKey: string;
  mimeType: string;
  fileSize: number;
};

export type StorageService = {
  ensureReady: () => Promise<void>;
  upload: (input: {
    storageKey: string;
    body: Buffer;
    mimeType: string;
  }) => Promise<StoredObject>;
  delete: (storageKey: string) => Promise<void>;
  getDownloadUrl: (storageKey: string) => Promise<string>;
};

type MemoryObject = {
  body: Buffer;
  mimeType: string;
};

function createMemoryStorage(): StorageService {
  const objects = new Map<string, MemoryObject>();

  return {
    async ensureReady() {
      return;
    },
    async upload({ storageKey, body, mimeType }) {
      objects.set(storageKey, { body, mimeType });
      return { storageKey, mimeType, fileSize: body.length };
    },
    async delete(storageKey) {
      objects.delete(storageKey);
    },
    async getDownloadUrl(storageKey) {
      if (!objects.has(storageKey)) {
        throw AppError.notFound('Stored file was not found');
      }
      return `memory://${storageKey}`;
    },
  };
}

function createMinioStorage(): StorageService {
  const client = new S3Client({
    region: env.MINIO_REGION,
    endpoint: env.MINIO_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.MINIO_ACCESS_KEY,
      secretAccessKey: env.MINIO_SECRET_KEY,
    },
  });

  return {
    async ensureReady() {
      try {
        await client.send(new HeadBucketCommand({ Bucket: env.MINIO_BUCKET }));
      } catch {
        await client.send(new CreateBucketCommand({ Bucket: env.MINIO_BUCKET }));
        pinoLogger.info({ bucket: env.MINIO_BUCKET }, 'Created MinIO bucket');
      }
    },
    async upload({ storageKey, body, mimeType }) {
      await client.send(
        new PutObjectCommand({
          Bucket: env.MINIO_BUCKET,
          Key: storageKey,
          Body: body,
          ContentType: mimeType,
          ContentLength: body.length,
        }),
      );
      return { storageKey, mimeType, fileSize: body.length };
    },
    async delete(storageKey) {
      await client.send(
        new DeleteObjectCommand({
          Bucket: env.MINIO_BUCKET,
          Key: storageKey,
        }),
      );
    },
    async getDownloadUrl(storageKey) {
      return getSignedUrl(
        client,
        new GetObjectCommand({
          Bucket: env.MINIO_BUCKET,
          Key: storageKey,
        }),
        { expiresIn: env.PRESIGNED_URL_EXPIRES_SECONDS },
      );
    },
  };
}

export const storage: StorageService =
  env.STORAGE_DRIVER === 'memory' ? createMemoryStorage() : createMinioStorage();
