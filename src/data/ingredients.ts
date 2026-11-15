/**
 * Weights from the King Arthur Baking ingredient weight chart (averages):
 * https://www.kingarthurbaking.com/learn/ingredient-weight-chart
 */

export type VolumeUnit = 'cup' | 'tbsp' | 'tsp' | 'floz';

export type Unit = VolumeUnit | 'oz' | 'stick';

/** `id` is a string here because IngredientId is derived from INGREDIENTS. */
interface IngredientData {
  id: string;
  /** Units that make sense for this ingredient, in the order shown in the UI. */
  units: readonly Unit[];
  /** Weight in grams of one level US cup. Required when `units` has a volume unit. */
  gramsPerCup?: number;
  /** Weight in grams of one stick. Required when `units` includes 'stick'. */
  gramsPerStick?: number;
}

/** 1 cup = 16 tbsp = 48 tsp = 8 fl oz. */
export const CUPS_PER_UNIT: Record<VolumeUnit, number> = {
  cup: 1,
  tbsp: 1 / 16,
  tsp: 1 / 48,
  floz: 1 / 8,
};

/** One ounce (weight, not fluid ounce) in grams. */
export const GRAMS_PER_OUNCE = 28.35;

const VOLUME_AND_WEIGHT: readonly Unit[] = ['cup', 'tbsp', 'tsp', 'oz'];

/** In dropdown order. Display names are in `src/texts/nl.ts`. */
export const INGREDIENTS = [
  { id: 'flour', units: VOLUME_AND_WEIGHT, gramsPerCup: 120 },
  { id: 'granulated-sugar', units: VOLUME_AND_WEIGHT, gramsPerCup: 198 },
  { id: 'powdered-sugar', units: VOLUME_AND_WEIGHT, gramsPerCup: 113 },
  { id: 'brown-sugar', units: VOLUME_AND_WEIGHT, gramsPerCup: 213 },
  {
    id: 'butter',
    units: ['stick', 'cup', 'tbsp', 'tsp', 'oz'],
    gramsPerCup: 227,
    gramsPerStick: 113,
  },
  { id: 'almond-flour', units: VOLUME_AND_WEIGHT, gramsPerCup: 96 },
  { id: 'cocoa-powder', units: VOLUME_AND_WEIGHT, gramsPerCup: 84 },
  { id: 'milk', units: ['cup', 'tbsp', 'tsp', 'floz'], gramsPerCup: 227 },
  { id: 'heavy-cream', units: ['cup', 'tbsp', 'tsp', 'floz'], gramsPerCup: 227 },
  { id: 'cream-cheese', units: VOLUME_AND_WEIGHT, gramsPerCup: 227 },
  { id: 'cornstarch', units: VOLUME_AND_WEIGHT, gramsPerCup: 112 },
] as const satisfies readonly IngredientData[];

export type IngredientId = (typeof INGREDIENTS)[number]['id'];

export interface Ingredient extends IngredientData {
  id: IngredientId;
}

export function getIngredient(id: string): Ingredient | undefined {
  return INGREDIENTS.find(ingredient => ingredient.id === id);
}

/** Takes any string, because attributes and `<select>` values are not typed. */
export function hasUnit(ingredient: Ingredient, unit: string): unit is Unit {
  return (ingredient.units as readonly string[]).includes(unit);
}
