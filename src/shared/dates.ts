import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { env } from '../config/env.js';

export function startOfZonedDay(date: Date, timeZone = env.APP_TIMEZONE): Date {
  const zoned = toZonedTime(date, timeZone);
  zoned.setHours(0, 0, 0, 0);
  return fromZonedTime(zoned, timeZone);
}

export function endOfZonedDay(date: Date, timeZone = env.APP_TIMEZONE): Date {
  const zoned = toZonedTime(date, timeZone);
  zoned.setHours(23, 59, 59, 999);
  return fromZonedTime(zoned, timeZone);
}

export function addZonedDays(date: Date, days: number, timeZone = env.APP_TIMEZONE): Date {
  const zoned = toZonedTime(date, timeZone);
  zoned.setDate(zoned.getDate() + days);
  return fromZonedTime(zoned, timeZone);
}

export function formatDateOnly(date: Date, timeZone = env.APP_TIMEZONE): string {
  const zoned = toZonedTime(date, timeZone);
  const year = zoned.getFullYear();
  const month = String(zoned.getMonth() + 1).padStart(2, '0');
  const day = String(zoned.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateOnly(value: string): string {
  return value;
}
