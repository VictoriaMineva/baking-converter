import { describe, it, expect } from 'vitest';
import { validateAmount } from './validate-amount';

describe('validateAmount', () => {
  it.each([
    ['2', 2],
    ['1.5', 1.5],
    ['1,5', 1.5],
    ['0.5', 0.5],
    ['.5', 0.5],
    ['  3  ', 3],
    ['1000000', 1_000_000],
    ['2500,75', 2500.75],
  ])('parses "%s" as %d', (input, expected) => {
    const result = validateAmount(input);
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.amount).toBeCloseTo(expected);
  });

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['-1', 'negative'],
    ['0', 'zero'],
    ['0,0', 'zero'],
  ])('rejects "%s" with error "%s"', (input, error) => {
    expect(validateAmount(input)).toEqual({ valid: false, error });
  });

  it.each([
    'abc',
    '1.2.3',
    '1,2,3',
    '1e3',
    'Infinity',
    'NaN',
    '2 cups',
    /** No fractions: the decimal keypad has no "/". */
    '1/2',
    '1 1/2',
    '1/',
  ])('rejects "%s" as an invalid format', input => {
    expect(validateAmount(input)).toEqual({ valid: false, error: 'format' });
  });

  it('rejects a number too large to represent, instead of returning Infinity', () => {
    expect(validateAmount('9'.repeat(400))).toEqual({ valid: false, error: 'format' });
  });
});
