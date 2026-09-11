import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

const booleanFromEnv = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((value) => value === true || value === 'true' || value === '1');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z.string().min(1),
  APP_TIMEZONE: z.string().min(1).default('America/Argentina/Buenos_Aires'),
  FRONTEND_ORIGIN: z.string().min(1),
  TRUST_PROXY: booleanFromEnv.default(false),
  SESSION_SECRET: z.string().min(32),
  SESSION_TTL_MS: z.coerce.number().int().positive().default(7 * 24 * 60 * 60 * 1000),
  COOKIE_SECURE: booleanFromEnv.default(false),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_DOMAIN: z.string().min(1).optional(),
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().min(1),
  MINIO_REGION: z.string().min(1).default('us-east-1'),
  MINIO_USE_SSL: booleanFromEnv.default(false),
  PRESIGNED_URL_EXPIRES_SECONDS: z.coerce.number().int().positive().default(300),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  STORAGE_DRIVER: z.enum(['minio', 'memory']).default('minio'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isDevelopment = env.NODE_ENV === 'development';

export const frontendOrigins = env.FRONTEND_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);
