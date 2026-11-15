import { describe, it, expect } from 'vitest';
import { toGrams } from './convert';
import { getIngredient, INGREDIENTS } from '../data/ingredients';

describe('ingredient data', () => {
  const cases = INGREDIENTS.flatMap(ingredient =>
    ingredient.units.map(unit => ({ ingredient, unit })),
  );

  it.each(cases)(
    'converts 1 $unit of $ingredient.id to a positive weight',
    ({ ingredient, unit }) => {
      expect(toGrams(1, unit, ingredient)).toBeGreaterThan(0);
    },
  );
});

describe('toGrams', () => {
  it('converts cups to grams', () => {
    expect(toGrams(1, 'cup', getIngredient('flour')!)).toBeCloseTo(120);
  });

  it('converts oz to grams', () => {
    expect(toGrams(10, 'oz', getIngredient('granulated-sugar')!)).toBeCloseTo(283.5);
  });

  it('converts tablespoons to grams', () => {
    expect(toGrams(10, 'tbsp', getIngredient('powdered-sugar')!)).toBeCloseTo(70.625);
  });

  it('converts teaspoons to grams', () => {
    expect(toGrams(12, 'tsp', getIngredient('brown-sugar')!)).toBeCloseTo(53.25);
  });

  it('converts sticks of butter to grams', () => {
    expect(toGrams(2, 'stick', getIngredient('butter')!)).toBeCloseTo(226);
  });

  it('converts 0 cups of almond-flour to 0 grams', () => {
    expect(toGrams(0, 'cup', getIngredient('almond-flour')!)).toBeCloseTo(0);
  });

  it('throws when converting sticks of flour, which has no stick weight', () => {
    expect(() => toGrams(1, 'stick', getIngredient('flour')!)).toThrow();
  });
});
