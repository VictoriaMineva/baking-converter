# baking-converter



<!-- Auto Generated Below -->


## Properties

| Property            | Attribute            | Description                                                                                                                                          | Type                                                                                                                                                                              | Default   |
| ------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `defaultIngredient` | `default-ingredient` | The ingredient that is selected when the component loads, e.g. `"butter"`. Only read once: changing it after the component has loaded has no effect. | `"almond-flour" \| "brown-sugar" \| "butter" \| "cocoa-powder" \| "cornstarch" \| "cream-cheese" \| "flour" \| "granulated-sugar" \| "heavy-cream" \| "milk" \| "powdered-sugar"` | `'flour'` |
| `defaultUnit`       | `default-unit`       | The unit that is selected when the component loads, e.g. `"stick"`. Only read once: changing it after the component has loaded has no effect.        | `"cup" \| "floz" \| "oz" \| "stick" \| "tbsp" \| "tsp"`                                                                                                                           | `'cup'`   |


## CSS Custom Properties

| Name                | Description                                                                  |
| ------------------- | ---------------------------------------------------------------------------- |
| `--bc-accent`       | Focus outline, result text and result border. Default `#164e63`.             |
| `--bc-border-color` | Border of the form fields and the line below the form. Default `#767676`.    |
| `--bc-error`        | Error message, and the border of an invalid amount field. Default `#c2410c`. |
| `--bc-hint-color`   | Hint text below the amount field. Default `#595959`.                         |
| `--bc-input-bg`     | Background of the form fields. Default `#fff`.                               |
| `--bc-result-bg`    | Background of the result box. Default `#f3fbfc`.                             |
| `--bc-text-color`   | Text colour of the form fields and the dropdown arrows. Default `#000`.      |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
