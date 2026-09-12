import { AppError } from '../errors/app-error.js';

const CENTS_FACTOR = 100;

export function toCents(value: number | string): number {
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) {
    throw AppError.validation('Invalid monetary amount');
  }
  return Math.round(amount * CENTS_FACTOR);
}

export function fromCents(cents: number): number {
  return Number((cents / CENTS_FACTOR).toFixed(2));
}

export function roundMoney(value: number | string): number {
  return fromCents(toCents(value));
}

export function sumMoney(values: Array<number | string>): number {
  return fromCents(values.reduce<number>((total, value) => total + toCents(value), 0));
}

export function lineTotal(quantity: number, unitPrice: number | string): number {
  return fromCents(toCents(unitPrice) * quantity);
}

export function roundUnitPrice(value: number | string): number {
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) {
    throw AppError.validation('Invalid monetary amount');
  }
  return Number(amount.toFixed(4));
}

export function quantityCost(quantity: number | string, unitPrice: number | string): number {
  const amount = typeof quantity === 'number' ? quantity : Number(quantity);
  if (!Number.isFinite(amount)) {
    throw AppError.validation('Invalid quantity');
  }
  return roundMoney(amount * Number(unitPrice));
}
