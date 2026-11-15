import { render, h, describe, it, expect } from '@stencil/vitest';
import { afterEach, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import type { IngredientId, Unit } from '../../data/ingredients';

async function setup(element: Parameters<typeof render>[0]) {
  const result = await render(element);
  mounted.push(result.unmount);
  const shadow = result.root.shadowRoot!;

  return {
    ...result,
    form: shadow.querySelector('form')!,
    ingredient: shadow.querySelector<HTMLSelectElement>('#ingredient')!,
    amount: shadow.querySelector<HTMLInputElement>('#amount')!,
    unit: shadow.querySelector<HTMLSelectElement>('#unit')!,
    error: shadow.querySelector('#amount-error')!,
    output: shadow.querySelector('output')!,
    status: shadow.querySelector('[role="status"]')!,
  };
}

const mounted: Array<() => void> = [];

afterEach(() => {
  mounted.splice(0).forEach(unmount => unmount());
  vi.restoreAllMocks();
});

async function typeAmount(input: HTMLInputElement, text: string) {
  await userEvent.clear(input);
  await userEvent.type(input, text);
}

async function axeViolations(root: HTMLElement) {
  const results = await axe.run(root);
  return results.violations.map(violation => `${violation.id}: ${violation.help}`);
}

describe('baking-converter', () => {
  describe('starting state', () => {
    it('renders 1 cup of flour by default', async () => {
      const { ingredient, unit, amount, output } = await setup(<baking-converter />);

      expect(ingredient.value).toBe('flour');
      expect(unit.value).toBe('cup');
      expect(amount.value).toBe('1');
      expect(output).toHaveTextContent('1 cup bloem = 120 g');
    });

    it('uses the defaultIngredient prop as the starting ingredient', async () => {
      const { ingredient, output } = await setup(<baking-converter defaultIngredient="butter" />);

      expect(ingredient.value).toBe('butter');
      expect(output).toHaveTextContent('1 cup boter = 227 g');
    });

    it('falls back to the first ingredient and warns when defaultIngredient is unknown', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      /** A page can set any string as an attribute. */
      const { ingredient, output } = await setup(
        <baking-converter defaultIngredient={'pizza' as IngredientId} />,
      );

      expect(ingredient.value).toBe('flour');
      expect(output).toHaveTextContent('1 cup bloem = 120 g');
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('unknown ingredient "pizza"'));
    });

    it('falls back to the first unit and warns when the ingredient has no such unit', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { ingredient, unit, output } = await setup(
        <baking-converter defaultIngredient="flour" defaultUnit="stick" />,
      );

      expect(ingredient.value).toBe('flour');
      expect(unit.value).toBe('cup');
      expect(output).toHaveTextContent('1 cup bloem = 120 g');
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('"flour" has no unit "stick"'));
    });

    it('falls back to the first unit and warns when defaultUnit is not a unit at all', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { unit } = await setup(<baking-converter defaultUnit={'litre' as Unit} />);

      expect(unit.value).toBe('cup');
      expect(warn).toHaveBeenCalledOnce();
    });

    it('ignores a change to the default props after load', async () => {
      const { root, ingredient, unit, output, waitForChanges } = await setup(
        <baking-converter defaultIngredient="butter" defaultUnit="stick" />,
      );

      root.setAttribute('default-ingredient', 'flour');
      root.setAttribute('default-unit', 'tbsp');
      await waitForChanges();

      expect(ingredient.value).toBe('butter');
      expect(unit.value).toBe('stick');
      expect(output).toHaveTextContent('1 stick boter = 113 g');
    });

    it('keeps the user’s choice when the default props change after load', async () => {
      const { root, ingredient, unit, waitForChanges } = await setup(
        <baking-converter defaultIngredient="butter" defaultUnit="stick" />,
      );

      await userEvent.selectOptions(ingredient, 'milk');
      await waitForChanges();

      root.setAttribute('default-ingredient', 'flour');
      root.setAttribute('default-unit', 'tbsp');
      await waitForChanges();

      expect(ingredient.value).toBe('milk');
      expect(unit.value).toBe('cup');
    });
  });

  describe('converting', () => {
    it('updates the result as the user types an amount', async () => {
      const { amount, output, waitForChanges } = await setup(<baking-converter />);

      await typeAmount(amount, '5');
      await waitForChanges();

      expect(output).toHaveTextContent('5 cups bloem = 600 g');
    });

    it.each([
      ['1,5', '1,5 cups bloem = 180 g'],
      ['1.5', '1,5 cups bloem = 180 g'],
      [',5', '0,5 cups bloem = 60 g'],
    ])('accepts "%s" and shows "%s"', async (typed, expected) => {
      const { amount, output, error, waitForChanges } = await setup(<baking-converter />);

      await typeAmount(amount, typed);
      await userEvent.tab();
      await waitForChanges();

      expect(output).toHaveTextContent(expected);
      expect(error.textContent).toBe('');
    });

    it('keeps the last valid result while the user is still typing a number', async () => {
      const { amount, output, error, waitForChanges } = await setup(<baking-converter />);

      /** "2," is invalid, but halfway to "2,5". */
      await typeAmount(amount, '2,');
      await waitForChanges();

      expect(output).toHaveTextContent('2 cups bloem = 240 g');
      expect(error.textContent).toBe('');

      await userEvent.type(amount, '5');
      await waitForChanges();

      expect(output).toHaveTextContent('2,5 cups bloem = 300 g');
    });

    it('drops the last valid result once the user leaves the field with an invalid amount', async () => {
      const { amount, output, waitForChanges } = await setup(<baking-converter />);

      await typeAmount(amount, '2,');
      await userEvent.tab();
      await waitForChanges();

      expect(output.textContent).toBe('');
    });

    it('recalculates the result when the unit changes', async () => {
      const { unit, output, waitForChanges } = await setup(<baking-converter />);

      await userEvent.selectOptions(unit, 'tbsp');
      await waitForChanges();

      expect(output).toHaveTextContent('1 eetlepel (tbsp) bloem = 7,5 g');
    });

    it('ignores a unit change to a unit the ingredient does not have', async () => {
      const { unit, output, waitForChanges } = await setup(<baking-converter />);

      /** Flour has no "stick" option, so the select's value becomes "". */
      unit.value = 'stick';
      unit.dispatchEvent(new Event('change'));
      await waitForChanges();

      expect(output).toHaveTextContent('1 cup bloem = 120 g');
    });

    it('updates the unit list and resets an unsupported unit when the ingredient changes', async () => {
      const { ingredient, unit, output, waitForChanges } = await setup(
        <baking-converter defaultIngredient="butter" defaultUnit="stick" />,
      );

      await userEvent.selectOptions(ingredient, 'milk');
      await waitForChanges();

      const units = Array.from(unit.options, option => option.value);
      expect(units).toEqual(['cup', 'tbsp', 'tsp', 'floz']);
      expect(unit.value).toBe('cup');
      expect(output).toHaveTextContent('1 cup melk = 227 g');
    });
  });

  describe('errors', () => {
    it('shows the error and sets aria-invalid once the user leaves the field with invalid input', async () => {
      const { amount, error, waitForChanges } = await setup(<baking-converter />);
      expect(amount).not.toHaveAttribute('aria-invalid');

      await typeAmount(amount, '-1');
      await waitForChanges();

      expect(error.textContent).toBe('');
      expect(amount).not.toHaveAttribute('aria-invalid');

      await userEvent.tab();
      await waitForChanges();

      expect(error).toHaveTextContent('Fout: De hoeveelheid kan niet negatief zijn.');
      expect(amount).toHaveAttribute('aria-invalid', 'true');
    });

    it.each([
      ['', 'Vul een hoeveelheid in.'],
      ['0', 'De hoeveelheid moet groter zijn dan 0.'],
      ['abc', 'Vul een getal in, bijvoorbeeld 1 of 1,5.'],
    ])('shows the matching message for "%s"', async (typed, message) => {
      const { amount, error, waitForChanges } = await setup(<baking-converter />);

      await userEvent.clear(amount);
      if (typed !== '') await userEvent.type(amount, typed);
      await userEvent.tab();
      await waitForChanges();

      expect(error).toHaveTextContent(message);
    });

    it('links the format hint to the amount field, and adds the error once it shows', async () => {
      const { amount, waitForChanges } = await setup(<baking-converter />);
      expect(amount).toHaveAttribute('aria-describedby', 'amount-hint');

      await typeAmount(amount, 'abc');
      await userEvent.tab();
      await waitForChanges();

      expect(amount).toHaveAttribute('aria-describedby', 'amount-hint amount-error');
    });

    it('clears the error as soon as the user starts fixing the amount', async () => {
      const { amount, error, output, waitForChanges } = await setup(<baking-converter />);

      await typeAmount(amount, 'abc');
      await userEvent.tab();
      await waitForChanges();
      expect(error.textContent).not.toBe('');

      await typeAmount(amount, '3');
      await waitForChanges();

      expect(error.textContent).toBe('');
      expect(amount).not.toHaveAttribute('aria-invalid');
      expect(amount).toHaveAttribute('aria-describedby', 'amount-hint');
      expect(output).toHaveTextContent('3 cups bloem = 360 g');
    });

    it('does not show the error again after a fixed amount is committed', async () => {
      const { amount, error, waitForChanges } = await setup(<baking-converter />);

      await typeAmount(amount, 'abc');
      await userEvent.tab();
      await typeAmount(amount, '3');
      await userEvent.tab();
      await waitForChanges();

      expect(error.textContent).toBe('');
      expect(amount).not.toHaveAttribute('aria-invalid');
    });
  });

  describe('pressing Enter', () => {
    it('does not submit the form, so the page does not reload', async () => {
      const { form, amount, output, waitForChanges } = await setup(<baking-converter />);

      /** Added after the component's own listener, so it runs after the component. */
      let submitted: SubmitEvent | undefined;
      form.addEventListener('submit', event => (submitted = event as SubmitEvent));

      await typeAmount(amount, '2');
      await userEvent.keyboard('{Enter}');
      await waitForChanges();

      expect(submitted, 'Enter should trigger implicit submission').toBeDefined();
      expect(submitted!.defaultPrevented).toBe(true);
      expect(output).toHaveTextContent('2 cups bloem = 240 g');
    });

    it('shows the error for an invalid amount, like leaving the field does', async () => {
      const { amount, error, waitForChanges } = await setup(<baking-converter />);

      await typeAmount(amount, 'abc');
      await userEvent.keyboard('{Enter}');
      await waitForChanges();

      expect(error).toHaveTextContent('Vul een getal in, bijvoorbeeld 1 of 1,5.');
      expect(amount).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('announcing the result', () => {
    it('stays quiet on load', async () => {
      const { status } = await setup(<baking-converter />);

      expect(status.textContent).toBe('');
    });

    it('announces the result only once the user finishes an edit, not while typing', async () => {
      const { amount, output, status, waitForChanges } = await setup(<baking-converter />);

      await typeAmount(amount, '2');
      await waitForChanges();

      expect(output).toHaveTextContent('2 cups bloem = 240 g');
      expect(status.textContent).toBe('');

      await userEvent.tab();
      await waitForChanges();

      expect(status.textContent).toBe('2 cups bloem = 240 g');
    });

    it('announces the new result when the ingredient changes', async () => {
      const { ingredient, status, waitForChanges } = await setup(<baking-converter />);

      await userEvent.selectOptions(ingredient, 'butter');
      await waitForChanges();

      expect(status.textContent).toBe('1 cup boter = 227 g');
    });

    it('announces the new result when the unit changes', async () => {
      const { unit, status, waitForChanges } = await setup(<baking-converter />);

      await userEvent.selectOptions(unit, 'oz');
      await waitForChanges();

      expect(status.textContent).toBe('1 ounce (oz) bloem = 28 g');
    });

    it('announces nothing for an invalid amount, which the error region already reports', async () => {
      const { amount, ingredient, status, waitForChanges } = await setup(<baking-converter />);

      await typeAmount(amount, '2');
      await userEvent.tab();
      await waitForChanges();
      expect(status.textContent).toBe('2 cups bloem = 240 g');

      await typeAmount(amount, 'abc');
      await userEvent.tab();
      await waitForChanges();
      expect(status.textContent).toBe('');

      await userEvent.selectOptions(ingredient, 'butter');
      await waitForChanges();
      expect(status.textContent).toBe('');
    });

    it('clears the announcement shortly after, so the result is not read twice when browsing', async () => {
      const { ingredient, output, status, waitForChanges } = await setup(<baking-converter />);

      await userEvent.selectOptions(ingredient, 'butter');
      await waitForChanges();
      expect(status.textContent).toBe('1 cup boter = 227 g');

      await expect.poll(() => status.textContent, { timeout: 3000 }).toBe('');
      expect(output).toHaveTextContent('1 cup boter = 227 g');
    });

    it('announces an identical result again, so a repeated edit is still confirmed', async () => {
      const { amount, status, waitForChanges } = await setup(<baking-converter />);

      const commit = async (value: string) => {
        await typeAmount(amount, value);
        await userEvent.tab();
        await waitForChanges();
        return status.textContent!;
      };

      const first = await commit('2');
      const second = await commit('2,0');
      const third = await commit('2.0');

      /** Same words, different text, so it is read out every time. */
      expect(first.trim()).toBe('2 cups bloem = 240 g');
      expect(second.trim()).toBe(first.trim());
      expect(second).not.toBe(first);
      expect(third).not.toBe(second);
    });
  });

  describe('accessibility', () => {
    /** Width of the widest option text, in the select's own font. */
    function widestOption(select: HTMLSelectElement) {
      const context = document.createElement('canvas').getContext('2d')!;
      context.font = getComputedStyle(select).font;
      return Math.max(
        ...Array.from(select.options, option => context.measureText(option.text).width),
      );
    }

    /** Room for text inside a select: its width minus the padding, which includes the arrow. */
    function textRoom(select: HTMLSelectElement) {
      const style = getComputedStyle(select);
      return select.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    }

    it.each([320, 400, 480, 600, 601, 800])(
      'shows every option in full at a width of %dpx (WCAG 1.4.10)',
      async width => {
        /** Milk offers "fluid ounce (fl oz)", the longest unit name. Verdana is wider than most page fonts. */
        const { ingredient, unit } = await setup(
          <baking-converter
            defaultIngredient="milk"
            style={{ width: `${width}px`, fontFamily: 'Verdana, sans-serif' }}
          />,
        );

        for (const select of [ingredient, unit]) {
          expect(widestOption(select)).toBeLessThanOrEqual(textRoom(select));
        }
      },
    );

    it('keeps its width inside a flex row, which sizes items to their content', async () => {
      const { root, unmount } = await render(
        <div style={{ display: 'flex' }}>
          <baking-converter />
        </div>,
      );
      mounted.push(unmount);

      /** 20rem, the smallest width the layout supports. */
      expect(root.querySelector('baking-converter')!.clientWidth).toBe(320);
    });

    it('uses --bc-focus-color for the focus outline, and --bc-accent for the result', async () => {
      const { amount, output } = await setup(
        <baking-converter
          style={{ '--bc-accent': 'rgb(1, 2, 3)', '--bc-focus-color': 'rgb(4, 5, 6)' }}
        />,
      );

      amount.focus();

      expect(getComputedStyle(amount).outlineColor).toBe('rgb(4, 5, 6)');
      expect(getComputedStyle(output).color).toBe('rgb(1, 2, 3)');
    });

    it('falls back to --bc-accent for the focus outline', async () => {
      const { amount } = await setup(
        <baking-converter style={{ '--bc-accent': 'rgb(1, 2, 3)' }} />,
      );

      amount.focus();

      expect(getComputedStyle(amount).outlineColor).toBe('rgb(1, 2, 3)');
    });

    it('colours the dropdown arrows and field backgrounds from the tokens', async () => {
      const { ingredient, amount, unit } = await setup(
        <baking-converter
          style={{ '--bc-text-color': 'rgb(1, 2, 3)', '--bc-input-bg': 'rgb(4, 5, 6)' }}
        />,
      );

      for (const select of [ingredient, unit]) {
        const arrow = getComputedStyle(select.parentElement!, '::after');
        expect(arrow.backgroundColor).toBe('rgb(1, 2, 3)');
      }
      for (const field of [ingredient, amount, unit]) {
        expect(getComputedStyle(field).backgroundColor).toBe('rgb(4, 5, 6)');
      }
    });

    it('gives every form field a computed accessible name', async () => {
      const { root, ingredient, amount, unit } = await setup(<baking-converter />);

      /** Fails when a field is added or removed. */
      const fields = Array.from(root.shadowRoot!.querySelectorAll('input, select'));
      expect(fields).toEqual([ingredient, amount, unit]);

      await expect.element(ingredient).toHaveAccessibleName('Ingrediënt');
      await expect.element(amount).toHaveAccessibleName('Hoeveelheid');
      await expect.element(unit).toHaveAccessibleName('Eenheid');
    });

    it('gives the amount field the hint as its description, and adds the error once it shows', async () => {
      const { amount, waitForChanges } = await setup(<baking-converter />);
      await expect.element(amount).toHaveAccessibleDescription('Bijvoorbeeld 1,5. Typ ½ als 0,5.');

      await typeAmount(amount, '-1');
      await userEvent.tab();
      await waitForChanges();

      await expect
        .element(amount)
        .toHaveAccessibleDescription(
          'Bijvoorbeeld 1,5. Typ ½ als 0,5. Fout: De hoeveelheid kan niet negatief zijn.',
        );
    });

    it('can be used with the keyboard alone, in a logical tab order', async () => {
      const { root, ingredient, amount, unit } = await setup(<baking-converter />);
      const focused = () => root.shadowRoot!.activeElement;

      await userEvent.click(ingredient);
      await userEvent.keyboard('{Escape}');
      expect(focused()).toBe(ingredient);

      await userEvent.tab();
      expect(focused()).toBe(amount);

      await userEvent.tab();
      expect(focused()).toBe(unit);
    });

    it('groups the fields under one accessible name', async () => {
      const { root, ingredient, amount, unit } = await setup(<baking-converter />);
      const group = root.shadowRoot!.querySelector('fieldset')!;

      await expect.element(group).toHaveAccessibleName('Omrekenen naar grammen');
      for (const field of [ingredient, amount, unit]) expect(group.contains(field)).toBe(true);
    });

    it('marks all its text as Dutch, including the result regions outside the form', async () => {
      const { form, output, status, error } = await setup(<baking-converter />);

      for (const element of [form, output, status, error]) {
        expect(element.closest('[lang]')?.getAttribute('lang')).toBe('nl');
      }
    });

    it('has no axe violations on load', async () => {
      const { root } = await setup(<baking-converter />);

      expect(await axeViolations(root)).toEqual([]);
    });

    it('has no axe violations while an error is shown', async () => {
      const { root, amount, error, waitForChanges } = await setup(<baking-converter />);

      await typeAmount(amount, 'abc');
      await userEvent.tab();
      await waitForChanges();
      expect(error.textContent).not.toBe('');

      expect(await axeViolations(root)).toEqual([]);
    });
  });
});
