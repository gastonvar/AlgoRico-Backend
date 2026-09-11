import { z } from 'zod';

export const uuidParam = (name: string) =>
  z.string().uuid({ message: `${name} must be a valid UUID` });

export const idParams = (name: string) =>
  z.object({
    [name]: uuidParam(name),
  });

export const optionalTrimmed = z
  .string()
  .trim()
  .max(10_000)
  .optional()
  .transform((value) => (value === '' ? undefined : value));

export const optionalEmail = z
  .string()
  .trim()
  .email()
  .max(255)
  .optional()
  .or(z.literal('').transform(() => undefined));

export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm');
