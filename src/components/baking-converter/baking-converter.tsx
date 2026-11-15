import { Component, h, Prop, State } from '@stencil/core';
import { INGREDIENTS, IngredientId, Unit, getIngredient, hasUnit } from '../../data/ingredients';
import { TEXT } from '../../texts/nl';
import { toGrams } from '../../utils/convert';
import { formatConversion } from '../../utils/format';
import { AmountResult, validateAmount } from '../../utils/validate-amount';

/** Time before the hidden status is emptied again, so the result isn't read twice when browsing the page. */
const ANNOUNCEMENT_CLEAR_MS = 1000;

const NBSP = '\u00A0';

@Component({
  tag: 'baking-converter',
  styleUrl: 'baking-converter.css',
  shadow: true,
})
export class BakingConverter {
  /**
   * The ingredient that is selected when the component loads, e.g. `"butter"`.
   * Only read once: changing it after the component has loaded has no effect.
   */
  @Prop() defaultIngredient: IngredientId = 'flour';

  /**
   * The unit that is selected when the component loads, e.g. `"stick"`.
   * Only read once: changing it after the component has loaded has no effect.
   */
  @Prop() defaultUnit: Unit = 'cup';

  @State() amount = '1';
  @State() amountTouched = false;

  /** Set from the default props in componentWillLoad. */
  @State() selectedIngredientId!: IngredientId;
  @State() selectedUnit!: Unit;
  @State() announcement = '';

  /** Keeps the result visible while the amount is half typed, like "1,". */
  @State() lastValidAmount: number | null = 1;

  private get amountResult(): AmountResult {
    return validateAmount(this.amount);
  }

  private clearAnnouncementTimer?: ReturnType<typeof setTimeout>;

  componentWillLoad() {
    this.applyDefaults();
  }

  disconnectedCallback() {
    clearTimeout(this.clearAnnouncementTimer);
  }

  private applyDefaults() {
    let ingredient = getIngredient(this.defaultIngredient);
    if (!ingredient) {
      console.warn(
        `<baking-converter>: unknown ingredient "${this.defaultIngredient}", using "${INGREDIENTS[0].id}".`,
      );
      ingredient = INGREDIENTS[0];
    }

    const unit = this.defaultUnit;
    if (!hasUnit(ingredient, unit)) {
      console.warn(
        `<baking-converter>: "${ingredient.id}" has no unit "${unit}", using "${ingredient.units[0]}".`,
      );
    }

    this.selectedIngredientId = ingredient.id;
    this.selectedUnit = hasUnit(ingredient, unit) ? unit : ingredient.units[0];
  }

  private onSubmit = (event: Event) => {
    event.preventDefault();
    this.commitAmount();
  };

  private onAmountInput = (event: Event) => {
    this.amount = (event.target as HTMLInputElement).value;
    this.amountTouched = false;

    const result = this.amountResult;
    if (result.valid) this.lastValidAmount = result.amount;
  };

  private onAmountChange = () => this.announce();

  private onAmountBlur = () => this.commitAmount();

  /** On blur or Enter: show the error and hide the result if the amount is invalid. */
  private commitAmount() {
    this.amountTouched = true;
    if (!this.amountResult.valid) this.lastValidAmount = null;
  }

  private onIngredientChange = (event: Event) => {
    const ingredient = getIngredient((event.target as HTMLSelectElement).value);
    if (!ingredient) return;
    this.selectedIngredientId = ingredient.id;

    if (!hasUnit(ingredient, this.selectedUnit)) {
      this.selectedUnit = ingredient.units[0];
    }

    this.announce();
  };

  private onUnitChange = (event: Event) => {
    const ingredient = getIngredient(this.selectedIngredientId);
    const unit = (event.target as HTMLSelectElement).value;
    if (!ingredient || !hasUnit(ingredient, unit)) return;
    this.selectedUnit = unit;

    this.announce();
  };

  /** Only called when an edit is done, not on every key press. */
  private announce() {
    const result = this.amountResult;
    const text = (result.valid && this.resultText(result.amount)) || '';

    /**
     * A screen reader only reads the status again if its text changes. For the same result
     * (e.g. "1" → "1,0") add or remove a no-break space.
     */
    const same = text !== '' && this.announcement.replace(/\u00A0$/, '') === text;
    this.announcement = same && !this.announcement.endsWith(NBSP) ? `${text}${NBSP}` : text;

    clearTimeout(this.clearAnnouncementTimer);
    if (this.announcement !== '') {
      this.clearAnnouncementTimer = setTimeout(
        () => (this.announcement = ''),
        ANNOUNCEMENT_CLEAR_MS,
      );
    }
  }

  /** The result sentence for the selected ingredient and unit. */
  private resultText(amount: number | null): string | null {
    const ingredient = getIngredient(this.selectedIngredientId);
    if (amount === null || !ingredient) return null;
    const unit = this.selectedUnit;
    return formatConversion(amount, unit, ingredient, toGrams(amount, unit, ingredient));
  }

  render() {
    const ingredient = getIngredient(this.selectedIngredientId);
    const result = this.amountResult;
    const showError = this.amountTouched && !result.valid;
    const visibleAmount = result.valid ? result.amount : this.lastValidAmount;

    return (
      <div lang={TEXT.lang}>
        <form onSubmit={this.onSubmit}>
          <fieldset>
            <legend class="visually-hidden">{TEXT.legend}</legend>
            <label htmlFor="ingredient">{TEXT.labels.ingredient}</label>
            <div class="select">
              <select id="ingredient" onChange={this.onIngredientChange}>
                {INGREDIENTS.map(item => (
                  <option
                    value={item.id}
                    selected={item.id === this.selectedIngredientId}
                    key={item.id}
                  >
                    {TEXT.ingredients[item.id]}
                  </option>
                ))}
              </select>
            </div>

            <div class="fields">
              <div class="field">
                <label htmlFor="amount">{TEXT.labels.amount}</label>
                <input
                  id="amount"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  value={this.amount}
                  aria-invalid={showError ? 'true' : undefined}
                  aria-describedby={showError ? 'amount-hint amount-error' : 'amount-hint'}
                  onInput={this.onAmountInput}
                  onChange={this.onAmountChange}
                  onBlur={this.onAmountBlur}
                />
                <p id="amount-hint" class="hint">
                  {TEXT.amountHint}
                </p>
                <p id="amount-error" class="conversion-error" aria-live="polite">
                  {showError &&
                    !result.valid && [
                      <span class="visually-hidden">{TEXT.errorPrefix}</span>,
                      TEXT.errors[result.error],
                    ]}
                </p>
              </div>
              <div class="field">
                <label htmlFor="unit">{TEXT.labels.unit}</label>
                <div class="select">
                  <select id="unit" onChange={this.onUnitChange}>
                    {ingredient?.units.map(unit => (
                      <option value={unit} selected={unit === this.selectedUnit} key={unit}>
                        {TEXT.units[unit].one}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </fieldset>
        </form>
        {/**
         * The output changes on every key press, so it is not a live region.
         * The hidden status below reads the result out instead.
         */}
        <output htmlFor="ingredient unit amount" class="conversion-result" aria-live="off">
          {this.resultText(visibleAmount)}
        </output>

        <p class="visually-hidden" role="status">
          {this.announcement}
        </p>
      </div>
    );
  }
}
