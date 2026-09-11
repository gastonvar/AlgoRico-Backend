import { AppError } from '../errors/app-error.js';
import type { PaymentStatus } from './constants.js';
import { fromCents, toCents } from './money.js';

export type PaymentSummary = {
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  paymentStatus: PaymentStatus;
};

export function summarizePayments(
  totalAmount: number | string,
  paidAmount: number | string,
): PaymentSummary {
  const totalCents = toCents(totalAmount);
  const paidCents = toCents(paidAmount);
  const remainingCents = totalCents - paidCents;

  let paymentStatus: PaymentStatus;
  if (remainingCents <= 0) {
    paymentStatus = 'PAID';
  } else if (paidCents <= 0) {
    paymentStatus = 'UNPAID';
  } else {
    paymentStatus = 'PARTIALLY_PAID';
  }

  return {
    totalAmount: fromCents(totalCents),
    paidAmount: fromCents(paidCents),
    remainingBalance: fromCents(Math.max(remainingCents, 0)),
    paymentStatus,
  };
}

export function assertPaymentDoesNotOverpay(
  remainingBalance: number | string,
  paymentAmount: number | string,
): void {
  if (toCents(paymentAmount) > toCents(remainingBalance)) {
    throw AppError.conflict('Payment exceeds the remaining balance');
  }
}
