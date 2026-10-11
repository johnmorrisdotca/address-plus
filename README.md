# address-plus

**Try it:** [the demo](https://johnmorrisdotca.github.io/address-plus/), in your browser with nothing to install · [API reference](https://johnmorrisdotca.github.io/address-plus/api.html)

The demo parses, validates, formats, compares and cleans an address as you type; takes a pasted list of addresses from all seven countries and saves the results as CSV, JSON or text; takes a Japanese address apart, each part beside its reading and romaji; and runs the whole test corpus, 3,526 cases, in your browser, listing the few still wrong. Every panel copies its call as code or a link that opens the page as you left it. Nothing you type leaves the page.

<table align="center">
<tr>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/address-plus/main/docs/images/hero-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/address-plus/main/docs/images/hero-desk-light.webp" alt="The demo on a desk, in English: the header with its language chooser, the API reference link, five cloth patches and the Help switch, then panels in two columns. Parse shows 1600 Pennsylvania Ave NW, Washington, DC 20500 split into number 1600, street Pennsylvania, street type Ave, direction NW, city Washington, state DC, ZIP 20500 and country US, with the call parseLocation under it. Validate shows 123 Main St, Seattle, NY 98101 as valid with the warning POSTAL_REGION_MISMATCH: ZIP code 98101 belongs to WA, not NY" width="600">
</picture>
<br><em>The demo on a desk: each panel answers the example in its box, with the call that made it.</em>
</td>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/address-plus/main/docs/images/hero-phone-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/address-plus/main/docs/images/hero-phone-light.webp" alt="The demo on a phone, in Japanese: the header with its language chooser, patches and Help switch, then the first panel, 住所の解析 (parseLocation), with the Japanese example 〒100-0005 東京都千代田区丸の内1丁目2番3号 typed in and its example buttons, the 日本語 one pressed" width="190">
</picture>
<br><em>On a phone, in Japanese, in the device's light or dark.</em>
</td>
</tr>
</table>

A modern, TypeScript‑first address parser and normalizer for the US, Canada and Japan, with Australia, France, Germany and the United Kingdom as modules of their own. Supports USPS, Canada Post, Australia Post, La Poste, Deutsche Post and Royal Mail formats, Japanese addresses written in Japanese or in romaji, bilingual abbreviations, ZIP and postal codes, facility name detection, and parenthetical parsing. Lightweight, regex‑driven, and API‑compatible with parse-address for seamless upgrades.

## Features

- **US Address Parsing**: Full USPS format support with street types, directionals, and secondary units
- **Canadian Address Parsing**: Canada Post bilingual support (English/French)
- **Japanese Address Parsing**: Addresses in Japanese (〒100-0005 東京都千代田区丸の内1丁目2番3号) or romaji (1-2-3 Marunouchi, Chiyoda-ku, Tokyo), with every prefecture and municipality and the prefecture each postal code delivers to
- **Australia, France, Germany and the United Kingdom**: `/au` reads `3/12 Smith St, Parramatta NSW 2150` the Australia Post way, `/fr` reads `12 bis rue de la Paix, 75002 Paris` the La Poste way, `/de` reads `Hauptstraße 12a, 10115 Berlin` the Deutsche Post way, and `/gb` reads `Flat 2, 14 High Street, London NW9 0AA` the Royal Mail way, each with its own validator, formatter and postcode lookups; a country costs only the callers who import it
- **Facility Detection**: Extracts business/landmark names with various separators
- **Intersection Parsing**: Handles street intersections with multiple formats, and knows "Newfoundland and Labrador" is a province, not two streets
- **Postal Codes Know Their Region**: Finds the state or province a ZIP or postal code belongs to, lists the codes a region uses, and flags an address whose code names another region
- **Comprehensive Address Components**: Numbers, streets, units, cities, states, postal codes
- **Batch Processing**: Efficiently process multiple addresses with performance statistics
- **One Small Dependency**: `fast-levenshtein`, for fuzzy state and province names (kanji numerals are read with `@johnmorrisdotca/hikidashi`, bundled into the build)
- **TypeScript First**: Full type definitions included
- **Drop-in Replacement**: API compatible with parse-address; [Migrating from parse-address](docs/MIGRATING_FROM_PARSE_ADDRESS.md) maps every call and field and lists where the answers differ on purpose

## Installation

```bash
# npm
npm install @johnmorrisdotca/address-plus

# pnpm
pnpm add @johnmorrisdotca/address-plus

# yarn
yarn add @johnmorrisdotca/address-plus
```


## Address field for a form

Use the [embed builder](https://johnmorrisdotca.github.io/address-plus/builder.html)
for a live preview and framework/HTML snippets. Import
`@johnmorrisdotca/address-plus/element/define`, then put
`<address-field country="CA" name="shipping-address" required></address-field>`
inside a form. It submits the raw text like a normal field and exposes parsed
results locally. The optional browser entry includes all seven country parsers;
the core and individual country imports remain separate. Read the
[field guide](docs/embeds.md) for host options, form reset/validity and private
frame messages. Validation checks format, not whether mail can be delivered.

## Usage

### JavaScript (ES6+)

```javascript
import { parseLocation, parseIntersection } from "@johnmorrisdotca/address-plus";

// Parse a standard address
const result = parseLocation("123 Main Street, Anytown, NY 12345");
console.log(result);
// {
//   number: '123',
//   street: 'Main',
//   type: 'St',
//   city: 'Anytown',
//   state: 'NY',
//   zip: '12345',
//   country: 'US'
// }

// Parse address with facility name
const facility = parseLocation("Empire State Building, 350 5th Avenue, New York NY 10118");
console.log(facility);
// {
//   place: 'Empire State Building',
//   number: '350',
//   street: '5th',
//   type: 'Ave',
//   city: 'New York',
//   state: 'NY',
//   zip: '10118',
//   country: 'US'
// }

// Parse intersection
const intersection = parseIntersection("Main St & Broadway, New York NY");
console.log(intersection);
// {
//   street1: 'Main',
//   type1: 'St',
//   street2: 'Broadway',
//   city: 'New York',
//   state: 'NY'
// }
```

### TypeScript

```typescript
import { parseLocation, parseIntersection, type ParsedAddress, type ParsedIntersection } from "@johnmorrisdotca/address-plus";

// Typed address parsing
const address: ParsedAddress | null = parseLocation("1600 Pennsylvania Ave NW, Washington DC 20500");

if (address && "street" in address) {
  // TypeScript knows this is a standard address, not an intersection
  console.log(`Number: ${address.number}`);
  console.log(`Street: ${address.street} ${address.type}`);
  console.log(`City: ${address.city}, ${address.state} ${address.zip}`);
}

// Typed intersection parsing
const intersection: ParsedIntersection | null = parseIntersection("5th St and Broadway");

if (intersection) {
  console.log(`Intersection: ${intersection.street1} & ${intersection.street2}`);
}

// Canadian address with types
const canadianAddress = parseLocation("123 Rue Saint-Jacques, Montréal QC H3C 1G1");
console.log(canadianAddress);
// {
//   number: '123',
//   street: 'Rue Saint-Jacques',
//   city: 'Montréal',
//   state: 'QC',
//   zip: 'H3C 1G1',
//   country: 'CA'
// }
```

### Node.js (CommonJS)

```javascript
const { parseLocation, parseIntersection } = require("@johnmorrisdotca/address-plus");

// Parse addresses in Node.js
const address = parseLocation("456 Oak Street, Suite 100, Boston MA 02101");
console.log(address);
// {
//   number: '456',
//   street: 'Oak',
//   type: 'St',
//   sec_unit_type: 'Suite',
//   sec_unit_num: '100',
//   city: 'Boston',
//   state: 'MA',
//   zip: '02101',
//   country: 'US'
// }

// Batch processing
const addresses = [
  "123 Main St, New York NY 10001",
  "456 Broadway Ave, Los Angeles CA 90210",
  "789 First Street, Chicago IL 60601",
];

const parsed = addresses.map((addr) => parseLocation(addr));
console.log(parsed);
```

## Migrating from parse-address

Replace the package and keep your calls: `parseLocation`, `parseAddress`, `parseIntersection` and `parseInformalAddress` have the same names and return the same fields, and `{ useSnakeCase: true }` gives parse-address's `sec_unit_type` and `sec_unit_num`. [Migrating from parse-address](docs/MIGRATING_FROM_PARSE_ADDRESS.md) maps every call and field, shows side by side each answer that differs on purpose (a unit designator in full, a fraction kept with the number, Canada's unit-civic pairs), and notes the one function that reads less than parse-address's (`parseInformalAddress`; call `parseLocation` instead).

## Address Components

The parser returns structured objects with the following possible fields:

### Standard Address Fields

| Field           | Description                  | Example                                           |
| --------------- | ---------------------------- | ------------------------------------------------- |
| `number`        | House/building number        | `"123"`, `"123 1/2"`, `"N95W18855"`               |
| `prefix`        | Directional prefix           | `"N"`, `"SE"`, `"NW"`                             |
| `street`        | Street name                  | `"Main"`, `"Broadway"`, `"Martin Luther King Jr"` |
| `type`          | Street type (abbreviated)    | `"St"`, `"Ave"`, `"Blvd"`, `"Dr"`                 |
| `suffix`        | Directional suffix           | `"N"`, `"SW"`, `"E"`                              |
| `sec_unit_type` | Secondary unit type          | `"Apt"`, `"Suite"`, `"Unit"`, `"#"`               |
| `sec_unit_num`  | Secondary unit number        | `"4B"`, `"100"`, `"C-22"`                         |
| `city`          | City name                    | `"New York"`, `"Los Angeles"`                     |
| `state`         | State/province (abbreviated) | `"NY"`, `"CA"`, `"QC"`, `"ON"`                    |
| `zip`           | ZIP/postal code              | `"10001"`, `"90210"`, `"H3C 1G1"`                 |
| `plus4`         | ZIP+4 extension              | `"1234"`                                          |
| `country`       | Country code                 | `"US"`, `"CA"`                                    |
| `place`         | Facility/landmark name       | `"Empire State Building"`, `"Central Park"`       |

### Intersection Fields

| Field     | Description        | Example      |
| --------- | ------------------ | ------------ |
| `street1` | First street name  | `"Main"`     |
| `type1`   | First street type  | `"St"`       |
| `street2` | Second street name | `"Broadway"` |
| `type2`   | Second street type | `"Ave"`      |
| `city`    | City name          | `"New York"` |
| `state`   | State/province     | `"NY"`       |
| `zip`     | ZIP/postal code    | `"10001"`    |

## Examples

### US Addresses

```javascript
// Basic address
parseLocation("123 Main Street, Anytown, NY 12345");

// Address with directionals
parseLocation("456 N Broadway Ave, Los Angeles CA 90210");

// Address with secondary unit
parseLocation("789 Oak St, Apt 4B, Boston MA 02101");

// Fractional address numbers
parseLocation("123 1/2 Main Street, Los Angeles CA 90028");

// PO Box
parseLocation("PO Box 1234, Small Town, MT 59718");

// Business/facility with address
parseLocation("Starbucks, 1234 Coffee Lane, Seattle WA 98101");
```

### Canadian Addresses

```javascript
// English format
parseLocation("123 Main Street, Toronto ON M5V 1A1");

// French format
parseLocation("456 Rue Saint-Jacques, Montréal QC H3C 1G1");

// Bilingual
parseLocation("789 Avenue des Pins Ouest, Montréal QC H2W 1S6");
```

### Intersections

```javascript
// Various intersection formats
parseIntersection("Main St & Broadway");
parseIntersection("5th Street and Park Avenue");
parseIntersection("Highway 101 & Interstate 280");
```

## API Reference

Every export of every entry point (`@johnmorrisdotca/address-plus`, `/jp`, `/au` and `/gb`), with its signature, what it does, each parameter, what it returns and a worked example, is in the [full API reference](docs/api.md), also on the [demo site](https://johnmorrisdotca.github.io/address-plus/api.html). The same TSDoc ships in the type definitions, so your editor shows it on hover. The two main functions are described here.

### `parseLocation(address: string): ParsedAddress | null`

Parses a single address string into structured components.

**Parameters:**

- `address` (string): The address string to parse

**Returns:**

- `ParsedAddress | null`: Parsed address object or null if parsing fails

### `parseIntersection(intersection: string): ParsedIntersection | null`

Parses a street intersection string into structured components.

**Parameters:**

- `intersection` (string): The intersection string to parse

**Returns:**

- `ParsedIntersection | null`: Parsed intersection object or null if parsing fails

## ZIP Code & Postal Code Handling

The parser extracts ZIP/postal codes from addresses and provides validation information:

### US ZIP Codes

```javascript
// Standard 5-digit ZIP
parseLocation("123 Main St, New York NY 12345");
// { zip: '12345', zipValid: true, ... }

// ZIP+4 with hyphen (standard format)
parseLocation("123 Main St, New York NY 12345-6789");
// { zip: '12345', plus4: '6789', zipValid: true, ... }

// ZIP+4 without hyphen (extracted and normalized)
parseLocation("123 Main St, New York NY 123456789");
// { zip: '12345', plus4: '6789', zipValid: true, ... }

// Invalid ZIP length (still extracted but marked invalid)
parseLocation("123 Main St, New York NY 123");
// { zip: '123', zipValid: false, ... }

parseLocation("123 Main St, New York NY 1234567");
// { zip: '1234567', zipValid: false, ... }
```

### Canadian Postal Codes

```javascript
// Standard format with space (A1A 1A1)
parseLocation("123 Main St, Toronto ON M5V 1A1");
// { zip: 'M5V 1A1', zipValid: true, country: 'CA', ... }

// No spaces (extracted and normalized)
parseLocation("123 Main St, Toronto ON M5V1A1");
// { zip: 'M5V 1A1', zipValid: true, country: 'CA', ... }

// With hyphen (extracted but marked invalid format)
parseLocation("123 Main St, Toronto ON M5V-1A1");
// { zip: 'M5V-1A1', zipValid: false, country: 'CA', ... }

// Wrong pattern (extracted but marked invalid)
parseLocation("123 Main St, Toronto ON ABC123");
// { zip: 'ABC123', zipValid: false, country: 'CA', ... }
```

### Validation Fields

The parser provides these validation-related fields:

| Field      | Description                                | Example                         |
| ---------- | ------------------------------------------ | ------------------------------- |
| `zip`      | Extracted ZIP/postal code (any format)     | `"12345"`, `"M5V 1A1"`, `"123"` |
| `plus4`    | ZIP+4 extension (US only)                  | `"6789"`                        |
| `zipValid` | Whether ZIP/postal follows standard format | `true`, `false`                 |
| `country`  | Detected country based on format           | `"US"`, `"CA"`                  |

### Format Standards

**Valid US ZIP formats:**

- 5 digits: `12345`
- ZIP+4: `12345-6789` or `123456789`

**Valid Canadian postal formats:**

- Standard: `A1A 1A1` (letter-digit-letter space digit-letter-digit)
- No spaces: `A1A1A1` (automatically normalized to `A1A 1A1`)

**Invalid formats are still extracted** but `zipValid: false` to allow for:

- Data cleaning and validation workflows
- Parsing addresses with typos or non-standard formatting
- Flexible input handling while maintaining validation awareness

### Which Region A Code Belongs To

A Canadian postal code's first letter, and a US ZIP code's first three digits, name the province or state they belong to. The lookups go both ways:

```javascript
import {
  getProvinceFromPostalCode,
  getStateFromZip,
  getPostalPrefixesForProvince,
  getZipPrefixesForState,
} from "@johnmorrisdotca/address-plus";

getProvinceFromPostalCode("R8M 8G0"); // 'MB'
getStateFromZip("90210"); // 'CA'
getStateFromZip("24926-5858"); // 'WV'

// Every code starting with one of these belongs to that region.
getPostalPrefixesForProvince("QC"); // ['G', 'H', 'J']
getPostalPrefixesForProvince("NU"); // ['X0A', 'X0B', 'X0C'] (the territories share X)
getZipPrefixesForState("RI"); // ['028', '029']
getZipPrefixesForState("GU"); // ['96910', …, '96932'] (five digits where a region owns part of a block)
```

`validateAddress` uses them: an address whose code belongs to another region gets a `POSTAL_REGION_MISMATCH` warning, or an error with `strictPostalValidation: true`.

```javascript
validateAddress("1 Main St, Beverly Hills, NY 90210").warnings;
// [{ field: 'zip', code: 'POSTAL_REGION_MISMATCH', message: 'ZIP code 90210 belongs to CA, not NY', severity: 'warning' }]
```

## Japanese Addresses

`parseLocation` reads a Japanese address written either way it is usually written, and returns the same fields for both:

```javascript
import { parseLocation } from "@johnmorrisdotca/address-plus";

// In Japanese, from the largest part to the smallest
parseLocation("〒100-0005 東京都千代田区丸の内1丁目2番3号 サンプルビル5階");

// In romaji, in English order
parseLocation("Sample Bldg 5F, 1-2-3 Marunouchi, Chiyoda-ku, Tokyo 100-0005, Japan");

// Both give
// {
//   country: 'JP', postalCode: '100-0005',
//   prefecture: '東京都', prefectureCode: '13', prefectureRomaji: 'Tokyo',
//   municipality: '千代田区', municipalityCode: '13101', municipalityRomaji: 'Chiyoda-ku',
//   town: '丸の内' (or 'Marunouchi'), chome: '1', ban: '2', go: '3', block: '1-2-3',
//   building: 'サンプルビル' (or 'Sample Bldg'), floor: '5',
//   ...and the shared fields below
// }
```

An address is read as Japanese when it is in Japanese script, ends with Japan, or names a prefecture beside a Japanese postal code (`NNN-NNNN`), a romaji designator (`-ku`, `-shi`, `-ken`) or a municipality written with an English word (`Chiyoda City`). A US or Canadian address that only mentions a Japanese place, such as `100 Tokyo Ave, Brooklyn, NY 11201`, is still read as US or Canadian. `{ country: "JP" }` skips the detection.

The parser reads what people actually type:

- full-width digits and letters (`１－２－３`, `５Ｆ`), half-width katakana, every kind of dash (the hyphens, dashes and minus signs, `ー` and `ｰ`, the box-drawing `─` and `━`), while a `ー` inside a name such as ハーバー stays;
- the block as `1丁目2番3号`, `1-2-3`, `1の2の3`, `一丁目二番三号`, `一-二-三`, `2番地3`, Sakai's `3丁1番9号` or a lone `488`, a fourth number or one after a further dash as the room (`2-3-10-107`, `6番23-2`), and a lettered go (`14-イ22`); kanji numerals that belong to a name (三番町, 麻布十番, 北一条西, 二階堂) are left alone, as is a town whose name holds a number (和歌山市7番町);
- Kyoto's street directions (`寺町通御池上る上本能寺前町488`), reported apart from the town in `streetDirections`;
- Hokkaido's grid towns (`北1条西2丁目`, `6条通9丁目`), the `条` kept in the town;
- a postal code after 〒 or not, with or without its hyphen, at the start or the end;
- 日本 or Japan at either end;
- a prefecture left out (千代田区丸の内1-2-3 is in Tokyo) or written without its designator (東京千代田区, 千葉市川市);
- a designated city without its ward (大阪市, Sapporo), a ward with only its prefecture (大阪府北区), a town or village without its district (当別町 for 石狩郡当別町), and spaces inside any of them (京都市 下京区);
- 巿 typed for 市, and `ヶ` or an old kanji in a municipality's name (鎌ケ谷市, 飛驒市);
- romaji with or without macrons, with `-to`, `-do`, `-fu`, `-ken`, `Prefecture`, `Pref.`, `City` or `Metropolis`, in English order or Japanese order, on one line or several;
- a building, its floor (`5階`, `5F`, `地下1階`) and its room (`501号室`, or `501号` after a building name).

### Fields

| Field                | Example                       | Meaning                                                       |
| -------------------- | ----------------------------- | ------------------------------------------------------------- |
| `postalCode`         | `100-0005`                    | 郵便番号, always written `NNN-NNNN`                           |
| `prefecture`         | `東京都`                      | 都道府県, the official name                                   |
| `prefectureCode`     | `13`                          | JIS X 0401 code, `01` (Hokkaido) to `47` (Okinawa)            |
| `prefectureRomaji`   | `Tokyo`                       | The name English addresses use                                |
| `municipality`       | `千代田区`                    | 市区町村, with the district for a town or village (石狩郡当別町) |
| `municipalityCode`   | `13101`                       | JIS X 0402 code                                               |
| `municipalityRomaji` | `Chiyoda-ku`                  | Romaji with its designators: `Sapporo-shi Chuo-ku`            |
| `streetDirections`   | `寺町通御池上る`              | Kyoto's street directions (通り名) written before the town    |
| `town`               | `丸の内`                      | 町名 or 大字, without the chome; as written                   |
| `chome`              | `1`                           | 丁目                                                          |
| `ban`                | `2`                           | 番 or 番地                                                    |
| `go`                 | `3`                           | 号                                                            |
| `block`              | `1-2-3`                       | The numbered block as one string                              |
| `building`           | `サンプルビル`                      | The building's name                                           |
| `floor`              | `5`                           | 階; `B1` for a basement floor                                 |
| `room`               | `501`                         | 号室                                                          |

Two numbers straight after a town are read as ban and go: `寿町2-31` is 2番31号, and `大字下里12-3` is 12番地3. They could be a chome and a ban (`丸の内1-2` for 1丁目2番), but almost never are: of the 907 addresses in Geolonia's test set that end in a bare pair after the town, 899 are ban and go, since a person in a town of chome writes all three numbers. A chome written as such (`1丁目2-3`) is kept. Three numbers are chome, ban and go, unless the town is named with 大字 or 字 or the first number is 100 or more, and then ban, go and a room. `block` is the same either way, so read `block` when the parts must be certain.

The Japanese corpus (`test-data/corpus/japan/`, 1,118 cases from Geolonia's tests and original shapes) is described in [docs/TEST_COVERAGE.md](docs/TEST_COVERAGE.md#the-japanese-corpus), with the 13 cases still wrong and why.

The shared fields are filled too, so the rest of the library treats the address like any other:

| Shared field | Holds for Japan                    |
| ------------ | ---------------------------------- |
| `country`    | `JP`                               |
| `state`      | the prefecture's JIS code (`13`)   |
| `city`       | the municipality (`千代田区`)      |
| `street`     | the town (`丸の内`)                |
| `number`     | the block (`1-2-3`)                |
| `zip`        | the postal code (`100-0005`)       |
| `place`      | the building (`サンプルビル`)            |

`{ useSnakeCase: true }` gives the Japanese fields in snake_case as well: `postal_code`, `prefecture_code`, `municipality_romaji`.

### Formatting

```javascript
import { formatJapanese, formatJapaneseEnglish, parseLocation } from "@johnmorrisdotca/address-plus";

const address = parseLocation("〒100-0005 東京都千代田区丸の内1丁目2番3号 サンプルビル5階");

formatJapanese(address);
// 〒100-0005
// 東京都千代田区丸の内1-2-3
// サンプルビル5階

formatJapanese(address, { blockStyle: "markers" }); // ...丸の内1丁目2番3号
formatJapanese(address, { multiline: false, includePostalCode: false }); // 東京都千代田区丸の内1-2-3 サンプルビル5階

formatJapaneseEnglish(parseLocation("Sample Bldg 5F, 1-2-3 Marunouchi, Chiyoda-ku, Tokyo 100-0005"));
// Sample Bldg 5F, 1-2-3 Marunouchi, Chiyoda-ku, Tokyo 100-0005, Japan
```

`formatJapaneseEnglish` writes the prefecture and municipality in romaji from the tables, whichever script the address came in, with a ward before its city (`Chuo-ku, Sapporo-shi`). The town and building have no romaji in the tables, so they are written as they were parsed: from an address in Japanese they stay in Japanese (`サンプルビル 5F, 1-2-3 丸の内, Chiyoda-ku, Tokyo 100-0005, Japan`). A municipality the tables do not know keeps the name it was written with.

`formatJapanese` writes the prefecture and municipality in kanji from the tables. A town or building parsed from romaji is kept in romaji and set off with spaces, so the scripts do not run together: `東京都千代田区 Marunouchi 1-2-3`, then `Sample Bldg 5階`. With `blockStyle: "markers"`, a block in a town of numbered blocks (住居表示) is written `1丁目2番3号` or `4番2号`, a lone number `488番地`, and a land lot (地番) with no chome, in a town named with 大字 or 字 or with a first number of 100 or more, `12番地3`, since a 号 there would be wrong.

### Validation

`validateAddress` checks a Japanese address against the tables:

| Code                               | Severity                                              | When                                                         |
| ---------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------ |
| `POSTAL_REGION_MISMATCH`           | warning; error with `strictPostalValidation: true`    | The postal code delivers to another prefecture               |
| `UNRECOGNIZED_POSTAL_CODE`         | warning; error with `strictPostalValidation: true`    | No Japanese postal code begins with its first three digits   |
| `INVALID_POSTAL_FORMAT`            | warning; error with `strictPostalValidation: true`    | The postal code is not `NNN-NNNN`                            |
| `MUNICIPALITY_PREFECTURE_MISMATCH` | warning                                               | The municipality is in another prefecture than the one named |
| `UNRECOGNIZED_MUNICIPALITY`        | warning                                               | The municipality is not in the tables                        |
| `AMBIGUOUS_MUNICIPALITY`           | warning                                               | Two prefectures have a municipality of that name (府中市), and neither a prefecture nor a postal code says which |

```javascript
validateAddress("〒530-0001 東京都千代田区丸の内1-2-3").warnings;
// [{ field: 'zip', code: 'POSTAL_REGION_MISMATCH', message: 'Postal code 530-0001 belongs to 大阪府, not 東京都', severity: 'warning' }]

validateAddress("東京都大阪市北区梅田1-1").warnings;
// [{ field: 'city', code: 'MUNICIPALITY_PREFECTURE_MISMATCH', message: '大阪市北区 is in 大阪府, not 東京都', ... }, ...]
```

When the prefecture written and the municipality disagree, the parser keeps both as written and leaves the judgement to validation. The municipality findings stay warnings even in strict mode, since the tables can trail a merger of municipalities.

### Lookups

```javascript
import {
  findMunicipalitiesByName,
  findMunicipalitiesByRomaji,
  findPrefecture,
  getPostalPrefixesForPrefecture,
  getPrefectureFromJapanesePostalCode,
} from "@johnmorrisdotca/address-plus";

findPrefecture("Osaka Prefecture"); // { code: '27', name: '大阪府', kana: 'オオサカフ', romaji: 'Osaka-fu' }
getPrefectureFromJapanesePostalCode("100-0005"); // '13'
getPostalPrefixesForPrefecture("沖縄県"); // ['900', '901', …, '907'] (a JIS code or romaji works too)
findMunicipalitiesByRomaji("Chuo-ku, Sapporo"); // [札幌市中央区]
findMunicipalitiesByName("府中市"); // [Tokyo's 府中市, Hiroshima's 府中市]
```

The tables are exported as `JP_PREFECTURES`, `JP_MUNICIPALITIES`, `JP_DESIGNATED_CITIES` (the twenty cities with wards, which the parser accepts without a ward), `JP_POSTAL_PREFIXES` and `JP_POSTAL_EXCEPTIONS` (the 236 codes that belong to another prefecture than the rest of their three-digit prefix).

### Japan Only

`@johnmorrisdotca/address-plus/jp` is the Japanese module on its own: the parser, the formatters, `validateJapaneseAddress`, the lookups and the tables, without the US and Canadian parser.

```javascript
import { formatJapaneseEnglish, parseJapaneseAddress } from "@johnmorrisdotca/address-plus/jp";

formatJapaneseEnglish(parseJapaneseAddress("2-1 Kasumigaseki 1-chome, Chiyoda-ku, Tokyo"));
// 1-2-1 Kasumigaseki, Chiyoda-ku, Tokyo, Japan
```

### Data

The tables in `src/constants/jp/` are generated, and `pnpm data:jp` regenerates them:

- prefectures and municipalities, with their JIS codes, readings and romaji, from Geolonia 住所データ (MIT), [github.com/geolonia/japanese-addresses](https://github.com/geolonia/japanese-addresses);
- the prefecture each postal code delivers to, from Japan Post's postal code file (KEN_ALL.CSV) through [jp-postal](https://www.npmjs.com/package/jp-postal) (MIT);
- kanji numerals are read with [hikidashi](https://www.npmjs.com/package/@johnmorrisdotca/hikidashi) (MIT), bundled into the build.

Geolonia's data predates Hamamatsu's reorganisation of its wards on 1 January 2024, so its new wards `中央区`, `浜名区` and `天竜区` are not yet in the tables: `浜松市中央区元城町103-2` is read as 浜松市 (22130) with the town `中央区元城町`.

## Australian, French, German and British Addresses

Australia, France, Germany and the United Kingdom are modules of their own, so they cost only the callers who import them. Each has
its own parser, validator, formatter and comparer, and a module object to hand to `parseLocation` and
`validateAddress`, which then read its addresses beside the US, Canadian and Japanese ones:

```javascript
import { parseLocation, validateAddress } from "@johnmorrisdotca/address-plus";
import { australia } from "@johnmorrisdotca/address-plus/au";
import { france } from "@johnmorrisdotca/address-plus/fr";
import { germany } from "@johnmorrisdotca/address-plus/de";
import { unitedKingdom } from "@johnmorrisdotca/address-plus/gb";

const countries = [australia, france, germany, unitedKingdom];

parseLocation("3/12 Smith St, Parramatta NSW 2150", { countries });
// { secUnitType: 'Unit', secUnitNum: '3', number: '12', street: 'Smith', type: 'St',
//   city: 'Parramatta', state: 'NSW', zip: '2150', zipValid: true, country: 'AU' }

parseLocation("Flat 2, Rose Court, 14 High St, Kingsbury, London NW9 0AA", { countries });
// { secUnitType: 'Flat', secUnitNum: '2', building: 'Rose Court', number: '14', street: 'High', type: 'Street',
//   locality: 'Kingsbury', city: 'London', zip: 'NW9 0AA', zipValid: true, nation: 'ENG', country: 'GB' }

parseLocation("Résidence Les Lilas, Apt 12, 4 bis av. des Écoles, 31000 Toulouse", { countries });
// { building: 'Résidence Les Lilas', secUnitType: 'Appartement', secUnitNum: '12', number: '4', numberExtension: 'bis',
//   type: 'Avenue', street: 'des Écoles', city: 'Toulouse', state: '31', zip: '31000', zipValid: true, country: 'FR' }

parseLocation("c/o Weber, Hinterhaus, Kastanienallee 4b, 10435 Berlin", { countries });
// { careOf: 'Weber', building: 'Hinterhaus', street: 'Kastanienallee', number: '4B', city: 'Berlin',
//   state: 'BE', zip: '10435', zipValid: true, country: 'DE' }

parseLocation("12 Smith St, Parramatta", { country: "AU", countries }); // the hint: read as Australian
validateAddress("1 Main St, Sydney VIC 2000", { countries }).warnings[0].message;
// 'Postcode 2000 belongs to NSW, not VIC'
```

With no hint, an address is Australian when it ends with a state and an Australian postcode (or `Australia`; after
`WA` the postcode must be Western Australia's, so `Seattle, WA 9810` stays American), and British when it holds a
postcode in Royal Mail's grammar near its end, or ends with the United Kingdom or a nation. A Canadian postal code is
never taken for a British one: it ends in a digit. A French address is told by its country at the end, a CEDEX, an arrondissement,
or a last line of a postcode whose number names a department and a commune (`75008 Paris`) beside a French type of voie (`rue`, `avenue`,
`chemin`), a box or a lieu-dit; a US ZIP code follows its state, so `New York, NY 10036` stays American. A German address is told
by Germany or Deutschland at its end, or a last line of a postcode and a place beside a street that ends in a German suffix
and is followed by its number (`Hauptstraße 12`, `Am Markt 5`), a Postfach or a Packstation: a French street begins with its
number, so the two never meet. Without `countries`, nothing changes. When the country is known, pass
it: the hint is the reliable path. [docs/COUNTRIES.md](docs/COUNTRIES.md) has the design, the detection rules, the
fields each country fills and where its data comes from.

### Australia

```javascript
import {
  formatAustraliaPost,
  getStatesForAustralianPostcode,
  parseAustralianAddress,
  validateAustralianAddress,
} from "@johnmorrisdotca/address-plus/au";

const address = parseAustralianAddress("Level 6, 51 Jacobson Street, Brisbane Qld 4000");
formatAustraliaPost(address).lines; // ['LEVEL 6 51 JACOBSON ST', 'BRISBANE QLD 4000']
formatAustraliaPost(parseAustralianAddress("Unit 3, 12 Smith St, Parramatta NSW 2150"), { unitStyle: "slash" }).lines;
// ['3/12 SMITH ST', 'PARRAMATTA NSW 2150']
getStatesForAustralianPostcode("2620"); // ['NSW', 'ACT']: Queanbeyan, and suburbs of Canberra
```

It reads a unit before a slash (`3/12`) or with its type (`Unit 3`, `U3`, `Shop 5`, `Suite 2.01`), a level (`Level 6`,
`L6`, `Ground Floor`), a lot (`Lot 12`), a range (`12-14`), a building's name, and the postal deliveries `PO Box`,
`GPO Box`, `Locked Bag`, `Private Bag`, `RMB`, `RSD`, `RMS`, `CMB`, `CMA`, `CPA`, `MS` and `Care PO`. Street types come
back as AS4590's abbreviations (`St`, `Pde`, `Cres`). The validator checks the postcode against Australia Post's
blocks for each state, and lets a postcode that crosses a border (from the Australian Bureau of Statistics' Postal
Areas, CC BY 4.0) pass with either state. The formatter writes Australia Post's layout: the last two lines in capitals,
the unit and level before the number.

### The United Kingdom

```javascript
import {
  formatRoyalMail,
  getNationFromUKPostcode,
  parseUKAddress,
  parseUKPostcode,
} from "@johnmorrisdotca/address-plus/gb";

formatRoyalMail(parseUKAddress("10 Downing St, London, sw1a2aa")).lines; // ['10 Downing Street', 'LONDON', 'SW1A 2AA']
parseUKPostcode("ec1a1bb"); // { postcode: 'EC1A 1BB', outward: 'EC1A', inward: '1BB', area: 'EC', district: 'EC1A', ... }
getNationFromUKPostcode("CH5 1AA"); // 'WLS': CH5 is in Wales, though most of CH is in England
parseUKAddress("12 Bath Street, St Helier JE2 4ST").country; // 'JE': Jersey uses Royal Mail's postcodes but is not the UK
```

It reads the parts of Royal Mail's Postcode Address File: a flat (`Flat 2`, Glasgow's `Flat 2/1`) or a named part of
a building (`Basement Flat`), a floor, the building's name, the number, a dependent thoroughfare, the thoroughfare (its
descriptor in full, `Street` for `St`), the dependent localities, the post town, a county and the postcode, wherever it
is written; `BFPO 105` and `GIR 0AA` too. The validator checks the postcode's grammar (the letters each place allows),
its area, and in Great Britain its district against Ordnance Survey's Code-Point Open (OGL v3; contains Royal Mail data
© Royal Mail copyright and database right 2026). Northern Ireland's districts are not in the open data, so a BT postcode
is checked to its area only.

### France

```javascript
import {
  formatLaPoste,
  getDepartmentFromFrenchPostcode,
  parseFrenchAddress,
  parseFrenchPostcode,
  validateFrenchAddress,
} from "@johnmorrisdotca/address-plus/fr";

const address = parseFrenchAddress("Chez Mme Martin, Apt 5, 2e étage, 15 bis rue d'Aboukir, Les Granges, BP 12, 69003 Lyon 3e");
formatLaPoste(address).lines;
// ['CHEZ MME MARTIN', 'APPARTEMENT 5 ETAGE 2', '15 BIS RUE D ABOUKIR', 'LES GRANGES', 'BP 12', '69003 LYON']
getDepartmentFromFrenchPostcode("20200"); // '2B': Corsica's 20 is split between 2A and 2B at 20200
parseFrenchPostcode("98714"); // { postcode: '98714', place: '987', country: 'PF', known: true }
validateFrenchAddress(parseFrenchAddress("12 rue de la Paix, 75099 Paris")).warnings[0].message;
// "Postcode 75099 is not in La Poste's base officielle"
```

It reads the lines of La Poste's layout: who the address is care of (`Chez`), an apartment or a door (`Appartement 12`,
`Apt 12`, `Porte 3`, `Bureau 21`), a floor (`3e étage`, `Rez-de-chaussée`), a staircase, an entrance, the building, the
residence or the zone (`Résidence Les Lilas`, `Bât. A`, `Zone industrielle Nord`), the number with its extension
(`12 bis`, `12 B`, `12-14`), the type of voie (first, as French has it: `rue`, `av.`, `bd`, `chemin`, `impasse`,
`rond-point`, and thirty more, in full in `type`) and its name, a lieu-dit, a box (`BP 12`, `CS 30001`, `TSA 90001`),
and the line of the postcode, the commune and its CEDEX or arrondissement (`75008 PARIS CEDEX 08`, `Lyon 3e`); `F-75008`
too. The overseas departments (971 to 976) read as France with their three-digit code in `state`; Monaco and the overseas
collectivities (Saint-Pierre-et-Miquelon, Saint-Barthélemy, Saint-Martin, Wallis-et-Futuna, French Polynesia, New
Caledonia) are La Poste's too and read with their own country codes. The validator checks the postcode against the 6,328
in La Poste's base officielle (Licence Ouverte 2.0), which names its department; it skips that check for an address with
a CEDEX, whose code the base does not list. The formatter writes La Poste's lines in capitals without accents or
punctuation (`keepAccents: true` keeps the accents). The 101 departments and their regions are INSEE's (Licence Ouverte
2.0). No commune name or street name of France is in the package: the commune beside a postcode is not checked against
it, and a street is whatever follows the type of voie.

### Germany

```javascript
import {
  formatDeutschePost,
  getStateFromGermanPostcode,
  parseGermanAddress,
  validateGermanAddress,
} from "@johnmorrisdotca/address-plus/de";

const address = parseGermanAddress("c/o Weber, Wohnung 12, 2. OG links, Straße des 17. Juni 5, 10623 Berlin");
formatDeutschePost(address).lines;
// ['c/o Weber', 'Wohnung 12', '2. OG', 'Straße des 17. Juni 5', '10623 Berlin']
getStateFromGermanPostcode("80331"); // 'BY': Bavaria
validateGermanAddress(parseGermanAddress("Hauptstraße 12, 00000 Berlin")).warnings[0].message;
// "Postcode 00000 is not in GeoNames' list for Germany"
```

It reads the lines of a German address: who it is care of (`c/o`, `z. Hd.`, `bei`), a part of the building (`Hinterhaus`,
`Haus B`, a firm's name), a flat (`Wohnung 12`, `Whg. 3b`), a floor (`2. OG`, `EG`, `3. Etage`, with its side), the street
and its house number after it (`Hauptstraße 12a`, `Berliner Str. 7-9`, `Am Markt 5`, `Platz der Republik 1`; the whole name
as written in `street`, since a German street's type is part of its name), a Postfach (`Postfach 12 34 56`) or a Packstation,
and the line of the postcode and the place (`D-10115 Berlin`, `Halle (Saale)`, `Leipzig OT Gohlis`). The postcode names the
Land in `state`. The validator checks the postcode against the 10,813 in GeoNames' list for Germany (Creative Commons
Attribution 4.0), which is not Deutsche Post's directory and not current to the day, so a postcode it does not list is
a warning. The formatter writes Deutsche Post's lines with no punctuation at the end of one, and a Postfach's number in pairs.
The sixteen Länder are kuni's, with their Japanese names. No place name or street name of Germany is in the package.

The corpora (`test-data/corpus/au/`, 266 cases, `test-data/corpus/de/`, 151, `test-data/corpus/fr/`, 196, and
`test-data/corpus/gb/`, 190, with libpostal's British, French and German fixtures written again as original addresses) are described in
[docs/TEST_COVERAGE.md](docs/TEST_COVERAGE.md).

## Batch Processing

Process multiple addresses efficiently with built-in batch functions:

### Simple Batch Functions

```javascript
import { parseLocations, parseAddresses, parseIntersections } from "@johnmorrisdotca/address-plus";

// Process multiple addresses (returns array of results)
const addresses = [
  "123 Main St, New York, NY 10001",
  "456 Oak Ave, Los Angeles, CA 90210",
  "789 Pine Rd, Chicago, IL 60601",
];

const results = parseLocations(addresses);
// [
//   { number: '123', street: 'Main', city: 'New York', ... },
//   { number: '456', street: 'Oak', city: 'Los Angeles', ... },
//   { number: '789', street: 'Pine', city: 'Chicago', ... }
// ]

// Process intersections
const intersections = ["Main St & Broadway, New York, NY", "5th Street and Park Ave, San Francisco, CA"];
const intersectionResults = parseIntersections(intersections);
```

### Advanced Batch Functions (with Statistics)

```javascript
import { parseLocationsBatch, parseAddressesBatch } from "@johnmorrisdotca/address-plus";

const addresses = [
  "123 Main St, New York, NY 10001",
  "", // Invalid address
  "456 Oak Ave, Los Angeles, CA 90210",
];

const result = parseLocationsBatch(addresses);

console.log(result.results);
// [
//   { number: '123', street: 'Main', ... },
//   null,  // Failed to parse
//   { number: '456', street: 'Oak', ... }
// ]

console.log(result.stats);
// {
//   total: 3,
//   successful: 2,
//   failed: 1,
//   duration: 15,           // milliseconds
//   averagePerAddress: 5,   // ms per address
//   addressesPerSecond: 200
// }

console.log(result.errors);
// [
//   {
//     index: 1,
//     error: 'Address parsing returned null - invalid or unparseable format',
//     input: ''
//   }
// ]
```

### Batch Options

```javascript
// Stop processing on first error
const result = parseLocationsBatch(addresses, {
  stopOnError: true,
});

// Pass parsing options to underlying parsers
const result = parseLocationsBatch(addresses, {
  strict: true, // Enable strict ZIP validation
  country: "CA", // Force Canadian parsing
});
```

### Available Batch Functions

| Function                                           | Input Type | Output Type                            | Description              |
| -------------------------------------------------- | ---------- | -------------------------------------- | ------------------------ |
| `parseLocations(addresses)`                        | `string[]` | `ParsedAddress[]`                      | Simple array processing  |
| `parseAddresses(addresses)`                        | `string[]` | `ParsedAddress[]`                      | Alias for parseLocations |
| `parseInformalAddresses(addresses)`                | `string[]` | `ParsedAddress[]`                      | Process informal formats |
| `parseIntersections(addresses)`                    | `string[]` | `ParsedIntersection[]`                 | Process intersections    |
| `parseLocationsBatch(addresses, options?)`         | `string[]` | `BatchParseResult<ParsedAddress>`      | With statistics          |
| `parseAddressesBatch(addresses, options?)`         | `string[]` | `BatchParseResult<ParsedAddress>`      | With statistics          |
| `parseInformalAddressesBatch(addresses, options?)` | `string[]` | `BatchParseResult<ParsedAddress>`      | With statistics          |
| `parseIntersectionsBatch(addresses, options?)`     | `string[]` | `BatchParseResult<ParsedIntersection>` | With statistics          |

### BatchParseResult Type

```typescript
interface BatchParseResult<T> {
  results: (T | null)[]; // Array of parsed results (null for failures)
  errors: BatchParseError[]; // Array of error details
  stats: BatchParseStats; // Performance and count statistics
}

interface BatchParseError {
  index: number; // Index of failed address in input array
  error: string; // Error description
  input: string; // Original input that failed
}

interface BatchParseStats {
  total: number; // Total addresses processed
  successful: number; // Successfully parsed addresses
  failed: number; // Failed addresses
  duration: number; // Total processing time (ms)
  averagePerAddress: number; // Average time per address (ms)
  addressesPerSecond: number; // Processing rate
}
```

### Performance Benefits

Batch processing provides several advantages over individual parsing:

- **Reduced function call overhead**: Single function call for multiple addresses
- **Optimized pattern compilation**: Regex patterns compiled once
- **Better memory allocation**: Efficient array handling
- **Built-in error tracking**: Automatic error collection and reporting
- **Performance metrics**: Built-in timing and statistics

## Quality Assurance

- **Comprehensive test suite**: Vitest runs every parsing scenario from JSON test data, for the US, Canada and each other country
- **Multi-format support**: Extensive test coverage for US, Canadian and Japanese addresses, including every Japanese prefecture and municipality and 1,000 generated Japanese records from REST in Pieces
- **Address corpora**: 3,526 cases from USPS Publication 28, Canada Post's guidelines, Australia Post's, La Poste's, Deutsche Post's and Royal Mail's rules, libpostal, parse-address's shapes and Geolonia's Japanese test addresses, with every case still wrong listed and explained in [docs/TEST_COVERAGE.md](docs/TEST_COVERAGE.md)
- **Documented examples that run**: every export's TSDoc example is run against the built package by `pnpm docs:check`
- **Edge case testing**: Validation of complex parsing scenarios and error conditions
- **Type tests**: `tsd` checks the published type definitions
- **Package check**: `pnpm test:package` packs the built package, installs it in a clean project, and proves that `require`, `import` and the types work for each entry point
- **Real-world data validation**: Tests based on actual address formats and variations

## Performance

- **One small dependency**: `fast-levenshtein`, for fuzzy state and province names; hikidashi is bundled in
- **Size**: the whole library, minified for the browser with every table (US, Canada, and Japan's 1,894 municipalities and its postal prefixes), is about 600 KB, 107 KB gzipped; the `/jp` entry point and tree-shaking take what a caller does not use. `/au` is 16 KB (7 KB gzipped), `/de` 26 KB (12 KB gzipped), `/fr` 28 KB (9 KB gzipped) and `/gb` 20 KB (9 KB gzipped), and none is in the main entry point
- **Fast**: Regex-based parsing optimized for performance
- **Memory efficient**: Minimal object allocation

## Browser Support

The build targets ES2022, so it runs in any current browser with ES2022 support (Chrome 94, Firefox 93,
Safari 15, Edge 94 or newer) and in Node.js 24 or newer.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

### Development

The project needs Node.js 24 (see `.nvmrc`) and pnpm 10.

```bash
pnpm install
pnpm check     # lint, typecheck, test, build, type tests, schema validation, package check
pnpm test      # the Vitest suite alone
pnpm lint:fix  # ESLint and Prettier, fixing what they can
```

`pnpm release <version>` cuts a release: it moves the changelog's `Unreleased` entries under the new version, commits, and tags it. Pushing the tag publishes it. `AGENTS.md` describes the whole procedure.

## Related Projects

- [REST in Pieces](https://github.com/spxis/rest-in-pieces) - A fake-data REST service that uses address-plus to write invented addresses in seven countries, each in its post's own format with a postcode that exists in the right region, and to validate and format addresses sent to it
- [parse-address](https://github.com/scaleway/parse-address) - Original inspiration and API compatibility target

## The family

<!-- family:start (made by scripts/family-readme.mjs from scripts/family-template.mjs; change those, not this) -->
address-plus is one of twenty-eight packages, each made for the same site, each at
[github.com/johnmorrisdotca](https://github.com/johnmorrisdotca) or [github.com/spxis](https://github.com/spxis). The code of every one is MIT.

**Games — board**

- [Domino](https://github.com/johnmorrisdotca/domino) (ドミノ): dominoes and Mexican Train. [Demo](https://johnmorrisdotca.github.io/domino/).
- [Gunjin](https://github.com/johnmorrisdotca/gunjin) (軍人): five hidden-rank strategy games with pass-the-device play. [Demo](https://johnmorrisdotca.github.io/gunjin/).
- [Narabe](https://github.com/johnmorrisdotca/narabe) (並べ): one rules engine for abstract board games, from gomoku and Reversi to Go and checkers. [Demo](https://johnmorrisdotca.github.io/narabe/).
- [Sugoroku](https://github.com/johnmorrisdotca/sugoroku) (双六): backgammon and its variants, with the doubling cube and match play. [Demo](https://johnmorrisdotca.github.io/sugoroku/).
- [Tenka](https://github.com/johnmorrisdotca/tenka) (天下): world conquest for two to six, on a map of the real world. [Demo](https://johnmorrisdotca.github.io/tenka/).

**Games — cards & tiles**

- [Hitotsu](https://github.com/johnmorrisdotca/hitotsu) (一つ): a colour-card shedding game for two to eight, with the house rules people play. [Demo](https://johnmorrisdotca.github.io/hitotsu/).
- [Jarajara](https://github.com/johnmorrisdotca/jarajara) (ジャラジャラ): mahjong tiles drawn as SVG, stacked layouts, and the matching solitaire Awase. [Demo](https://johnmorrisdotca.github.io/jarajara/).
- [Kumimoji](https://github.com/johnmorrisdotca/kumimoji) (組み文字): a crossword tile race, in English and Japanese kana. [Demo](https://johnmorrisdotca.github.io/kumimoji/).
- [Toranpu](https://github.com/johnmorrisdotca/toranpu) (トランプ): a deck of playing cards, card games with computer players, and solitaires. [Demo](https://johnmorrisdotca.github.io/toranpu/).

**Games — puzzles**

- [Houseki](https://github.com/johnmorrisdotca/houseki) (宝石): gem and stone matching puzzles: falling triplets, stone collapse, colour chains and gem swap. [Demo](https://johnmorrisdotca.github.io/houseki/).
- [Jirai](https://github.com/johnmorrisdotca/jirai) (地雷): minesweeper on shaped grids with verified no-guess boards. [Demo](https://johnmorrisdotca.github.io/jirai/).
- [Karakuri](https://github.com/johnmorrisdotca/karakuri) (からくり): eight hyper-casual puzzle games, some of them physics: draw a shield, pull pins, cut ropes, slide blocks, pour tubes. [Demo](https://johnmorrisdotca.github.io/karakuri/).
- [Kazu](https://github.com/johnmorrisdotca/kazu) (数): grid number puzzles: Sudoku and its variants, Futoshiki and Skyscrapers. [Demo](https://johnmorrisdotca.github.io/kazu/).
- [Kyuubu](https://github.com/johnmorrisdotca/kyuubu) (キューブ): a turning cube for the browser, 2×2 to 7×7, with record solves to replay. [Demo](https://johnmorrisdotca.github.io/kyuubu/).
- [Meikyuu](https://github.com/johnmorrisdotca/meikyuu) (迷宮): mazes on squares, hexagons, triangles and circles, made from a seed and drawn through with a finger or the mouse. [Demo](https://johnmorrisdotca.github.io/meikyuu/).
- [Suido](https://github.com/johnmorrisdotca/suido) (水道): a pipe puzzle: turn the pieces until the water reaches every drain. [Demo](https://johnmorrisdotca.github.io/suido/).
- [Tobiishi](https://github.com/johnmorrisdotca/tobiishi) (飛び石): peg solitaire with nine boards and seeded solvable challenges. [Demo](https://johnmorrisdotca.github.io/tobiishi/).
- [Tsunagi](https://github.com/johnmorrisdotca/tsunagi) (繋ぎ): a line-joining logic puzzle whose every level has exactly one answer. [Demo](https://johnmorrisdotca.github.io/tsunagi/).

**Games — dice & random**

- [Korokoro](https://github.com/johnmorrisdotca/korokoro) (コロコロ): dice, with notation, exact odds, real sounds and the dice of many games. [Demo](https://johnmorrisdotca.github.io/korokoro/).
- [Tane](https://github.com/johnmorrisdotca/tane) (種): seeded random numbers and daily seeds, the same in every browser and on every server. [Demo](https://johnmorrisdotca.github.io/tane/).

**Language**

- [Bushu](https://github.com/johnmorrisdotca/bushu) (部首): find a kanji by the parts it is made of. [Demo](https://johnmorrisdotca.github.io/bushu/).
- [Hikidashi](https://github.com/johnmorrisdotca/hikidashi) (引き出し): a drawer of small Japanese text tools: era dates, kanji numerals, readings and sentence difficulty. [Demo](https://johnmorrisdotca.github.io/hikidashi/).
- [Kotoba](https://github.com/johnmorrisdotca/kotoba) (言葉): word lists and word-game rules in English, French, German and Japanese. [Demo](https://johnmorrisdotca.github.io/kotoba/).

**Geography & data**

- [address-plus](https://github.com/johnmorrisdotca/address-plus) (アドレスプラス): parse and format addresses in the United States, Canada, Japan, Australia, France, Germany and the United Kingdom. [Demo](https://johnmorrisdotca.github.io/address-plus/).
- [Chizu](https://github.com/johnmorrisdotca/chizu) (地図): maps of the world and of countries' regions, in English and Japanese, with a quiz and callouts. [Demo](https://johnmorrisdotca.github.io/chizu/).
- [Hata](https://github.com/johnmorrisdotca/hata) (旗): country and regional flags as SVG, at their true proportions and keyed by ISO code. [Demo](https://johnmorrisdotca.github.io/hata/).
- [Kuni](https://github.com/johnmorrisdotca/kuni) (国): countries and their regions, with ISO codes and names in English and Japanese. [Demo](https://johnmorrisdotca.github.io/kuni/).

**Developer tools**

- [REST in Pieces](https://github.com/spxis/rest-in-pieces) (レスト・イン・ピーシーズ): seeded test data and REST APIs for frontend development, with latency and error drills. [Demo](https://spxis.github.io/rest-in-pieces/).


**This package is address-plus.** The demos of all twenty-eight share one header and footer, so each links the rest.
<!-- family:end -->
