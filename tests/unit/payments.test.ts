import { AppError } from '../../src/errors/app-error.js';
import { assertPaymentDoesNotOverpay, summarizePayments } from '../../src/shared/payments.js';
import { describe, expect, it } from 'vitest';

describe('payment summary', () => {
  it('marks an order unpaid when nothing has been collected', () => {
    expect(summarizePayments(5000, 0)).toEqual({
      totalAmount: 5000,
      paidAmount: 0,
      remainingBalance: 5000,
      paymentStatus: 'UNPAID',
    });
  });

  it('marks an order partially paid after a deposit', () => {
    expect(summarizePayments(5000, 2000)).toEqual({
      totalAmount: 5000,
      paidAmount: 2000,
      remainingBalance: 3000,
      paymentStatus: 'PARTIALLY_PAID',
    });
  });

  it('marks an order paid when payments cover the total', () => {
    expect(summarizePayments(5000, 5000).paymentStatus).toBe('PAID');
    expect(summarizePayments(5000, 5000).remainingBalance).toBe(0);
  });

  it('rejects overpayment', () => {
    expect(() => assertPaymentDoesNotOverpay(3000, 3000.01)).toThrow(AppError);
  });
});
