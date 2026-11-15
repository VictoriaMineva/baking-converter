import { Ingredient, Unit, CUPS_PER_UNIT, GRAMS_PER_OUNCE } from '../data/ingredients';

export function toGrams(amount: number, unit: Unit, ingredient: Ingredient): number {
  switch (unit) {
    case 'cup':
    case 'tbsp':
    case 'tsp':
    case 'floz':
      if (ingredient.gramsPerCup === undefined)
        throw new Error(`Ingredient ${ingredient.id} does not have gramsPerCup defined.`);
      return amount * CUPS_PER_UNIT[unit] * ingredient.gramsPerCup;
    case 'oz':
      return amount * GRAMS_PER_OUNCE;
    case 'stick':
      if (ingredient.gramsPerStick === undefined)
        throw new Error(`Ingredient ${ingredient.id} does not have gramsPerStick defined.`);
      return amount * ingredient.gramsPerStick;
    default: {
      const unhandled: never = unit;
      throw new Error(`Unsupported unit: ${unhandled}`);
    }
  }
}
