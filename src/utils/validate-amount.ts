const DECIMAL = /^\d+(?:[.,]\d+)?$|^[.,]\d+$/;

export type AmountError = 'empty' | 'negative' | 'zero' | 'format';

export type AmountResult = { valid: true; amount: number } | { valid: false; error: AmountError };

function positive(amount: number): AmountResult {
  return amount > 0 ? { valid: true, amount } : { valid: false, error: 'zero' };
}

/** Accepts "2", "1.5", "1,5" and ".5". Zero counts as a mistake. */
export function validateAmount(value: string): AmountResult {
  const input = (value ?? '').trim();

  if (input === '') {
    return { valid: false, error: 'empty' };
  }

  if (input.startsWith('-')) {
    return { valid: false, error: 'negative' };
  }

  if (DECIMAL.test(input)) {
    const amount = Number(input.replace(',', '.'));
    /** A very long number matches DECIMAL but becomes Infinity. */
    if (!Number.isFinite(amount)) return { valid: false, error: 'format' };
    return positive(amount);
  }

  return { valid: false, error: 'format' };
}
