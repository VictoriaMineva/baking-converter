import { describe, it, expect } from 'vitest';
import { formatAmount, formatConversion, formatGrams } from './format';
import { getIngredient } from '../data/ingredients';

describe('formatAmount', () => {
  it.each([
    [1, '1'],
    [1.5, '1,5'],
    [0.333333, '0,33'],
  ])('formats %d as "%s"', (input, expected) => {
    expect(formatAmount(input)).toBe(expected);
  });
});

describe('formatGrams', () => {
  it.each([
    [180, '180 g'],
    [70.625, '71 g'],
    [10, '10 g'],
    [9.94, '9,9 g'],
    [2.5, '2,5 g'],
    [1234, '1.234 g'],
  ])('formats %d as "%s"', (input, expected) => {
    expect(formatGrams(input)).toBe(expected);
  });
});

describe('formatConversion', () => {
  it('builds the result sentence for 1 cup', () => {
    expect(formatConversion(1, 'cup', getIngredient('flour')!, 120)).toBe('1 cup bloem = 120 g');
  });

  it('builds the result sentence for multiple cups', () => {
    expect(formatConversion(3.5, 'cup', getIngredient('flour')!, 420)).toBe(
      '3,5 cups bloem = 420 g',
    );
  });

  it.each([
    [0.5, '0,5 cups'],
    [2, '2 cups'],
    /** Shown as "1", so the label must be singular too. */
    [1.004, '1 cup'],
    [0.999, '1 cup'],
    [1.01, '1,01 cups'],
  ])('uses the plural that matches the shown amount for %d', (amount, expected) => {
    expect(formatConversion(amount, 'cup', getIngredient('flour')!, 120)).toMatch(
      new RegExp(`^${expected} `),
    );
  });
});
