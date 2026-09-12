import { fromCents, lineTotal, quantityCost, roundMoney, sumMoney, toCents } from '../../src/shared/money.js';
import { describe, expect, it } from 'vitest';

describe('money helpers', () => {
  it('converts amounts to cents without floating drift', () => {
    expect(toCents(19.99)).toBe(1999);
    expect(toCents('45.10')).toBe(4510);
    expect(fromCents(1999)).toBe(19.99);
  });

  it('sums line totals from mixed decimal values', () => {
    expect(lineTotal(12, '1500.00')).toBe(18000);
    expect(sumMoney(['20000.00', 3000])).toBe(23000);
    expect(roundMoney(10.555)).toBe(10.56);
  });

  it('computes fractional quantity costs from a unit price', () => {
    expect(quantityCost(0.5, 100)).toBe(50);
    expect(quantityCost('4', '20.0000')).toBe(80);
  });
});
