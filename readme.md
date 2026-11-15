# Bakcalculator: `<baking-converter>`

Een webcomponent, gebouwd met [Stencil](https://stenciljs.com), die de maten uit Amerikaanse bakrecepten omrekent naar grammen.

Amerikaanse recepten meten de meeste ingrediënten in volume: cups, eetlepels, theelepels en sticks boter. In een Nederlandse keuken gebruik je een weegschaal. Een cup bloem weegt veel minder dan een cup boter, dus met één vaste factor kom je er niet. De component kent per ingrediënt het gewicht van een cup en laat het resultaat in grammen zien, bijvoorbeeld **1,5 cups bloem = 180 g**.

Ik bak zelf taarten, macarons en cupcakes uit Amerikaanse recepten. Juist daar luistert het gewicht nauw, en daar komt het idee vandaan.

## Aan de slag

Je hebt Node.js 20 of hoger nodig.

```bash
npm install
npm start        # ontwikkelserver met live reload op http://localhost:3333
npm test         # bouwt de component en draait de unit- en componenttests
npm run build    # productiebuild naar dist/, loader/ en www/
```

Bij de eerste `npm test` kan Playwright vragen om de browser te installeren: `npx playwright install chromium`.

## Gebruik

Laad de component en zet de tag op de pagina:

```html
<script type="module" src="/build/baking-converter.esm.js"></script>

<baking-converter default-ingredient="butter" default-unit="stick"></baking-converter>
```

In een app met een bundler registreer je de component via de loader:

```ts
import { defineCustomElements } from 'baking-converter/loader';

defineCustomElements();
```

### Properties

| Attribuut            | Property            | Standaard | Beschrijving                                                                                                    |
| -------------------- | ------------------- | --------- | --------------------------------------------------------------------------------------------------------------- |
| `default-ingredient` | `defaultIngredient` | `"flour"` | Het ingrediënt dat bij het laden geselecteerd is, bijvoorbeeld `"butter"`.                                      |
| `default-unit`       | `defaultUnit`       | `"cup"`   | De eenheid die bij het laden geselecteerd is, bijvoorbeeld `"stick"`. Moet bestaan voor het gekozen ingrediënt. |

Bij een onbekende waarde valt de component terug op het eerste ingrediënt of de eerste eenheid van dat ingrediënt, en schrijft een `console.warn`.

### Styling

De component gebruikt Shadow DOM. Je past de kleuren aan met CSS custom properties op het element:

```css
baking-converter {
  --bc-accent: #7c2d12;
  --bc-result-bg: #fff7ed;
}
```

Het lettertype neemt de component over van de pagina. Alle custom properties en hun standaardwaarden staan in de [componentreadme](src/components/baking-converter/readme.md), die Stencil uit de broncode genereert.

## Ontwerpkeuzes

### Een tekstveld voor de hoeveelheid, zonder breuken

Nederlanders typen een decimale komma (`1,5`). Een `type="number"`-veld gaat daar per browser en taal anders mee om, en geeft bij invoer die het niet begrijpt een lege waarde terug. Dan kan de component "leeg" en "ongeldig" niet meer uit elkaar houden. Daarom is het veld `type="text"` met `inputmode="decimal"`: op een telefoon krijg je nog steeds een numeriek toetsenbord. Zowel `1,5` als `1.5` werkt. De komma heb ik getest in Chrome en Firefox.

Amerikaanse recepten schrijven vaak breuken, zoals `1/2` of `1 1/2`. Ik verwacht dat je de component vooral op je telefoon gebruikt, naast het recept, en het numerieke toetsenbord heeft geen `/`. Breuken ondersteunen zou betekenen dat iedereen het volledige toetsenbord krijgt, ook voor gewone getallen. Je typt `1/2` dus als `0,5`. Een hint onder het veld zegt dat meteen, en bij andere invoer krijg je een foutmelding met een voorbeeld.

### Gewichten en eenheden

Alle gewichten komen uit één bron, de [ingredient weight chart van King Arthur Baking](https://www.kingarthurbaking.com/learn/ingredient-weight-chart), zodat ze onderling kloppen. Het zijn gemiddelden: wat een cup echt weegt, hangt af van hoe je schept of aandrukt. Bruine suiker staat erin als aangedrukt, zoals Amerikaanse recepten bedoelen.

Een ounce (`oz`) is een gewicht en altijd 28,35 g. Een fluid ounce (`fl oz`) is een volume, dat ik via het gewicht per cup omreken (1 cup = 8 fl oz). Vloeistoffen zoals melk en slagroom bieden `fl oz` aan, droge ingrediënten `oz`. Elk ingrediënt toont alleen de eenheden die erbij passen, dus "een stick bloem" kun je niet kiezen.

### Rustige validatie

Het resultaat verandert terwijl je typt. Een foutmelding komt pas als je het veld verlaat of op Enter drukt, en verdwijnt zodra je weer typt. Typ je een half getal zoals `1,`, dan blijft het laatste geldige resultaat staan, zodat het niet knippert.

Nul geldt als fout. "0 cups" omrekenen is nooit wat iemand bedoelt, dus de component behandelt het als typefout in plaats van "0 g" te tonen.

### Startwaarden, en nog geen event

`default-ingredient` en `default-unit` bepalen alleen de selectie bij het laden. Latere wijzigingen negeert de component bewust: anders kan de pagina overschrijven wat de gebruiker net heeft gekozen. Ik heb overwogen om ze twee kanten op gelijk te houden (`mutable` en `reflect`), maar dan zijn de pagina en de gebruiker allebei eigenaar van de selectie.

Er is nog geen event met het resultaat. De component is een zelfstandig hulpmiddel: je leest het resultaat af en gebruikt het. Zolang geen pagina de waarde nodig heeft, weet ik niet hoe zo'n event eruit moet zien, en elk event is API die je daarna stabiel moet houden.

## Toegankelijkheid

Wat erin zit:

- Elk veld heeft een zichtbaar label.
- Onder het hoeveelheidsveld staat een hint met het verwachte formaat ("Bijvoorbeeld 1,5. Typ ½ als 0,5."), gekoppeld aan het veld, zodat een screenreader die bij het label voorleest (WCAG 3.3.2).
- Bij ongeldige invoer krijgt het veld `aria-invalid="true"` en wordt de foutmelding aan het veld gekoppeld. Een fout zie je altijd als tekst, niet alleen aan de kleur (WCAG 1.4.1).
- Het resultaat wordt voorgelezen als je klaar bent met een wijziging (veld verlaten, Enter, of een andere keuze in een dropdown), niet bij elke toetsaanslag (WCAG 4.1.3).
- De hele component heeft `lang="nl"`, zodat een screenreader ook op een anderstalige pagina een Nederlandse stem gebruikt (WCAG 3.1.2).
- Focus is op elk veld zichtbaar, en tekst heeft een contrast van minstens 4,5:1.
- Enter herlaadt de pagina niet.

Zo heb ik het getest:

- Alleen met het toetsenbord: Tab door de velden, pijltjestoetsen in de dropdowns.
- Op 200% zoom en op een smal telefoonscherm.
- Met de screenreader NVDA op Windows: labels, hint, foutmeldingen en resultaten worden voorgelezen.
- In Chrome en Firefox.
- Automatisch: de componenttests draaien axe-core, en controleren onder meer de toegankelijke namen, beschrijvingen en de toetsenbordvolgorde.

## Bekende beperking

Een punt en een komma tellen allebei als decimaalteken. Typ je `1.000` met een punt als duizendtalscheiding, dan leest de component dat als 1 en niet als 1000. Bij cups en eetlepels kom je zulke getallen zelden tegen.

## Met meer tijd

- **Een `conversionChange`-event**, zodra een pagina het resultaat nodig heeft, bijvoorbeeld voor een boodschappenlijst met meerdere omrekeningen. Het event zou ruwe waarden bevatten (`grams: 180`, niet `"180 g"`) en alleen afgaan als het resultaat geldig en veranderd is.
- **Oventemperatuur**: °F naar °C, met een correctie voor hetelucht (ongeveer 20 °C lager).
- **Een tweede taal.** Alle tekst staat nu in één getypeerd bestand, [`src/texts/nl.ts`](src/texts/nl.ts). Voor een tweede taal is meer nodig: een manier om de taal te kiezen, de volgorde van de resultaatzin in de teksten in plaats van in de code, en geen vaste `toLowerCase()` op ingrediëntnamen.

## Licentie

MIT
