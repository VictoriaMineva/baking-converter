import { Ingredient, Unit } from '../data/ingredients';
import { TEXT } from '../texts/nl';

const amountFormat = new Intl.NumberFormat(TEXT.locale, { maximumFractionDigits: 2 });
/** Same rounding as amountFormat, so 1.004 shows as "1" with the singular "cup". */
const amountPlural = new Intl.PluralRules(TEXT.locale, { maximumFractionDigits: 2 });
const gramsWhole = new Intl.NumberFormat(TEXT.locale, { maximumFractionDigits: 0 });
const gramsOneDecimal = new Intl.NumberFormat(TEXT.locale, { maximumFractionDigits: 1 });

export function formatAmount(amount: number): string {
  return amountFormat.format(amount);
}

/** Whole grams from 10 g up, one decimal below that (baking powder, salt). */
export function formatGrams(grams: number): string {
  return `${(grams >= 10 ? gramsWhole : gramsOneDecimal).format(grams)} g`;
}

/** E.g. "1,5 cups bloem = 180 g". */
export function formatConversion(
  amount: number,
  unit: Unit,
  ingredient: Ingredient,
  grams: number,
): string {
  const unitNames = TEXT.units[unit];
  const label = unitNames[amountPlural.select(amount)] ?? unitNames.other;
  return `${formatAmount(amount)} ${label} ${TEXT.ingredients[ingredient.id].toLowerCase()} = ${formatGrams(grams)}`;
}
