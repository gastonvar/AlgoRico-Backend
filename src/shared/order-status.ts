import { AppError } from '../errors/app-error.js';
import type { FulfillmentType, OrderStatus } from './constants.js';

const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  LEAD: ['QUOTED', 'AWAITING_DEPOSIT', 'CONFIRMED', 'CANCELLED'],
  QUOTED: ['LEAD', 'AWAITING_DEPOSIT', 'CONFIRMED', 'CANCELLED'],
  AWAITING_DEPOSIT: ['QUOTED', 'LEAD', 'CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['AWAITING_DEPOSIT', 'IN_PRODUCTION', 'READY', 'CANCELLED'],
  IN_PRODUCTION: ['CONFIRMED', 'READY', 'CANCELLED'],
  READY: ['IN_PRODUCTION', 'DELIVERED', 'PICKED_UP', 'CANCELLED'],
  DELIVERED: ['READY', 'COMPLETED'],
  PICKED_UP: ['READY', 'COMPLETED'],
  COMPLETED: ['DELIVERED', 'PICKED_UP'],
  CANCELLED: ['LEAD', 'QUOTED', 'AWAITING_DEPOSIT', 'CONFIRMED'],
};

export function assertOrderStatusTransition(from: OrderStatus, to: OrderStatus): void {
  if (from === to) {
    return;
  }

  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw AppError.conflict(`Cannot change order status from ${from} to ${to}`);
  }
}

export function assertFulfillmentStatus(
  status: OrderStatus,
  fulfillmentType: FulfillmentType,
): void {
  if (status === 'DELIVERED' && fulfillmentType !== 'DELIVERY') {
    throw AppError.conflict('Only delivery orders can be marked as delivered');
  }

  if (status === 'PICKED_UP' && fulfillmentType !== 'PICKUP') {
    throw AppError.conflict('Only pickup orders can be marked as picked up');
  }
}

export function isPreConfirmationStatus(status: OrderStatus): boolean {
  return status === 'LEAD' || status === 'QUOTED' || status === 'AWAITING_DEPOSIT';
}
