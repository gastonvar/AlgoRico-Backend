import { describe, expect, it } from 'vitest';
import { recipePriceFromLines } from '../../src/features/recipes/recipes.mappers.js';

describe('recipe price', () => {
  it('sums ingredient price per unit times quantity', () => {
    expect(
      recipePriceFromLines([
        { quantity: 0.5, pricePerUnit: 100 },
        { quantity: 4, pricePerUnit: 20 },
      ]),
    ).toBe(130);
  });
});
