import type { IngredientId, Unit } from '../data/ingredients';
import type { AmountError } from '../utils/validate-amount';

/** All text the user sees, in Dutch. */
export interface Texts {
  lang: string;
  locale: string;

  /** Visually hidden. */
  legend: string;
  labels: { ingredient: string; amount: string; unit: string };
  amountHint: string;
  /** Visually hidden, read before an error message. */
  errorPrefix: string;
  errors: Record<AmountError, string>;

  /** Lowercased in the result sentence. */
  ingredients: Record<IngredientId, string>;
  /** Per Intl.PluralRules category; `one` is also the dropdown label. Missing categories use `other`. */
  units: Record<
    Unit,
    { one: string; other: string } & Partial<Record<Intl.LDMLPluralRule, string>>
  >;
}

export const TEXT: Texts = {
  lang: 'nl',
  locale: 'nl-NL',

  legend: 'Omrekenen naar grammen',
  labels: {
    ingredient: 'Ingrediënt',
    amount: 'Hoeveelheid',
    unit: 'Eenheid',
  },
  amountHint: 'Bijvoorbeeld 1,5. Typ ½ als 0,5.',
  errorPrefix: 'Fout: ',
  errors: {
    empty: 'Vul een hoeveelheid in.',
    negative: 'De hoeveelheid kan niet negatief zijn.',
    zero: 'De hoeveelheid moet groter zijn dan 0.',
    format: 'Vul een getal in, bijvoorbeeld 1 of 1,5.',
  },

  ingredients: {
    'flour': 'Bloem',
    'granulated-sugar': 'Kristalsuiker',
    'powdered-sugar': 'Poedersuiker',
    'brown-sugar': 'Bruine suiker (aangedrukt)',
    'butter': 'Boter',
    'almond-flour': 'Amandelmeel',
    'cocoa-powder': 'Cacaopoeder',
    'milk': 'Melk',
    'heavy-cream': 'Slagroom',
    'cream-cheese': 'Roomkaas',
    'cornstarch': 'Maizena',
  },
  /** Keep the US names, because those are the words in the recipe. */
  units: {
    cup: { one: 'cup', other: 'cups' },
    tbsp: { one: 'eetlepel (tbsp)', other: 'eetlepels (tbsp)' },
    tsp: { one: 'theelepel (tsp)', other: 'theelepels (tsp)' },
    oz: { one: 'ounce (oz)', other: 'ounces (oz)' },
    floz: { one: 'fluid ounce (fl oz)', other: 'fluid ounces (fl oz)' },
    stick: { one: 'stick', other: 'sticks' },
  },
};
