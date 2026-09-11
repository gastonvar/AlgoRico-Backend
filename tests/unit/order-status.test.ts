import { AppError } from '../../src/errors/app-error.js';
import {
  assertFulfillmentStatus,
  assertOrderStatusTransition,
} from '../../src/shared/order-status.js';
import { describe, expect, it } from 'vitest';

describe('order status transitions', () => {
  it('allows a lead to become confirmed after a deposit', () => {
    expect(() => assertOrderStatusTransition('LEAD', 'CONFIRMED')).not.toThrow();
    expect(() => assertOrderStatusTransition('AWAITING_DEPOSIT', 'CONFIRMED')).not.toThrow();
  });

  it('prevents skipping from lead to completed', () => {
    expect(() => assertOrderStatusTransition('LEAD', 'COMPLETED')).toThrow(AppError);
  });

  it('allows reopening a completed pickup order', () => {
    expect(() => assertOrderStatusTransition('COMPLETED', 'PICKED_UP')).not.toThrow();
  });

  it('rejects delivered status on pickup orders', () => {
    expect(() => assertFulfillmentStatus('DELIVERED', 'PICKUP')).toThrow(AppError);
    expect(() => assertFulfillmentStatus('PICKED_UP', 'DELIVERY')).toThrow(AppError);
  });
});
