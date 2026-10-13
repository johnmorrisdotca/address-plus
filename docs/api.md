# API reference

Every export of every entry point of @johnmorrisdotca/address-plus 1.6.0, with its signature, its TSDoc (what it does, each parameter, what it returns) and one example with the answer it gives. Made from the source by `pnpm docs:make`, and `pnpm docs:legacy-check` holds every example's answer to the built package; the demo API anchor index at https://johnmorrisdotca.github.io/address-plus/api.html links to the individual documentation pages. Editors show the same TSDoc on hover, from the published type definitions.

## @johnmorrisdotca/address-plus

### AddressAbbreviations

type

```ts
interface AddressAbbreviations {
  streetTypes: Record<string, string>; // Street type abbreviation mappings
  directions: Record<string, string>; // Directional abbreviation mappings
  states: Record<string, string>; // State abbreviation mappings
  provinces: Record<string, string>; // Province abbreviation mappings
  unitTypes: Record<string, string>; // Unit type abbreviation mappings
}
```

What `getAddressAbbreviations` returns: one map per kind of abbreviation.

```js
import { getAddressAbbreviations } from "@johnmorrisdotca/address-plus";
import type { AddressAbbreviations } from "@johnmorrisdotca/address-plus";

console.log(Object.keys(getAddressAbbreviations()));
// ["streetTypes","directions","states","provinces","unitTypes"]
```

### AddressComparisonOptions

type

```ts
interface AddressComparisonOptions {
  ignoreCase?: boolean; // Whether to ignore case when comparing text
  ignorePunctuation?: boolean; // Whether to ignore punctuation marks
  normalizeStreetTypes?: boolean; // Whether to normalize street type abbreviations
  normalizeDirections?: boolean; // Whether to normalize directional abbreviations
  normalizeStates?: boolean; // Whether to normalize state/province names
  fuzzyMatching?: boolean; // Whether to use fuzzy string matching
  strictPostalCode?: boolean; // Whether postal codes must match exactly
  requireExactMatch?: boolean; // Whether all fields must match exactly
}
```

Options for comparing addresses: what to normalize before comparing, whether to allow small typos, and whether every field must match exactly.

```js
import { isSameAddress, parseLocation } from "@johnmorrisdotca/address-plus";
import type { AddressComparisonOptions } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parseLocation("123 Main St, Anytown, NY 12345");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseLocation("123 Main Stret, Anytown, NY 12345");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(isSameAddress(parsedAddress1, parsedAddress2, { fuzzyMatching: false }));
// false
```

### AddressComparisonResult

type

```ts
interface AddressComparisonResult {
  isSame: boolean; // Whether addresses are considered the same
  matchType: AddressMatchType; // Type of match found
  similarity: AddressSimilarityResult; // Detailed similarity analysis
  normalizedAddress1: ParsedAddress; // First address after normalization
  normalizedAddress2: ParsedAddress; // Second address after normalization
}
```

What `compareAddresses` returns: the verdict, the match type and the similarity.

```js
import { compareAddresses, parseLocation } from "@johnmorrisdotca/address-plus";
import type { AddressComparisonResult } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parseLocation("123 Main St, Anytown, NY 12345");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseLocation("123 Main Street, Anytown, NY 12345");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(compareAddresses(parsedAddress1, parsedAddress2).isSame);
// true
```

### AddressComparisonTestCase

type

```ts
interface AddressComparisonTestCase extends TestCaseBase {
  input: {
    address1: string;
    address2: string;
  }; // Two addresses to compare
  expected: {
    isSame?: boolean;
    similarity?: number;
    differences?: string[];
    [key: string]: unknown;
  }; // Expected comparison results
}
```

A comparison case in the package's JSON test files: two addresses and the match expected.

```js
import type { AddressComparisonTestCase } from "@johnmorrisdotca/address-plus";

console.log(({ input: ["123 Main St", "123 Main Street"], expected: { isSame: true } }).expected.isSame);
// true
```

### AddressDifference

type

```ts
interface AddressDifference {
  field: keyof ParsedAddress; // Which address field differs
  value1: string | undefined; // Value from first address
  value2: string | undefined; // Value from second address
  type: "missing" | "different" | "similar" | "typo"; // Type of difference
  confidence: number; // Confidence in the difference assessment
}
```

One part on which two addresses differ, with both values and the kind of difference.

```js
import { getAddressSimilarity, parseLocation } from "@johnmorrisdotca/address-plus";
import type { AddressDifference } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parseLocation("123 Main St, Anytown, NY 12345");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseLocation("125 Main St, Anytown, NY 12345");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(getAddressSimilarity(parsedAddress1, parsedAddress2).differences[0]);
// {"field":"number","value1":"123","value2":"125","type":"typo","confidence":0.6}
```

### AddressFormattingOptions

type

```ts
interface AddressFormattingOptions {
  includeCountry?: boolean; // Whether to include country in formatted address
  includeSecondaryUnit?: boolean; // Whether to include unit/suite information
  upperCase?: boolean; // Whether to format in uppercase
  separator?: string; // Line separator for multi-line formatting
  abbreviateStreetTypes?: boolean; // Whether to abbreviate street types (Street -> St)
  abbreviateDirections?: boolean; // Whether to abbreviate directions (North -> N)
  abbreviateStates?: boolean; // Whether to abbreviate state/province names
  usePlusCode?: boolean; // Whether to include Plus Code in formatting
}
```

Options for `formatAddress` and `cleanAddress`: what to abbreviate, capitals, the unit, the country and the line separator.

```js
import { formatAddress, parseLocation } from "@johnmorrisdotca/address-plus";
import type { AddressFormattingOptions } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parseLocation("123 Main Street, Anytown, NY 12345");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatAddress(parsedAddress1, { upperCase: true }).singleLine);
// "123 MAIN ST, ANYTOWN NY 12345"
```

### AddressFormattingTestCase

type

```ts
interface AddressFormattingTestCase extends TestCaseBase {
  input: string; // Input address to format
  expected: string; // Expected formatted address string
  options?: {
    format?: string;
    abbreviate?: boolean;
    [key: string]: unknown;
  }; // Optional formatting configuration
}
```

A formatting case in the package's JSON test files: an address and the text expected.

```js
import type { AddressFormattingTestCase } from "@johnmorrisdotca/address-plus";

console.log(({ input: "123 main st", expected: "123 Main St" }).expected);
// "123 Main St"
```

### AddressMatchType

type

```ts
type AddressMatchType = "exact" | "strong" | "moderate" | "weak" | "none";
```

How strongly two addresses match, from `exact` to `none`.

```js
import { compareAddresses, parseLocation } from "@johnmorrisdotca/address-plus";
import type { AddressMatchType } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parseLocation("123 Main St, Anytown, NY 12345");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseLocation("456 Oak Ave, Portland, OR 97201");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(compareAddresses(parsedAddress1, parsedAddress2).matchType);
// "none"
```

### AddressParser

type

```ts
interface AddressParser {
  parseAddress(address: string, options?: ParseOptions): ParsedAddress | null;
  parseInformalAddress(address: string, options?: ParseOptions): ParsedAddress | null;
  parseIntersection(address: string, options?: ParseOptions): ParsedIntersection | null;
  parseLocation(address: string, options?: ParseOptions): ParsedAddress | null;
}
```

The shape of the default export: the four parsers parse-address's users call on one object.

```js
import parser from "@johnmorrisdotca/address-plus";
import type { AddressParser } from "@johnmorrisdotca/address-plus";

console.log(Object.keys(parser));
// ["parseLocation","parseIntersection","parseInformalAddress","parseAddress"]
```

### AddressParsingTestCase

type

```ts
interface AddressParsingTestCase extends TestCaseBase {
  input: string; // Input address string to parse
  expected: {
    number?: string;
    prefix?: string;
    street?: string;
    type?: string;
    suffix?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    [key: string]: unknown;
  }; // Expected parsed address components
  options?: {
    strict?: boolean;
    country?: string;
    [key: string]: unknown;
  }; // Optional parsing configuration
}
```

A parsing case in the package's JSON test files: an address and the fields expected from it.

```js
import type { AddressParsingTestCase } from "@johnmorrisdotca/address-plus";

console.log(({ input: "123 Main St, Anytown, NY 12345", expected: { number: "123", state: "NY" } }).expected.state);
// "NY"
```

### AddressSimilarityResult

type

```ts
interface AddressSimilarityResult {
  score: number; // 0-1 similarity score
  isMatch: boolean; // Whether addresses are considered a match
  confidence: number; // 0-1 confidence in the match
  details: {
    streetScore: number; // Street name similarity score
    cityScore: number; // City name similarity score
    stateScore: number; // State/province similarity score
    postalScore: number; // Postal code similarity score
    overallScore: number; // Combined overall similarity score
  };
  differences: AddressDifference[];
  suggestions?: string[];
}
```

How alike two addresses are: an overall score from 0 to 1, a score for each part, and the differences.

```js
import { getAddressSimilarity, parseLocation } from "@johnmorrisdotca/address-plus";
import type { AddressSimilarityResult } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parseLocation("123 Main St, Anytown, NY 12345");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseLocation("123 Main Street, Anytown, NY 12345");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(getAddressSimilarity(parsedAddress1, parsedAddress2).score);
// 1
```

### AddressValidationResult

type

```ts
interface AddressValidationResult {
  isValid: boolean; // Whether the address passed validation
  confidence: number; // 0-1 score indicating parsing confidence
  completeness: number; // 0-1 score indicating how complete the address is
  errors: ValidationError[]; // List of validation errors found
  warnings: ValidationError[]; // List of validation warnings
  suggestions: string[]; // Suggestions for improving the address
  parsedAddress: import("./parsed-address").ParsedAddress | null; // Parsed address result or null if parsing failed
}
```

What `validateAddress` returns.

```js
import { validateAddress } from "@johnmorrisdotca/address-plus";
import type { AddressValidationResult } from "@johnmorrisdotca/address-plus";

console.log(validateAddress("1600 Pennsylvania Ave NW, Washington, DC 20500").isValid);
// true
```

### AddressValidationTestCase

type

```ts
interface AddressValidationTestCase extends TestCaseBase {
  input: string; // Input address string to validate
  expected: {
    isValid: boolean;
    confidence?: number;
    completeness?: number;
    errors?: string[];
    warnings?: string[];
    [key: string]: unknown;
  }; // Expected validation results
}
```

A validation case in the package's JSON test files: an address and the verdict and codes expected.

```js
import type { AddressValidationTestCase } from "@johnmorrisdotca/address-plus";

console.log(({ input: "123 Main St", expected: { isValid: false } }).expected.isValid);
// false
```

### AustralianAddressFields

type

```ts
interface AustralianAddressFields {
  floorType?: string; // A level or floor: Level, Floor, Ground Floor, Lower Ground Floor, Upper Ground Floor, Basement, Mezzanine
  lot?: string; // A lot number where a street number is not yet given: the 12 in "Lot 12 Smith Rd"
}
```

The fields an Australian address fills beside the shared ones. The shared fields keep their meaning: `number` is the street number, `street` and `type` the street's name and its type (Australia Post's abbreviation, `St`, `Pde`, `Cres`), `secUnitType` and `secUnitNum` the unit (`Unit 3`) or the postal delivery (`PO Box 37`, `Locked Bag 801`), `city` the suburb or town, `state` the state's code and `zip` the postcode.

```js
import { parseAustralianAddress } from "@johnmorrisdotca/address-plus/au";
import type { AustralianAddressFields } from "@johnmorrisdotca/address-plus/au";

console.log(parseAustralianAddress("Level 6, 51 Jacobson St, Brisbane QLD 4000")?.floorType);
// "Level"
```

### AustralianPostcodeRange

type

```ts
interface AustralianPostcodeRange {
  state: AustralianStateCode;
  from: string; // First postcode of the block: "2000"
  to: string; // Last postcode of the block: "2599"
  use: "delivery" | "po-box"; // Street delivery, or PO boxes and large-volume receivers (NSW 1000 to 1999, VIC 8000 to 8999, QLD 9000 to 9999)
}
```

One block of postcodes Australia Post allocates to a state or territory: every postcode from `from` to `to`, inclusive, written as four digits.

```js
import { AU_POSTCODE_RANGES } from "@johnmorrisdotca/address-plus/au";
import type { AustralianPostcodeRange } from "@johnmorrisdotca/address-plus/au";

console.log(AU_POSTCODE_RANGES.find((range) => range.state === "TAS"));
// {"state":"TAS","from":"7000","to":"7999","use":"delivery"}
```

### AustralianState

type

```ts
interface AustralianState {
  code: AustralianStateCode; // The code on an envelope: VIC
  iso: string; // ISO 3166-2: AU-VIC
  name: string; // English: Victoria
  nameJa: string; // Japanese: ビクトリア州
  kind: "state" | "territory"; // The ACT and the NT are territories
}
```

An Australian state or territory in the tables: Australia Post's code, the ISO 3166-2 code, and its name in English and in Japanese (from kuni, which takes them from Unicode CLDR and Wikidata).

```js
import { findAustralianState } from "@johnmorrisdotca/address-plus/au";
import type { AustralianState } from "@johnmorrisdotca/address-plus/au";

console.log(findAustralianState("Victoria"));
// {"code":"VIC","iso":"AU-VIC","name":"Victoria","nameJa":"ビクトリア州","kind":"state"}
```

### AustralianStateCode

type

```ts
type AustralianStateCode = "ACT" | "NSW" | "NT" | "QLD" | "SA" | "TAS" | "VIC" | "WA";
```

The code of an Australian state or territory, as Australia Post writes it on the last line of an address.

```js
import { getStateFromAustralianPostcode } from "@johnmorrisdotca/address-plus/au";
import type { AustralianStateCode } from "@johnmorrisdotca/address-plus/au";

console.log(getStateFromAustralianPostcode("3000"));
// "VIC"
```

### BatchParseError

type

```ts
interface BatchParseError {
  index: number; // Index of the failed address in the input array
  error: string; // Error message describing what went wrong
  input: string; // Original input that failed to parse
}
```

One address a batch could not parse: its index, the input and the reason.

```js
import { parseLocationsBatch } from "@johnmorrisdotca/address-plus";
import type { BatchParseError } from "@johnmorrisdotca/address-plus";

console.log(parseLocationsBatch([""]).errors[0].index);
// 0
```

### BatchParseOptions

type

```ts
interface BatchParseOptions extends ParseOptions {
  stopOnError?: boolean; // Whether to stop processing on first error (default: false)
  parallel?: boolean; // Process addresses in parallel where possible (default: false)
  chunkSize?: number; // Size of chunks for parallel processing (default: 100)
  includeStats?: boolean; // Include performance statistics in result (default: true)
}
```

Options for the batch parsers: the parse options, plus whether to stop at the first error and whether to include the statistics.

```js
import { parseLocationsBatch } from "@johnmorrisdotca/address-plus";
import type { BatchParseOptions } from "@johnmorrisdotca/address-plus";

console.log(parseLocationsBatch(["123 Main St, Anytown, NY 12345"], { country: "US" }).stats.total);
// 1
```

### BatchParseResult

type

```ts
interface BatchParseResult<T = ParsedAddress | ParsedIntersection> {
  results: (T | null)[]; // Array of parsed results (null for failed parses)
  errors: BatchParseError[]; // Array of errors that occurred during parsing
  stats: BatchParseStats; // Performance and processing statistics
}
```

What a batch parser returns: the results in order, the errors and the statistics.

```js
import { parseLocationsBatch } from "@johnmorrisdotca/address-plus";
import type { BatchParseResult } from "@johnmorrisdotca/address-plus";

console.log(parseLocationsBatch(["123 Main St, Anytown, NY 12345"]).results.length);
// 1
```

### BatchParseStats

type

```ts
interface BatchParseStats {
  total: number; // Total number of addresses processed
  successful: number; // Number of successfully parsed addresses
  failed: number; // Number of failed parsing attempts
  duration: number; // Total processing time in milliseconds
  averagePerAddress: number; // Average processing time per address in milliseconds
  addressesPerSecond: number; // Addresses processed per second
}
```

The counts and timing of a batch: how many were parsed, how many failed, and how long it took.

```js
import { parseLocationsBatch } from "@johnmorrisdotca/address-plus";
import type { BatchParseStats } from "@johnmorrisdotca/address-plus";

console.log(parseLocationsBatch(["123 Main St, Anytown, NY 12345", ""]).stats.failed);
// 1
```

### BatchProcessingTestCase

type

```ts
interface BatchProcessingTestCase extends TestCaseBase {
  input: string[]; // Array of input addresses
  expected: {
    results?: unknown[];
    statistics?: {
      total: number;
      successful: number;
      failed: number;
    };
    errors?: Array<{
      index: number;
      error: string;
    }>;
    [key: string]: unknown;
  }; // Expected batch processing results
}
```

A batch case in the package's JSON test files: several addresses and the counts expected.

```js
import type { BatchProcessingTestCase } from "@johnmorrisdotca/address-plus";

console.log(({ input: ["123 Main St"], expected: { successful: 1 } }).expected.successful);
// 1
```

### buildRegexFromDict

function

```ts
buildRegexFromDict(dict: Record<string, string>, capture?: boolean): RegExp
```

A regular expression matching any key of a dictionary as a whole word, longest first. Words match in any alphabet, so `québec` is found at the start of a string and `al` is not found inside `Montréal`.

- `dict`: The dictionary whose keys are matched.
- `capture`: Whether to wrap the alternatives in a capturing group; default `true`.
- Returns: The expression, case-insensitive.

```js
import { buildRegexFromDict } from "@johnmorrisdotca/address-plus";

console.log(buildRegexFromDict({ street: "St", avenue: "Ave" }).test("avenue"));
// true
```

### CA_PROVINCE_ALTERNATIVES

const

```ts
CA_PROVINCE_ALTERNATIVES: Record<string, string>
```

Other ways Canadian provinces are written (old and informal abbreviations such as `PQ`, `Que.`, `Nfld.`), in lower case, to their codes.

```js
import { CA_PROVINCE_ALTERNATIVES } from "@johnmorrisdotca/address-plus";

console.log(CA_PROVINCE_ALTERNATIVES["pq"]);
// "QC"
```

### CA_PROVINCE_NAMES

const

```ts
CA_PROVINCE_NAMES: Record<string, string>
```

Every Canadian province and territory by its English or French name, to its code.

```js
import { CA_PROVINCE_NAMES } from "@johnmorrisdotca/address-plus";

console.log(CA_PROVINCE_NAMES["québec"]);
// "QC"
```

### CA_PROVINCE_NAMES_EN

const

```ts
CA_PROVINCE_NAMES_EN: Record<string, string>
```

Every Canadian province and territory by its English name in lower case, to its two-letter code.

```js
import { CA_PROVINCE_NAMES_EN } from "@johnmorrisdotca/address-plus";

console.log(CA_PROVINCE_NAMES_EN["british columbia"]);
// "BC"
```

### CA_PROVINCE_NAMES_FR

const

```ts
CA_PROVINCE_NAMES_FR: Record<string, string>
```

Every Canadian province and territory by its French name in lower case, to its two-letter code.

```js
import { CA_PROVINCE_NAMES_FR } from "@johnmorrisdotca/address-plus";

console.log(CA_PROVINCE_NAMES_FR["colombie-britannique"]);
// "BC"
```

### CA_PROVINCES

const

```ts
CA_PROVINCES: Record<string, string>
```

Every name and other spelling of a Canadian province, to its code: the names and the alternatives together.

```js
import { CA_PROVINCES } from "@johnmorrisdotca/address-plus";

console.log(CA_PROVINCES["nfld"]);
// "NL"
```

### CA_REGIONS

const

```ts
CA_REGIONS: Region[]
```

Every name and other spelling of a Canadian province or territory as a `Region` object, for fuzzy matching by `normalizeRegion`.

```js
import { CA_REGIONS } from "@johnmorrisdotca/address-plus";

console.log(CA_REGIONS.filter((region) => region.abbr === "QC").map((region) => region.name));
// ["quebec","québec","pq","que"]
```

### CA_STREET_TYPES

const

```ts
CA_STREET_TYPES: Record<string, string>
```

Every street type Canada Post lists, in English and French, with common spellings, in lower case, to the abbreviation the parser reports. Where USPS Publication 28 has the same word, the USPS abbreviation is used (Court is `Ct`, not Canada Post's `Crt`; see the conventions in docs/TEST_COVERAGE.md); the words Publication 28 lacks keep Canada Post's abbreviation.

```js
import { CA_STREET_TYPES } from "@johnmorrisdotca/address-plus";

console.log(CA_STREET_TYPES["croissant"]);
// "crois"
```

### CanadaPostFormattingOptions

type

```ts
interface CanadaPostFormattingOptions {
  includeDeliveryLine?: boolean; // Whether to include delivery line
  includeLastLine?: boolean; // Whether to include city/province/postal line
  bilingualLabels?: boolean; // Whether to include bilingual labels
  standardizeCase?: boolean; // Whether to standardize case per Canada Post guidelines
}
```

Options for `formatCanadaPost`: which lines to include, bilingual labels, and whether to set the letter case the Canada Post way.

```js
import { formatCanadaPost, parseLocation } from "@johnmorrisdotca/address-plus";
import type { CanadaPostFormattingOptions } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parseLocation("100 Queen St W, Toronto, ON M5H 2N2");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatCanadaPost(parsedAddress1, { includeDeliveryLine: false }).lines);
// ["TORONTO ON M5H 2N2"]
```

### CANADIAN_POSTAL_CODE_PATTERN

const

```ts
CANADIAN_POSTAL_CODE_PATTERN: RegExp
```

A Canadian postal code with the letters Canada Post assigns, with or without its space.

```js
import { CANADIAN_POSTAL_CODE_PATTERN } from "@johnmorrisdotca/address-plus";

console.log(CANADIAN_POSTAL_CODE_PATTERN.test("M5H 2N2"));
// true
```

### CANADIAN_POSTAL_LIBERAL_PATTERN

const

```ts
CANADIAN_POSTAL_LIBERAL_PATTERN: RegExp
```

A Canadian postal code of any letters, for finding one before it is checked.

```js
import { CANADIAN_POSTAL_LIBERAL_PATTERN } from "@johnmorrisdotca/address-plus";

console.log(CANADIAN_POSTAL_LIBERAL_PATTERN.test("m5h2n2"));
// true
```

### capitalizeStreetName

function

```ts
capitalizeStreetName(text: string): string
```

Capitalizes a street name the way it is signed. A word written in mixed case is kept as written (`O'Farrell`, `McKinley`, `d'Youville`); a word all in lower case or all in capitals is title-cased, except a French particle written in lower case, which stays so (`rue des Jardins`).

- `text`: The street name.
- Returns: The name capitalized.

```js
import { capitalizeStreetName } from "@johnmorrisdotca/address-plus";

console.log(capitalizeStreetName("o'brien"));
// "O'Brien"
```

### capitalizeWords

function

```ts
capitalizeWords(text: string): string
```

Capitalizes the first letter of each word.

- `text`: The text.
- Returns: The text with each word's first letter in capitals and the rest as written.

```js
import { capitalizeWords } from "@johnmorrisdotca/address-plus";

console.log(capitalizeWords("new york city"));
// "New York City"
```

### CITY_PATTERNS

const

```ts
CITY_PATTERNS: { readonly BASIC_CITY: RegExp; readonly MULTI_WORD_CITY: RegExp; readonly SINGLE_WORD_CITY: RegExp; readonly TWO_WORD_CITY: RegExp; }
```

Patterns for a city of one or more words at the end of a text, after a space, used where no comma marks it. A word is letters of any alphabet, with apostrophes and hyphens inside it.

```js
import { CITY_PATTERNS } from "@johnmorrisdotca/address-plus";

console.log(CITY_PATTERNS.SINGLE_WORD_CITY.exec("Pine St Tacoma")?.[1]);
// "Tacoma"
```

### cleanAddress

function

```ts
cleanAddress(addressString: string, options?: CleanAddressOptions): string
```

Tidies an address typed in a hurry: spaces, commas, letter case, the street type and the state, without changing what it says.

- `addressString`: The address as typed.
- `options`: What to tidy and the letter case to set (see `CleanAddressOptions`).
- Returns: The tidied address; the input, trimmed, when it cannot be parsed.

```js
import { cleanAddress } from "@johnmorrisdotca/address-plus";

console.log(cleanAddress("350 FIFTH AVENUE, NEW YORK, NY 10118"));
// "350 Fifth Ave, New York NY 10118"
```

### cleanAddressDetailed

function

```ts
cleanAddressDetailed(addressString: string, options?: CleanAddressOptions): CleanAddressResult
```

Tidies an address like `cleanAddress`, and says what it changed.

- `addressString`: The address as typed.
- `options`: What to tidy and the letter case to set (see `CleanAddressOptions`).
- Returns: The tidied address, the input, whether anything changed, and a line for each change.

```js
import { cleanAddressDetailed } from "@johnmorrisdotca/address-plus";

console.log(cleanAddressDetailed("742 evergreen terrace,springfield ,  il 62704").cleanedAddress);
// "742 Evergreen Ter, Springfield IL 62704"
```

### CleanAddressOptions

type

```ts
interface CleanAddressOptions extends AddressFormattingOptions {
  format?: "standard" | "usps" | "canada-post"; // Desired output format
  removeExtraSpaces?: boolean; // Whether to remove redundant spaces
  standardizeCase?: "upper" | "lower" | "title" | "none"; // Case standardization option
  expandAbbreviations?: boolean; // Whether to expand abbreviations to full forms
}
```

Options for `cleanAddress`: which tidying to do, and the letter case to set.

```js
import { cleanAddress } from "@johnmorrisdotca/address-plus";
import type { CleanAddressOptions } from "@johnmorrisdotca/address-plus";

console.log(cleanAddress("123 main st, anytown, ny 12345", { standardizeCase: "upper" }));
// "123 MAIN ST, ANYTOWN NY 12345"
```

### CleanAddressResult

type

```ts
interface CleanAddressResult {
  cleanedAddress: string; // The cleaned address string
  wasModified: boolean; // Whether any modifications were made
  changes: string[]; // List of changes made to the address
}
```

What `cleanAddressDetailed` returns: the tidied address and what changed.

```js
import { cleanAddressDetailed } from "@johnmorrisdotca/address-plus";
import type { CleanAddressResult } from "@johnmorrisdotca/address-plus";

console.log(cleanAddressDetailed("123 main st, anytown, ny 12345").wasModified);
// true
```

### CleanAddressTestCase

type

```ts
interface CleanAddressTestCase extends TestCaseBase {
  input: string; // Input address string to clean
  expected: {
    cleaned: string;
    changes?: string[];
    [key: string]: unknown;
  }; // Expected cleaned address and changes
  options?: {
    format?: string;
    abbreviate?: boolean;
    [key: string]: unknown;
  }; // Optional cleaning configuration
}
```

A cleaning case in the package's JSON test files: an address and the tidied text expected.

```js
import type { CleanAddressTestCase } from "@johnmorrisdotca/address-plus";

console.log(({ input: "123 MAIN ST", expected: "123 Main St" }).expected);
// "123 Main St"
```

### COMMON_PARSER_PATTERNS

const

```ts
COMMON_PARSER_PATTERNS: { readonly ZIP_AT_END: (zipPattern: string) => RegExp; readonly STATE_AT_END: (statePattern: string) => RegExp; readonly CITY_STATE_PATTERN: (stateAbbrevPattern: string) => RegExp; readonly POSTAL_AT_END: (postalPattern: string) => RegExp; }
```

Pattern builders the parsers share: a ZIP, a state or a postal code at the end of a text, and a city before a state. Each takes the source of a pattern wrapped in one pair of parentheses or anchors, which it strips.

```js
import { COMMON_PARSER_PATTERNS } from "@johnmorrisdotca/address-plus";

console.log(COMMON_PARSER_PATTERNS.ZIP_AT_END("(\\d{5})").exec("Tacoma WA 98402")?.[1]);
// "98402"
```

### COMMON_STREET_NAMES_PATTERN

const

```ts
COMMON_STREET_NAMES_PATTERN: RegExp
```

Street names common enough that they must not be taken as part of a city's name.

```js
import { COMMON_STREET_NAMES_PATTERN } from "@johnmorrisdotca/address-plus";

console.log(COMMON_STREET_NAMES_PATTERN.test("Main"));
// true
```

### compareAddresses

function

```ts
compareAddresses(address1: ParsedAddress, address2: ParsedAddress, options?: AddressComparisonOptions): AddressComparisonResult
```

Compares two parsed addresses field by field, allowing for abbreviations (Street and St), state names and codes, letter case and small typos.

- `address1`: The first address, as `parseLocation` returns it.
- `address2`: The second address.
- `options`: How to compare: which parts to ignore and how close a fuzzy match must be (see `AddressComparisonOptions`).
- Returns: Whether they are the same place, how strong the match is (`exact` to `none`), the similarity score from 0 to 1 and every difference found.

```js
import { compareAddresses, parseLocation } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parseLocation("123 Main Street, Anytown, NY 12345");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseLocation("123 Main St, Anytown, New York 12345");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(compareAddresses(parsedAddress1, parsedAddress2).matchType);
// "exact"
```

### CONNECTOR_WORDS

const

```ts
CONNECTOR_WORDS: Set<string>
```

Small words (`of`, `the`, `and`) that may be in lower case inside a facility's name written in title case.

```js
import { CONNECTOR_WORDS } from "@johnmorrisdotca/address-plus";

console.log(CONNECTOR_WORDS.has("of"));
// true
```

### COUNTRIES

const

```ts
COUNTRIES: { readonly CANADA: "CA"; readonly JAPAN: "JP"; readonly UNITED_STATES: "US"; }
```

The country codes the parser reports: `US`, `CA` and `JP`.

```js
import { COUNTRIES } from "@johnmorrisdotca/address-plus";

console.log(COUNTRIES.JAPAN);
// "JP"
```

### CountryCode

type

```ts
type CountryCode = (typeof COUNTRIES)[keyof typeof COUNTRIES];
```

A country code the parser reports: `US`, `CA` or `JP`.

```js
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { CountryCode } from "@johnmorrisdotca/address-plus";

console.log(parseLocation("100 Queen St W, Toronto, ON M5H 2N2")?.country);
// "CA"
```

### CountryComparison

type

```ts
interface CountryComparison {
  isSame: boolean;
  differences: CountryDifference[];
}
```

What a country module's comparer returns: whether the two addresses are the same delivery point, and every field that differs once both are in the same form (letter case, punctuation, a street type written out or abbreviated).

```js
import { compareAustralianAddresses, parseAustralianAddress } from "@johnmorrisdotca/address-plus/au";
import type { CountryComparison } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseAustralianAddress("3/12 Smith Street, Parramatta NSW 2150");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseAustralianAddress("Unit 3, 12 Smith St, PARRAMATTA NSW 2150");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(compareAustralianAddresses(parsedAddress1, parsedAddress2).isSame);
// true
```

### CountryDifference

type

```ts
interface CountryDifference {
  field: string;
  first?: string;
  second?: string;
}
```

One way two addresses differ, as a country module's comparer reports it: the field, and its value in each address after both were put in the same form.

```js
import { compareUKAddresses, parseUKAddress } from "@johnmorrisdotca/address-plus/gb";
import type { CountryDifference } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseUKAddress("10 High Street, Bath BA1 1AA");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseUKAddress("12 High St, Bath BA1 1AA");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(compareUKAddresses(parsedAddress1, parsedAddress2).differences);
// [{"field":"number","first":"10","second":"12"}]
```

### CountryModule

type

```ts
interface CountryModule {
  code: string; // The country's ISO 3166-1 code: AU, GB
  codes: readonly string[]; // Every country code the module reads; GB also reads Jersey (JE), Guernsey (GY) and the Isle of Man (IM)
  name: string; // The country's name in English
  detect(address: string): boolean; // Whether the address is surely this country's, with no hint
  parse(address: string, options?: ParseOptions): ParsedAddress | null;
  validate(address: ParsedAddress, options?: ValidationOptions): CountryValidation;
  format(address: ParsedAddress): FormattedAddress;
  compare(first: ParsedAddress, second: ParsedAddress): CountryComparison;
}
```

A country's address module: its codes, how to tell its addresses apart, and its parser, validator, formatter and comparer. Import one from its entry point (`australia` from `@johnmorrisdotca/address-plus/au`, `unitedKingdom` from `@johnmorrisdotca/address-plus/gb`) and hand it to `parseLocation` and `validateAddress` in `countries`.

```js
import { australia } from "@johnmorrisdotca/address-plus/au";
import type { CountryModule } from "@johnmorrisdotca/address-plus/au";

console.log(australia.codes);
// ["AU"]
```

### CountryValidation

type

```ts
interface CountryValidation {
  errors: ValidationError[];
  warnings: ValidationError[];
}
```

What a country module's validator returns: the errors and the warnings it found.

```js
import { parseAustralianAddress, validateAustralianAddress } from "@johnmorrisdotca/address-plus/au";
import type { CountryValidation } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseAustralianAddress("1 Main St, Sydney VIC 2000");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(validateAustralianAddress(parsedAddress1).warnings.map((one) => one.code));
// ["POSTAL_REGION_MISMATCH"]
```

### default

const

```ts
default: AddressParser
```

The default export, shaped like parse-address's module: `parseLocation`, `parseAddress`, `parseIntersection` and `parseInformalAddress` on one object, so `import parser from "@johnmorrisdotca/address-plus"` works where parse-address was imported. Named imports work too.

```js
import parser from "@johnmorrisdotca/address-plus";
import { parseLocation } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parser.parseLocation("123 Main St, New York, NY 10001");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(parsedAddress1.zip);
// "10001"
```

### detectCountry

function

```ts
detectCountry(address: ParsedAddress): "US" | "CA" | undefined
```

Which country a parsed address is in, from its postal code, then its state or province.

- `address`: The parsed address, or any object with its `zip` and `state`.
- Returns: `US` or `CA`, or `undefined` when nothing says.

```js
import { detectCountry } from "@johnmorrisdotca/address-plus";

console.log(detectCountry({ zip: "M5H 2N2" }));
// "CA"
```

### DIRECTION_EXPANSIONS

const

```ts
DIRECTION_EXPANSIONS: Record<string, string>
```

Each directional abbreviation in lower case, to the word in full.

```js
import { DIRECTION_EXPANSIONS } from "@johnmorrisdotca/address-plus";

console.log(DIRECTION_EXPANSIONS["ne"]);
// "Northeast"
```

### DIRECTIONAL_MAP

const

```ts
DIRECTIONAL_MAP: Record<string, string>
```

Each directional word, in English or French, in lower case, to its abbreviation (`northwest` and `nord-ouest` to `NW` and `NO`).

```js
import { DIRECTIONAL_MAP } from "@johnmorrisdotca/address-plus";

console.log(DIRECTIONAL_MAP["northwest"]);
// "NW"
```

### FACILITY_DELIMITER_PATTERN

const

```ts
FACILITY_DELIMITER_PATTERN: RegExp
```

A facility's name followed by a comma or a dash and then the address.

```js
import { FACILITY_DELIMITER_PATTERN } from "@johnmorrisdotca/address-plus";

console.log(FACILITY_DELIMITER_PATTERN.test("City Hall - 100 Queen St W"));
// true
```

### FACILITY_DELIMITER_PATTERNS

const

```ts
FACILITY_DELIMITER_PATTERNS: { readonly PARENTHETICAL: RegExp; readonly DELIMITED: RegExp; readonly TRAILING_ISLAND: RegExp; }
```

The ways a facility's name is set off from an address: in parentheses, before a delimiter, or as a trailing island.

```js
import { FACILITY_DELIMITER_PATTERNS } from "@johnmorrisdotca/address-plus";

console.log(FACILITY_DELIMITER_PATTERNS.PARENTHETICAL.test("(City Hall)"));
// true
```

### FACILITY_INDICATORS

const

```ts
FACILITY_INDICATORS: readonly ["center", "centre", "building", "tower", "plaza", "square", "garden", "gardens", "park", "university", "college", "school", "hospital", "library", "museum", "station", "airport", "mall", "market", "stadium", "arena", "theater", "theatre", "hotel", "resort", "memorial", "monument", "bridge", "tunnel", "complex"]
```

Words that mark a place's name as a facility (`center`, `tower`, `hospital`, `université`), in lower case.

```js
import { FACILITY_INDICATORS } from "@johnmorrisdotca/address-plus";

console.log(FACILITY_INDICATORS.includes("hospital"));
// true
```

### FACILITY_PATTERNS

const

```ts
FACILITY_PATTERNS: RegExp[]
```

The patterns that find a facility's name, in English and French.

```js
import { FACILITY_PATTERNS } from "@johnmorrisdotca/address-plus";

console.log(FACILITY_PATTERNS.some((pattern) => pattern.test("Empire State Building")));
// true
```

### findMunicipalitiesByName

function

```ts
findMunicipalitiesByName(name: string, prefectureCode?: string): JapaneseMunicipality[]
```

The municipalities a Japanese name could mean: several when the name is shared (`府中市` is in Tokyo and in Hiroshima). A town or village may be named without its district (`当別町`).

- `name`: The municipality's name in Japanese.
- `prefectureCode`: A prefecture's JIS code, to look in that prefecture only.
- Returns: Every match, an empty array when there is none.

```js
import { findMunicipalitiesByName } from "@johnmorrisdotca/address-plus/jp";

console.log(findMunicipalitiesByName("府中市").map((one) => one.code + " " + one.romaji));
// ["13206 Fuchu-shi","34208 Fuchu-shi"]
```

### findMunicipalitiesByRomaji

function

```ts
findMunicipalitiesByRomaji(text: string, prefectureCode?: string): JapaneseMunicipality[]
```

The municipalities a romaji name could mean, written with or without macrons and designators (`Chiyoda-ku`, `Chiyoda City`, `Sapporo-shi Chuo-ku`, `Chuo-ku, Sapporo`). A town written without its district, and then a ward written without its city, are looked up when the full name finds nothing.

- `text`: The name in romaji.
- `prefectureCode`: A prefecture's JIS code, to look in that prefecture only.
- Returns: Every match, an empty array when there is none.

```js
import { findMunicipalitiesByRomaji } from "@johnmorrisdotca/address-plus/jp";

console.log(findMunicipalitiesByRomaji("Chuo-ku, Sapporo").map((one) => one.name));
// ["札幌市中央区"]
```

### findMunicipalityByCode

function

```ts
findMunicipalityByCode(code: string): JapaneseMunicipality | null
```

The municipality with a JIS X 0402 code, a designated city's own code included.

- `code`: The five-digit code.
- Returns: The municipality, or `null` for a code the tables do not have.

```js
import { findMunicipalityByCode } from "@johnmorrisdotca/address-plus/jp";

console.log(findMunicipalityByCode("13101")?.name);
// "千代田区"
```

### findPrefecture

function

```ts
findPrefecture(text: string): JapanesePrefecture | null
```

The prefecture a name, reading, romaji spelling or JIS code refers to: `東京都`, `東京`, `トウキョウト`, `Tokyo`, `Osaka Prefecture`, `13`.

- `text`: The name, reading or code; letter case and macrons do not matter.
- Returns: The prefecture, or `null` when the text names none.

```js
import { findPrefecture } from "@johnmorrisdotca/address-plus/jp";

console.log(findPrefecture("Osaka Prefecture")?.name);
// "大阪府"
```

### formatAddress

function

```ts
formatAddress(address: ParsedAddress, options?: AddressFormattingOptions): FormattedAddress
```

Writes a parsed address back out as lines and as one line, with abbreviations or in full.

- `address`: The address, as `parseLocation` returns it.
- `options`: How to write it: abbreviated or in full, the letter case, the country (see `AddressFormattingOptions`).
- Returns: The address as an array of lines and as one line.

```js
import { formatAddress, parseLocation } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parseLocation("123 Main Street, Anytown, NY 12345");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatAddress(parsedAddress1).singleLine);
// "123 Main St, Anytown NY 12345"
```

### formatCanadaPost

function

```ts
formatCanadaPost(address: ParsedAddress, options?: CanadaPostFormattingOptions): FormattedAddress
```

Writes a parsed address the way Canada Post asks: capitals, the unit before the civic number joined by a hyphen, and the postal code two spaces after the province.

- `address`: The address, as `parseLocation` returns it.
- `options`: Canada Post settings (see `CanadaPostFormattingOptions`).
- Returns: The address as lines and as one line.

```js
import { formatCanadaPost, parseLocation } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parseLocation("100 Queen Street West, Toronto, Ontario M5H 2N2");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatCanadaPost(parsedAddress1).lines);
// ["100 QUEEN ST W","TORONTO ON M5H 2N2"]
```

### formatJapanese

function

```ts
formatJapanese(address: ParsedAddress, options?: JapaneseFormattingOptions): string
```

Writes a Japanese address in Japanese order, as an envelope is addressed: `〒100-0005`, then `東京都千代田区丸の内1-2-3`, then `サンプルビル5階501号室`. The prefecture and municipality are always in kanji, from the tables. A town or building parsed from romaji keeps its romaji, set off by spaces so the scripts do not run together. Kyoto's street directions are written before the town.

- `address`: The address, as `parseLocation` returns it for a Japanese address.
- `options`: The block's style (`1-2-3` or `1丁目2番3号`), the postal code, and lines or one line (see `JapaneseFormattingOptions`).
- Returns: The address as text, its lines joined with newlines unless `options.multiline` is `false`; an empty string when the address has none of the parts.

```js
import { formatJapanese } from "@johnmorrisdotca/address-plus/jp";
import { parseLocation } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parseLocation("〒100-0005 東京都千代田区丸の内1-2-3");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatJapanese(parsedAddress1, { blockStyle: "markers", multiline: false }));
// "〒100-0005 東京都千代田区丸の内1丁目2番3号"
```

### formatJapaneseEnglish

function

```ts
formatJapaneseEnglish(address: ParsedAddress, options?: JapaneseEnglishFormattingOptions): string
```

Writes a Japanese address in English order, as a form from abroad expects: building, room, block, town, municipality, prefecture, postal code, Japan. The prefecture and municipality are always romaji, from the tables; the town and building are written as they were parsed, since the tables hold no romaji for towns.

- `address`: The address, as `parseLocation` returns it for a Japanese address.
- `options`: Whether to end with the postal code and with Japan (see `JapaneseEnglishFormattingOptions`).
- Returns: The address as one line, its parts joined by commas.

```js
import { formatJapaneseEnglish } from "@johnmorrisdotca/address-plus/jp";
import { parseLocation } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parseLocation("1-2-3 Marunouchi, Chiyoda-ku, Tokyo 100-0005");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatJapaneseEnglish(parsedAddress1));
// "1-2-3 Marunouchi, Chiyoda-ku, Tokyo 100-0005, Japan"
```

### FormattedAddress

type

```ts
interface FormattedAddress {
  lines: string[]; // Individual address lines
  singleLine: string; // Single-line representation
  deliveryLine?: string; // Street address line
  lastLine?: string; // City/state/postal line
  country?: string; // Country designation
  format:
    | "standard"
    | "usps"
    | "canada-post"
    | "international"
    | "australia-post"
    | "royal-mail"
    | "la-poste"
    | "deutsche-post"; // Formatting standard used
}
```

A formatted address: its lines, and the same on one line.

```js
import { formatUSPS, parseLocation } from "@johnmorrisdotca/address-plus";
import type { FormattedAddress } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseLocation("123 Main St, Anytown, NY 12345");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatUSPS(parsedAddress1));
// {"lines":["123 MAIN ST","ANYTOWN NY 12345"],"singleLine":"123 Main St, Anytown NY 12345","deliveryLine":"123 Main St","lastLine":"Anytown NY 12345","country":"US","format":"usps"}
```

### formatUSPS

function

```ts
formatUSPS(address: ParsedAddress, options?: USPSFormattingOptions): FormattedAddress
```

Writes a parsed address the way USPS Publication 28 asks: capitals, standard abbreviations, the unit on the street line, and the city, state and ZIP+4 on the last.

- `address`: The address, as `parseLocation` returns it.
- `options`: USPS settings (see `USPSFormattingOptions`).
- Returns: The address as lines and as one line.

```js
import { formatUSPS, parseLocation } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parseLocation("123 Main Street Apt 4, Anytown, NY 12345");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatUSPS(parsedAddress1).lines);
// ["123 MAIN ST APT 4","ANYTOWN NY 12345"]
```

### FRENCH_PREPOSITIONS

const

```ts
FRENCH_PREPOSITIONS: Map<string, string>
```

French particles that can open a street name, each with the space after it, to the way it is written there (`de la ` as `De la `).

```js
import { FRENCH_PREPOSITIONS } from "@johnmorrisdotca/address-plus";

console.log(FRENCH_PREPOSITIONS.get("de la "));
// "De la "
```

### FrenchAddressFields

type

```ts
interface FrenchAddressFields {
  numberExtension?: string; // The indice de répétition after the number: bis, ter, quater, or a letter (the B of 12 B)
  staircase?: string; // The staircase: the B of "Escalier B"
  entrance?: string; // The entrance: the A of "Entrée A"
  lieuDit?: string; // A lieu-dit: a named place (a hamlet, a farm) that goes on a line of its own
  postalBoxType?: "BP" | "CS" | "TSA"; // A boîte postale, a course spéciale or a tri service arrivée
  postalBoxNum?: string; // The number of the box: 123 in "BP 123"
  cedex?: string; // The CEDEX the commune line ends with, as La Poste writes it: "CEDEX 09", or "CEDEX" alone
  arrondissement?: string; // The arrondissement of Paris, Lyon or Marseille, as a number: 8 for "Paris 8e"
  careOf?: string; // The "chez" line: who the address is care of
}
```

The fields an address in France fills beside the shared ones. The shared fields keep their meaning: `number` is the street number, `street` the name of the street without its type and `type` the type in full (`Rue`; the name is `de la Paix`), `secUnitType` and `secUnitNum` an apartment or a door, `floorType` and `floor` a floor, `building` the building's or the residence's name, `city` the commune, `state` the department's code and `zip` the postcode.

```js
import { parseFrenchAddress } from "@johnmorrisdotca/address-plus/fr";
import type { FrenchAddressFields } from "@johnmorrisdotca/address-plus/fr";

console.log(parseFrenchAddress("12 bis rue de la Paix, 75002 Paris")?.numberExtension);
// "bis"
```

### FrenchCollectivity

type

```ts
interface FrenchCollectivity {
  code: string; // 988
  country: FrenchPostalCountry; // NC
  name: string; // Nouvelle-Calédonie
}
```

An overseas collectivity of France in the tables: its code (`987`), the ISO 3166-1 country code an address in it reads as (`PF`) and its name.

```js
import { FR_COLLECTIVITIES } from "@johnmorrisdotca/address-plus/fr";
import type { FrenchCollectivity } from "@johnmorrisdotca/address-plus/fr";

console.log(FR_COLLECTIVITIES.find((one) => one.code === "988"));
// {"code":"988","country":"NC","name":"Nouvelle-Calédonie"}
```

### FrenchDepartment

type

```ts
interface FrenchDepartment {
  code: string; // 75, 2A, 971
  name: string; // Paris
  region: string; // Île-de-France
}
```

A department of France in the tables: its code (`75`, `2A`, `971`), its name and its region's, from INSEE's Code officiel géographique.

```js
import { FR_DEPARTMENTS } from "@johnmorrisdotca/address-plus/fr";
import type { FrenchDepartment } from "@johnmorrisdotca/address-plus/fr";

console.log(FR_DEPARTMENTS.find((department) => department.code === "75"));
// {"code":"75","name":"Paris","region":"Île-de-France"}
```

### FrenchPostalCountry

type

```ts
type FrenchPostalCountry = "BL" | "FR" | "MC" | "MF" | "NC" | "PF" | "PM" | "WF";
```

The country an address in La Poste's base belongs to: `FR` for France (the metropolis and the overseas departments), `MC` for Monaco, and the ISO 3166-1 code of an overseas collectivity (`PM`, `BL`, `MF`, `WF`, `PF`, `NC`), which is French but has a country code of its own and is listed apart by the Universal Postal Union.

```js
import { parseFrenchAddress } from "@johnmorrisdotca/address-plus/fr";
import type { FrenchPostalCountry } from "@johnmorrisdotca/address-plus/fr";

console.log(parseFrenchAddress("Avenue Pouvanaa a Oopa, 98713 Papeete, Polynésie française")?.country);
// "PF"
```

### FrenchPostcode

type

```ts
interface FrenchPostcode {
  postcode: string; // 75008
  place: string; // 75, 2B, 971, 987, 99
  country: FrenchPostalCountry;
  known: boolean; // Whether La Poste's base lists it
  department?: string; // The department's code, absent for a collectivity and for Monaco
}
```

A postcode taken apart: the code of the department or territory its number belongs to, the country it delivers to, and whether La Poste's base has it. `place` is a department's code (`75`, `2A`, `971`), a collectivity's (`987`) or `99` for Monaco.

```js
import { parseFrenchPostcode } from "@johnmorrisdotca/address-plus/fr";
import type { FrenchPostcode } from "@johnmorrisdotca/address-plus/fr";

console.log(parseFrenchPostcode("20200"));
// {"postcode":"20200","place":"2B","country":"FR","known":true,"department":"2B"}
```

### FuzzyMatchOptions

type

```ts
interface FuzzyMatchOptions {
  threshold: number; // 0-1 minimum similarity threshold
  maxDistance: number; // Maximum edit distance for string matching
  enableSoundex?: boolean; // Use soundex for phonetic matching
  enableMetaphone?: boolean; // Use metaphone for phonetic matching
}
```

Settings for fuzzy string matching: the lowest similarity that counts, the largest edit distance, and phonetic matching.

```js
import type { FuzzyMatchOptions } from "@johnmorrisdotca/address-plus";

console.log(({ threshold: 0.8, maxDistance: 2 }).maxDistance);
// 2
```

### GENERAL_DELIVERY_PATTERNS

const

```ts
GENERAL_DELIVERY_PATTERNS: { readonly STANDARD: RegExp; readonly WITH_CITY: RegExp; }
```

General delivery written alone or before a city.

```js
import { GENERAL_DELIVERY_PATTERNS } from "@johnmorrisdotca/address-plus";

console.log(GENERAL_DELIVERY_PATTERNS.STANDARD.test("General Delivery"));
// true
```

### GermanAddressFields

type

```ts
interface GermanAddressFields {
  careOf?: string; // The "c/o", "bei" or "z. Hd." line: who the address is care of
}
```

The fields an address in Germany fills beside the shared ones. The shared fields keep their meaning: `street` is the whole name of the street as written (`Hauptstraße`, `Berliner Str.`, `Am Markt`), `number` the house number with its letter (`12a`) or range (`12-14`), `secUnitType` and `secUnitNum` a flat (`Wohnung 12`), a box (`Postfach 12 34 56`) or a Packstation, `floorType` and `floor` a floor (`OG` and `2`), `building` a wing, a house or a name (`Hinterhaus`, `Haus B`), `locality` the Ortsteil, `city` the place, `state` the Land's code and `zip` the postcode.

```js
import { parseGermanAddress } from "@johnmorrisdotca/address-plus/de";
import type { GermanAddressFields } from "@johnmorrisdotca/address-plus/de";

console.log(parseGermanAddress("c/o Weber, Hauptstraße 12a, 10115 Berlin")?.careOf);
// "Weber"
```

### GermanPostcode

type

```ts
interface GermanPostcode {
  postcode: string; // 10115
  state?: GermanStateCode; // BE; absent for a postcode that is not in the list
  known: boolean; // Whether GeoNames' list has it
}
```

A postcode taken apart: the Land it is in, and whether GeoNames' list has it.

```js
import { parseGermanPostcode } from "@johnmorrisdotca/address-plus/de";
import type { GermanPostcode } from "@johnmorrisdotca/address-plus/de";

console.log(parseGermanPostcode("10115"));
// {"postcode":"10115","state":"BE","known":true}
```

### GermanState

type

```ts
interface GermanState {
  code: GermanStateCode; // BY
  iso: string; // DE-BY
  name: string; // Bavaria
  nameJa: string; // バイエルン自由州
}
```

A Land of Germany in the tables: its code, its ISO 3166-2 code, and its name in English and in Japanese (from kuni, which takes them from Unicode CLDR and Wikidata).

```js
import { DE_STATES } from "@johnmorrisdotca/address-plus/de";
import type { GermanState } from "@johnmorrisdotca/address-plus/de";

console.log(DE_STATES.find((state) => state.code === "BY"));
// {"code":"BY","iso":"DE-BY","name":"Bavaria","nameJa":"バイエルン自由州"}
```

### GermanStateCode

type

```ts
type GermanStateCode =
  "BB" | "BE" | "BW" | "BY" | "HB" | "HE" | "HH" | "MV" | "NI" | "NW" | "RP" | "SH" | "SL" | "SN" | "ST" | "TH";
```

The code of one of the sixteen Länder of Germany, as ISO 3166-2:DE writes it after `DE-`.

```js
import { getStateFromGermanPostcode } from "@johnmorrisdotca/address-plus/de";
import type { GermanStateCode } from "@johnmorrisdotca/address-plus/de";

console.log(getStateFromGermanPostcode("80331"));
// "BY"
```

### getAddressAbbreviations

function

```ts
getAddressAbbreviations(): AddressAbbreviations
```

Every abbreviation the formatters use: street types, directionals, secondary units, states and provinces.

- Returns: One map per kind, each from the full word to its abbreviation.

```js
import { getAddressAbbreviations } from "@johnmorrisdotca/address-plus";

console.log(getAddressAbbreviations().streetTypes.avenue);
// "Ave"
```

### getAddressSimilarity

function

```ts
getAddressSimilarity(address1: ParsedAddress, address2: ParsedAddress, options?: AddressComparisonOptions): AddressSimilarityResult
```

The similarity of two parsed addresses, part by part, without a verdict: the score and each part's score, and the differences.

- `address1`: The first address, as `parseLocation` returns it.
- `address2`: The second address.
- `options`: How to compare (see `AddressComparisonOptions`).
- Returns: The overall score from 0 to 1, the street, city, state and postal scores, and each difference with its kind.

```js
import { getAddressSimilarity, parseLocation } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parseLocation("123 Main Street, Anytown, NY 12345");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseLocation("125 Main Street, Anytown, NY 12345");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(getAddressSimilarity(parsedAddress1, parsedAddress2).differences);
// [{"field":"number","value1":"123","value2":"125","type":"typo","confidence":0.6}]
```

### getPostalPrefixesForPrefecture

function

```ts
getPostalPrefixesForPrefecture(prefecture: string): string[]
```

The three-digit postal prefixes a prefecture's codes begin with, the reverse of `getPrefectureFromJapanesePostalCode`. A prefix on a border is listed under the prefecture most of its codes belong to.

- `prefecture`: The prefecture, by JIS code, name or romaji, as `findPrefecture` reads it.
- Returns: The prefixes in ascending order, an empty array for an unknown prefecture.

```js
import { getPostalPrefixesForPrefecture } from "@johnmorrisdotca/address-plus/jp";

console.log(getPostalPrefixesForPrefecture("沖縄県"));
// ["900","901","902","903","904","905","906","907"]
```

### getPostalPrefixesForProvince

function

```ts
getPostalPrefixesForProvince(province: string): string[]
```

The postal code prefixes a province or territory uses, the reverse of `getProvinceFromPostalCode`. Every code starting with one of them belongs to that province.

- `province`: The province or territory's two-letter code.
- Returns: The prefixes, a letter or, for the territories, three characters; an empty array for an unknown code.

```js
import { getPostalPrefixesForProvince } from "@johnmorrisdotca/address-plus";

console.log(getPostalPrefixesForProvince("NU"));
// ["X0A","X0B","X0C"]
```

### getPrefectureFromJapanesePostalCode

function

```ts
getPrefectureFromJapanesePostalCode(postalCode: string): string | null
```

The prefecture a Japanese postal code delivers to, from Japan Post's data: by its first three digits, and for the codes on the far side of a prefix that straddles a border, by the whole code.

- `postalCode`: The seven-digit code, with or without its hyphen, in either width.
- Returns: The prefecture's JIS code, or `null` for a malformed code or one no Japanese code begins like.

```js
import { getPrefectureFromJapanesePostalCode } from "@johnmorrisdotca/address-plus/jp";

console.log(getPrefectureFromJapanesePostalCode("530-0001"));
// "27"
```

### getProvinceFromPostalCode

function

```ts
getProvinceFromPostalCode(postalCode: string): string | null
```

The province or territory a Canadian postal code is in, from its first letter, and for the X codes of the north, its first three characters.

- `postalCode`: The postal code, with or without its space.
- Returns: The two-letter code, or `null` for a code that is not Canadian.

```js
import { getProvinceFromPostalCode } from "@johnmorrisdotca/address-plus";

console.log(getProvinceFromPostalCode("H3G 1P1"));
// "QC"
```

### getStateFromZip

function

```ts
getStateFromZip(zip: string | number): StateCode | undefined
```

The state or territory a US ZIP code is in.

- `zip`: A five-digit ZIP or a ZIP+4, as a string or a number (a number loses its leading zeros, which are put back).
- Returns: The two-letter code, or `undefined` for a ZIP no state uses or a malformed one.

```js
import { getStateFromZip } from "@johnmorrisdotca/address-plus";

console.log(getStateFromZip("98101"));
// "WA"
```

### getValidationErrors

function

```ts
getValidationErrors(addressString: string, options?: ValidationOptions): ValidationError[]
```

The errors `validateAddress` finds, without the rest of its result.

- `addressString`: The address as one string.
- `options`: What to require and how strict to be (see `ValidationOptions`).
- Returns: The errors, each with its field, code and message; an empty array when there are none.

```js
import { getValidationErrors } from "@johnmorrisdotca/address-plus";

console.log(getValidationErrors("123 Main St, Seattle, NY 98101", { strictPostalValidation: true }).map((error) => error.code));
// ["POSTAL_REGION_MISMATCH"]
```

### getZipPrefixesForState

function

```ts
getZipPrefixesForState(state: string): string[]
```

The ZIP code prefixes a state or territory uses, the reverse of `getStateFromZip`: three digits where a whole block of a hundred belongs to it, five where only part of one does. Every ZIP starting with one of them resolves to that state.

- `state`: The state or territory's two-letter code.
- Returns: The prefixes in ascending order, or an empty array for an unknown code.

```js
import { getZipPrefixesForState } from "@johnmorrisdotca/address-plus";

console.log(getZipPrefixesForState("RI"));
// ["028","029"]
```

### hasValidAddressComponents

function

```ts
hasValidAddressComponents(address: string): boolean
```

Whether a string looks like an address at all: a number and a street, a PO box, a postal code or another recognised part.

- `address`: The text to look at.
- Returns: `true` when it holds something an address is made of.

```js
import { hasValidAddressComponents } from "@johnmorrisdotca/address-plus";

console.log(hasValidAddressComponents("123 Main St, Anytown, NY 12345"));
// true
```

### INTERSECTION_PATTERNS

const

```ts
INTERSECTION_PATTERNS: { readonly BASIC_CITY: RegExp; readonly CITY_WITH_COMMA: RegExp; readonly STREET_WITH_TYPE: (directionalPattern: string, streetTypePattern: string) => RegExp; readonly STREET_SIMPLE: (directionalPattern: string) => RegExp; }
```

The regular expressions and pattern builders the intersection parser uses to find the city and each street with its type.

```js
import { INTERSECTION_PATTERNS } from "@johnmorrisdotca/address-plus";

console.log(INTERSECTION_PATTERNS.CITY_WITH_COMMA.exec("Pine St, Tacoma")?.[1]);
// "Tacoma"
```

### ISLAND_TYPE_PATTERN

const

```ts
ISLAND_TYPE_PATTERN: RegExp
```

The words for an island, for addresses on one (`Island`, `Isle`, `Île`).

```js
import { ISLAND_TYPE_PATTERN } from "@johnmorrisdotca/address-plus";

console.log(ISLAND_TYPE_PATTERN.test("Island"));
// true
```

### isSameAddress

function

```ts
isSameAddress(address1: ParsedAddress, address2: ParsedAddress, options?: AddressComparisonOptions): boolean
```

Whether two parsed addresses are the same place, by the same rules as `compareAddresses`.

- `address1`: The first address, as `parseLocation` returns it.
- `address2`: The second address.
- `options`: How to compare (see `AddressComparisonOptions`).
- Returns: `true` when they match, `false` otherwise.

```js
import { isSameAddress, parseLocation } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parseLocation("東京都千代田区丸の内1丁目2番3号");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseLocation("東京都千代田区丸の内１－２－３");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(isSameAddress(parsedAddress1, parsedAddress2));
// true
```

### isValidAddress

function

```ts
isValidAddress(addressString: string, options?: ValidationOptions): boolean
```

Whether an address passes `validateAddress`.

- `addressString`: The address as one string.
- `options`: What to require and how strict to be (see `ValidationOptions`).
- Returns: `true` when it has no errors, `false` otherwise. Warnings do not make it invalid unless `strictPostalValidation` turns them into errors.

```js
import { isValidAddress } from "@johnmorrisdotca/address-plus";

console.log(isValidAddress("123 Main St, Seattle, NY 98101", { strictPostalValidation: true }));
// false
```

### JapaneseAddressFields

type

```ts
interface JapaneseAddressFields {
  postalCode?: string; // 〒 code as NNN-NNNN
  prefecture?: string; // 東京都
  prefectureCode?: string; // JIS code: "13"
  prefectureRomaji?: string; // Tokyo
  municipality?: string; // 千代田区
  municipalityCode?: string; // JIS code: "13101"
  municipalityRomaji?: string; // Chiyoda-ku
  streetDirections?: string; // Kyoto's street directions before the town (通り名): 寺町通御池上る
  town?: string; // 丸の内 (大字・町名), without the chome
  chome?: string; // 丁目: "1"
  ban?: string; // 番 (番地): "2"
  go?: string; // 号: "3"
  block?: string; // The numbered block as one string: "1-2-3"
  building?: string; // サンプルビル
  floor?: string; // 階: "5"
  room?: string; // 号室: "501"
}
```

The fields a Japanese address fills on top of the shared ones. Every value is normalised: full-width and kanji numerals become ASCII digits, and the block is split into chome, ban and go whichever way it was written.

```js
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { JapaneseAddressFields } from "@johnmorrisdotca/address-plus/jp";

console.log(parseLocation("〒100-0005 東京都千代田区丸の内1丁目2番3号")?.municipalityCode);
// "13101"
```

### JapaneseEnglishFormattingOptions

type

```ts
interface JapaneseEnglishFormattingOptions {
  includeCountry?: boolean; // ", Japan" at the end; default true
  includePostalCode?: boolean; // Default true
}
```

Options for `formatJapaneseEnglish`.

```js
import { formatJapaneseEnglish } from "@johnmorrisdotca/address-plus/jp";
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { JapaneseEnglishFormattingOptions } from "@johnmorrisdotca/address-plus/jp";

const parsedAddress1=parseLocation("〒100-0005 東京都千代田区丸の内1-2-3");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatJapaneseEnglish(parsedAddress1, { includeCountry: false }));
// "1-2-3 丸の内, Chiyoda-ku, Tokyo 100-0005"
```

### JapaneseFormattingOptions

type

```ts
interface JapaneseFormattingOptions {
  blockStyle?: "hyphen" | "markers"; // 1-2-3 (default) or 1丁目2番3号
  includePostalCode?: boolean; // 〒100-0005 on its own line; default true
  multiline?: boolean; // Lines joined with newlines (default) or one line with spaces
}
```

Options for `formatJapanese`.

```js
import { formatJapanese } from "@johnmorrisdotca/address-plus/jp";
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { JapaneseFormattingOptions } from "@johnmorrisdotca/address-plus/jp";

const parsedAddress1=parseLocation("〒100-0005 東京都千代田区丸の内1-2-3");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatJapanese(parsedAddress1, { blockStyle: "markers", includePostalCode: false }));
// "東京都千代田区丸の内1丁目2番3号"
```

### JapaneseMunicipality

type

```ts
interface JapaneseMunicipality {
  code: string; // JIS X 0402 code, five digits; the first two are the prefecture's
  prefecture: string; // The prefecture's JIS code
  name: string; // Official name, with the district for towns and villages in one: 千代田区, 札幌市中央区, 石狩郡当別町
  kana: string; // Reading in katakana
  romaji: string; // Romaji with designators hyphenated on: Chiyoda-ku, Sapporo-shi Chuo-ku, Ishikari-gun Tobetsu-cho
}
```

A municipality (市区町村) in the tables: its JIS code, its prefecture's code, its official name with the district for a town or village in one, its reading and its romaji.

```js
import { findMunicipalityByCode } from "@johnmorrisdotca/address-plus/jp";
import type { JapaneseMunicipality } from "@johnmorrisdotca/address-plus/jp";

console.log(findMunicipalityByCode("13101"));
// {"code":"13101","prefecture":"13","name":"千代田区","kana":"チヨダク","romaji":"Chiyoda-ku"}
```

### JapanesePrefecture

type

```ts
interface JapanesePrefecture {
  code: string; // JIS X 0401 code, "01" (Hokkaido) to "47" (Okinawa)
  name: string; // Official name with its designator: 東京都, 大阪府, 北海道, 愛知県
  kana: string; // Reading in katakana: トウキョウト
  romaji: string; // Romaji with the designator hyphenated on: Tokyo-to
}
```

A prefecture (都道府県) in the tables: its JIS code, official name, katakana reading and romaji.

```js
import { findPrefecture } from "@johnmorrisdotca/address-plus/jp";
import type { JapanesePrefecture } from "@johnmorrisdotca/address-plus/jp";

console.log(findPrefecture("13"));
// {"code":"13","name":"東京都","kana":"トウキョウト","romaji":"Tokyo-to"}
```

### JapaneseValidation

type

```ts
interface JapaneseValidation {
  errors: ValidationError[];
  warnings: ValidationError[];
}
```

What `validateJapaneseAddress` returns: the errors and the warnings found.

```js
import { validateJapaneseAddress } from "@johnmorrisdotca/address-plus/jp";
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { JapaneseValidation } from "@johnmorrisdotca/address-plus/jp";

const parsedAddress1=parseLocation("東京都大阪市北区梅田1-1");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(validateJapaneseAddress(parsedAddress1).warnings.map((one) => one.code));
// ["MUNICIPALITY_PREFECTURE_MISMATCH"]
```

### JP_DESIGNATED_CITIES

const

```ts
JP_DESIGNATED_CITIES: readonly JapaneseMunicipality[]
```

The twenty designated cities (政令指定都市) as municipalities of their own. Geolonia lists only their wards, but addresses often name the city alone (`大阪市`, `Sapporo`), and the city has a JIS code of its own: its wards' codes with the last digit 0 (札幌市 01100).

```js
import { JP_DESIGNATED_CITIES } from "@johnmorrisdotca/address-plus/jp";

console.log(JP_DESIGNATED_CITIES.length);
// 20
```

### JP_MUNICIPALITIES

const

```ts
JP_MUNICIPALITIES: readonly JapaneseMunicipality[]
```

Every municipality (市区町村) by JIS X 0402 code, with its prefecture, official name, reading and romaji; a designated city's wards are listed, and the city itself is in `JP_DESIGNATED_CITIES`. Generated from Geolonia 住所データ (MIT).

```js
import { JP_MUNICIPALITIES } from "@johnmorrisdotca/address-plus/jp";

console.log(JP_MUNICIPALITIES.find((one) => one.code === "13101")?.name);
// "千代田区"
```

### JP_POSTAL_EXCEPTIONS

const

```ts
JP_POSTAL_EXCEPTIONS: Readonly<Record<string, string>>
```

The postal codes that deliver to another prefecture than the rest of their three-digit prefix, each to that prefecture's JIS code. Generated from Japan Post's KEN_ALL.CSV through jp-postal (MIT).

```js
import { JP_POSTAL_EXCEPTIONS } from "@johnmorrisdotca/address-plus/jp";

console.log(Object.keys(JP_POSTAL_EXCEPTIONS).length > 0);
// true
```

### JP_POSTAL_PREFIXES

const

```ts
JP_POSTAL_PREFIXES: Readonly<Record<string, string>>
```

Each three-digit postal prefix, to the JIS code of the prefecture most of its codes deliver to. Generated from Japan Post's KEN_ALL.CSV through jp-postal (MIT).

```js
import { JP_POSTAL_PREFIXES } from "@johnmorrisdotca/address-plus/jp";

console.log(JP_POSTAL_PREFIXES["530"]);
// "27"
```

### JP_PREFECTURES

const

```ts
JP_PREFECTURES: readonly JapanesePrefecture[]
```

The 47 prefectures in JIS X 0401 order, each with its code, official name, katakana reading and romaji. Generated from Geolonia 住所データ (MIT).

```js
import { JP_PREFECTURES } from "@johnmorrisdotca/address-plus/jp";

console.log(JP_PREFECTURES.length);
// 47
```

### kanjiNumeralsToDigits

function

```ts
kanjiNumeralsToDigits(text: string): string
```

Turns the kanji numerals that stand for block, floor or room numbers into digits: `一丁目二番三号` becomes `1丁目2番3号`. A numeral that is part of a name stays: `北一条西`, `三番町`, `麻布十番`, `二階堂`.

- `text`: Japanese text.
- Returns: The text with those numerals as digits.

```js
import { kanjiNumeralsToDigits } from "@johnmorrisdotca/address-plus/jp";

console.log(kanjiNumeralsToDigits("二丁目十五番"));
// "2丁目15番"
```

### looksJapanese

function

```ts
looksJapanese(text: string): boolean
```

Whether a text is a Japanese address: in Japanese script, ending with Japan, or naming a prefecture beside a Japanese postal code, a romaji designator (`-ku`, `-shi`) or a municipality written with an English word (`Chiyoda City`). A US address that only mentions a Japanese name (`100 Tokyo Ave`) does not count.

- `text`: The text.
- Returns: `true` when the text should be read as Japanese.

```js
import { looksJapanese } from "@johnmorrisdotca/address-plus/jp";

console.log(looksJapanese("1-2-3 Marunouchi, Chiyoda-ku, Tokyo"));
// true
```

### municipalitiesOf

function

```ts
municipalitiesOf(prefectureCode: string): readonly JapaneseMunicipality[]
```

Every municipality of a prefecture, the designated cities included.

- `prefectureCode`: The prefecture's JIS code.
- Returns: The municipalities, an empty array for an unknown code.

```js
import { municipalitiesOf } from "@johnmorrisdotca/address-plus/jp";

console.log(municipalitiesOf("47").length);
// 41
```

### MUSIC_SQUARE_EAST_PATTERN

const

```ts
MUSIC_SQUARE_EAST_PATTERN: RegExp
```

Nashville's Music Square East, whose name ends in a directional word that is part of it.

```js
import { MUSIC_SQUARE_EAST_PATTERN } from "@johnmorrisdotca/address-plus";

console.log(MUSIC_SQUARE_EAST_PATTERN.test("1 Music Square East"));
// true
```

### normalizeJapaneseAddressText

function

```ts
normalizeJapaneseAddressText(text: string): string
```

Makes the text of a Japanese address uniform, as the parser reads it: widths folded, spaces tidied, numerals as digits, and `1の2の3`, `１－２－３` or any other dash written `1-2-3`. The postal mark 〒 is kept.

- `text`: Japanese text.
- Returns: The text made uniform.

```js
import { normalizeJapaneseAddressText } from "@johnmorrisdotca/address-plus/jp";

console.log(normalizeJapaneseAddressText("〒１００-０００５ 東京都千代田区丸の内一丁目二番三号"));
// "〒100-0005 東京都千代田区丸の内1丁目2番3号"
```

### normalizeRegion

function

```ts
normalizeRegion(input: string): { abbr: string; country: "CA" | "US"; } | null
```

Finds the US state or Canadian province a name, code or misspelling means: `Calfornia`, `Que.`, `British Columbia`, `nfld`.

- `input`: A state or province name, code or abbreviation, in English or French.
- Returns: Its code and country, or `null` when nothing is close enough.

```js
import { normalizeRegion } from "@johnmorrisdotca/address-plus";

console.log(normalizeRegion("Calfornia"));
// {"abbr":"CA","country":"US"}
```

### normalizeStateProvinceName

function

```ts
normalizeStateProvinceName(stateName: string): string | undefined
```

The code of a US state or Canadian province written in full, in lower case.

- `stateName`: The name in full, in English or French, any letter case.
- Returns: The code in lower case, or `undefined` for a name that is not a state or province.

```js
import { normalizeStateProvinceName } from "@johnmorrisdotca/address-plus";

console.log(normalizeStateProvinceName("Nova Scotia"));
// "ns"
```

### normalizeText

function

```ts
normalizeText(text: string): string
```

Lower-cases a string, turns its periods, commas and semicolons into spaces, folds runs of spaces to one and trims it: the form the parsers compare words in.

- `text`: The text.
- Returns: The text in lower case, without that punctuation, with single spaces and none at either end.

```js
import { normalizeText } from "@johnmorrisdotca/address-plus";

console.log(normalizeText("  123   Main  St  "));
// "123 main st"
```

### PARENTHETICAL_PATTERN

const

```ts
PARENTHETICAL_PATTERN: RegExp
```

Words in parentheses inside an address; group 1 is what is inside them.

```js
import { PARENTHETICAL_PATTERN } from "@johnmorrisdotca/address-plus";

console.log(PARENTHETICAL_PATTERN.exec("123 Main St (Rear)")?.[1]);
// "Rear"
```

### parseAddress

function

```ts
parseAddress(address: string, options?: ParseOptions): ParsedAddress | null
```

Parses a street address. The same as `parseLocation`, kept under the name parse-address's users know.

- `address`: The address as one string.
- `options`: How to parse (see `ParseOptions`).
- Returns: The parts found, or `null` when nothing can be read as an address.

```js
import { parseAddress } from "@johnmorrisdotca/address-plus";

console.log(parseAddress("123 Main St Apt 4, Anytown, NY 12345")?.secUnitNum);
// "4"
```

### parseAddresses

function

```ts
parseAddresses(addresses: string[], options?: ParseOptions): (ParsedAddress | null)[]
```

Parses many street addresses with `parseAddress`, in order.

- `addresses`: The addresses, one string each.
- `options`: How to parse every one of them (see `ParseOptions`).
- Returns: One result per address, in the same order, `null` where an address could not be read.

```js
import { parseAddresses } from "@johnmorrisdotca/address-plus";

console.log(parseAddresses(["10 Main St, Anytown, NY 12345", "PO Box 12, Springfield, IL 62701"]).map((one) => one?.city));
// ["Anytown","Springfield"]
```

### parseAddressesBatch

function

```ts
parseAddressesBatch(addresses: string[], options?: BatchParseOptions): BatchParseResult<ParsedAddress>
```

Parses many street addresses with `parseAddress`, and reports which failed and how long it took.

- `addresses`: The addresses, one string each.
- `options`: How to parse, plus the batch settings (see `BatchParseOptions`).
- Returns: The results in order (`null` for a failure), the errors, and the counts and timing.

```js
import { parseAddressesBatch } from "@johnmorrisdotca/address-plus";

console.log(parseAddressesBatch(["10 Main St, Anytown, NY 12345", "PO Box 12, Springfield, IL 62701"]).stats.successful);
// 2
```

### ParsedAddress

type

```ts
interface ParsedAddress extends JapaneseAddressFields, AustralianAddressFields, FrenchAddressFields, UKAddressFields {
  city?: string; // City name, or the municipality in Japan; APO, FPO or DPO in a military address
  compartment?: string; // Compartment on a Canadian rural route (the 10 in "SITE 6 COMP 10 RR 8")
  country?: "CA" | "US" | "JP" | "AU" | "GB" | "GY" | "IM" | "JE" | FrenchPostalCountry | "DE"; // Detected country; AU, GB (with Jersey, Guernsey and the Isle of Man), FR (with Monaco and the overseas collectivities) and DE only from their modules
  fraction?: string; // Fractional address number (e.g., 1/2 in "123 1/2 Main St")
  generalDelivery?: boolean; // General delivery indicator
  highwayContract?: string; // Highway contract route number (the 68 in "HC 68 BOX 23A"); ruralRoute holds "HC 68"
  locality?: string; // Sub-city locality (borough, district, neighborhood), or a Puerto Rico urbanization
  military?: string; // Military delivery line ("PSC 802 Box 74", "Unit 2050 Box 4190"); state is AA, AE or AP
  number?: string; // Street number
  place?: string; // Place name (landmark, POI, building, monument, etc.)
  plus4?: string; // Extended ZIP+4 code
  postalValid?: boolean; // Postal code validation status
  postalType?: "zip" | "postal"; // Postal code type (zip or postal)
  prefix?: string; // Directional prefix (N, S, E, W, etc.)
  rpo?: string; // Retail Postal Outlet (Canada Post) identifier
  rr?: string; // Rural Route number (RR/R.R.)
  ruralRoute?: string; // Rural route or similar
  secUnitNum?: string; // Secondary unit number
  secUnitType?: string; // Secondary unit type (apt, suite, etc.)
  secondary?: string; // Legacy properties for backward compatibility
  site?: string; // Site number on a Canadian rural route (the 6 in "SITE 6 COMP 10 RR 8")
  state?: string; // State/Province code; AA, AE or AP for a military address
  station?: string; // Station or Succursale identifier (e.g., Station A, Succ. Centre-ville)
  street?: string; // Street name
  suffix?: string; // Directional suffix
  type?: string; // Street type/suffix (St, Ave, Rd, etc.)
  unit?: string; // Legacy unit property for backward compatibility
  zip?: string; // ZIP or postal code
  zipValid?: boolean; // ZIP/postal code format validation (true if format is valid)
}
```

What `parseLocation` returns: every part it found, each absent when the address has none. A Japanese address fills its own fields and the shared ones that stand for them: `state` the prefecture's JIS code, `city` the municipality, `street` the town, `number` the block, `zip` the postal code.

```js
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { ParsedAddress } from "@johnmorrisdotca/address-plus/jp";

console.log(parseLocation("123 Main St Apt 4, Anytown, NY 12345"));
// {"number":"123","secUnitType":"Apartment","secUnitNum":"4","unit":"Apt 4","street":"Main","type":"St","city":"Anytown","state":"NY","zip":"12345","zipValid":true,"country":"US"}
```

### ParsedIntersection

type

```ts
interface ParsedIntersection {
  street1?: string; // First street
  type1?: string; // First street type
  prefix1?: string; // First street prefix
  suffix1?: string; // First street suffix
  street2?: string; // Second street
  type2?: string; // Second street type
  prefix2?: string; // Second street prefix
  suffix2?: string; // Second street suffix
  city?: string; // City
  state?: string; // State/Province
  zip?: string; // ZIP/Postal code
  plus4?: string; // Extended ZIP+4 code
  country?: "CA" | "US"; // Country
  postalValid?: boolean; // Postal code validation status
  postalType?: "zip" | "postal"; // Postal code type (zip or postal)
}
```

What `parseIntersection` returns: two streets, each with its name, type and directionals, and the place.

```js
import { parseIntersection } from "@johnmorrisdotca/address-plus";
import type { ParsedIntersection } from "@johnmorrisdotca/address-plus";

console.log(parseIntersection("Hollywood Blvd and Vine St, Los Angeles, CA"));
// {"state":"CA","city":"Los Angeles","street1":"Hollywood","type1":"Blvd","street2":"Vine","type2":"St"}
```

### parseDirectional

function

```ts
parseDirectional(text: string): { direction: string | undefined; remaining: string; }
```

Takes a leading directional off a street (`NW Main St`), abbreviated.

- `text`: The street text.
- Returns: The directional (`undefined` when there is none) and the text that remains.

```js
import { parseDirectional } from "@johnmorrisdotca/address-plus";

console.log(parseDirectional("NW Main St"));
// {"direction":"NW","remaining":"Main St"}
```

### parseFacility

function

```ts
parseFacility(text: string): { facility: string | undefined; remaining: string; }
```

Takes a facility's name (a building, a park, a hospital) off the start of an address.

- `text`: The address text.
- Returns: The facility (`undefined` when there is none) and the text that remains.

```js
import { parseFacility } from "@johnmorrisdotca/address-plus";

console.log(parseFacility("Empire State Building, 350 5th Ave"));
// {"facility":"Empire State Building","remaining":", 350 5th Ave"}
```

### parseInformalAddress

function

```ts
parseInformalAddress(address: string, options?: ParseOptions): ParsedAddress | null
```

Reads an address written loosely, as a fallback when `parseLocation` finds no street address: a description such as `Downtown near City Hall` is kept whole as the street, with any ZIP code after it.

- `address`: The address as one string.
- `options`: How to parse (see `ParseOptions`).
- Returns: The street and the ZIP code it could find, or `null` when the text is empty.

```js
import { parseInformalAddress } from "@johnmorrisdotca/address-plus";

console.log(parseInformalAddress("Downtown near City Hall, Springfield IL 62701"));
// {"street":"Downtown near City Hall","zip":"62701","country":"US"}
```

### parseInformalAddresses

function

```ts
parseInformalAddresses(addresses: string[], options?: ParseOptions): (ParsedAddress | null)[]
```

Parses many loosely written addresses with `parseInformalAddress`, in order.

- `addresses`: The addresses, one string each.
- `options`: How to parse every one of them (see `ParseOptions`).
- Returns: One result per address, in the same order, `null` where nothing could be read.

```js
import { parseInformalAddresses } from "@johnmorrisdotca/address-plus";

console.log(parseInformalAddresses(["Downtown near City Hall, Springfield IL 62701"]).map((one) => one?.zip));
// ["62701"]
```

### parseInformalAddressesBatch

function

```ts
parseInformalAddressesBatch(addresses: string[], options?: BatchParseOptions): BatchParseResult<ParsedAddress>
```

Parses many loosely written addresses with `parseInformalAddress`, and reports which failed and how long it took.

- `addresses`: The addresses, one string each.
- `options`: How to parse, plus the batch settings (see `BatchParseOptions`).
- Returns: The results in order (`null` for a failure), the errors, and the counts and timing.

```js
import { parseInformalAddressesBatch } from "@johnmorrisdotca/address-plus";

console.log(parseInformalAddressesBatch(["Main St, Anytown NY"]).stats.successful);
// 1
```

### parseIntersection

function

```ts
parseIntersection(address: string, options?: ParseOptions): ParsedIntersection | null
```

Parses an intersection of two streets, joined by `&`, `and`, `at` or `@`, with the city, state and ZIP that may follow. With no comma before the city, the second street ends at its type, so the city may be any number of words.

- `address`: The intersection as one string, such as `Main St & Pine Ave, Tacoma, WA`.
- `options`: How to parse (see `ParseOptions`).
- Returns: Both streets with their types and directionals, and the place, or `null` when the text does not name two streets. A street with no type has `type1` or `type2` set to an empty string, as in parse-address.

```js
import { parseIntersection } from "@johnmorrisdotca/address-plus";

console.log(parseIntersection("Main St and Pine St Tacoma WA"));
// {"state":"WA","city":"Tacoma","street1":"Main","type1":"St","street2":"Pine","type2":"St"}
```

### parseIntersections

function

```ts
parseIntersections(addresses: string[], options?: ParseOptions): (ParsedIntersection | null)[]
```

Parses many intersections with `parseIntersection`, in order.

- `addresses`: The intersections, one string each.
- `options`: How to parse every one of them (see `ParseOptions`).
- Returns: One result per intersection, in the same order, `null` where one could not be read.

```js
import { parseIntersections } from "@johnmorrisdotca/address-plus";

console.log(parseIntersections(["Yonge St and Bloor St, Toronto, ON"]).map((one) => one?.street2));
// ["Bloor"]
```

### parseIntersectionsBatch

function

```ts
parseIntersectionsBatch(addresses: string[], options?: BatchParseOptions): BatchParseResult<ParsedIntersection>
```

Parses many intersections with `parseIntersection`, and reports which failed and how long it took.

- `addresses`: The intersections, one string each.
- `options`: How to parse, plus the batch settings (see `BatchParseOptions`).
- Returns: The results in order (`null` for a failure), the errors, and the counts and timing.

```js
import { parseIntersectionsBatch } from "@johnmorrisdotca/address-plus";

console.log(parseIntersectionsBatch(["Yonge St and Bloor St, Toronto, ON"]).stats.successful);
// 1
```

### parseJapaneseAddress

function

```ts
parseJapaneseAddress(text: string, options?: ParseOptions): ParsedAddress | null
```

Parses a Japanese address, in Japanese script or in romaji, into the Japanese fields and the shared ones. `parseLocation` calls it for any address that looks Japanese; call it directly to skip the detection.

- `text`: The address as one string, in either script, with or without 〒 and the postal code.
- `options`: `useSnakeCase` gives snake_case keys; the other options are ignored.
- Returns: The parts found, or `null` when nothing in the text names a place in Japan (no prefecture, municipality or postal code).

```js
import { parseJapaneseAddress } from "@johnmorrisdotca/address-plus/jp";

console.log(parseJapaneseAddress("〒100-0005 東京都千代田区丸の内1丁目2番3号 サンプルビル5階501号室")?.block);
// "1-2-3"
```

### parseLocation

function

```ts
parseLocation(address: string, options?: ParseOptions): ParsedAddress | null
```

Parses a US, Canadian or Japanese address into its parts. The country is detected from the text (a state, a province, a postal code, Japanese script or romaji designators) unless `options.country` names it. A Japanese address fills its own fields (`prefecture`, `municipality`, `town`, `chome`, `ban`, `go`) and the shared ones that stand for them. Australia and the United Kingdom are read too when their modules are passed in `options.countries` (`australia` from `/au`, `unitedKingdom` from `/gb`): `options.country` picks one, or each module's own detection decides, before the US, Canada and Japan are tried.

- `address`: The address as one string; commas, line breaks and full-width characters are all read.
- `options`: How to parse: the country, strict postal codes, snake_case keys and the rest (see `ParseOptions`).
- Returns: The parts found, or `null` when the text is empty or holds nothing that can be read as an address. A part that is not in the address is absent from the result, never an empty string.

```js
import { parseLocation } from "@johnmorrisdotca/address-plus";

console.log(parseLocation("1600 Pennsylvania Ave NW, Washington, DC 20500"));
// {"number":"1600","street":"Pennsylvania","type":"Ave","suffix":"NW","city":"Washington","state":"DC","zip":"20500","zipValid":true,"country":"US"}
```

### parseLocations

function

```ts
parseLocations(addresses: string[], options?: ParseOptions): (ParsedAddress | null)[]
```

Parses many addresses with `parseLocation`, in order.

- `addresses`: The addresses, one string each.
- `options`: How to parse every one of them (see `ParseOptions`).
- Returns: One result per address, in the same order: the parts, or `null` where an address could not be read.

```js
import { parseLocations } from "@johnmorrisdotca/address-plus";

console.log(parseLocations(["100 Queen St W, Toronto, ON M5H 2N2", "大阪府大阪市北区梅田3-1-1"]).map((one) => one?.country));
// ["CA","JP"]
```

### parseLocationsBatch

function

```ts
parseLocationsBatch(addresses: string[], options?: BatchParseOptions): BatchParseResult<ParsedAddress>
```

Parses many addresses with `parseLocation`, and reports which failed and how long it took. A failure is recorded and the batch goes on, unless `options.stopOnError` is set.

- `addresses`: The addresses, one string each.
- `options`: How to parse, plus the batch settings (see `BatchParseOptions`).
- Returns: The results in order (`null` for a failure), the errors with their index and input, and the counts and timing.

```js
import { parseLocationsBatch } from "@johnmorrisdotca/address-plus";

console.log(parseLocationsBatch(["100 Queen St W, Toronto, ON M5H 2N2", "", "大阪府大阪市北区梅田3-1-1"]).stats.successful);
// 2
```

### ParseOptions

type

```ts
interface ParseOptions {
  country?:
    | "CA"
    | "US"
    | "JP"
    | "AU"
    | "GB"
    | "GY"
    | "IM"
    | "JE"
    | FrenchPostalCountry
    | "DE"
    | "GP"
    | "MQ"
    | "GF"
    | "RE"
    | "YT"
    | "auto"; // Country to optimize parsing for; JP skips the detection and parses as Japanese; AU, GB, FR, DE and the rest need their module in countries
  countries?: readonly CountryModule[]; // Country modules to read beside the US, Canada and Japan: australia from "/au", unitedKingdom from "/gb", france from "/fr", germany from "/de"
  normalize?: boolean; // Whether to normalize street types and directions
  validatePostalCode?: boolean; // Whether to validate postal/ZIP codes
  language?: "auto" | "en" | "fr"; // Language preference for bilingual parsing (Canada)
  extractFacilities?: boolean; // Whether to extract facility names
  parseParenthetical?: boolean; // Whether to parse parenthetical information
  strict?: boolean; // Whether to only extract valid ZIP/postal codes (strict mode) - true: Only extract codes that pass format validation, false (default): Extract all codes but indicate validity with zipValid field
  useSnakeCase?: boolean; // Whether to return field names in snake_case format for backward compatibility - true: Return snake_case field names (sec_unit_type, sec_unit_num, etc.), false (default): Return camelCase field names (secUnitType, secUnitNum, etc.)
}
```

Options for every parser: the country, strict postal codes, snake_case keys and the rest. Every one is optional.

```js
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { ParseOptions } from "@johnmorrisdotca/address-plus/jp";

console.log(Reflect.get(parseLocation("東京都千代田区丸の内1-2-3", { country: "JP", useSnakeCase: true }) ?? {}, "prefecture_code"));
// "13"
```

### parseParenthetical

function

```ts
parseParenthetical(text: string): { secondary: string | undefined; remaining: string; }
```

Takes words in parentheses out of an address, such as `(Rear Entrance)`.

- `text`: The address text.
- Returns: The words in the parentheses (`undefined` when there are none) and the text without them.

```js
import { parseParenthetical } from "@johnmorrisdotca/address-plus";

console.log(parseParenthetical("123 Main St (Rear Entrance)"));
// {"secondary":"Rear Entrance","remaining":"123 Main St"}
```

### parsePostalCode

function

```ts
parsePostalCode(text: string): { zip: string | undefined; plus4: string | undefined; remaining: string; detectedCountry?: "US" | "CA"; detectedProvince?: string; }
```

Takes a ZIP code, ZIP+4 or Canadian postal code off the end of a text.

- `text`: The text, such as `Toronto ON M5H 2N2`.
- Returns: The code and its ZIP+4 (`undefined` when there is none), the text that remains, and the country and province the code points to.

```js
import { parsePostalCode } from "@johnmorrisdotca/address-plus";

console.log(parsePostalCode("Toronto ON M5H 2N2"));
// {"zip":"M5H 2N2","remaining":"Toronto ON","detectedCountry":"CA","detectedProvince":"ON"}
```

### parseSecondaryUnit

function

```ts
parseSecondaryUnit(text: string): { unit: string | undefined; secUnitType: string | undefined; secUnitNum: string | undefined; remaining: string; }
```

Takes a secondary unit (apartment, suite, floor and the rest) off a street line.

- `text`: The street line.
- Returns: The unit as written, its designator in full and its number (each `undefined` when there is none), and the text that remains.

```js
import { parseSecondaryUnit } from "@johnmorrisdotca/address-plus";

console.log(parseSecondaryUnit("123 Main St Apt 4"));
// {"unit":"Apartment 4","secUnitType":"Apartment","secUnitNum":"4","remaining":"123 Main St"}
```

### parseStateProvince

function

```ts
parseStateProvince(text: string): { state: string | undefined; remaining: string; detectedCountry?: "US" | "CA"; }
```

Takes a US state or Canadian province off the end of a text, by code or by name.

- `text`: The text, such as `Anytown NY`.
- Returns: The two-letter code (`undefined` when there is none), the text that remains, and the country it points to.

```js
import { parseStateProvince } from "@johnmorrisdotca/address-plus";

console.log(parseStateProvince("Anytown NY"));
// {"state":"NY","remaining":"Anytown","detectedCountry":"US"}
```

### parseStreetNumber

function

```ts
parseStreetNumber(text: string): { number: string | undefined; remaining: string; }
```

Takes the house number off the start of a street line, with a fraction or a letter if it has one.

- `text`: The street line.
- Returns: The number (`undefined` when there is none) and the text that remains.

```js
import { parseStreetNumber } from "@johnmorrisdotca/address-plus";

console.log(parseStreetNumber("123 Main St"));
// {"number":"123","remaining":"Main St"}
```

### parseStreetType

function

```ts
parseStreetType(text: string, country?: "US" | "CA"): { type: string | undefined; remaining: string; }
```

Takes the street type off the end of a street, abbreviated the USPS way.

- `text`: The street text.
- `country`: `US` or `CA`, for the types only one country uses.
- Returns: The type's USPS abbreviation in lower case (`undefined` when there is none) and the text that remains.

```js
import { parseStreetType } from "@johnmorrisdotca/address-plus";

console.log(parseStreetType("Main Street"));
// {"type":"st","remaining":"Main"}
```

### PO_BOX_PATTERNS

const

```ts
PO_BOX_PATTERNS: { readonly US_PO_BOX: RegExp; readonly STATION_PATTERN: RegExp; readonly LEADING_BOX_NUMBER: RegExp; readonly TRAILING_COMMA: RegExp; }
```

The regular expressions the PO box parser uses: the box itself, a station after it, a box number first, and a trailing comma.

```js
import { PO_BOX_PATTERNS } from "@johnmorrisdotca/address-plus";

console.log(PO_BOX_PATTERNS.US_PO_BOX.exec("PO Box 123, Springfield, IL 62701")?.slice(1));
// ["123","Springfield","IL","62701"]
```

### POSTAL_CODE_TO_PROVINCE

const

```ts
POSTAL_CODE_TO_PROVINCE: Record<string, string>
```

Each first letter of a Canadian postal code, to the province or territory it is assigned to. X is shared by the Northwest Territories and Nunavut and is resolved with `TERRITORY_POSTAL_RANGES`.

```js
import { POSTAL_CODE_TO_PROVINCE } from "@johnmorrisdotca/address-plus";

console.log(POSTAL_CODE_TO_PROVINCE["V"]);
// "BC"
```

### PostalValidationResult

type

```ts
interface PostalValidationResult {
  isValid: boolean;
  type: "zip" | "postal" | null;
  formatted?: string;
  message?: string;
}
```

What `validatePostalCode` returns: whether the code is well formed, its type, and the code written the standard way.

```js
import { validatePostalCode } from "@johnmorrisdotca/address-plus";
import type { PostalValidationResult } from "@johnmorrisdotca/address-plus";

console.log(validatePostalCode("98101"));
// {"isValid":true,"type":"zip","formatted":"98101","message":"Valid US ZIP code format"}
```

### PROVINCE_EXPANSIONS

const

```ts
PROVINCE_EXPANSIONS: Record<string, string>
```

Each Canadian province's code in lower case, to its name in lower case: English by default, the French names under their own keys.

```js
import { PROVINCE_EXPANSIONS } from "@johnmorrisdotca/address-plus";

console.log(PROVINCE_EXPANSIONS["on"]);
// "ontario"
```

### PROVINCE_EXPANSIONS_EN

const

```ts
PROVINCE_EXPANSIONS_EN: Record<string, string>
```

Each Canadian province's code in lower case, to its English name in lower case.

```js
import { PROVINCE_EXPANSIONS_EN } from "@johnmorrisdotca/address-plus";

console.log(PROVINCE_EXPANSIONS_EN["qc"]);
// "quebec"
```

### PROVINCE_EXPANSIONS_FR

const

```ts
PROVINCE_EXPANSIONS_FR: Record<string, string>
```

Each Canadian province's code in lower case, to its French name in lower case.

```js
import { PROVINCE_EXPANSIONS_FR } from "@johnmorrisdotca/address-plus";

console.log(PROVINCE_EXPANSIONS_FR["qc"]);
// "québec"
```

### Region

type

```ts
type Region = {
  abbr: string;
  country: "CA" | "US";
  name: string;
};
```

A US state or Canadian province: its code, its country and its name, as `normalizeRegion` matches them.

```js
import { CA_REGIONS } from "@johnmorrisdotca/address-plus";
import type { Region } from "@johnmorrisdotca/address-plus";

console.log(CA_REGIONS[0]);
// {"abbr":"AB","country":"CA","name":"alberta"}
```

### SECONDARY_UNIT_PATTERN

const

```ts
SECONDARY_UNIT_PATTERN: RegExp
```

A unit at the end of a street line: group 1 is the street before it, group 2 the unit.

```js
import { SECONDARY_UNIT_PATTERN } from "@johnmorrisdotca/address-plus";

console.log(SECONDARY_UNIT_PATTERN.exec("123 Main St Apt 4")?.[2]);
// "Apt 4"
```

### SECONDARY_UNIT_TYPES

const

```ts
SECONDARY_UNIT_TYPES: Record<string, string>
```

Each secondary unit designator, abbreviated or in full, in lower case, to the word the parser reports in full: USPS Publication 28 Appendix C2, and Canada Post's French unit words, which stay French.

```js
import { SECONDARY_UNIT_TYPES } from "@johnmorrisdotca/address-plus";

console.log(SECONDARY_UNIT_TYPES["ste"]);
// "Suite"
```

### setValidatedPostalCode

function

```ts
setValidatedPostalCode(result: ParsedAddress | ParsedIntersection, zipCode: string, options: ParseOptions): void
```

Sets a ZIP or postal code on a result, the way the parsers do: split into ZIP and ZIP+4, a Canadian code in capitals with one space, with `zipValid` set, and in strict mode only when the code is well formed. It changes the object it is given.

- `result`: The parsed address or intersection to set the code on.
- `zipCode`: The code as written.
- `options`: `strict` keeps a malformed code out (see `ParseOptions`).

```js
import { setValidatedPostalCode } from "@johnmorrisdotca/address-plus";

const parsed = { city: "Toronto", state: "ON" };
setValidatedPostalCode(parsed, "m5h2n2", {});
console.log(parsed);
// {"city":"Toronto","state":"ON","zip":"M5H 2N2"}
```

### StateCode

type

```ts
type StateCode =
  | "AL"
  | "AK"
  | "AZ"
  | "AR"
  | "CA"
  | "CO"
  | "CT"
  | "DC"
  | "DE"
  | "FL"
  | "GA"
  | "HI"
  | "ID"
  | "IL"
  | "IN"
  | "IA"
  | "KS"
  | "KY"
  | "LA"
  | "ME"
  | "MD"
  | "MA"
  | "MI"
  | "MN"
  | "MS"
  | "MO"
  | "MT"
  | "NE"
  | "NV"
  | "NH"
  | "NJ"
  | "NM"
  | "NY"
  | "NC"
  | "ND"
  | "OH"
  | "OK"
  | "OR"
  …
```

A US state, DC or territory code that `getStateFromZip` can return.

```js
import { getStateFromZip } from "@johnmorrisdotca/address-plus";
import type { StateCode } from "@johnmorrisdotca/address-plus";

console.log(getStateFromZip("00901"));
// "PR"
```

### STREET_NAME_ACRONYMS

const

```ts
STREET_NAME_ACRONYMS: Map<string, string>
```

Acronyms written in capitals inside a street name (`US`, `FBI`), from their lower-case form, for `capitalizeStreetName`.

```js
import { STREET_NAME_ACRONYMS } from "@johnmorrisdotca/address-plus";

console.log(STREET_NAME_ACRONYMS.get("fbi"));
// "FBI"
```

### STREET_TYPE_DETECTION_PATTERN

const

```ts
STREET_TYPE_DETECTION_PATTERN: RegExp
```

Whether a text has a common street type in it, used to judge that a parse found a street.

```js
import { STREET_TYPE_DETECTION_PATTERN } from "@johnmorrisdotca/address-plus";

console.log(STREET_TYPE_DETECTION_PATTERN.test("123 Main Street"));
// true
```

### STREET_TYPE_EXPANSIONS

const

```ts
STREET_TYPE_EXPANSIONS: Record<string, string>
```

Each USPS street type abbreviation in lower case, to the word in full.

```js
import { STREET_TYPE_EXPANSIONS } from "@johnmorrisdotca/address-plus";

console.log(STREET_TYPE_EXPANSIONS["blvd"]);
// "Boulevard"
```

### STREET_TYPE_PROPER_CASE

const

```ts
STREET_TYPE_PROPER_CASE: Record<string, string>
```

Each street type abbreviation in lower case, to the way the parser reports it (`Ave`, `Xing`).

```js
import { STREET_TYPE_PROPER_CASE } from "@johnmorrisdotca/address-plus";

console.log(STREET_TYPE_PROPER_CASE["xing"]);
// "Xing"
```

### SubRegion

type

```ts
interface SubRegion {
  name: string; // Primary normalized name (lowercase, trimmed)
  parentCity: string; // Parent city name (empty if not applicable)
  state: string; // State/province code (e.g., "NY", "QC")
  country: "US" | "CA"; // Country code
  type: "borough" | "parish" | "district" | "ward" | "arrondissement" | "quadrant"; // Administrative type
  aliases?: string[]; // Alternative names, abbreviations, bilingual variants, no-space versions
}
```

An administrative part of a city (a borough, a parish, a ward, an arrondissement) that may be written where the city is expected.

```js
import type { SubRegion } from "@johnmorrisdotca/address-plus";

console.log(({ name: "brooklyn", parentCity: "new york", state: "NY", country: "US", type: "borough" }).type);
// "borough"
```

### TERRITORY_POSTAL_PREFIXES

const

```ts
TERRITORY_POSTAL_PREFIXES: Record<string, string[]>
```

The first three characters of each territory's postal codes, since the territories share a first letter.

```js
import { TERRITORY_POSTAL_PREFIXES } from "@johnmorrisdotca/address-plus";

console.log(TERRITORY_POSTAL_PREFIXES["NU"]);
// ["X0A","X0B","X0C"]
```

### TERRITORY_POSTAL_RANGES

const

```ts
TERRITORY_POSTAL_RANGES: { pattern: RegExp; province: string; }[]
```

The patterns that tell the Northwest Territories' X codes from Nunavut's, by their first three characters.

```js
import { TERRITORY_POSTAL_RANGES } from "@johnmorrisdotca/address-plus";

console.log(TERRITORY_POSTAL_RANGES.find((range) => range.pattern.test("X0A"))?.province);
// "NU"
```

### TestCase

type

```ts
type TestCase =
  | AddressParsingTestCase
  | AddressFormattingTestCase
  | AddressValidationTestCase
  | AddressComparisonTestCase
  | CleanAddressTestCase
  | BatchProcessingTestCase;
```

Any case in the package's JSON test files.

```js
import type { TestCase } from "@johnmorrisdotca/address-plus";

console.log(({ input: "98101", expected: "WA" }).input);
// "98101"
```

### TestCaseBase

type

```ts
interface TestCaseBase {
  name?: string; // Human-readable name or description of what this test case validates
  description?: string; // Human-readable description of what this test case validates (alternative to name)
  input: unknown; // The input data for the test
  expected: unknown; // The expected output/result of the test
  options?: Record<string, unknown>; // Optional configuration or parsing options for the test
}
```

The fields every case in the package's JSON test files has: a name or description, the input, what is expected and the options. Exported for tools that read those files.

```js
import type { TestCaseBase } from "@johnmorrisdotca/address-plus";

console.log(({ name: "a ZIP code", input: "98101", expected: "WA" }).expected);
// "WA"
```

### UKAddressFields

type

```ts
interface UKAddressFields {
  subBuilding?: string; // A part of a building with no number: "Basement Flat", "Stables Flat"
  dependentThoroughfare?: string; // A thoroughfare inside another: the "Seastone Cottages" of "1A Seastone Cottages, Station Road"
  doubleDependentLocality?: string; // A locality inside the dependent locality, written above it
  county?: string; // A county, when one is written; Royal Mail no longer needs it
  nation?: UKNationCode; // The nation the postcode delivers to, from the tables
  bfpo?: string; // A British Forces Post Office number: the 105 of "BFPO 105"
}
```

The fields an address in the United Kingdom fills beside the shared ones. The shared fields keep their meaning: `number` is the building number, `street` and `type` the thoroughfare's name and its descriptor in full (`Upper` and `Street`, as Royal Mail writes it), `secUnitType` and `secUnitNum` a flat or unit (`Flat 2`) or a PO Box, `building` the building's name, `locality` the dependent locality, `city` the post town and `zip` the postcode.

```js
import { parseUKAddress } from "@johnmorrisdotca/address-plus/gb";
import type { UKAddressFields } from "@johnmorrisdotca/address-plus/gb";

console.log(parseUKAddress("Flat 2, Rose Court, 14 High Street, Kingsbury, LONDON NW9 0AA")?.locality);
// "Kingsbury"
```

### UKNation

type

```ts
interface UKNation {
  code: UKNationCode;
  iso: string; // GB-SCT
  name: string; // Scotland
  nameJa: string; // スコットランド
}
```

A nation of the United Kingdom in the tables: its code, its ISO 3166-2 code, and its name in English and in Japanese (from kuni, which takes them from Unicode CLDR and Wikidata).

```js
import { GB_NATIONS } from "@johnmorrisdotca/address-plus/gb";
import type { UKNation } from "@johnmorrisdotca/address-plus/gb";

console.log(GB_NATIONS.find((nation) => nation.code === "SCT"));
// {"code":"SCT","iso":"GB-SCT","name":"Scotland","nameJa":"スコットランド"}
```

### UKNationCode

type

```ts
type UKNationCode = "ENG" | "NIR" | "SCT" | "WLS";
```

The code of one of the four nations of the United Kingdom, as ISO 3166-2:GB writes it after `GB-`.

```js
import { getNationFromUKPostcode } from "@johnmorrisdotca/address-plus/gb";
import type { UKNationCode } from "@johnmorrisdotca/address-plus/gb";

console.log(getNationFromUKPostcode("CF10 1AA"));
// "WLS"
```

### UKPostcode

type

```ts
interface UKPostcode {
  postcode: string; // Capitals, one space: EC1A 1BB
  outward: string; // EC1A
  inward: string; // 1BB
  area: string; // EC
  district: string; // EC1A, the same as the outward code
  sector: string; // EC1A 1
  country: "GB" | "GY" | "IM" | "JE";
  nation?: UKNationCode; // Absent outside the United Kingdom, and for a non-geographic area (BX, BF)
}
```

A postcode taken apart: the outward code (area and district) and the inward code (sector and unit), and where it delivers. `country` is `GB` for the United Kingdom and `JE`, `GY` or `IM` for Jersey, Guernsey and the Isle of Man, which use Royal Mail's postcodes but are not part of the United Kingdom.

```js
import { parseUKPostcode } from "@johnmorrisdotca/address-plus/gb";
import type { UKPostcode } from "@johnmorrisdotca/address-plus/gb";

console.log(parseUKPostcode("ec1a1bb"));
// {"postcode":"EC1A 1BB","outward":"EC1A","inward":"1BB","area":"EC","district":"EC1A","sector":"EC1A 1","country":"GB","nation":"ENG"}
```

### UNIT_TYPE_KEYWORDS

const

```ts
UNIT_TYPE_KEYWORDS: string
```

The secondary unit designators that take a value after them, as one alternation for a regular expression, longest first so that `apartment` is tried before `apt`: USPS Publication 28 Appendix C2, Canada Post's English and French unit words, and a few spellings people write.

```js
import { UNIT_TYPE_KEYWORDS } from "@johnmorrisdotca/address-plus";

console.log(new RegExp("^(?:" + UNIT_TYPE_KEYWORDS + ")$", "i").test("suite"));
// true
```

### UNIT_TYPE_NUMBER_PATTERN

const

```ts
UNIT_TYPE_NUMBER_PATTERN: RegExp
```

A unit's designator and value: groups 1 and 2 (`apt 123`, `Apt. #4B`), groups 3 and 4 for a lot run together (`lt42`), group 5 for the value after a bare `#`.

```js
import { UNIT_TYPE_NUMBER_PATTERN } from "@johnmorrisdotca/address-plus";

console.log(UNIT_TYPE_NUMBER_PATTERN.exec("Apt. #4B")?.slice(1, 3));
// ["Apt","4B"]
```

### US_REGIONS

const

```ts
US_REGIONS: Region[]
```

Every name and other spelling of a US state, DC or territory as a `Region` object, for fuzzy matching by `normalizeRegion`.

```js
import { US_REGIONS } from "@johnmorrisdotca/address-plus";

console.log(US_REGIONS.find((region) => region.abbr === "WA")?.name);
// "washington"
```

### US_STATE_ALTERNATIVES

const

```ts
US_STATE_ALTERNATIVES: Record<string, string>
```

Other ways US states are written (shortened forms, old abbreviations, `D.C.`), in lower case, to their codes.

```js
import { US_STATE_ALTERNATIVES } from "@johnmorrisdotca/address-plus";

console.log(US_STATE_ALTERNATIVES["calif"]);
// "CA"
```

### US_STATE_EXPANSIONS

const

```ts
US_STATE_EXPANSIONS: Record<string, string>
```

Each US state's code in lower case, to its name in lower case: the reverse of `US_STATE_NAMES`.

```js
import { US_STATE_EXPANSIONS } from "@johnmorrisdotca/address-plus";

console.log(US_STATE_EXPANSIONS["wa"]);
// "washington"
```

### US_STATE_NAMES

const

```ts
US_STATE_NAMES: Record<string, string>
```

Every US state, DC and territory by its name in lower case, to its two-letter code.

```js
import { US_STATE_NAMES } from "@johnmorrisdotca/address-plus";

console.log(US_STATE_NAMES["new york"]);
// "NY"
```

### US_STATES

const

```ts
US_STATES: Record<string, string>
```

Every name and other spelling of a US state in lower case, to its code: `US_STATE_NAMES` and `US_STATE_ALTERNATIVES` together.

```js
import { US_STATES } from "@johnmorrisdotca/address-plus";

console.log(US_STATES["mass"]);
// "MA"
```

### US_STREET_TYPES

const

```ts
US_STREET_TYPES: Record<string, string>
```

Every street type USPS Publication 28 lists, and the common spellings of each, in lower case, to its USPS abbreviation in lower case.

```js
import { US_STREET_TYPES } from "@johnmorrisdotca/address-plus";

console.log(US_STREET_TYPES["boulevard"]);
// "blvd"
```

### USPSFormattingOptions

type

```ts
interface USPSFormattingOptions {
  includeDeliveryLine?: boolean; // Whether to include delivery line
  includeLastLine?: boolean; // Whether to include city/state/ZIP line
  includeBarcode?: boolean; // Whether to include postal barcode
  standardizeCase?: boolean; // Whether to standardize case per USPS guidelines
}
```

Options for `formatUSPS`: which lines to include, and whether to set the letter case the USPS way.

```js
import { formatUSPS, parseLocation } from "@johnmorrisdotca/address-plus";
import type { USPSFormattingOptions } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parseLocation("123 Main St, Anytown, NY 12345");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatUSPS(parsedAddress1, { includeLastLine: false }).lines);
// ["123 MAIN ST"]
```

### validateAddress

function

```ts
validateAddress(addressString: string, options?: ValidationOptions): AddressValidationResult
```

Checks an address: whether it has what an address needs, whether its ZIP or postal code is well formed and belongs to the state, province or prefecture named, and how sure the parser is. With country modules in `options.countries`, an Australian or British address is checked by its module's validator.

- `addressString`: The address as one string.
- `options`: What to require and how strict to be (see `ValidationOptions`).
- Returns: Whether it is valid, the confidence and completeness from 0 to 1, every error and warning with its code, suggestions, and the parsed address (`null` when it could not be parsed).

```js
import { validateAddress } from "@johnmorrisdotca/address-plus";

console.log(validateAddress("123 Main St, Seattle, NY 98101").warnings[0].code);
// "POSTAL_REGION_MISMATCH"
```

### validateJapaneseAddress

function

```ts
validateJapaneseAddress(address: ParsedAddress, options?: ValidationOptions): JapaneseValidation
```

Checks a parsed Japanese address against the tables: the postal code's shape, whether any code begins with its first three digits, whether it delivers to the prefecture named, and whether the municipality is a real one in that prefecture.

- `address`: The address, as `parseLocation` returns it for a Japanese address.
- `options`: `strictPostalValidation` makes the postal findings errors rather than warnings; the municipality findings stay warnings.
- Returns: The errors and the warnings, each with its field, code and message.

```js
import { validateJapaneseAddress } from "@johnmorrisdotca/address-plus/jp";
import { parseLocation } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parseLocation("〒530-0001 東京都千代田区丸の内1-2-3");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(validateJapaneseAddress(parsedAddress1).warnings.map((one) => one.code));
// ["POSTAL_REGION_MISMATCH"]
```

### validatePostalCode

function

```ts
validatePostalCode: (code: string) => PostalValidationResult
```

Checks the shape of a US ZIP code or a Canadian postal code.

- `code`: The code, with or without the space or the ZIP+4.
- Returns: Whether it is well formed, its type (`zip` or `postal`), and the code written the standard way.

```js
import { validatePostalCode } from "@johnmorrisdotca/address-plus";

console.log(validatePostalCode("k1a0b1"));
// {"isValid":true,"type":"postal","formatted":"K1A 0B1","message":"Valid Canadian postal code format"}
```

### VALIDATION_PATTERNS

const

```ts
VALIDATION_PATTERNS: { readonly HAS_LETTERS: RegExp; readonly ALPHANUMERIC: RegExp; readonly HAS_DIGITS: RegExp; readonly HOUSE_NUMBER_START: RegExp; readonly STARTS_WITH_NUMBER: RegExp; readonly WHITESPACE_SPLIT: RegExp; readonly TITLE_CASE: RegExp; readonly NUMERIC_ONLY: RegExp; readonly NON_WORD: RegExp; readonly REGEX_ESCAPE: RegExp; readonly NORMALIZE_SPACES: RegExp; readonly PO_BOX_NORMALIZE: RegExp; }
```

Small regular expressions the validators share: letters, digits, a house number at the start, and the like.

```js
import { VALIDATION_PATTERNS } from "@johnmorrisdotca/address-plus";

console.log(VALIDATION_PATTERNS.STARTS_WITH_NUMBER.test("123 Main St"));
// true
```

### ValidationError

type

```ts
interface ValidationError {
  field: string; // Field name where error occurred
  code: string; // Error code identifier
  message: string; // Human-readable error message
  severity: "error" | "warning" | "info"; // Severity level of the validation issue
}
```

One finding of a validator: the field it is about, its code, a message, and how serious it is.

```js
import { validateAddress } from "@johnmorrisdotca/address-plus";
import type { ValidationError } from "@johnmorrisdotca/address-plus/jp";

console.log(validateAddress("123 Main St, Seattle, NY 98101").warnings[0]);
// {"field":"zip","code":"POSTAL_REGION_MISMATCH","message":"ZIP code 98101 belongs to WA, not NY","severity":"warning"}
```

### ValidationOptions

type

```ts
interface ValidationOptions {
  requireStreetNumber?: boolean; // Whether street number is required
  requireStreetName?: boolean; // Whether street name is required
  requireCity?: boolean; // Whether city is required
  requireState?: boolean; // Whether state/province is required
  requirePostalCode?: boolean; // Whether postal code is required
  allowPOBox?: boolean; // Whether PO Box addresses are allowed
  allowRuralRoute?: boolean; // Whether rural route addresses are allowed
  allowGeneralDelivery?: boolean; // Whether general delivery addresses are allowed
  strictPostalValidation?: boolean; // Whether to use strict postal code validation
  country?: ParseOptions["country"]; // Country context for validation rules; AU, GB, FR, DE and the rest need their module in countries
  countries?: readonly import("./country-module").CountryModule[]; // Country modules to read beside the US, Canada and Japan
}
```

Options for the validators: which parts an address must have, which kinds are allowed, and whether a postal code that does not match its region is an error.

```js
import { validateAddress } from "@johnmorrisdotca/address-plus";
import type { ValidationOptions } from "@johnmorrisdotca/address-plus/jp";

console.log(validateAddress("123 Main St", { requirePostalCode: true }).errors.map((error) => error.code));
// ["MISSING_POSTAL_CODE"]
```

### WRITTEN_NUMBERS

const

```ts
WRITTEN_NUMBERS: string
```

House numbers written as words (`One`, `Twenty`), as one alternation for a regular expression, so `One Microsoft Way` is read as number 1.

```js
import { WRITTEN_NUMBERS } from "@johnmorrisdotca/address-plus";

console.log(new RegExp("^(?:" + WRITTEN_NUMBERS + ")$", "i").test("one"));
// true
```

### ZIP_CODE_PATTERN

const

```ts
ZIP_CODE_PATTERN: RegExp
```

A US ZIP code with an optional ZIP+4.

```js
import { ZIP_CODE_PATTERN } from "@johnmorrisdotca/address-plus";

console.log(ZIP_CODE_PATTERN.test("98101-1234"));
// true
```

### ZIP_CODE_REGEX_PATTERN

const

```ts
ZIP_CODE_REGEX_PATTERN: string
```

The source of `ZIP_CODE_PATTERN`, for building larger patterns.

```js
import { ZIP_CODE_REGEX_PATTERN } from "@johnmorrisdotca/address-plus";

console.log(ZIP_CODE_REGEX_PATTERN.length > 0);
// true
```

### ZIP_VALIDATION_PATTERNS

const

```ts
ZIP_VALIDATION_PATTERNS: { readonly POTENTIAL_ZIP: RegExp; }
```

The shape of something that could be a ZIP code.

```js
import { ZIP_VALIDATION_PATTERNS } from "@johnmorrisdotca/address-plus";

console.log(ZIP_VALIDATION_PATTERNS.POTENTIAL_ZIP.test("98101"));
// true
```


## @johnmorrisdotca/address-plus/jp

### findMunicipalitiesByName

function

```ts
findMunicipalitiesByName(name: string, prefectureCode?: string): JapaneseMunicipality[]
```

The municipalities a Japanese name could mean: several when the name is shared (`府中市` is in Tokyo and in Hiroshima). A town or village may be named without its district (`当別町`).

- `name`: The municipality's name in Japanese.
- `prefectureCode`: A prefecture's JIS code, to look in that prefecture only.
- Returns: Every match, an empty array when there is none.

```js
import { findMunicipalitiesByName } from "@johnmorrisdotca/address-plus/jp";

console.log(findMunicipalitiesByName("府中市").map((one) => one.code + " " + one.romaji));
// ["13206 Fuchu-shi","34208 Fuchu-shi"]
```

### findMunicipalitiesByRomaji

function

```ts
findMunicipalitiesByRomaji(text: string, prefectureCode?: string): JapaneseMunicipality[]
```

The municipalities a romaji name could mean, written with or without macrons and designators (`Chiyoda-ku`, `Chiyoda City`, `Sapporo-shi Chuo-ku`, `Chuo-ku, Sapporo`). A town written without its district, and then a ward written without its city, are looked up when the full name finds nothing.

- `text`: The name in romaji.
- `prefectureCode`: A prefecture's JIS code, to look in that prefecture only.
- Returns: Every match, an empty array when there is none.

```js
import { findMunicipalitiesByRomaji } from "@johnmorrisdotca/address-plus/jp";

console.log(findMunicipalitiesByRomaji("Chuo-ku, Sapporo").map((one) => one.name));
// ["札幌市中央区"]
```

### findMunicipalityByCode

function

```ts
findMunicipalityByCode(code: string): JapaneseMunicipality | null
```

The municipality with a JIS X 0402 code, a designated city's own code included.

- `code`: The five-digit code.
- Returns: The municipality, or `null` for a code the tables do not have.

```js
import { findMunicipalityByCode } from "@johnmorrisdotca/address-plus/jp";

console.log(findMunicipalityByCode("13101")?.name);
// "千代田区"
```

### findPrefecture

function

```ts
findPrefecture(text: string): JapanesePrefecture | null
```

The prefecture a name, reading, romaji spelling or JIS code refers to: `東京都`, `東京`, `トウキョウト`, `Tokyo`, `Osaka Prefecture`, `13`.

- `text`: The name, reading or code; letter case and macrons do not matter.
- Returns: The prefecture, or `null` when the text names none.

```js
import { findPrefecture } from "@johnmorrisdotca/address-plus/jp";

console.log(findPrefecture("Osaka Prefecture")?.name);
// "大阪府"
```

### formatJapanese

function

```ts
formatJapanese(address: ParsedAddress, options?: JapaneseFormattingOptions): string
```

Writes a Japanese address in Japanese order, as an envelope is addressed: `〒100-0005`, then `東京都千代田区丸の内1-2-3`, then `サンプルビル5階501号室`. The prefecture and municipality are always in kanji, from the tables. A town or building parsed from romaji keeps its romaji, set off by spaces so the scripts do not run together. Kyoto's street directions are written before the town.

- `address`: The address, as `parseLocation` returns it for a Japanese address.
- `options`: The block's style (`1-2-3` or `1丁目2番3号`), the postal code, and lines or one line (see `JapaneseFormattingOptions`).
- Returns: The address as text, its lines joined with newlines unless `options.multiline` is `false`; an empty string when the address has none of the parts.

```js
import { formatJapanese } from "@johnmorrisdotca/address-plus/jp";
import { parseLocation } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parseLocation("〒100-0005 東京都千代田区丸の内1-2-3");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatJapanese(parsedAddress1, { blockStyle: "markers", multiline: false }));
// "〒100-0005 東京都千代田区丸の内1丁目2番3号"
```

### formatJapaneseEnglish

function

```ts
formatJapaneseEnglish(address: ParsedAddress, options?: JapaneseEnglishFormattingOptions): string
```

Writes a Japanese address in English order, as a form from abroad expects: building, room, block, town, municipality, prefecture, postal code, Japan. The prefecture and municipality are always romaji, from the tables; the town and building are written as they were parsed, since the tables hold no romaji for towns.

- `address`: The address, as `parseLocation` returns it for a Japanese address.
- `options`: Whether to end with the postal code and with Japan (see `JapaneseEnglishFormattingOptions`).
- Returns: The address as one line, its parts joined by commas.

```js
import { formatJapaneseEnglish } from "@johnmorrisdotca/address-plus/jp";
import { parseLocation } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parseLocation("1-2-3 Marunouchi, Chiyoda-ku, Tokyo 100-0005");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatJapaneseEnglish(parsedAddress1));
// "1-2-3 Marunouchi, Chiyoda-ku, Tokyo 100-0005, Japan"
```

### getPostalPrefixesForPrefecture

function

```ts
getPostalPrefixesForPrefecture(prefecture: string): string[]
```

The three-digit postal prefixes a prefecture's codes begin with, the reverse of `getPrefectureFromJapanesePostalCode`. A prefix on a border is listed under the prefecture most of its codes belong to.

- `prefecture`: The prefecture, by JIS code, name or romaji, as `findPrefecture` reads it.
- Returns: The prefixes in ascending order, an empty array for an unknown prefecture.

```js
import { getPostalPrefixesForPrefecture } from "@johnmorrisdotca/address-plus/jp";

console.log(getPostalPrefixesForPrefecture("沖縄県"));
// ["900","901","902","903","904","905","906","907"]
```

### getPrefectureFromJapanesePostalCode

function

```ts
getPrefectureFromJapanesePostalCode(postalCode: string): string | null
```

The prefecture a Japanese postal code delivers to, from Japan Post's data: by its first three digits, and for the codes on the far side of a prefix that straddles a border, by the whole code.

- `postalCode`: The seven-digit code, with or without its hyphen, in either width.
- Returns: The prefecture's JIS code, or `null` for a malformed code or one no Japanese code begins like.

```js
import { getPrefectureFromJapanesePostalCode } from "@johnmorrisdotca/address-plus/jp";

console.log(getPrefectureFromJapanesePostalCode("530-0001"));
// "27"
```

### JapaneseAddressFields

type

```ts
interface JapaneseAddressFields {
  postalCode?: string; // 〒 code as NNN-NNNN
  prefecture?: string; // 東京都
  prefectureCode?: string; // JIS code: "13"
  prefectureRomaji?: string; // Tokyo
  municipality?: string; // 千代田区
  municipalityCode?: string; // JIS code: "13101"
  municipalityRomaji?: string; // Chiyoda-ku
  streetDirections?: string; // Kyoto's street directions before the town (通り名): 寺町通御池上る
  town?: string; // 丸の内 (大字・町名), without the chome
  chome?: string; // 丁目: "1"
  ban?: string; // 番 (番地): "2"
  go?: string; // 号: "3"
  block?: string; // The numbered block as one string: "1-2-3"
  building?: string; // サンプルビル
  floor?: string; // 階: "5"
  room?: string; // 号室: "501"
}
```

The fields a Japanese address fills on top of the shared ones. Every value is normalised: full-width and kanji numerals become ASCII digits, and the block is split into chome, ban and go whichever way it was written.

```js
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { JapaneseAddressFields } from "@johnmorrisdotca/address-plus/jp";

console.log(parseLocation("〒100-0005 東京都千代田区丸の内1丁目2番3号")?.municipalityCode);
// "13101"
```

### JapaneseEnglishFormattingOptions

type

```ts
interface JapaneseEnglishFormattingOptions {
  includeCountry?: boolean; // ", Japan" at the end; default true
  includePostalCode?: boolean; // Default true
}
```

Options for `formatJapaneseEnglish`.

```js
import { formatJapaneseEnglish } from "@johnmorrisdotca/address-plus/jp";
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { JapaneseEnglishFormattingOptions } from "@johnmorrisdotca/address-plus/jp";

const parsedAddress1=parseLocation("〒100-0005 東京都千代田区丸の内1-2-3");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatJapaneseEnglish(parsedAddress1, { includeCountry: false }));
// "1-2-3 丸の内, Chiyoda-ku, Tokyo 100-0005"
```

### JapaneseFormattingOptions

type

```ts
interface JapaneseFormattingOptions {
  blockStyle?: "hyphen" | "markers"; // 1-2-3 (default) or 1丁目2番3号
  includePostalCode?: boolean; // 〒100-0005 on its own line; default true
  multiline?: boolean; // Lines joined with newlines (default) or one line with spaces
}
```

Options for `formatJapanese`.

```js
import { formatJapanese } from "@johnmorrisdotca/address-plus/jp";
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { JapaneseFormattingOptions } from "@johnmorrisdotca/address-plus/jp";

const parsedAddress1=parseLocation("〒100-0005 東京都千代田区丸の内1-2-3");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatJapanese(parsedAddress1, { blockStyle: "markers", includePostalCode: false }));
// "東京都千代田区丸の内1丁目2番3号"
```

### JapaneseMunicipality

type

```ts
interface JapaneseMunicipality {
  code: string; // JIS X 0402 code, five digits; the first two are the prefecture's
  prefecture: string; // The prefecture's JIS code
  name: string; // Official name, with the district for towns and villages in one: 千代田区, 札幌市中央区, 石狩郡当別町
  kana: string; // Reading in katakana
  romaji: string; // Romaji with designators hyphenated on: Chiyoda-ku, Sapporo-shi Chuo-ku, Ishikari-gun Tobetsu-cho
}
```

A municipality (市区町村) in the tables: its JIS code, its prefecture's code, its official name with the district for a town or village in one, its reading and its romaji.

```js
import { findMunicipalityByCode } from "@johnmorrisdotca/address-plus/jp";
import type { JapaneseMunicipality } from "@johnmorrisdotca/address-plus/jp";

console.log(findMunicipalityByCode("13101"));
// {"code":"13101","prefecture":"13","name":"千代田区","kana":"チヨダク","romaji":"Chiyoda-ku"}
```

### JapanesePrefecture

type

```ts
interface JapanesePrefecture {
  code: string; // JIS X 0401 code, "01" (Hokkaido) to "47" (Okinawa)
  name: string; // Official name with its designator: 東京都, 大阪府, 北海道, 愛知県
  kana: string; // Reading in katakana: トウキョウト
  romaji: string; // Romaji with the designator hyphenated on: Tokyo-to
}
```

A prefecture (都道府県) in the tables: its JIS code, official name, katakana reading and romaji.

```js
import { findPrefecture } from "@johnmorrisdotca/address-plus/jp";
import type { JapanesePrefecture } from "@johnmorrisdotca/address-plus/jp";

console.log(findPrefecture("13"));
// {"code":"13","name":"東京都","kana":"トウキョウト","romaji":"Tokyo-to"}
```

### JapaneseValidation

type

```ts
interface JapaneseValidation {
  errors: ValidationError[];
  warnings: ValidationError[];
}
```

What `validateJapaneseAddress` returns: the errors and the warnings found.

```js
import { validateJapaneseAddress } from "@johnmorrisdotca/address-plus/jp";
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { JapaneseValidation } from "@johnmorrisdotca/address-plus/jp";

const parsedAddress1=parseLocation("東京都大阪市北区梅田1-1");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(validateJapaneseAddress(parsedAddress1).warnings.map((one) => one.code));
// ["MUNICIPALITY_PREFECTURE_MISMATCH"]
```

### JP_DESIGNATED_CITIES

const

```ts
JP_DESIGNATED_CITIES: readonly JapaneseMunicipality[]
```

The twenty designated cities (政令指定都市) as municipalities of their own. Geolonia lists only their wards, but addresses often name the city alone (`大阪市`, `Sapporo`), and the city has a JIS code of its own: its wards' codes with the last digit 0 (札幌市 01100).

```js
import { JP_DESIGNATED_CITIES } from "@johnmorrisdotca/address-plus/jp";

console.log(JP_DESIGNATED_CITIES.length);
// 20
```

### JP_MUNICIPALITIES

const

```ts
JP_MUNICIPALITIES: readonly JapaneseMunicipality[]
```

Every municipality (市区町村) by JIS X 0402 code, with its prefecture, official name, reading and romaji; a designated city's wards are listed, and the city itself is in `JP_DESIGNATED_CITIES`. Generated from Geolonia 住所データ (MIT).

```js
import { JP_MUNICIPALITIES } from "@johnmorrisdotca/address-plus/jp";

console.log(JP_MUNICIPALITIES.find((one) => one.code === "13101")?.name);
// "千代田区"
```

### JP_POSTAL_EXCEPTIONS

const

```ts
JP_POSTAL_EXCEPTIONS: Readonly<Record<string, string>>
```

The postal codes that deliver to another prefecture than the rest of their three-digit prefix, each to that prefecture's JIS code. Generated from Japan Post's KEN_ALL.CSV through jp-postal (MIT).

```js
import { JP_POSTAL_EXCEPTIONS } from "@johnmorrisdotca/address-plus/jp";

console.log(Object.keys(JP_POSTAL_EXCEPTIONS).length > 0);
// true
```

### JP_POSTAL_PREFIXES

const

```ts
JP_POSTAL_PREFIXES: Readonly<Record<string, string>>
```

Each three-digit postal prefix, to the JIS code of the prefecture most of its codes deliver to. Generated from Japan Post's KEN_ALL.CSV through jp-postal (MIT).

```js
import { JP_POSTAL_PREFIXES } from "@johnmorrisdotca/address-plus/jp";

console.log(JP_POSTAL_PREFIXES["530"]);
// "27"
```

### JP_PREFECTURES

const

```ts
JP_PREFECTURES: readonly JapanesePrefecture[]
```

The 47 prefectures in JIS X 0401 order, each with its code, official name, katakana reading and romaji. Generated from Geolonia 住所データ (MIT).

```js
import { JP_PREFECTURES } from "@johnmorrisdotca/address-plus/jp";

console.log(JP_PREFECTURES.length);
// 47
```

### kanjiNumeralsToDigits

function

```ts
kanjiNumeralsToDigits(text: string): string
```

Turns the kanji numerals that stand for block, floor or room numbers into digits: `一丁目二番三号` becomes `1丁目2番3号`. A numeral that is part of a name stays: `北一条西`, `三番町`, `麻布十番`, `二階堂`.

- `text`: Japanese text.
- Returns: The text with those numerals as digits.

```js
import { kanjiNumeralsToDigits } from "@johnmorrisdotca/address-plus/jp";

console.log(kanjiNumeralsToDigits("二丁目十五番"));
// "2丁目15番"
```

### looksJapanese

function

```ts
looksJapanese(text: string): boolean
```

Whether a text is a Japanese address: in Japanese script, ending with Japan, or naming a prefecture beside a Japanese postal code, a romaji designator (`-ku`, `-shi`) or a municipality written with an English word (`Chiyoda City`). A US address that only mentions a Japanese name (`100 Tokyo Ave`) does not count.

- `text`: The text.
- Returns: `true` when the text should be read as Japanese.

```js
import { looksJapanese } from "@johnmorrisdotca/address-plus/jp";

console.log(looksJapanese("1-2-3 Marunouchi, Chiyoda-ku, Tokyo"));
// true
```

### municipalitiesOf

function

```ts
municipalitiesOf(prefectureCode: string): readonly JapaneseMunicipality[]
```

Every municipality of a prefecture, the designated cities included.

- `prefectureCode`: The prefecture's JIS code.
- Returns: The municipalities, an empty array for an unknown code.

```js
import { municipalitiesOf } from "@johnmorrisdotca/address-plus/jp";

console.log(municipalitiesOf("47").length);
// 41
```

### normalizeJapaneseAddressText

function

```ts
normalizeJapaneseAddressText(text: string): string
```

Makes the text of a Japanese address uniform, as the parser reads it: widths folded, spaces tidied, numerals as digits, and `1の2の3`, `１－２－３` or any other dash written `1-2-3`. The postal mark 〒 is kept.

- `text`: Japanese text.
- Returns: The text made uniform.

```js
import { normalizeJapaneseAddressText } from "@johnmorrisdotca/address-plus/jp";

console.log(normalizeJapaneseAddressText("〒１００-０００５ 東京都千代田区丸の内一丁目二番三号"));
// "〒100-0005 東京都千代田区丸の内1丁目2番3号"
```

### ParsedAddress

type

```ts
interface ParsedAddress extends JapaneseAddressFields, AustralianAddressFields, FrenchAddressFields, UKAddressFields {
  city?: string; // City name, or the municipality in Japan; APO, FPO or DPO in a military address
  compartment?: string; // Compartment on a Canadian rural route (the 10 in "SITE 6 COMP 10 RR 8")
  country?: "CA" | "US" | "JP" | "AU" | "GB" | "GY" | "IM" | "JE" | FrenchPostalCountry | "DE"; // Detected country; AU, GB (with Jersey, Guernsey and the Isle of Man), FR (with Monaco and the overseas collectivities) and DE only from their modules
  fraction?: string; // Fractional address number (e.g., 1/2 in "123 1/2 Main St")
  generalDelivery?: boolean; // General delivery indicator
  highwayContract?: string; // Highway contract route number (the 68 in "HC 68 BOX 23A"); ruralRoute holds "HC 68"
  locality?: string; // Sub-city locality (borough, district, neighborhood), or a Puerto Rico urbanization
  military?: string; // Military delivery line ("PSC 802 Box 74", "Unit 2050 Box 4190"); state is AA, AE or AP
  number?: string; // Street number
  place?: string; // Place name (landmark, POI, building, monument, etc.)
  plus4?: string; // Extended ZIP+4 code
  postalValid?: boolean; // Postal code validation status
  postalType?: "zip" | "postal"; // Postal code type (zip or postal)
  prefix?: string; // Directional prefix (N, S, E, W, etc.)
  rpo?: string; // Retail Postal Outlet (Canada Post) identifier
  rr?: string; // Rural Route number (RR/R.R.)
  ruralRoute?: string; // Rural route or similar
  secUnitNum?: string; // Secondary unit number
  secUnitType?: string; // Secondary unit type (apt, suite, etc.)
  secondary?: string; // Legacy properties for backward compatibility
  site?: string; // Site number on a Canadian rural route (the 6 in "SITE 6 COMP 10 RR 8")
  state?: string; // State/Province code; AA, AE or AP for a military address
  station?: string; // Station or Succursale identifier (e.g., Station A, Succ. Centre-ville)
  street?: string; // Street name
  suffix?: string; // Directional suffix
  type?: string; // Street type/suffix (St, Ave, Rd, etc.)
  unit?: string; // Legacy unit property for backward compatibility
  zip?: string; // ZIP or postal code
  zipValid?: boolean; // ZIP/postal code format validation (true if format is valid)
}
```

What `parseLocation` returns: every part it found, each absent when the address has none. A Japanese address fills its own fields and the shared ones that stand for them: `state` the prefecture's JIS code, `city` the municipality, `street` the town, `number` the block, `zip` the postal code.

```js
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { ParsedAddress } from "@johnmorrisdotca/address-plus/jp";

console.log(parseLocation("123 Main St Apt 4, Anytown, NY 12345"));
// {"number":"123","secUnitType":"Apartment","secUnitNum":"4","unit":"Apt 4","street":"Main","type":"St","city":"Anytown","state":"NY","zip":"12345","zipValid":true,"country":"US"}
```

### parseJapaneseAddress

function

```ts
parseJapaneseAddress(text: string, options?: ParseOptions): ParsedAddress | null
```

Parses a Japanese address, in Japanese script or in romaji, into the Japanese fields and the shared ones. `parseLocation` calls it for any address that looks Japanese; call it directly to skip the detection.

- `text`: The address as one string, in either script, with or without 〒 and the postal code.
- `options`: `useSnakeCase` gives snake_case keys; the other options are ignored.
- Returns: The parts found, or `null` when nothing in the text names a place in Japan (no prefecture, municipality or postal code).

```js
import { parseJapaneseAddress } from "@johnmorrisdotca/address-plus/jp";

console.log(parseJapaneseAddress("〒100-0005 東京都千代田区丸の内1丁目2番3号 サンプルビル5階501号室")?.block);
// "1-2-3"
```

### ParseOptions

type

```ts
interface ParseOptions {
  country?:
    | "CA"
    | "US"
    | "JP"
    | "AU"
    | "GB"
    | "GY"
    | "IM"
    | "JE"
    | FrenchPostalCountry
    | "DE"
    | "GP"
    | "MQ"
    | "GF"
    | "RE"
    | "YT"
    | "auto"; // Country to optimize parsing for; JP skips the detection and parses as Japanese; AU, GB, FR, DE and the rest need their module in countries
  countries?: readonly CountryModule[]; // Country modules to read beside the US, Canada and Japan: australia from "/au", unitedKingdom from "/gb", france from "/fr", germany from "/de"
  normalize?: boolean; // Whether to normalize street types and directions
  validatePostalCode?: boolean; // Whether to validate postal/ZIP codes
  language?: "auto" | "en" | "fr"; // Language preference for bilingual parsing (Canada)
  extractFacilities?: boolean; // Whether to extract facility names
  parseParenthetical?: boolean; // Whether to parse parenthetical information
  strict?: boolean; // Whether to only extract valid ZIP/postal codes (strict mode) - true: Only extract codes that pass format validation, false (default): Extract all codes but indicate validity with zipValid field
  useSnakeCase?: boolean; // Whether to return field names in snake_case format for backward compatibility - true: Return snake_case field names (sec_unit_type, sec_unit_num, etc.), false (default): Return camelCase field names (secUnitType, secUnitNum, etc.)
}
```

Options for every parser: the country, strict postal codes, snake_case keys and the rest. Every one is optional.

```js
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { ParseOptions } from "@johnmorrisdotca/address-plus/jp";

console.log(Reflect.get(parseLocation("東京都千代田区丸の内1-2-3", { country: "JP", useSnakeCase: true }) ?? {}, "prefecture_code"));
// "13"
```

### validateJapaneseAddress

function

```ts
validateJapaneseAddress(address: ParsedAddress, options?: ValidationOptions): JapaneseValidation
```

Checks a parsed Japanese address against the tables: the postal code's shape, whether any code begins with its first three digits, whether it delivers to the prefecture named, and whether the municipality is a real one in that prefecture.

- `address`: The address, as `parseLocation` returns it for a Japanese address.
- `options`: `strictPostalValidation` makes the postal findings errors rather than warnings; the municipality findings stay warnings.
- Returns: The errors and the warnings, each with its field, code and message.

```js
import { validateJapaneseAddress } from "@johnmorrisdotca/address-plus/jp";
import { parseLocation } from "@johnmorrisdotca/address-plus";

const parsedAddress1=parseLocation("〒530-0001 東京都千代田区丸の内1-2-3");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(validateJapaneseAddress(parsedAddress1).warnings.map((one) => one.code));
// ["POSTAL_REGION_MISMATCH"]
```

### ValidationError

type

```ts
interface ValidationError {
  field: string; // Field name where error occurred
  code: string; // Error code identifier
  message: string; // Human-readable error message
  severity: "error" | "warning" | "info"; // Severity level of the validation issue
}
```

One finding of a validator: the field it is about, its code, a message, and how serious it is.

```js
import { validateAddress } from "@johnmorrisdotca/address-plus";
import type { ValidationError } from "@johnmorrisdotca/address-plus/jp";

console.log(validateAddress("123 Main St, Seattle, NY 98101").warnings[0]);
// {"field":"zip","code":"POSTAL_REGION_MISMATCH","message":"ZIP code 98101 belongs to WA, not NY","severity":"warning"}
```

### ValidationOptions

type

```ts
interface ValidationOptions {
  requireStreetNumber?: boolean; // Whether street number is required
  requireStreetName?: boolean; // Whether street name is required
  requireCity?: boolean; // Whether city is required
  requireState?: boolean; // Whether state/province is required
  requirePostalCode?: boolean; // Whether postal code is required
  allowPOBox?: boolean; // Whether PO Box addresses are allowed
  allowRuralRoute?: boolean; // Whether rural route addresses are allowed
  allowGeneralDelivery?: boolean; // Whether general delivery addresses are allowed
  strictPostalValidation?: boolean; // Whether to use strict postal code validation
  country?: ParseOptions["country"]; // Country context for validation rules; AU, GB, FR, DE and the rest need their module in countries
  countries?: readonly import("./country-module").CountryModule[]; // Country modules to read beside the US, Canada and Japan
}
```

Options for the validators: which parts an address must have, which kinds are allowed, and whether a postal code that does not match its region is an error.

```js
import { validateAddress } from "@johnmorrisdotca/address-plus";
import type { ValidationOptions } from "@johnmorrisdotca/address-plus/jp";

console.log(validateAddress("123 Main St", { requirePostalCode: true }).errors.map((error) => error.code));
// ["MISSING_POSTAL_CODE"]
```


## @johnmorrisdotca/address-plus/au

### AU_CROSS_BORDER_POSTCODES

const

```ts
AU_CROSS_BORDER_POSTCODES: Readonly<Record<string, readonly AustralianStateCode[]>>
```

The postcodes whose area lies in more than one state or territory, each with the states it lies in, the one with most of it first. Read from the Australian Bureau of Statistics' Postal Areas (ASGS Edition 3, CC BY 4.0), which approximate Australia Post's postcodes by mesh blocks, so a state with a sliver of a postcode's area is listed too. An address naming any of these states passes the postcode check.

```js
import { AU_CROSS_BORDER_POSTCODES } from "@johnmorrisdotca/address-plus/au";

console.log(AU_CROSS_BORDER_POSTCODES["2620"]);
// ["NSW","ACT"]
```

### AU_EXTERNAL_TERRITORY_POSTCODES

const

```ts
AU_EXTERNAL_TERRITORY_POSTCODES: readonly string[]
```

The postcodes the Australian Bureau of Statistics places, wholly or partly, in the Other Territories: Jervis Bay, Norfolk Island, Christmas Island and the Cocos (Keeling) Islands. Which state's code Australia Post writes beside each is not in the open data, so the validator does not judge the state given with one.

```js
import { AU_EXTERNAL_TERRITORY_POSTCODES } from "@johnmorrisdotca/address-plus/au";

console.log(AU_EXTERNAL_TERRITORY_POSTCODES);
// ["2540","2899","6798","6799"]
```

### AU_POSTCODE_RANGES

const

```ts
AU_POSTCODE_RANGES: readonly AustralianPostcodeRange[]
```

The blocks of postcodes Australia Post allocates to each state and territory. A postcode outside every block is not Australian. A few postcodes near a border also serve towns across it (`AU_CROSS_BORDER_POSTCODES`), and the external territories have postcodes inside a state's block (`AU_EXTERNAL_TERRITORY_POSTCODES`).

```js
import { AU_POSTCODE_RANGES } from "@johnmorrisdotca/address-plus/au";

console.log(AU_POSTCODE_RANGES.filter((range) => range.state === "ACT").map((range) => `${range.from}-${range.to}`));
// ["0200-0299","2600-2618","2900-2920"]
```

### AU_STATES

const

```ts
AU_STATES: readonly AustralianState[]
```

The six states and two territories of Australia, in order of their codes, each with Australia Post's code, the ISO 3166-2 code and its name in English and in Japanese. Copied from kuni when the tables are made.

```js
import { AU_STATES } from "@johnmorrisdotca/address-plus/au";

console.log(AU_STATES.map((state) => state.code));
// ["ACT","NSW","NT","QLD","SA","TAS","VIC","WA"]
```

### AU_STREET_TYPES

const

```ts
AU_STREET_TYPES: Readonly<Record<string, string>>
```

Australia's street types: each AS4590 abbreviation, in proper case as the parser reports it, with the word it stands for. The parser also reads the word itself, and a few spellings people use (`Boulevarde`, `Crs`, `Tce`).

```js
import { AU_STREET_TYPES } from "@johnmorrisdotca/address-plus/au";

console.log(AU_STREET_TYPES.Pde);
// "Parade"
```

### australia

const

```ts
australia: CountryModule
```

Australia's module, for `parseLocation` and `validateAddress`: pass it in `countries`, and an address that ends with a state and its postcode (or `Australia`) is read as Australian; `country: "AU"` reads any address as one.

```js
import { parseLocation } from "@johnmorrisdotca/address-plus";
import { australia } from "@johnmorrisdotca/address-plus/au";

console.log(parseLocation("3/12 Smith St, Parramatta NSW 2150", { countries: [australia] })?.secUnitNum);
// "3"
```

### AustralianAddressFields

type

```ts
interface AustralianAddressFields {
  floorType?: string; // A level or floor: Level, Floor, Ground Floor, Lower Ground Floor, Upper Ground Floor, Basement, Mezzanine
  lot?: string; // A lot number where a street number is not yet given: the 12 in "Lot 12 Smith Rd"
}
```

The fields an Australian address fills beside the shared ones. The shared fields keep their meaning: `number` is the street number, `street` and `type` the street's name and its type (Australia Post's abbreviation, `St`, `Pde`, `Cres`), `secUnitType` and `secUnitNum` the unit (`Unit 3`) or the postal delivery (`PO Box 37`, `Locked Bag 801`), `city` the suburb or town, `state` the state's code and `zip` the postcode.

```js
import { parseAustralianAddress } from "@johnmorrisdotca/address-plus/au";
import type { AustralianAddressFields } from "@johnmorrisdotca/address-plus/au";

console.log(parseAustralianAddress("Level 6, 51 Jacobson St, Brisbane QLD 4000")?.floorType);
// "Level"
```

### AustralianPostcodeRange

type

```ts
interface AustralianPostcodeRange {
  state: AustralianStateCode;
  from: string; // First postcode of the block: "2000"
  to: string; // Last postcode of the block: "2599"
  use: "delivery" | "po-box"; // Street delivery, or PO boxes and large-volume receivers (NSW 1000 to 1999, VIC 8000 to 8999, QLD 9000 to 9999)
}
```

One block of postcodes Australia Post allocates to a state or territory: every postcode from `from` to `to`, inclusive, written as four digits.

```js
import { AU_POSTCODE_RANGES } from "@johnmorrisdotca/address-plus/au";
import type { AustralianPostcodeRange } from "@johnmorrisdotca/address-plus/au";

console.log(AU_POSTCODE_RANGES.find((range) => range.state === "TAS"));
// {"state":"TAS","from":"7000","to":"7999","use":"delivery"}
```

### AustralianState

type

```ts
interface AustralianState {
  code: AustralianStateCode; // The code on an envelope: VIC
  iso: string; // ISO 3166-2: AU-VIC
  name: string; // English: Victoria
  nameJa: string; // Japanese: ビクトリア州
  kind: "state" | "territory"; // The ACT and the NT are territories
}
```

An Australian state or territory in the tables: Australia Post's code, the ISO 3166-2 code, and its name in English and in Japanese (from kuni, which takes them from Unicode CLDR and Wikidata).

```js
import { findAustralianState } from "@johnmorrisdotca/address-plus/au";
import type { AustralianState } from "@johnmorrisdotca/address-plus/au";

console.log(findAustralianState("Victoria"));
// {"code":"VIC","iso":"AU-VIC","name":"Victoria","nameJa":"ビクトリア州","kind":"state"}
```

### AustralianStateCode

type

```ts
type AustralianStateCode = "ACT" | "NSW" | "NT" | "QLD" | "SA" | "TAS" | "VIC" | "WA";
```

The code of an Australian state or territory, as Australia Post writes it on the last line of an address.

```js
import { getStateFromAustralianPostcode } from "@johnmorrisdotca/address-plus/au";
import type { AustralianStateCode } from "@johnmorrisdotca/address-plus/au";

console.log(getStateFromAustralianPostcode("3000"));
// "VIC"
```

### AustraliaPostFormattingOptions

type

```ts
interface AustraliaPostFormattingOptions {
  unitStyle?: "words" | "slash"; // "UNIT 3 12 SMITH ST" (the default) or "3/12 SMITH ST"
  wideSpacing?: boolean; // Two spaces before the state and before the postcode, as Australia Post prefers on a typed label
  includeCountry?: boolean; // AUSTRALIA as the last line, for mail from abroad
}
```

Options for `formatAustraliaPost`.

```js
import { formatAustraliaPost, parseAustralianAddress } from "@johnmorrisdotca/address-plus/au";
import type { AustraliaPostFormattingOptions } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseAustralianAddress("Unit 3, 12 Smith St, Parramatta NSW 2150");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatAustraliaPost(parsedAddress1, { unitStyle: "slash" }).lines);
// ["3/12 SMITH ST","PARRAMATTA NSW 2150"]
```

### compareAustralianAddresses

function

```ts
compareAustralianAddresses(first: ParsedAddress, second: ParsedAddress): CountryComparison
```

Compares two Australian addresses field by field: the unit, level, lot, number, street, suburb, state and postcode. Letter case, punctuation, a street type written out or abbreviated (`Street`, `St`) and a state by name or code are not differences.

- `first`: The first address, as `parseAustralianAddress` returns it.
- `second`: The second address.
- Returns: Whether they are the same delivery point, and each field that differs.

```js
import { compareAustralianAddresses, parseAustralianAddress } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseAustralianAddress("12 Smith Street, Parramatta NSW 2150");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseAustralianAddress("14 Smith St, Parramatta New South Wales 2150");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(compareAustralianAddresses(parsedAddress1, parsedAddress2));
// {"isSame":false,"differences":[{"field":"number","first":"12","second":"14"}]}
```

### CountryComparison

type

```ts
interface CountryComparison {
  isSame: boolean;
  differences: CountryDifference[];
}
```

What a country module's comparer returns: whether the two addresses are the same delivery point, and every field that differs once both are in the same form (letter case, punctuation, a street type written out or abbreviated).

```js
import { compareAustralianAddresses, parseAustralianAddress } from "@johnmorrisdotca/address-plus/au";
import type { CountryComparison } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseAustralianAddress("3/12 Smith Street, Parramatta NSW 2150");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseAustralianAddress("Unit 3, 12 Smith St, PARRAMATTA NSW 2150");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(compareAustralianAddresses(parsedAddress1, parsedAddress2).isSame);
// true
```

### CountryDifference

type

```ts
interface CountryDifference {
  field: string;
  first?: string;
  second?: string;
}
```

One way two addresses differ, as a country module's comparer reports it: the field, and its value in each address after both were put in the same form.

```js
import { compareUKAddresses, parseUKAddress } from "@johnmorrisdotca/address-plus/gb";
import type { CountryDifference } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseUKAddress("10 High Street, Bath BA1 1AA");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseUKAddress("12 High St, Bath BA1 1AA");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(compareUKAddresses(parsedAddress1, parsedAddress2).differences);
// [{"field":"number","first":"10","second":"12"}]
```

### CountryModule

type

```ts
interface CountryModule {
  code: string; // The country's ISO 3166-1 code: AU, GB
  codes: readonly string[]; // Every country code the module reads; GB also reads Jersey (JE), Guernsey (GY) and the Isle of Man (IM)
  name: string; // The country's name in English
  detect(address: string): boolean; // Whether the address is surely this country's, with no hint
  parse(address: string, options?: ParseOptions): ParsedAddress | null;
  validate(address: ParsedAddress, options?: ValidationOptions): CountryValidation;
  format(address: ParsedAddress): FormattedAddress;
  compare(first: ParsedAddress, second: ParsedAddress): CountryComparison;
}
```

A country's address module: its codes, how to tell its addresses apart, and its parser, validator, formatter and comparer. Import one from its entry point (`australia` from `@johnmorrisdotca/address-plus/au`, `unitedKingdom` from `@johnmorrisdotca/address-plus/gb`) and hand it to `parseLocation` and `validateAddress` in `countries`.

```js
import { australia } from "@johnmorrisdotca/address-plus/au";
import type { CountryModule } from "@johnmorrisdotca/address-plus/au";

console.log(australia.codes);
// ["AU"]
```

### CountryValidation

type

```ts
interface CountryValidation {
  errors: ValidationError[];
  warnings: ValidationError[];
}
```

What a country module's validator returns: the errors and the warnings it found.

```js
import { parseAustralianAddress, validateAustralianAddress } from "@johnmorrisdotca/address-plus/au";
import type { CountryValidation } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseAustralianAddress("1 Main St, Sydney VIC 2000");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(validateAustralianAddress(parsedAddress1).warnings.map((one) => one.code));
// ["POSTAL_REGION_MISMATCH"]
```

### expandAustralianStreetType

function

```ts
expandAustralianStreetType(type: string): string
```

The word an AS4590 street type stands for: `Pde` is `Parade`. Any other text comes back as it is.

- `type`: The abbreviation, in any letter case.
- Returns: The word.

```js
import { expandAustralianStreetType } from "@johnmorrisdotca/address-plus/au";

console.log(expandAustralianStreetType("CRES"));
// "Crescent"
```

### findAustralianState

function

```ts
findAustralianState(text: string): AustralianState | null
```

Finds an Australian state or territory by its code (`VIC`, `AU-VIC`, `Vic.`) or its name in English or Japanese (`Victoria`, `ビクトリア州`), in any letter case.

- `text`: The code or the name.
- Returns: The state, or `null` when nothing matches.

```js
import { findAustralianState } from "@johnmorrisdotca/address-plus/au";

console.log(findAustralianState("n.s.w.")?.name);
// "New South Wales"
```

### formatAustraliaPost

function

```ts
formatAustraliaPost(address: ParsedAddress, options?: AustraliaPostFormattingOptions): FormattedAddress
```

Writes an Australian address as Australia Post asks: the building's name, then the delivery line (unit and level before the number, the street type abbreviated), then the suburb, state and postcode, both in capitals with no punctuation. A postal delivery (`PO BOX 37`) takes the delivery line's place.

- `address`: The address as `parseAustralianAddress` returns it.
- `options`: The unit's style, the spacing of the last line, and whether to add AUSTRALIA (see `AustraliaPostFormattingOptions`).
- Returns: The lines, the same on one line, the delivery line and the last line.

```js
import { formatAustraliaPost, parseAustralianAddress } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseAustralianAddress("Level 6, 51 Jacobson Street, Brisbane Qld 4000");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatAustraliaPost(parsedAddress1).lines);
// ["LEVEL 6 51 JACOBSON ST","BRISBANE QLD 4000"]
```

### FormattedAddress

type

```ts
interface FormattedAddress {
  lines: string[]; // Individual address lines
  singleLine: string; // Single-line representation
  deliveryLine?: string; // Street address line
  lastLine?: string; // City/state/postal line
  country?: string; // Country designation
  format:
    | "standard"
    | "usps"
    | "canada-post"
    | "international"
    | "australia-post"
    | "royal-mail"
    | "la-poste"
    | "deutsche-post"; // Formatting standard used
}
```

A formatted address: its lines, and the same on one line.

```js
import { formatUSPS, parseLocation } from "@johnmorrisdotca/address-plus";
import type { FormattedAddress } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseLocation("123 Main St, Anytown, NY 12345");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatUSPS(parsedAddress1));
// {"lines":["123 MAIN ST","ANYTOWN NY 12345"],"singleLine":"123 Main St, Anytown NY 12345","deliveryLine":"123 Main St","lastLine":"Anytown NY 12345","country":"US","format":"usps"}
```

### getPostcodeRangesForAustralianState

function

```ts
getPostcodeRangesForAustralianState(state: string): AustralianPostcodeRange[]
```

The blocks of postcodes Australia Post allocates to a state or territory.

- `state`: The state's code or name.
- Returns: The blocks, in order; an empty array for something that is not a state.

```js
import { getPostcodeRangesForAustralianState } from "@johnmorrisdotca/address-plus/au";

console.log(getPostcodeRangesForAustralianState("Victoria").map((range) => `${range.from}-${range.to}`));
// ["3000-3999","8000-8999"]
```

### getStateFromAustralianPostcode

function

```ts
getStateFromAustralianPostcode(postcode: string): AustralianStateCode | undefined
```

The state or territory whose block of postcodes a postcode is in. A postcode that also serves a town across a border still gives the state of its block; `getStatesForAustralianPostcode` gives them all.

- `postcode`: Four digits, with or without spaces around them.
- Returns: The state's code, or `undefined` when the text is not four digits or no block holds it.

```js
import { getStateFromAustralianPostcode } from "@johnmorrisdotca/address-plus/au";

console.log(getStateFromAustralianPostcode("2620"));
// "NSW"
```

### getStatesForAustralianPostcode

function

```ts
getStatesForAustralianPostcode(postcode: string): AustralianStateCode[]
```

Every state or territory a postcode serves: its block's state, and for a postcode that crosses a border, the states across it too, the one with most of the postcode's area first.

- `postcode`: Four digits.
- Returns: The states' codes; an empty array when the postcode is not in any block.

```js
import { getStatesForAustralianPostcode } from "@johnmorrisdotca/address-plus/au";

console.log(getStatesForAustralianPostcode("0872"));
// ["NT","SA","WA"]
```

### looksAustralian

function

```ts
looksAustralian(text: string): boolean
```

Whether an address is surely Australian, with no hint: it ends with `Australia`, or with a state and an Australian postcode (`NSW 2150`, `Victoria 3000`, `VIC 2000`, whose postcode is Sydney's). `WA` needs one of Western Australia's postcodes (`WA 6000`), since `WA 9810` is a Washington ZIP code cut short. A postcode alone is not enough: four digits end addresses in many countries.

- `text`: The address as one string.
- Returns: `true` when the address is Australian beyond doubt, `false` otherwise.

```js
import { looksAustralian } from "@johnmorrisdotca/address-plus/au";

console.log([looksAustralian("12 Smith St, Parramatta NSW 2150"), looksAustralian("123 Main St, Seattle, WA 9810")]);
// [true,false]
```

### parseAustralianAddress

function

```ts
parseAustralianAddress(text: string, options?: ParseOptions): ParsedAddress | null
```

Parses an Australian address into its parts, as Australia Post lays one out: the delivery line, then the suburb or town, the state and the postcode. Reads a unit written `3/12`, `Unit 3/12`, `Unit 3, 12` or `U3 12`; a level (`Level 6`, `L6`, `Ground Floor`); a lot (`Lot 12`); a range of numbers (`12-14`); a building's name on a line of its own; and the postal deliveries `PO Box`, `GPO Box`, `Locked Bag`, `Private Bag`, `RMB`, `RSD`, `RMS`, `CMB`, `CMA`, `CPA`, `MS` and `Care PO`. The street type is reported as AS4590's abbreviation (`St`, `Pde`, `Cres`). A state is written by its code or its name; a trailing `Australia` is dropped.

- `text`: The address as one string; commas and line breaks both separate its parts.
- `options`: `useSnakeCase` gives snake_case keys; the other options are not used.
- Returns: The parts found, with `country: "AU"`, or `null` when the text is empty or has nothing but a state.

```js
import { parseAustralianAddress } from "@johnmorrisdotca/address-plus/au";

console.log(parseAustralianAddress("Unit 3/12 Smith St, Parramatta NSW 2150"));
// {"secUnitType":"Unit","secUnitNum":"3","number":"12","street":"Smith","type":"St","city":"Parramatta","state":"NSW","zip":"2150","zipValid":true,"country":"AU"}
```

### ParsedAddress

type

```ts
interface ParsedAddress extends JapaneseAddressFields, AustralianAddressFields, FrenchAddressFields, UKAddressFields {
  city?: string; // City name, or the municipality in Japan; APO, FPO or DPO in a military address
  compartment?: string; // Compartment on a Canadian rural route (the 10 in "SITE 6 COMP 10 RR 8")
  country?: "CA" | "US" | "JP" | "AU" | "GB" | "GY" | "IM" | "JE" | FrenchPostalCountry | "DE"; // Detected country; AU, GB (with Jersey, Guernsey and the Isle of Man), FR (with Monaco and the overseas collectivities) and DE only from their modules
  fraction?: string; // Fractional address number (e.g., 1/2 in "123 1/2 Main St")
  generalDelivery?: boolean; // General delivery indicator
  highwayContract?: string; // Highway contract route number (the 68 in "HC 68 BOX 23A"); ruralRoute holds "HC 68"
  locality?: string; // Sub-city locality (borough, district, neighborhood), or a Puerto Rico urbanization
  military?: string; // Military delivery line ("PSC 802 Box 74", "Unit 2050 Box 4190"); state is AA, AE or AP
  number?: string; // Street number
  place?: string; // Place name (landmark, POI, building, monument, etc.)
  plus4?: string; // Extended ZIP+4 code
  postalValid?: boolean; // Postal code validation status
  postalType?: "zip" | "postal"; // Postal code type (zip or postal)
  prefix?: string; // Directional prefix (N, S, E, W, etc.)
  rpo?: string; // Retail Postal Outlet (Canada Post) identifier
  rr?: string; // Rural Route number (RR/R.R.)
  ruralRoute?: string; // Rural route or similar
  secUnitNum?: string; // Secondary unit number
  secUnitType?: string; // Secondary unit type (apt, suite, etc.)
  secondary?: string; // Legacy properties for backward compatibility
  site?: string; // Site number on a Canadian rural route (the 6 in "SITE 6 COMP 10 RR 8")
  state?: string; // State/Province code; AA, AE or AP for a military address
  station?: string; // Station or Succursale identifier (e.g., Station A, Succ. Centre-ville)
  street?: string; // Street name
  suffix?: string; // Directional suffix
  type?: string; // Street type/suffix (St, Ave, Rd, etc.)
  unit?: string; // Legacy unit property for backward compatibility
  zip?: string; // ZIP or postal code
  zipValid?: boolean; // ZIP/postal code format validation (true if format is valid)
}
```

What `parseLocation` returns: every part it found, each absent when the address has none. A Japanese address fills its own fields and the shared ones that stand for them: `state` the prefecture's JIS code, `city` the municipality, `street` the town, `number` the block, `zip` the postal code.

```js
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { ParsedAddress } from "@johnmorrisdotca/address-plus/jp";

console.log(parseLocation("123 Main St Apt 4, Anytown, NY 12345"));
// {"number":"123","secUnitType":"Apartment","secUnitNum":"4","unit":"Apt 4","street":"Main","type":"St","city":"Anytown","state":"NY","zip":"12345","zipValid":true,"country":"US"}
```

### ParseOptions

type

```ts
interface ParseOptions {
  country?:
    | "CA"
    | "US"
    | "JP"
    | "AU"
    | "GB"
    | "GY"
    | "IM"
    | "JE"
    | FrenchPostalCountry
    | "DE"
    | "GP"
    | "MQ"
    | "GF"
    | "RE"
    | "YT"
    | "auto"; // Country to optimize parsing for; JP skips the detection and parses as Japanese; AU, GB, FR, DE and the rest need their module in countries
  countries?: readonly CountryModule[]; // Country modules to read beside the US, Canada and Japan: australia from "/au", unitedKingdom from "/gb", france from "/fr", germany from "/de"
  normalize?: boolean; // Whether to normalize street types and directions
  validatePostalCode?: boolean; // Whether to validate postal/ZIP codes
  language?: "auto" | "en" | "fr"; // Language preference for bilingual parsing (Canada)
  extractFacilities?: boolean; // Whether to extract facility names
  parseParenthetical?: boolean; // Whether to parse parenthetical information
  strict?: boolean; // Whether to only extract valid ZIP/postal codes (strict mode) - true: Only extract codes that pass format validation, false (default): Extract all codes but indicate validity with zipValid field
  useSnakeCase?: boolean; // Whether to return field names in snake_case format for backward compatibility - true: Return snake_case field names (sec_unit_type, sec_unit_num, etc.), false (default): Return camelCase field names (secUnitType, secUnitNum, etc.)
}
```

Options for every parser: the country, strict postal codes, snake_case keys and the rest. Every one is optional.

```js
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { ParseOptions } from "@johnmorrisdotca/address-plus/jp";

console.log(Reflect.get(parseLocation("東京都千代田区丸の内1-2-3", { country: "JP", useSnakeCase: true }) ?? {}, "prefecture_code"));
// "13"
```

### validateAustralianAddress

function

```ts
validateAustralianAddress(address: ParsedAddress, options?: ValidationOptions): CountryValidation
```

Checks an Australian address against Australia Post's blocks of postcodes: the postcode is four digits, some state's block holds it, and it is the state named, or one it serves across a border (from the ABS's Postal Areas). Also warns when the state, the postcode or the suburb is missing.

- `address`: The address as `parseAustralianAddress` (or `parseLocation` with the module) returns it.
- `options`: `strictPostalValidation: true` makes the postcode findings errors; the rest are not used.
- Returns: The errors and warnings, each with its field, code and message.

```js
import { parseAustralianAddress, validateAustralianAddress } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseAustralianAddress("1 Main St, Sydney VIC 2000");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(validateAustralianAddress(parsedAddress1).warnings[0].message);
// "Postcode 2000 belongs to NSW, not VIC"
```

### ValidationError

type

```ts
interface ValidationError {
  field: string; // Field name where error occurred
  code: string; // Error code identifier
  message: string; // Human-readable error message
  severity: "error" | "warning" | "info"; // Severity level of the validation issue
}
```

One finding of a validator: the field it is about, its code, a message, and how serious it is.

```js
import { validateAddress } from "@johnmorrisdotca/address-plus";
import type { ValidationError } from "@johnmorrisdotca/address-plus/jp";

console.log(validateAddress("123 Main St, Seattle, NY 98101").warnings[0]);
// {"field":"zip","code":"POSTAL_REGION_MISMATCH","message":"ZIP code 98101 belongs to WA, not NY","severity":"warning"}
```

### ValidationOptions

type

```ts
interface ValidationOptions {
  requireStreetNumber?: boolean; // Whether street number is required
  requireStreetName?: boolean; // Whether street name is required
  requireCity?: boolean; // Whether city is required
  requireState?: boolean; // Whether state/province is required
  requirePostalCode?: boolean; // Whether postal code is required
  allowPOBox?: boolean; // Whether PO Box addresses are allowed
  allowRuralRoute?: boolean; // Whether rural route addresses are allowed
  allowGeneralDelivery?: boolean; // Whether general delivery addresses are allowed
  strictPostalValidation?: boolean; // Whether to use strict postal code validation
  country?: ParseOptions["country"]; // Country context for validation rules; AU, GB, FR, DE and the rest need their module in countries
  countries?: readonly import("./country-module").CountryModule[]; // Country modules to read beside the US, Canada and Japan
}
```

Options for the validators: which parts an address must have, which kinds are allowed, and whether a postal code that does not match its region is an error.

```js
import { validateAddress } from "@johnmorrisdotca/address-plus";
import type { ValidationOptions } from "@johnmorrisdotca/address-plus/jp";

console.log(validateAddress("123 Main St", { requirePostalCode: true }).errors.map((error) => error.code));
// ["MISSING_POSTAL_CODE"]
```


## @johnmorrisdotca/address-plus/gb

### compareUKAddresses

function

```ts
compareUKAddresses(first: ParsedAddress, second: ParsedAddress): CountryComparison
```

Compares two addresses in the United Kingdom field by field: the flat, the building, the number, the thoroughfare, the post town and the postcode. Letter case, punctuation, a descriptor abbreviated (`St`, `Rd`) and the postcode's space are not differences. The localities and the county are left out, since Royal Mail needs neither when the postcode is given.

- `first`: The first address, as `parseUKAddress` returns it.
- `second`: The second address.
- Returns: Whether they are the same delivery point, and each field that differs.

```js
import { compareUKAddresses, parseUKAddress } from "@johnmorrisdotca/address-plus/gb";

const parsedAddress1=parseUKAddress("10 Downing Street, London SW1A 2AA");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseUKAddress("10 DOWNING ST, LONDON, SW1A2AA");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(compareUKAddresses(parsedAddress1, parsedAddress2).isSame);
// true
```

### CountryComparison

type

```ts
interface CountryComparison {
  isSame: boolean;
  differences: CountryDifference[];
}
```

What a country module's comparer returns: whether the two addresses are the same delivery point, and every field that differs once both are in the same form (letter case, punctuation, a street type written out or abbreviated).

```js
import { compareAustralianAddresses, parseAustralianAddress } from "@johnmorrisdotca/address-plus/au";
import type { CountryComparison } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseAustralianAddress("3/12 Smith Street, Parramatta NSW 2150");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseAustralianAddress("Unit 3, 12 Smith St, PARRAMATTA NSW 2150");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(compareAustralianAddresses(parsedAddress1, parsedAddress2).isSame);
// true
```

### CountryDifference

type

```ts
interface CountryDifference {
  field: string;
  first?: string;
  second?: string;
}
```

One way two addresses differ, as a country module's comparer reports it: the field, and its value in each address after both were put in the same form.

```js
import { compareUKAddresses, parseUKAddress } from "@johnmorrisdotca/address-plus/gb";
import type { CountryDifference } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseUKAddress("10 High Street, Bath BA1 1AA");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseUKAddress("12 High St, Bath BA1 1AA");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(compareUKAddresses(parsedAddress1, parsedAddress2).differences);
// [{"field":"number","first":"10","second":"12"}]
```

### CountryModule

type

```ts
interface CountryModule {
  code: string; // The country's ISO 3166-1 code: AU, GB
  codes: readonly string[]; // Every country code the module reads; GB also reads Jersey (JE), Guernsey (GY) and the Isle of Man (IM)
  name: string; // The country's name in English
  detect(address: string): boolean; // Whether the address is surely this country's, with no hint
  parse(address: string, options?: ParseOptions): ParsedAddress | null;
  validate(address: ParsedAddress, options?: ValidationOptions): CountryValidation;
  format(address: ParsedAddress): FormattedAddress;
  compare(first: ParsedAddress, second: ParsedAddress): CountryComparison;
}
```

A country's address module: its codes, how to tell its addresses apart, and its parser, validator, formatter and comparer. Import one from its entry point (`australia` from `@johnmorrisdotca/address-plus/au`, `unitedKingdom` from `@johnmorrisdotca/address-plus/gb`) and hand it to `parseLocation` and `validateAddress` in `countries`.

```js
import { australia } from "@johnmorrisdotca/address-plus/au";
import type { CountryModule } from "@johnmorrisdotca/address-plus/au";

console.log(australia.codes);
// ["AU"]
```

### CountryValidation

type

```ts
interface CountryValidation {
  errors: ValidationError[];
  warnings: ValidationError[];
}
```

What a country module's validator returns: the errors and the warnings it found.

```js
import { parseAustralianAddress, validateAustralianAddress } from "@johnmorrisdotca/address-plus/au";
import type { CountryValidation } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseAustralianAddress("1 Main St, Sydney VIC 2000");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(validateAustralianAddress(parsedAddress1).warnings.map((one) => one.code));
// ["POSTAL_REGION_MISMATCH"]
```

### findUKNation

function

```ts
findUKNation(text: string): (typeof GB_NATIONS)[number] | null
```

Finds a nation of the United Kingdom by its code (`SCT`, `GB-SCT`) or its name in English or Japanese.

- `text`: The code or the name.
- Returns: The nation, or `null` when nothing matches.

```js
import { findUKNation } from "@johnmorrisdotca/address-plus/gb";

console.log(findUKNation("wales")?.code);
// "WLS"
```

### formatRoyalMail

function

```ts
formatRoyalMail(address: ParsedAddress, options?: RoyalMailFormattingOptions): FormattedAddress
```

Writes an address in the United Kingdom as Royal Mail asks: the flat or part of the building, the floor, the building's name, the number with the dependent thoroughfare or the thoroughfare, the localities, then the post town and the postcode in capitals, each on its own line. A forces address ends `BFPO 105`.

- `address`: The address as `parseUKAddress` returns it.
- `options`: Whether to keep a county and to add the country (see `RoyalMailFormattingOptions`).
- Returns: The lines, the same on one line, the delivery line (the number and thoroughfare) and the last line.

```js
import { formatRoyalMail, parseUKAddress } from "@johnmorrisdotca/address-plus/gb";

const parsedAddress1=parseUKAddress("Flat 2, Rose Court, 14 High St, Kingsbury, London NW9 0AA");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatRoyalMail(parsedAddress1).lines);
// ["Flat 2","Rose Court","14 High Street","Kingsbury","LONDON","NW9 0AA"]
```

### FormattedAddress

type

```ts
interface FormattedAddress {
  lines: string[]; // Individual address lines
  singleLine: string; // Single-line representation
  deliveryLine?: string; // Street address line
  lastLine?: string; // City/state/postal line
  country?: string; // Country designation
  format:
    | "standard"
    | "usps"
    | "canada-post"
    | "international"
    | "australia-post"
    | "royal-mail"
    | "la-poste"
    | "deutsche-post"; // Formatting standard used
}
```

A formatted address: its lines, and the same on one line.

```js
import { formatUSPS, parseLocation } from "@johnmorrisdotca/address-plus";
import type { FormattedAddress } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseLocation("123 Main St, Anytown, NY 12345");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatUSPS(parsedAddress1));
// {"lines":["123 MAIN ST","ANYTOWN NY 12345"],"singleLine":"123 Main St, Anytown NY 12345","deliveryLine":"123 Main St","lastLine":"Anytown NY 12345","country":"US","format":"usps"}
```

### GB_DISTRICT_NATIONS

const

```ts
GB_DISTRICT_NATIONS: Readonly<Record<string, readonly UKNationCode[]>>
```

The postcode districts not wholly in the nation of their area, each with the nations its postcodes lie in, the one with most of them first: the districts that cross the borders of Wales and of Scotland, and those wholly across one (CH5 to CH8 are in Wales, though most of the CH area is in England). From Code-Point Open (OGL v3).

```js
import { GB_DISTRICT_NATIONS } from "@johnmorrisdotca/address-plus/gb";

console.log([GB_DISTRICT_NATIONS["TD15"], GB_DISTRICT_NATIONS["CH5"]]);
// [["ENG","SCT"],["WLS"]]
```

### GB_NATIONS

const

```ts
GB_NATIONS: readonly UKNation[]
```

The four nations of the United Kingdom, in order of their codes, each with its ISO 3166-2 code and its name in English and in Japanese. Copied from kuni when the tables are made.

```js
import { GB_NATIONS } from "@johnmorrisdotca/address-plus/gb";

console.log(GB_NATIONS.map((nation) => nation.name));
// ["England","Northern Ireland","Scotland","Wales"]
```

### GB_POSTCODE_AREAS

const

```ts
GB_POSTCODE_AREAS: Readonly<Record<string, UKPostcodeArea>>
```

Every postcode area Royal Mail uses: the 121 of the United Kingdom, the three Crown Dependencies (`GY`, `IM`, `JE`), and the two that are not places, `BF` (the British Forces Post Office) and `BX` (addresses kept for organisations wherever they are). Each with the town it is named for, its country and its nation.

```js
import { GB_POSTCODE_AREAS } from "@johnmorrisdotca/address-plus/gb";

console.log([GB_POSTCODE_AREAS.CF.nation, GB_POSTCODE_AREAS.JE.country]);
// ["WLS","JE"]
```

### GB_POSTCODE_DISTRICTS

const

```ts
GB_POSTCODE_DISTRICTS: Readonly<Record<string, string>>
```

Every postcode district in Great Britain, by area: the numbered districts as runs, then those with a letter. Read from Ordnance Survey's Code-Point Open (OGL v3; contains Royal Mail data © Royal Mail copyright and database right). Northern Ireland's BT area is not in it, so its districts are not listed.

```js
import { GB_POSTCODE_DISTRICTS } from "@johnmorrisdotca/address-plus/gb";

console.log(GB_POSTCODE_DISTRICTS["EC"]);
// "1A,1M,1N,1P,1R,1V,1Y,2A,2M,2N,2P,2R,2V,2Y,3A,3M,3N,3P,3R,3V,4A,4M,4N,4P,4R,4V,4Y"
```

### GB_THOROUGHFARE_DESCRIPTORS

const

```ts
GB_THOROUGHFARE_DESCRIPTORS: Readonly<Record<string, readonly string[]>>
```

The thoroughfare descriptors the parser takes off the end of a street's name and reports, in full, as `type` (`High Street` is street `High`, type `Street`), with the abbreviations it reads for each. A street ending in none of them (`Kingsway`, `The Strand`) has no type.

```js
import { GB_THOROUGHFARE_DESCRIPTORS } from "@johnmorrisdotca/address-plus/gb";

console.log(GB_THOROUGHFARE_DESCRIPTORS.Road);
// ["RD"]
```

### getNationFromUKPostcode

function

```ts
getNationFromUKPostcode(postcode: string): UKNationCode | undefined
```

The nation of the United Kingdom a postcode delivers to, by its area, or by its district where the district crosses the border with Wales or with Scotland (the nation most of its postcodes are in).

- `postcode`: The postcode.
- Returns: `ENG`, `NIR`, `SCT` or `WLS`; `undefined` for a postcode outside the United Kingdom, one that is not a place (BFPO), or text that is not a postcode.

```js
import { getNationFromUKPostcode } from "@johnmorrisdotca/address-plus/gb";

console.log(["CH5 1AA", "BT1 1AA", "EH1 1YZ", "JE2 3AB"].map(getNationFromUKPostcode));
// ["WLS","NIR","SCT",null]
```

### getNationsForUKPostcode

function

```ts
getNationsForUKPostcode(postcode: string): UKNationCode[]
```

Every nation a postcode's district delivers to: one for most, two for the districts along the borders of Wales and of Scotland (from Code-Point Open), the nation with most of the district's postcodes first.

- `postcode`: The postcode.
- Returns: The nations; an empty array outside the United Kingdom or for text that is not a postcode.

```js
import { getNationsForUKPostcode } from "@johnmorrisdotca/address-plus/gb";

console.log(getNationsForUKPostcode("SY10 7AA"));
// ["ENG","WLS"]
```

### isValidUKPostcode

function

```ts
isValidUKPostcode(postcode: string): boolean
```

Whether a postcode follows Royal Mail's grammar: one of the six shapes (`M2 5BQ`, `M34 4AB`, `CR0 2YR`, `DN16 9AA`, `W1A 4ZZ`, `EC1A 1HQ`) with the letters each place allows, or `GIR 0AA`. Letter case and the space do not matter. Whether the postcode is in use is a different question; `parseUKPostcode` and the validator also check its area and district.

- `postcode`: The postcode.
- Returns: `true` when it has a postcode's shape and letters.

```js
import { isValidUKPostcode } from "@johnmorrisdotca/address-plus/gb";

console.log(["EC1A 1BB", "sw1a1aa", "GIR 0AA", "Q1 1AA", "M5V 1A1"].map(isValidUKPostcode));
// [true,true,true,false,false]
```

### looksBritish

function

```ts
looksBritish(text: string): boolean
```

Whether an address is surely British, with no hint: it ends with the United Kingdom or one of its nations (or Jersey, Guernsey or the Isle of Man), or it holds a full postcode in Royal Mail's grammar whose area Royal Mail uses, or `BFPO` and a number. A Canadian postal code never passes: it ends in a digit (`M5V 1A1`), a British postcode in two letters (`W1A 0AX`).

- `text`: The address as one string.
- Returns: `true` when the address is British beyond doubt, `false` otherwise.

```js
import { looksBritish } from "@johnmorrisdotca/address-plus/gb";

console.log([looksBritish("10 Downing Street, London SW1A 2AA"), looksBritish("100 Queen St W, Toronto, ON M5H 2N2")]);
// [true,false]
```

### ParsedAddress

type

```ts
interface ParsedAddress extends JapaneseAddressFields, AustralianAddressFields, FrenchAddressFields, UKAddressFields {
  city?: string; // City name, or the municipality in Japan; APO, FPO or DPO in a military address
  compartment?: string; // Compartment on a Canadian rural route (the 10 in "SITE 6 COMP 10 RR 8")
  country?: "CA" | "US" | "JP" | "AU" | "GB" | "GY" | "IM" | "JE" | FrenchPostalCountry | "DE"; // Detected country; AU, GB (with Jersey, Guernsey and the Isle of Man), FR (with Monaco and the overseas collectivities) and DE only from their modules
  fraction?: string; // Fractional address number (e.g., 1/2 in "123 1/2 Main St")
  generalDelivery?: boolean; // General delivery indicator
  highwayContract?: string; // Highway contract route number (the 68 in "HC 68 BOX 23A"); ruralRoute holds "HC 68"
  locality?: string; // Sub-city locality (borough, district, neighborhood), or a Puerto Rico urbanization
  military?: string; // Military delivery line ("PSC 802 Box 74", "Unit 2050 Box 4190"); state is AA, AE or AP
  number?: string; // Street number
  place?: string; // Place name (landmark, POI, building, monument, etc.)
  plus4?: string; // Extended ZIP+4 code
  postalValid?: boolean; // Postal code validation status
  postalType?: "zip" | "postal"; // Postal code type (zip or postal)
  prefix?: string; // Directional prefix (N, S, E, W, etc.)
  rpo?: string; // Retail Postal Outlet (Canada Post) identifier
  rr?: string; // Rural Route number (RR/R.R.)
  ruralRoute?: string; // Rural route or similar
  secUnitNum?: string; // Secondary unit number
  secUnitType?: string; // Secondary unit type (apt, suite, etc.)
  secondary?: string; // Legacy properties for backward compatibility
  site?: string; // Site number on a Canadian rural route (the 6 in "SITE 6 COMP 10 RR 8")
  state?: string; // State/Province code; AA, AE or AP for a military address
  station?: string; // Station or Succursale identifier (e.g., Station A, Succ. Centre-ville)
  street?: string; // Street name
  suffix?: string; // Directional suffix
  type?: string; // Street type/suffix (St, Ave, Rd, etc.)
  unit?: string; // Legacy unit property for backward compatibility
  zip?: string; // ZIP or postal code
  zipValid?: boolean; // ZIP/postal code format validation (true if format is valid)
}
```

What `parseLocation` returns: every part it found, each absent when the address has none. A Japanese address fills its own fields and the shared ones that stand for them: `state` the prefecture's JIS code, `city` the municipality, `street` the town, `number` the block, `zip` the postal code.

```js
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { ParsedAddress } from "@johnmorrisdotca/address-plus/jp";

console.log(parseLocation("123 Main St Apt 4, Anytown, NY 12345"));
// {"number":"123","secUnitType":"Apartment","secUnitNum":"4","unit":"Apt 4","street":"Main","type":"St","city":"Anytown","state":"NY","zip":"12345","zipValid":true,"country":"US"}
```

### ParseOptions

type

```ts
interface ParseOptions {
  country?:
    | "CA"
    | "US"
    | "JP"
    | "AU"
    | "GB"
    | "GY"
    | "IM"
    | "JE"
    | FrenchPostalCountry
    | "DE"
    | "GP"
    | "MQ"
    | "GF"
    | "RE"
    | "YT"
    | "auto"; // Country to optimize parsing for; JP skips the detection and parses as Japanese; AU, GB, FR, DE and the rest need their module in countries
  countries?: readonly CountryModule[]; // Country modules to read beside the US, Canada and Japan: australia from "/au", unitedKingdom from "/gb", france from "/fr", germany from "/de"
  normalize?: boolean; // Whether to normalize street types and directions
  validatePostalCode?: boolean; // Whether to validate postal/ZIP codes
  language?: "auto" | "en" | "fr"; // Language preference for bilingual parsing (Canada)
  extractFacilities?: boolean; // Whether to extract facility names
  parseParenthetical?: boolean; // Whether to parse parenthetical information
  strict?: boolean; // Whether to only extract valid ZIP/postal codes (strict mode) - true: Only extract codes that pass format validation, false (default): Extract all codes but indicate validity with zipValid field
  useSnakeCase?: boolean; // Whether to return field names in snake_case format for backward compatibility - true: Return snake_case field names (sec_unit_type, sec_unit_num, etc.), false (default): Return camelCase field names (secUnitType, secUnitNum, etc.)
}
```

Options for every parser: the country, strict postal codes, snake_case keys and the rest. Every one is optional.

```js
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { ParseOptions } from "@johnmorrisdotca/address-plus/jp";

console.log(Reflect.get(parseLocation("東京都千代田区丸の内1-2-3", { country: "JP", useSnakeCase: true }) ?? {}, "prefecture_code"));
// "13"
```

### parseUKAddress

function

```ts
parseUKAddress(text: string, options?: ParseOptions): ParsedAddress | null
```

Parses an address in the United Kingdom (or Jersey, Guernsey and the Isle of Man, which share Royal Mail's postcodes) into the parts of Royal Mail's Postcode Address File: a flat or unit (`secUnitType`, `secUnitNum`) or a named part of a building (`subBuilding`), a floor, the building's name, the number, a dependent thoroughfare, the thoroughfare (its name in `street`, its descriptor in full in `type`), the dependent localities, the post town in `city`, a county, and the postcode in `zip` with the nation it delivers to. The postcode is found wherever it is written and normalised to capitals with one space; `BFPO 105` is read as a forces address.

- `text`: The address as one string; commas and line breaks both separate its parts.
- `options`: `useSnakeCase` gives snake_case keys; the other options are not used.
- Returns: The parts found, with `country` `GB` (or `JE`, `GY`, `IM`), or `null` when the text is empty.

```js
import { parseUKAddress } from "@johnmorrisdotca/address-plus/gb";

console.log(parseUKAddress("Flat 14, Ziggurat Building, 60-66 Saffron Hill, London EC1N 8QX"));
// {"secUnitType":"Flat","secUnitNum":"14","building":"Ziggurat Building","number":"60-66","street":"Saffron","type":"Hill","city":"London","zip":"EC1N 8QX","zipValid":true,"nation":"ENG","country":"GB"}
```

### parseUKPostcode

function

```ts
parseUKPostcode(postcode: string): UKPostcode | null
```

Takes a postcode apart: outward code, inward code, area, district and sector, and says where it delivers: the country (`GB`, or `JE`, `GY` or `IM` for the Crown Dependencies) and, in the United Kingdom, the nation. A district that crosses a border gives the nation most of its postcodes are in; `getNationsForUKPostcode` gives them all.

- `postcode`: The postcode, in any letter case, with or without its space.
- Returns: The parts, or `null` when it does not follow the grammar or its area is not one Royal Mail uses.

```js
import { parseUKPostcode } from "@johnmorrisdotca/address-plus/gb";

console.log(parseUKPostcode("JE2 3AB"));
// {"postcode":"JE2 3AB","outward":"JE2","inward":"3AB","area":"JE","district":"JE2","sector":"JE2 3","country":"JE"}
```

### RoyalMailFormattingOptions

type

```ts
interface RoyalMailFormattingOptions {
  includeCounty?: boolean; // Keep a county that was written, on the line after the post town; Royal Mail does not need it
  includeCountry?: boolean; // UNITED KINGDOM as the last line, for mail from abroad (or JERSEY, GUERNSEY, ISLE OF MAN)
}
```

Options for `formatRoyalMail`.

```js
import { formatRoyalMail, parseUKAddress } from "@johnmorrisdotca/address-plus/gb";
import type { RoyalMailFormattingOptions } from "@johnmorrisdotca/address-plus/gb";

const parsedAddress1=parseUKAddress("10 Downing Street, London SW1A 2AA");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatRoyalMail(parsedAddress1, { includeCountry: true }).lines);
// ["10 Downing Street","LONDON","SW1A 2AA","UNITED KINGDOM"]
```

### UKAddressFields

type

```ts
interface UKAddressFields {
  subBuilding?: string; // A part of a building with no number: "Basement Flat", "Stables Flat"
  dependentThoroughfare?: string; // A thoroughfare inside another: the "Seastone Cottages" of "1A Seastone Cottages, Station Road"
  doubleDependentLocality?: string; // A locality inside the dependent locality, written above it
  county?: string; // A county, when one is written; Royal Mail no longer needs it
  nation?: UKNationCode; // The nation the postcode delivers to, from the tables
  bfpo?: string; // A British Forces Post Office number: the 105 of "BFPO 105"
}
```

The fields an address in the United Kingdom fills beside the shared ones. The shared fields keep their meaning: `number` is the building number, `street` and `type` the thoroughfare's name and its descriptor in full (`Upper` and `Street`, as Royal Mail writes it), `secUnitType` and `secUnitNum` a flat or unit (`Flat 2`) or a PO Box, `building` the building's name, `locality` the dependent locality, `city` the post town and `zip` the postcode.

```js
import { parseUKAddress } from "@johnmorrisdotca/address-plus/gb";
import type { UKAddressFields } from "@johnmorrisdotca/address-plus/gb";

console.log(parseUKAddress("Flat 2, Rose Court, 14 High Street, Kingsbury, LONDON NW9 0AA")?.locality);
// "Kingsbury"
```

### UKNation

type

```ts
interface UKNation {
  code: UKNationCode;
  iso: string; // GB-SCT
  name: string; // Scotland
  nameJa: string; // スコットランド
}
```

A nation of the United Kingdom in the tables: its code, its ISO 3166-2 code, and its name in English and in Japanese (from kuni, which takes them from Unicode CLDR and Wikidata).

```js
import { GB_NATIONS } from "@johnmorrisdotca/address-plus/gb";
import type { UKNation } from "@johnmorrisdotca/address-plus/gb";

console.log(GB_NATIONS.find((nation) => nation.code === "SCT"));
// {"code":"SCT","iso":"GB-SCT","name":"Scotland","nameJa":"スコットランド"}
```

### UKNationCode

type

```ts
type UKNationCode = "ENG" | "NIR" | "SCT" | "WLS";
```

The code of one of the four nations of the United Kingdom, as ISO 3166-2:GB writes it after `GB-`.

```js
import { getNationFromUKPostcode } from "@johnmorrisdotca/address-plus/gb";
import type { UKNationCode } from "@johnmorrisdotca/address-plus/gb";

console.log(getNationFromUKPostcode("CF10 1AA"));
// "WLS"
```

### UKPostcode

type

```ts
interface UKPostcode {
  postcode: string; // Capitals, one space: EC1A 1BB
  outward: string; // EC1A
  inward: string; // 1BB
  area: string; // EC
  district: string; // EC1A, the same as the outward code
  sector: string; // EC1A 1
  country: "GB" | "GY" | "IM" | "JE";
  nation?: UKNationCode; // Absent outside the United Kingdom, and for a non-geographic area (BX, BF)
}
```

A postcode taken apart: the outward code (area and district) and the inward code (sector and unit), and where it delivers. `country` is `GB` for the United Kingdom and `JE`, `GY` or `IM` for Jersey, Guernsey and the Isle of Man, which use Royal Mail's postcodes but are not part of the United Kingdom.

```js
import { parseUKPostcode } from "@johnmorrisdotca/address-plus/gb";
import type { UKPostcode } from "@johnmorrisdotca/address-plus/gb";

console.log(parseUKPostcode("ec1a1bb"));
// {"postcode":"EC1A 1BB","outward":"EC1A","inward":"1BB","area":"EC","district":"EC1A","sector":"EC1A 1","country":"GB","nation":"ENG"}
```

### UKPostcodeArea

type

```ts
interface UKPostcodeArea {
  name: string;
  country: "GB" | "GY" | "IM" | "JE";
  nation?: UKNationCode;
}
```

A postcode area: the town Royal Mail names it for, the country it delivers to (`GB`, or `JE`, `GY` and `IM` for the Crown Dependencies), and for the United Kingdom the nation, absent for an area that is not a place (`BF`, `BX`).

```js
import { GB_POSTCODE_AREAS } from "@johnmorrisdotca/address-plus/gb";
import type { UKPostcodeArea } from "@johnmorrisdotca/address-plus/gb";

console.log(GB_POSTCODE_AREAS.BT);
// {"name":"Northern Ireland","country":"GB","nation":"NIR"}
```

### unitedKingdom

const

```ts
unitedKingdom: CountryModule
```

The United Kingdom's module, for `parseLocation` and `validateAddress`: pass it in `countries`, and an address with a British postcode (or ending with the United Kingdom or a nation) is read as British; `country: "GB"` reads any address as one. It reads Jersey (`JE`), Guernsey (`GY`) and the Isle of Man (`IM`) too.

```js
import { parseLocation } from "@johnmorrisdotca/address-plus";
import { unitedKingdom } from "@johnmorrisdotca/address-plus/gb";

console.log(parseLocation("221B Baker Street, London NW1 6XE", { countries: [unitedKingdom] })?.number);
// "221B"
```

### validateUKAddress

function

```ts
validateUKAddress(address: ParsedAddress, options?: ValidationOptions): CountryValidation
```

Checks an address in the United Kingdom against Royal Mail's postcode grammar and the tables: the postcode is well formed, Royal Mail uses its area, and in Great Britain Code-Point Open lists its district. Says when a postcode is Jersey's, Guernsey's or the Isle of Man's, which are not part of the UK, and warns when the postcode or the post town is missing.

- `address`: The address as `parseUKAddress` (or `parseLocation` with the module) returns it.
- `options`: `strictPostalValidation: true` makes the postcode findings errors; the rest are not used.
- Returns: The errors and warnings, each with its field, code and message.

```js
import { parseUKAddress, validateUKAddress } from "@johnmorrisdotca/address-plus/gb";

const parsedAddress1=parseUKAddress("1 High Street, London EC9Z 1AA");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(validateUKAddress(parsedAddress1).warnings.map((one) => one.code));
// ["INVALID_POSTAL_FORMAT"]
```

### ValidationError

type

```ts
interface ValidationError {
  field: string; // Field name where error occurred
  code: string; // Error code identifier
  message: string; // Human-readable error message
  severity: "error" | "warning" | "info"; // Severity level of the validation issue
}
```

One finding of a validator: the field it is about, its code, a message, and how serious it is.

```js
import { validateAddress } from "@johnmorrisdotca/address-plus";
import type { ValidationError } from "@johnmorrisdotca/address-plus/jp";

console.log(validateAddress("123 Main St, Seattle, NY 98101").warnings[0]);
// {"field":"zip","code":"POSTAL_REGION_MISMATCH","message":"ZIP code 98101 belongs to WA, not NY","severity":"warning"}
```

### ValidationOptions

type

```ts
interface ValidationOptions {
  requireStreetNumber?: boolean; // Whether street number is required
  requireStreetName?: boolean; // Whether street name is required
  requireCity?: boolean; // Whether city is required
  requireState?: boolean; // Whether state/province is required
  requirePostalCode?: boolean; // Whether postal code is required
  allowPOBox?: boolean; // Whether PO Box addresses are allowed
  allowRuralRoute?: boolean; // Whether rural route addresses are allowed
  allowGeneralDelivery?: boolean; // Whether general delivery addresses are allowed
  strictPostalValidation?: boolean; // Whether to use strict postal code validation
  country?: ParseOptions["country"]; // Country context for validation rules; AU, GB, FR, DE and the rest need their module in countries
  countries?: readonly import("./country-module").CountryModule[]; // Country modules to read beside the US, Canada and Japan
}
```

Options for the validators: which parts an address must have, which kinds are allowed, and whether a postal code that does not match its region is an error.

```js
import { validateAddress } from "@johnmorrisdotca/address-plus";
import type { ValidationOptions } from "@johnmorrisdotca/address-plus/jp";

console.log(validateAddress("123 Main St", { requirePostalCode: true }).errors.map((error) => error.code));
// ["MISSING_POSTAL_CODE"]
```


## @johnmorrisdotca/address-plus/de

### compareGermanAddresses

function

```ts
compareGermanAddresses(first: ParsedAddress, second: ParsedAddress): CountryComparison
```

Compares two addresses in Germany field by field: who it is care of, the building, the flat and floor, the street, the house number, the place and the postcode. Letter case, ä and ae, ß and ss, a street's suffix written `Straße`, `Strasse` or `Str.`, and the postcode's spacing are not differences. The Land and the Ortsteil are left out, since the postcode already says the first.

- `first`: The first address, as `parseGermanAddress` returns it.
- `second`: The second address.
- Returns: Whether they are the same delivery point, and each field that differs.

```js
import { compareGermanAddresses, parseGermanAddress } from "@johnmorrisdotca/address-plus/de";

const parsedAddress1=parseGermanAddress("Müllerstraße 5, 13353 Berlin");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseGermanAddress("MUELLERSTR. 5, 13353 BERLIN");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(compareGermanAddresses(parsedAddress1, parsedAddress2).isSame);
// true
```

### CountryComparison

type

```ts
interface CountryComparison {
  isSame: boolean;
  differences: CountryDifference[];
}
```

What a country module's comparer returns: whether the two addresses are the same delivery point, and every field that differs once both are in the same form (letter case, punctuation, a street type written out or abbreviated).

```js
import { compareAustralianAddresses, parseAustralianAddress } from "@johnmorrisdotca/address-plus/au";
import type { CountryComparison } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseAustralianAddress("3/12 Smith Street, Parramatta NSW 2150");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseAustralianAddress("Unit 3, 12 Smith St, PARRAMATTA NSW 2150");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(compareAustralianAddresses(parsedAddress1, parsedAddress2).isSame);
// true
```

### CountryDifference

type

```ts
interface CountryDifference {
  field: string;
  first?: string;
  second?: string;
}
```

One way two addresses differ, as a country module's comparer reports it: the field, and its value in each address after both were put in the same form.

```js
import { compareUKAddresses, parseUKAddress } from "@johnmorrisdotca/address-plus/gb";
import type { CountryDifference } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseUKAddress("10 High Street, Bath BA1 1AA");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseUKAddress("12 High St, Bath BA1 1AA");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(compareUKAddresses(parsedAddress1, parsedAddress2).differences);
// [{"field":"number","first":"10","second":"12"}]
```

### CountryModule

type

```ts
interface CountryModule {
  code: string; // The country's ISO 3166-1 code: AU, GB
  codes: readonly string[]; // Every country code the module reads; GB also reads Jersey (JE), Guernsey (GY) and the Isle of Man (IM)
  name: string; // The country's name in English
  detect(address: string): boolean; // Whether the address is surely this country's, with no hint
  parse(address: string, options?: ParseOptions): ParsedAddress | null;
  validate(address: ParsedAddress, options?: ValidationOptions): CountryValidation;
  format(address: ParsedAddress): FormattedAddress;
  compare(first: ParsedAddress, second: ParsedAddress): CountryComparison;
}
```

A country's address module: its codes, how to tell its addresses apart, and its parser, validator, formatter and comparer. Import one from its entry point (`australia` from `@johnmorrisdotca/address-plus/au`, `unitedKingdom` from `@johnmorrisdotca/address-plus/gb`) and hand it to `parseLocation` and `validateAddress` in `countries`.

```js
import { australia } from "@johnmorrisdotca/address-plus/au";
import type { CountryModule } from "@johnmorrisdotca/address-plus/au";

console.log(australia.codes);
// ["AU"]
```

### CountryValidation

type

```ts
interface CountryValidation {
  errors: ValidationError[];
  warnings: ValidationError[];
}
```

What a country module's validator returns: the errors and the warnings it found.

```js
import { parseAustralianAddress, validateAustralianAddress } from "@johnmorrisdotca/address-plus/au";
import type { CountryValidation } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseAustralianAddress("1 Main St, Sydney VIC 2000");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(validateAustralianAddress(parsedAddress1).warnings.map((one) => one.code));
// ["POSTAL_REGION_MISMATCH"]
```

### DE_BUILDING_WORDS

const

```ts
DE_BUILDING_WORDS: readonly string[]
```

The words for a part of a building, which open the line the parser keeps whole as `building` (`Hinterhaus`, `Haus B`, `Gebäude 4`, `Block C`), in lower case.

```js
import { DE_BUILDING_WORDS } from "@johnmorrisdotca/address-plus/de";

console.log(DE_BUILDING_WORDS.slice(0, 3));
// ["hinterhaus","vorderhaus","seitenflügel"]
```

### DE_COUNTRY_NAMES

const

```ts
DE_COUNTRY_NAMES: readonly string[]
```

What a country at the end of an address may be called, in capitals with no umlauts: `DEUTSCHLAND`, `GERMANY`, `ALLEMAGNE`, `BRD`.

```js
import { DE_COUNTRY_NAMES } from "@johnmorrisdotca/address-plus/de";

console.log(DE_COUNTRY_NAMES.includes("DEUTSCHLAND"));
// true
```

### DE_STATES

const

```ts
DE_STATES: readonly GermanState[]
```

The sixteen Länder of Germany, in order of their codes, each with its ISO 3166-2 code and its name in English and in Japanese. Copied from kuni when the tables are made.

```js
import { DE_STATES } from "@johnmorrisdotca/address-plus/de";

console.log(DE_STATES.map((state) => state.code));
// ["BB","BE","BW","BY","HB","HE","HH","MV","NI","NW","RP","SH","SL","SN","ST","TH"]
```

### DE_STREET_OPENERS

const

```ts
DE_STREET_OPENERS: readonly string[]
```

The words that begin a street's name with no suffix to end it (`Am Markt`, `An der Weide`, `Zum alten Hof`, `Im Winkel`), and the adjectives that begin one (`Große Bleiche`, `Alte Dorfstraße`), in lower case.

```js
import { DE_STREET_OPENERS } from "@johnmorrisdotca/address-plus/de";

console.log(DE_STREET_OPENERS.slice(0, 5));
// ["am","an","auf","im","in"]
```

### DE_STREET_SUFFIXES

const

```ts
DE_STREET_SUFFIXES: readonly string[]
```

What a street's name may end with, which makes the word the name ends in a thoroughfare (`Hauptstraße`, `Berliner Str.`, `Kastanienallee`), in lower case with their spellings: `strasse` for `straße`, `str` for the abbreviation. The parser reads the street's whole name as written into `street`; these tell where it ends.

```js
import { DE_STREET_SUFFIXES } from "@johnmorrisdotca/address-plus/de";

console.log(DE_STREET_SUFFIXES.slice(0, 4));
// ["straße","strasse","str","weg"]
```

### DE_UNIT_TYPES

const

```ts
DE_UNIT_TYPES: Readonly<Record<string, readonly string[]>>
```

The words for a flat or a room, which the parser reports as `secUnitType` in full, with the abbreviations it reads for each: `Whg. 12` is `Wohnung 12`.

```js
import { DE_UNIT_TYPES } from "@johnmorrisdotca/address-plus/de";

console.log(DE_UNIT_TYPES.Wohnung);
// ["whg","wohn","wo"]
```

### DeutschePostFormattingOptions

type

```ts
interface DeutschePostFormattingOptions {
  includeCountry?: boolean; // DEUTSCHLAND as the last line, for mail from abroad
}
```

Options for `formatDeutschePost`.

```js
import { formatDeutschePost, parseGermanAddress } from "@johnmorrisdotca/address-plus/de";
import type { DeutschePostFormattingOptions } from "@johnmorrisdotca/address-plus/de";

const parsedAddress1=parseGermanAddress("Hauptstr. 12, 10115 Berlin");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatDeutschePost(parsedAddress1, { includeCountry: true }).lines);
// ["Hauptstr. 12","10115 Berlin","DEUTSCHLAND"]
```

### findGermanState

function

```ts
findGermanState(text: string): GermanState | null
```

Finds a Land of Germany by its code (`BY`, `DE-BY`) or its name in English, German or Japanese, without regard to letter case or umlauts written as `ae`, `oe`, `ue`.

- `text`: The code or the name.
- Returns: The Land, or `null` when nothing matches.

```js
import { findGermanState } from "@johnmorrisdotca/address-plus/de";

console.log([findGermanState("Bayern")?.code, findGermanState("thueringen")?.code, findGermanState("Lower Saxony")?.code]);
// ["BY","TH","NI"]
```

### formatDeutschePost

function

```ts
formatDeutschePost(address: ParsedAddress, options?: DeutschePostFormattingOptions): FormattedAddress
```

Writes an address in Germany as Deutsche Post asks: who it is care of (`c/o`), the part of the building, the flat and the floor, the street and its house number, then the postcode and the place, each on its own line, with no punctuation at the end of a line. A Postfach is written with its number in pairs (`Postfach 12 34 56`) and a Packstation with its number.

- `address`: The address as `parseGermanAddress` returns it.
- `options`: Whether to add the country (see `DeutschePostFormattingOptions`).
- Returns: The lines, the same on one line, the delivery line (the street and its number) and the last line.

```js
import { formatDeutschePost, parseGermanAddress } from "@johnmorrisdotca/address-plus/de";

const parsedAddress1=parseGermanAddress("Hinterhaus, 2. OG, Kastanienallee 4 b, 10435 Berlin");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatDeutschePost(parsedAddress1).lines);
// ["Hinterhaus","2. OG","Kastanienallee 4B","10435 Berlin"]
```

### FormattedAddress

type

```ts
interface FormattedAddress {
  lines: string[]; // Individual address lines
  singleLine: string; // Single-line representation
  deliveryLine?: string; // Street address line
  lastLine?: string; // City/state/postal line
  country?: string; // Country designation
  format:
    | "standard"
    | "usps"
    | "canada-post"
    | "international"
    | "australia-post"
    | "royal-mail"
    | "la-poste"
    | "deutsche-post"; // Formatting standard used
}
```

A formatted address: its lines, and the same on one line.

```js
import { formatUSPS, parseLocation } from "@johnmorrisdotca/address-plus";
import type { FormattedAddress } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseLocation("123 Main St, Anytown, NY 12345");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatUSPS(parsedAddress1));
// {"lines":["123 MAIN ST","ANYTOWN NY 12345"],"singleLine":"123 Main St, Anytown NY 12345","deliveryLine":"123 Main St","lastLine":"Anytown NY 12345","country":"US","format":"usps"}
```

### GermanAddressFields

type

```ts
interface GermanAddressFields {
  careOf?: string; // The "c/o", "bei" or "z. Hd." line: who the address is care of
}
```

The fields an address in Germany fills beside the shared ones. The shared fields keep their meaning: `street` is the whole name of the street as written (`Hauptstraße`, `Berliner Str.`, `Am Markt`), `number` the house number with its letter (`12a`) or range (`12-14`), `secUnitType` and `secUnitNum` a flat (`Wohnung 12`), a box (`Postfach 12 34 56`) or a Packstation, `floorType` and `floor` a floor (`OG` and `2`), `building` a wing, a house or a name (`Hinterhaus`, `Haus B`), `locality` the Ortsteil, `city` the place, `state` the Land's code and `zip` the postcode.

```js
import { parseGermanAddress } from "@johnmorrisdotca/address-plus/de";
import type { GermanAddressFields } from "@johnmorrisdotca/address-plus/de";

console.log(parseGermanAddress("c/o Weber, Hauptstraße 12a, 10115 Berlin")?.careOf);
// "Weber"
```

### GermanPostcode

type

```ts
interface GermanPostcode {
  postcode: string; // 10115
  state?: GermanStateCode; // BE; absent for a postcode that is not in the list
  known: boolean; // Whether GeoNames' list has it
}
```

A postcode taken apart: the Land it is in, and whether GeoNames' list has it.

```js
import { parseGermanPostcode } from "@johnmorrisdotca/address-plus/de";
import type { GermanPostcode } from "@johnmorrisdotca/address-plus/de";

console.log(parseGermanPostcode("10115"));
// {"postcode":"10115","state":"BE","known":true}
```

### GermanState

type

```ts
interface GermanState {
  code: GermanStateCode; // BY
  iso: string; // DE-BY
  name: string; // Bavaria
  nameJa: string; // バイエルン自由州
}
```

A Land of Germany in the tables: its code, its ISO 3166-2 code, and its name in English and in Japanese (from kuni, which takes them from Unicode CLDR and Wikidata).

```js
import { DE_STATES } from "@johnmorrisdotca/address-plus/de";
import type { GermanState } from "@johnmorrisdotca/address-plus/de";

console.log(DE_STATES.find((state) => state.code === "BY"));
// {"code":"BY","iso":"DE-BY","name":"Bavaria","nameJa":"バイエルン自由州"}
```

### GermanStateCode

type

```ts
type GermanStateCode =
  "BB" | "BE" | "BW" | "BY" | "HB" | "HE" | "HH" | "MV" | "NI" | "NW" | "RP" | "SH" | "SL" | "SN" | "ST" | "TH";
```

The code of one of the sixteen Länder of Germany, as ISO 3166-2:DE writes it after `DE-`.

```js
import { getStateFromGermanPostcode } from "@johnmorrisdotca/address-plus/de";
import type { GermanStateCode } from "@johnmorrisdotca/address-plus/de";

console.log(getStateFromGermanPostcode("80331"));
// "BY"
```

### germany

const

```ts
germany: CountryModule
```

Germany's module, for `parseLocation` and `validateAddress`: pass it in `countries`, and an address that ends with Germany or Deutschland, or has a German street and its number and a postcode first on its last line, is read as German; `country: "DE"` reads any address as one.

```js
import { parseLocation } from "@johnmorrisdotca/address-plus";
import { germany } from "@johnmorrisdotca/address-plus/de";

console.log(parseLocation("Hauptstraße 12a, 10115 Berlin", { countries: [germany] })?.number);
// "12A"
```

### getStateFromGermanPostcode

function

```ts
getStateFromGermanPostcode(postcode: string): GermanStateCode | undefined
```

The Land a postcode is in, by its code: `BY` for 80331, `BE` for 10115.

- `postcode`: The postcode.
- Returns: The Land's code; `undefined` for a postcode GeoNames' list does not have, or text that is not a postcode.

```js
import { getStateFromGermanPostcode } from "@johnmorrisdotca/address-plus/de";

console.log(["80331", "10115", "20095", "00000"].map(getStateFromGermanPostcode));
// ["BY","BE","HH",null]
```

### isKnownGermanPostcode

function

```ts
isKnownGermanPostcode(postcode: string): boolean
```

Whether GeoNames' list for Germany has a postcode (its places include those of large firms, whose postcodes are their own). The list is GeoNames' (CC BY 4.0), not Deutsche Post's, so a postcode made since it was copied is not in it: an unknown one is a warning for a validator to give, not proof that it does not exist.

- `postcode`: The postcode.
- Returns: `true` when the list has it.

```js
import { isKnownGermanPostcode } from "@johnmorrisdotca/address-plus/de";

console.log(["10115", "80331", "00000", "99999"].map(isKnownGermanPostcode));
// [true,true,false,false]
```

### isValidGermanPostcode

function

```ts
isValidGermanPostcode(postcode: string): boolean
```

Whether a postcode follows Deutsche Post's shape: five digits. Whether the postcode is in use is a different question; `isKnownGermanPostcode` asks it, and the validator checks both.

- `postcode`: The postcode.
- Returns: `true` when it is five digits.

```js
import { isValidGermanPostcode } from "@johnmorrisdotca/address-plus/de";

console.log(["10115", "1011", "1011a", " 80331 "].map(isValidGermanPostcode));
// [true,false,false,true]
```

### looksGerman

function

```ts
looksGerman(text: string): boolean
```

Whether an address is surely German, with no hint: it ends with Germany, Deutschland or a code such as `D-10115` before the place, or its last line begins with a postcode and a place (`10115 Berlin`) while the address has a street that ends in a German suffix (`Hauptstraße`, `Kastanienallee`, `Am Markt`) followed by its number, or a `Postfach` or a `Packstation`. A US ZIP code follows its state, a Canadian one ends in a digit and a French street begins with its number and a type of voie, so none of those has that shape.

- `text`: The address as one string.
- Returns: `true` when the address is German beyond doubt, `false` otherwise.

```js
import { looksGerman } from "@johnmorrisdotca/address-plus/de";

console.log([looksGerman("Hauptstraße 12, 10115 Berlin"), looksGerman("123 Main St, Seattle, WA 98101")]);
// [true,false]
```

### ParsedAddress

type

```ts
interface ParsedAddress extends JapaneseAddressFields, AustralianAddressFields, FrenchAddressFields, UKAddressFields {
  city?: string; // City name, or the municipality in Japan; APO, FPO or DPO in a military address
  compartment?: string; // Compartment on a Canadian rural route (the 10 in "SITE 6 COMP 10 RR 8")
  country?: "CA" | "US" | "JP" | "AU" | "GB" | "GY" | "IM" | "JE" | FrenchPostalCountry | "DE"; // Detected country; AU, GB (with Jersey, Guernsey and the Isle of Man), FR (with Monaco and the overseas collectivities) and DE only from their modules
  fraction?: string; // Fractional address number (e.g., 1/2 in "123 1/2 Main St")
  generalDelivery?: boolean; // General delivery indicator
  highwayContract?: string; // Highway contract route number (the 68 in "HC 68 BOX 23A"); ruralRoute holds "HC 68"
  locality?: string; // Sub-city locality (borough, district, neighborhood), or a Puerto Rico urbanization
  military?: string; // Military delivery line ("PSC 802 Box 74", "Unit 2050 Box 4190"); state is AA, AE or AP
  number?: string; // Street number
  place?: string; // Place name (landmark, POI, building, monument, etc.)
  plus4?: string; // Extended ZIP+4 code
  postalValid?: boolean; // Postal code validation status
  postalType?: "zip" | "postal"; // Postal code type (zip or postal)
  prefix?: string; // Directional prefix (N, S, E, W, etc.)
  rpo?: string; // Retail Postal Outlet (Canada Post) identifier
  rr?: string; // Rural Route number (RR/R.R.)
  ruralRoute?: string; // Rural route or similar
  secUnitNum?: string; // Secondary unit number
  secUnitType?: string; // Secondary unit type (apt, suite, etc.)
  secondary?: string; // Legacy properties for backward compatibility
  site?: string; // Site number on a Canadian rural route (the 6 in "SITE 6 COMP 10 RR 8")
  state?: string; // State/Province code; AA, AE or AP for a military address
  station?: string; // Station or Succursale identifier (e.g., Station A, Succ. Centre-ville)
  street?: string; // Street name
  suffix?: string; // Directional suffix
  type?: string; // Street type/suffix (St, Ave, Rd, etc.)
  unit?: string; // Legacy unit property for backward compatibility
  zip?: string; // ZIP or postal code
  zipValid?: boolean; // ZIP/postal code format validation (true if format is valid)
}
```

What `parseLocation` returns: every part it found, each absent when the address has none. A Japanese address fills its own fields and the shared ones that stand for them: `state` the prefecture's JIS code, `city` the municipality, `street` the town, `number` the block, `zip` the postal code.

```js
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { ParsedAddress } from "@johnmorrisdotca/address-plus/jp";

console.log(parseLocation("123 Main St Apt 4, Anytown, NY 12345"));
// {"number":"123","secUnitType":"Apartment","secUnitNum":"4","unit":"Apt 4","street":"Main","type":"St","city":"Anytown","state":"NY","zip":"12345","zipValid":true,"country":"US"}
```

### parseGermanAddress

function

```ts
parseGermanAddress(text: string, options?: ParseOptions): ParsedAddress | null
```

Parses an address in Germany into the parts Deutsche Post and DIN 5008 lay out: who it is care of (`careOf`, from `c/o`, `z. Hd.`, `bei`), the part of a building (`building`: `Hinterhaus`, `Haus B`, or a name above the street), a flat (`secUnitType` and `secUnitNum`: `Wohnung 12`), a floor (`floorType` and `floor`: `Obergeschoss` and `2`), the street's whole name as written in `street` (`Hauptstraße`, `Berliner Str.`, `Am Markt`), its house number in `number` (`12a`, `12-14`), a Postfach or Packstation (`secUnitType` and `secUnitNum`), the Ortsteil in `locality`, the place in `city`, and the postcode in `zip` with the Land's code in `state`. The postcode may stand anywhere after the street; `D-10115` is read as `10115`.

- `text`: The address as one string; commas and line breaks both separate its parts.
- `options`: `useSnakeCase` gives snake_case keys; the other options are not used.
- Returns: The parts found, with `country` `DE`, or `null` when the text is empty or holds nothing that makes it an address.

```js
import { parseGermanAddress } from "@johnmorrisdotca/address-plus/de";

console.log(parseGermanAddress("c/o Weber, Hinterhaus, Hauptstraße 12a, 10115 Berlin"));
// {"careOf":"Weber","building":"Hinterhaus","street":"Hauptstraße","number":"12A","city":"Berlin","state":"BE","zip":"10115","zipValid":true,"country":"DE"}
```

### parseGermanPostcode

function

```ts
parseGermanPostcode(postcode: string): GermanPostcode | null
```

Takes a postcode apart: the Land it is in, from GeoNames' list (a postcode with places in two Länder takes the one most are in), and whether the list has it.

- `postcode`: The postcode, with or without spaces.
- Returns: The parts, or `null` when it is not five digits.

```js
import { parseGermanPostcode } from "@johnmorrisdotca/address-plus/de";

console.log(parseGermanPostcode("80331"));
// {"postcode":"80331","state":"BY","known":true}
```

### ParseOptions

type

```ts
interface ParseOptions {
  country?:
    | "CA"
    | "US"
    | "JP"
    | "AU"
    | "GB"
    | "GY"
    | "IM"
    | "JE"
    | FrenchPostalCountry
    | "DE"
    | "GP"
    | "MQ"
    | "GF"
    | "RE"
    | "YT"
    | "auto"; // Country to optimize parsing for; JP skips the detection and parses as Japanese; AU, GB, FR, DE and the rest need their module in countries
  countries?: readonly CountryModule[]; // Country modules to read beside the US, Canada and Japan: australia from "/au", unitedKingdom from "/gb", france from "/fr", germany from "/de"
  normalize?: boolean; // Whether to normalize street types and directions
  validatePostalCode?: boolean; // Whether to validate postal/ZIP codes
  language?: "auto" | "en" | "fr"; // Language preference for bilingual parsing (Canada)
  extractFacilities?: boolean; // Whether to extract facility names
  parseParenthetical?: boolean; // Whether to parse parenthetical information
  strict?: boolean; // Whether to only extract valid ZIP/postal codes (strict mode) - true: Only extract codes that pass format validation, false (default): Extract all codes but indicate validity with zipValid field
  useSnakeCase?: boolean; // Whether to return field names in snake_case format for backward compatibility - true: Return snake_case field names (sec_unit_type, sec_unit_num, etc.), false (default): Return camelCase field names (secUnitType, secUnitNum, etc.)
}
```

Options for every parser: the country, strict postal codes, snake_case keys and the rest. Every one is optional.

```js
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { ParseOptions } from "@johnmorrisdotca/address-plus/jp";

console.log(Reflect.get(parseLocation("東京都千代田区丸の内1-2-3", { country: "JP", useSnakeCase: true }) ?? {}, "prefecture_code"));
// "13"
```

### validateGermanAddress

function

```ts
validateGermanAddress(address: ParsedAddress, options?: ValidationOptions): CountryValidation
```

Checks an address in Germany against Deutsche Post's postcode shape and GeoNames' list: the postcode is five digits and the list has it, and the place and the house number are given. The list is GeoNames' and not Deutsche Post's, so a postcode made since it was copied is flagged as unrecognised.

- `address`: The address as `parseGermanAddress` (or `parseLocation` with the module) returns it.
- `options`: `strictPostalValidation: true` makes the postcode findings errors; the rest are not used.
- Returns: The errors and warnings, each with its field, code and message.

```js
import { parseGermanAddress, validateGermanAddress } from "@johnmorrisdotca/address-plus/de";

const parsedAddress1=parseGermanAddress("Hauptstraße 12, 00000 Berlin");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(validateGermanAddress(parsedAddress1).warnings.map((one) => one.code));
// ["UNRECOGNIZED_POSTAL_CODE"]
```

### ValidationError

type

```ts
interface ValidationError {
  field: string; // Field name where error occurred
  code: string; // Error code identifier
  message: string; // Human-readable error message
  severity: "error" | "warning" | "info"; // Severity level of the validation issue
}
```

One finding of a validator: the field it is about, its code, a message, and how serious it is.

```js
import { validateAddress } from "@johnmorrisdotca/address-plus";
import type { ValidationError } from "@johnmorrisdotca/address-plus/jp";

console.log(validateAddress("123 Main St, Seattle, NY 98101").warnings[0]);
// {"field":"zip","code":"POSTAL_REGION_MISMATCH","message":"ZIP code 98101 belongs to WA, not NY","severity":"warning"}
```

### ValidationOptions

type

```ts
interface ValidationOptions {
  requireStreetNumber?: boolean; // Whether street number is required
  requireStreetName?: boolean; // Whether street name is required
  requireCity?: boolean; // Whether city is required
  requireState?: boolean; // Whether state/province is required
  requirePostalCode?: boolean; // Whether postal code is required
  allowPOBox?: boolean; // Whether PO Box addresses are allowed
  allowRuralRoute?: boolean; // Whether rural route addresses are allowed
  allowGeneralDelivery?: boolean; // Whether general delivery addresses are allowed
  strictPostalValidation?: boolean; // Whether to use strict postal code validation
  country?: ParseOptions["country"]; // Country context for validation rules; AU, GB, FR, DE and the rest need their module in countries
  countries?: readonly import("./country-module").CountryModule[]; // Country modules to read beside the US, Canada and Japan
}
```

Options for the validators: which parts an address must have, which kinds are allowed, and whether a postal code that does not match its region is an error.

```js
import { validateAddress } from "@johnmorrisdotca/address-plus";
import type { ValidationOptions } from "@johnmorrisdotca/address-plus/jp";

console.log(validateAddress("123 Main St", { requirePostalCode: true }).errors.map((error) => error.code));
// ["MISSING_POSTAL_CODE"]
```


## @johnmorrisdotca/address-plus/fr

### compareFrenchAddresses

function

```ts
compareFrenchAddresses(first: ParsedAddress, second: ParsedAddress): CountryComparison
```

Compares two addresses in France field by field: the delivery point, the building, the number and its extension, the type and name of the street, the lieu-dit, the box, the commune and the postcode. Letter case, accents, hyphens, a type of voie abbreviated (`av.`, `bd`) and `St` for `Saint` are not differences. The CEDEX and the department are left out: the postcode already says them.

- `first`: The first address, as `parseFrenchAddress` returns it.
- `second`: The second address.
- Returns: Whether they are the same delivery point, and each field that differs.

```js
import { compareFrenchAddresses, parseFrenchAddress } from "@johnmorrisdotca/address-plus/fr";

const parsedAddress1=parseFrenchAddress("12 rue de l'Église, 38000 Saint-Étienne");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseFrenchAddress("12 R. DE L EGLISE, 38000 ST ETIENNE");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(compareFrenchAddresses(parsedAddress1, parsedAddress2).isSame);
// true
```

### CountryComparison

type

```ts
interface CountryComparison {
  isSame: boolean;
  differences: CountryDifference[];
}
```

What a country module's comparer returns: whether the two addresses are the same delivery point, and every field that differs once both are in the same form (letter case, punctuation, a street type written out or abbreviated).

```js
import { compareAustralianAddresses, parseAustralianAddress } from "@johnmorrisdotca/address-plus/au";
import type { CountryComparison } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseAustralianAddress("3/12 Smith Street, Parramatta NSW 2150");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseAustralianAddress("Unit 3, 12 Smith St, PARRAMATTA NSW 2150");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(compareAustralianAddresses(parsedAddress1, parsedAddress2).isSame);
// true
```

### CountryDifference

type

```ts
interface CountryDifference {
  field: string;
  first?: string;
  second?: string;
}
```

One way two addresses differ, as a country module's comparer reports it: the field, and its value in each address after both were put in the same form.

```js
import { compareUKAddresses, parseUKAddress } from "@johnmorrisdotca/address-plus/gb";
import type { CountryDifference } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseUKAddress("10 High Street, Bath BA1 1AA");
if (!parsedAddress1) throw new Error("The example address did not parse.");
const parsedAddress2=parseUKAddress("12 High St, Bath BA1 1AA");
if (!parsedAddress2) throw new Error("The example address did not parse.");
console.log(compareUKAddresses(parsedAddress1, parsedAddress2).differences);
// [{"field":"number","first":"10","second":"12"}]
```

### CountryModule

type

```ts
interface CountryModule {
  code: string; // The country's ISO 3166-1 code: AU, GB
  codes: readonly string[]; // Every country code the module reads; GB also reads Jersey (JE), Guernsey (GY) and the Isle of Man (IM)
  name: string; // The country's name in English
  detect(address: string): boolean; // Whether the address is surely this country's, with no hint
  parse(address: string, options?: ParseOptions): ParsedAddress | null;
  validate(address: ParsedAddress, options?: ValidationOptions): CountryValidation;
  format(address: ParsedAddress): FormattedAddress;
  compare(first: ParsedAddress, second: ParsedAddress): CountryComparison;
}
```

A country's address module: its codes, how to tell its addresses apart, and its parser, validator, formatter and comparer. Import one from its entry point (`australia` from `@johnmorrisdotca/address-plus/au`, `unitedKingdom` from `@johnmorrisdotca/address-plus/gb`) and hand it to `parseLocation` and `validateAddress` in `countries`.

```js
import { australia } from "@johnmorrisdotca/address-plus/au";
import type { CountryModule } from "@johnmorrisdotca/address-plus/au";

console.log(australia.codes);
// ["AU"]
```

### CountryValidation

type

```ts
interface CountryValidation {
  errors: ValidationError[];
  warnings: ValidationError[];
}
```

What a country module's validator returns: the errors and the warnings it found.

```js
import { parseAustralianAddress, validateAustralianAddress } from "@johnmorrisdotca/address-plus/au";
import type { CountryValidation } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseAustralianAddress("1 Main St, Sydney VIC 2000");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(validateAustralianAddress(parsedAddress1).warnings.map((one) => one.code));
// ["POSTAL_REGION_MISMATCH"]
```

### findFrenchDepartment

function

```ts
findFrenchDepartment(text: string): FrenchDepartment | null
```

Finds a department of France by its code (`75`, `2A`, `971`) or its name (`Paris`, `Haute-Corse`), without regard to letter case or accents.

- `text`: The code or the name.
- Returns: The department, or `null` when nothing matches.

```js
import { findFrenchDepartment } from "@johnmorrisdotca/address-plus/fr";

console.log(findFrenchDepartment("haute-corse")?.code);
// "2B"
```

### formatLaPoste

function

```ts
formatLaPoste(address: ParsedAddress, options?: LaPosteFormattingOptions): FormattedAddress
```

Writes an address in France as La Poste's specification asks (SP 8855): the person it is care of, then the line of the apartment, the floor and the staircase, the line of the entrance and the building, the number and street, the lieu-dit and the box, then the postcode, the commune and its CEDEX, each on its own line, in capitals without accents or punctuation. The arrondissement of Paris, Lyon or Marseille is not written when there is a postcode, which carries it (`75008 PARIS`, as La Poste's own list has it); without one it is written in two digits (`PARIS 08`).

- `address`: The address as `parseFrenchAddress` returns it.
- `options`: Whether to add the country, and whether to keep accents (see `LaPosteFormattingOptions`).
- Returns: The lines, the same on one line, the delivery line (the number and street) and the last line.

```js
import { formatLaPoste, parseFrenchAddress } from "@johnmorrisdotca/address-plus/fr";

const parsedAddress1=parseFrenchAddress("Apt 12, Résidence Les Lilas, 4 bis av. des Écoles, 31000 Toulouse");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatLaPoste(parsedAddress1).lines);
// ["APPARTEMENT 12","RESIDENCE LES LILAS","4 BIS AVENUE DES ECOLES","31000 TOULOUSE"]
```

### FormattedAddress

type

```ts
interface FormattedAddress {
  lines: string[]; // Individual address lines
  singleLine: string; // Single-line representation
  deliveryLine?: string; // Street address line
  lastLine?: string; // City/state/postal line
  country?: string; // Country designation
  format:
    | "standard"
    | "usps"
    | "canada-post"
    | "international"
    | "australia-post"
    | "royal-mail"
    | "la-poste"
    | "deutsche-post"; // Formatting standard used
}
```

A formatted address: its lines, and the same on one line.

```js
import { formatUSPS, parseLocation } from "@johnmorrisdotca/address-plus";
import type { FormattedAddress } from "@johnmorrisdotca/address-plus/au";

const parsedAddress1=parseLocation("123 Main St, Anytown, NY 12345");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatUSPS(parsedAddress1));
// {"lines":["123 MAIN ST","ANYTOWN NY 12345"],"singleLine":"123 Main St, Anytown NY 12345","deliveryLine":"123 Main St","lastLine":"Anytown NY 12345","country":"US","format":"usps"}
```

### FR_BUILDING_WORDS

const

```ts
FR_BUILDING_WORDS: Readonly<Record<string, readonly string[]>>
```

The words that open the line naming a building, a residence or a zone (La Poste's third line), which the parser keeps whole as `building` (`Résidence Les Lilas`, `Bâtiment A`, `Zone industrielle Nord`, `ZAC des Prés`), with their abbreviations.

```js
import { FR_BUILDING_WORDS } from "@johnmorrisdotca/address-plus/fr";

console.log(FR_BUILDING_WORDS.Bâtiment);
// ["BAT","BATIMENT","BÂT"]
```

### FR_COLLECTIVITIES

const

```ts
FR_COLLECTIVITIES: readonly FrenchCollectivity[]
```

The overseas collectivities that have postcodes in La Poste's base: each with its code, its ISO 3166-1 country code and its name. They are French, and addressed through La Poste, but each has a country code of its own and the Universal Postal Union lists them apart, so an address in one reads as that country's. From INSEE's Code officiel géographique (Licence Ouverte 2.0).

```js
import { FR_COLLECTIVITIES } from "@johnmorrisdotca/address-plus/fr";

console.log(FR_COLLECTIVITIES.map((one) => one.country));
// ["PM","BL","MF","WF","PF","NC"]
```

### FR_DEPARTMENTS

const

```ts
FR_DEPARTMENTS: readonly FrenchDepartment[]
```

The 101 departments of France, in order of their codes, each with its code (`75`, `2A`, `971`), its name and its region's. The code is how a postcode begins: its first two digits (three overseas), with Corsica's 20 split at 20200. From INSEE's Code officiel géographique (Licence Ouverte 2.0).

```js
import { FR_DEPARTMENTS } from "@johnmorrisdotca/address-plus/fr";

console.log(FR_DEPARTMENTS.find((department) => department.code === "2A"));
// {"code":"2A","name":"Corse-du-Sud","region":"Corse"}
```

### FR_NUMBER_EXTENSIONS

const

```ts
FR_NUMBER_EXTENSIONS: readonly string[]
```

The words that may follow the number as its indice de répétition: `bis`, `ter`, `quater` and the rest of the Latin series. A single letter (the B of `12 B rue Hugo`) is read as one too, when a type of voie follows it.

```js
import { FR_NUMBER_EXTENSIONS } from "@johnmorrisdotca/address-plus/fr";

console.log(FR_NUMBER_EXTENSIONS.slice(0, 3));
// ["bis","ter","quater"]
```

### FR_STREET_TYPES

const

```ts
FR_STREET_TYPES: Readonly<Record<string, readonly string[]>>
```

The types of voie the parser takes off the front of a street's name and reports, in full, as `type` (`rue de la Paix` is street `de la Paix`, type `Rue`), with the abbreviations it reads for each. In French the type comes first. A street with none of them (`Le Vieux Pont`) has no type.

```js
import { FR_STREET_TYPES } from "@johnmorrisdotca/address-plus/fr";

console.log(FR_STREET_TYPES.Boulevard);
// ["BD","BLD","BOUL","BVD","BLVD"]
```

### FR_UNIT_TYPES

const

```ts
FR_UNIT_TYPES: Readonly<Record<string, readonly string[]>>
```

The types of the part of a building that an address names below the number: an apartment or a door, which the parser reports as `secUnitType` and `secUnitNum`, with the abbreviations it reads for each.

```js
import { FR_UNIT_TYPES } from "@johnmorrisdotca/address-plus/fr";

console.log(FR_UNIT_TYPES.Appartement);
// ["APPT","APT","APP","APPART"]
```

### france

const

```ts
france: CountryModule
```

France's module, for `parseLocation` and `validateAddress`: pass it in `countries`, and an address that ends with France (or Monaco or an overseas territory), holds CEDEX, or has a French type of voie and a postcode first on its last line is read as French; `country: "FR"` reads any address as one, and so does the code of an overseas department or collectivity. It reads Monaco (`MC`) and the collectivities (`PM`, `BL`, `MF`, `WF`, `PF`, `NC`) too, and reports their own codes.

```js
import { parseLocation } from "@johnmorrisdotca/address-plus";
import { france } from "@johnmorrisdotca/address-plus/fr";

console.log(parseLocation("12 bis rue de la Paix, 75002 Paris, France", { countries: [france] })?.numberExtension);
// "bis"
```

### FrenchAddressFields

type

```ts
interface FrenchAddressFields {
  numberExtension?: string; // The indice de répétition after the number: bis, ter, quater, or a letter (the B of 12 B)
  staircase?: string; // The staircase: the B of "Escalier B"
  entrance?: string; // The entrance: the A of "Entrée A"
  lieuDit?: string; // A lieu-dit: a named place (a hamlet, a farm) that goes on a line of its own
  postalBoxType?: "BP" | "CS" | "TSA"; // A boîte postale, a course spéciale or a tri service arrivée
  postalBoxNum?: string; // The number of the box: 123 in "BP 123"
  cedex?: string; // The CEDEX the commune line ends with, as La Poste writes it: "CEDEX 09", or "CEDEX" alone
  arrondissement?: string; // The arrondissement of Paris, Lyon or Marseille, as a number: 8 for "Paris 8e"
  careOf?: string; // The "chez" line: who the address is care of
}
```

The fields an address in France fills beside the shared ones. The shared fields keep their meaning: `number` is the street number, `street` the name of the street without its type and `type` the type in full (`Rue`; the name is `de la Paix`), `secUnitType` and `secUnitNum` an apartment or a door, `floorType` and `floor` a floor, `building` the building's or the residence's name, `city` the commune, `state` the department's code and `zip` the postcode.

```js
import { parseFrenchAddress } from "@johnmorrisdotca/address-plus/fr";
import type { FrenchAddressFields } from "@johnmorrisdotca/address-plus/fr";

console.log(parseFrenchAddress("12 bis rue de la Paix, 75002 Paris")?.numberExtension);
// "bis"
```

### FrenchCollectivity

type

```ts
interface FrenchCollectivity {
  code: string; // 988
  country: FrenchPostalCountry; // NC
  name: string; // Nouvelle-Calédonie
}
```

An overseas collectivity of France in the tables: its code (`987`), the ISO 3166-1 country code an address in it reads as (`PF`) and its name.

```js
import { FR_COLLECTIVITIES } from "@johnmorrisdotca/address-plus/fr";
import type { FrenchCollectivity } from "@johnmorrisdotca/address-plus/fr";

console.log(FR_COLLECTIVITIES.find((one) => one.code === "988"));
// {"code":"988","country":"NC","name":"Nouvelle-Calédonie"}
```

### FrenchDepartment

type

```ts
interface FrenchDepartment {
  code: string; // 75, 2A, 971
  name: string; // Paris
  region: string; // Île-de-France
}
```

A department of France in the tables: its code (`75`, `2A`, `971`), its name and its region's, from INSEE's Code officiel géographique.

```js
import { FR_DEPARTMENTS } from "@johnmorrisdotca/address-plus/fr";
import type { FrenchDepartment } from "@johnmorrisdotca/address-plus/fr";

console.log(FR_DEPARTMENTS.find((department) => department.code === "75"));
// {"code":"75","name":"Paris","region":"Île-de-France"}
```

### FrenchPostalCountry

type

```ts
type FrenchPostalCountry = "BL" | "FR" | "MC" | "MF" | "NC" | "PF" | "PM" | "WF";
```

The country an address in La Poste's base belongs to: `FR` for France (the metropolis and the overseas departments), `MC` for Monaco, and the ISO 3166-1 code of an overseas collectivity (`PM`, `BL`, `MF`, `WF`, `PF`, `NC`), which is French but has a country code of its own and is listed apart by the Universal Postal Union.

```js
import { parseFrenchAddress } from "@johnmorrisdotca/address-plus/fr";
import type { FrenchPostalCountry } from "@johnmorrisdotca/address-plus/fr";

console.log(parseFrenchAddress("Avenue Pouvanaa a Oopa, 98713 Papeete, Polynésie française")?.country);
// "PF"
```

### FrenchPostcode

type

```ts
interface FrenchPostcode {
  postcode: string; // 75008
  place: string; // 75, 2B, 971, 987, 99
  country: FrenchPostalCountry;
  known: boolean; // Whether La Poste's base lists it
  department?: string; // The department's code, absent for a collectivity and for Monaco
}
```

A postcode taken apart: the code of the department or territory its number belongs to, the country it delivers to, and whether La Poste's base has it. `place` is a department's code (`75`, `2A`, `971`), a collectivity's (`987`) or `99` for Monaco.

```js
import { parseFrenchPostcode } from "@johnmorrisdotca/address-plus/fr";
import type { FrenchPostcode } from "@johnmorrisdotca/address-plus/fr";

console.log(parseFrenchPostcode("20200"));
// {"postcode":"20200","place":"2B","country":"FR","known":true,"department":"2B"}
```

### getDepartmentFromFrenchPostcode

function

```ts
getDepartmentFromFrenchPostcode(postcode: string): string | undefined
```

The department a postcode's number belongs to, by its code: `75` for 75008, `2B` for 20200, `971` for 97100.

- `postcode`: The postcode.
- Returns: The department's code; `undefined` for a postcode in a collectivity or Monaco, one that no department has, or text that is not a postcode.

```js
import { getDepartmentFromFrenchPostcode } from "@johnmorrisdotca/address-plus/fr";

console.log(["75008", "20190", "20200", "97400", "98714", "98000"].map(getDepartmentFromFrenchPostcode));
// ["75","2A","2B","974",null,null]
```

### isKnownFrenchPostcode

function

```ts
isKnownFrenchPostcode(postcode: string): boolean
```

Whether La Poste's base officielle des codes postaux lists a postcode: France, the overseas departments and collectivities and Monaco. The base is La Poste's (Licence Ouverte 2.0); a postcode created since it was copied is not in it, so an unknown one is a warning for a validator to give, not proof that it does not exist.

- `postcode`: The postcode.
- Returns: `true` when La Poste's base lists it.

```js
import { isKnownFrenchPostcode } from "@johnmorrisdotca/address-plus/fr";

console.log(["75008", "75099", "98000", "00000"].map(isKnownFrenchPostcode));
// [true,false,true,false]
```

### isValidFrenchPostcode

function

```ts
isValidFrenchPostcode(postcode: string): boolean
```

Whether a postcode follows La Poste's shape: five digits. Whether the postcode is in use is a different question; `isKnownFrenchPostcode` asks it, and the validator checks both.

- `postcode`: The postcode.
- Returns: `true` when it is five digits.

```js
import { isValidFrenchPostcode } from "@johnmorrisdotca/address-plus/fr";

console.log(["75008", "2000", "7500a", " 13001 "].map(isValidFrenchPostcode));
// [true,false,false,true]
```

### LaPosteFormattingOptions

type

```ts
interface LaPosteFormattingOptions {
  includeCountry?: boolean; // FRANCE as the last line, for mail from abroad (or MONACO, or the collectivity's name)
  keepAccents?: boolean; // Keep the accents and the hyphens: La Poste reads them, though the norm asks for none
}
```

Options for `formatLaPoste`.

```js
import { formatLaPoste, parseFrenchAddress } from "@johnmorrisdotca/address-plus/fr";
import type { LaPosteFormattingOptions } from "@johnmorrisdotca/address-plus/fr";

const parsedAddress1=parseFrenchAddress("12 rue de la Paix, 75002 Paris");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(formatLaPoste(parsedAddress1, { includeCountry: true }).lines);
// ["12 RUE DE LA PAIX","75002 PARIS","FRANCE"]
```

### looksFrench

function

```ts
looksFrench(text: string): boolean
```

Whether an address is surely French, with no hint: it ends with France, an overseas department, Monaco or one of the collectivities, or holds CEDEX beside a postcode, or its last line begins with a postcode whose number names a department, a collectivity or Monaco, followed by a commune (`75008 Paris`), while the address has a French type of voie (`rue`, `avenue`, `chemin`) at the start of a street, a `BP`, a `TSA` or a `lieu-dit`. A US ZIP code follows its state and a Canadian one ends in a digit, so neither is the shape of that last line; a German one has its postcode first too, but its streets end in `straße` or `weg` and begin with no French type.

- `text`: The address as one string.
- Returns: `true` when the address is French beyond doubt, `false` otherwise.

```js
import { looksFrench } from "@johnmorrisdotca/address-plus/fr";

console.log([looksFrench("12 rue de la Paix, 75002 Paris"), looksFrench("123 Main St, Seattle, WA 98101")]);
// [true,false]
```

### ParsedAddress

type

```ts
interface ParsedAddress extends JapaneseAddressFields, AustralianAddressFields, FrenchAddressFields, UKAddressFields {
  city?: string; // City name, or the municipality in Japan; APO, FPO or DPO in a military address
  compartment?: string; // Compartment on a Canadian rural route (the 10 in "SITE 6 COMP 10 RR 8")
  country?: "CA" | "US" | "JP" | "AU" | "GB" | "GY" | "IM" | "JE" | FrenchPostalCountry | "DE"; // Detected country; AU, GB (with Jersey, Guernsey and the Isle of Man), FR (with Monaco and the overseas collectivities) and DE only from their modules
  fraction?: string; // Fractional address number (e.g., 1/2 in "123 1/2 Main St")
  generalDelivery?: boolean; // General delivery indicator
  highwayContract?: string; // Highway contract route number (the 68 in "HC 68 BOX 23A"); ruralRoute holds "HC 68"
  locality?: string; // Sub-city locality (borough, district, neighborhood), or a Puerto Rico urbanization
  military?: string; // Military delivery line ("PSC 802 Box 74", "Unit 2050 Box 4190"); state is AA, AE or AP
  number?: string; // Street number
  place?: string; // Place name (landmark, POI, building, monument, etc.)
  plus4?: string; // Extended ZIP+4 code
  postalValid?: boolean; // Postal code validation status
  postalType?: "zip" | "postal"; // Postal code type (zip or postal)
  prefix?: string; // Directional prefix (N, S, E, W, etc.)
  rpo?: string; // Retail Postal Outlet (Canada Post) identifier
  rr?: string; // Rural Route number (RR/R.R.)
  ruralRoute?: string; // Rural route or similar
  secUnitNum?: string; // Secondary unit number
  secUnitType?: string; // Secondary unit type (apt, suite, etc.)
  secondary?: string; // Legacy properties for backward compatibility
  site?: string; // Site number on a Canadian rural route (the 6 in "SITE 6 COMP 10 RR 8")
  state?: string; // State/Province code; AA, AE or AP for a military address
  station?: string; // Station or Succursale identifier (e.g., Station A, Succ. Centre-ville)
  street?: string; // Street name
  suffix?: string; // Directional suffix
  type?: string; // Street type/suffix (St, Ave, Rd, etc.)
  unit?: string; // Legacy unit property for backward compatibility
  zip?: string; // ZIP or postal code
  zipValid?: boolean; // ZIP/postal code format validation (true if format is valid)
}
```

What `parseLocation` returns: every part it found, each absent when the address has none. A Japanese address fills its own fields and the shared ones that stand for them: `state` the prefecture's JIS code, `city` the municipality, `street` the town, `number` the block, `zip` the postal code.

```js
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { ParsedAddress } from "@johnmorrisdotca/address-plus/jp";

console.log(parseLocation("123 Main St Apt 4, Anytown, NY 12345"));
// {"number":"123","secUnitType":"Apartment","secUnitNum":"4","unit":"Apt 4","street":"Main","type":"St","city":"Anytown","state":"NY","zip":"12345","zipValid":true,"country":"US"}
```

### parseFrenchAddress

function

```ts
parseFrenchAddress(text: string, options?: ParseOptions): ParsedAddress | null
```

Parses an address in France (or Monaco, or an overseas department or collectivity, which are written the same way) into the parts La Poste's norm names: who it is care of (`careOf`), an apartment or a door (`secUnitType`, `secUnitNum`), a floor, a staircase, an entrance, the building or residence (`building`), the number with its extension (`numberExtension`: `bis`, `ter`, a letter), the type of voie in full in `type` and its name in `street` (`rue de la Paix` is `Rue` and `de la Paix`), a lieu-dit, a box (`BP 12`, `CS 30001`), the commune in `city` with its arrondissement and CEDEX, and the postcode in `zip` with the department's code in `state`. The postcode may stand anywhere after the street; `F-75008` is read as `75008`.

- `text`: The address as one string; commas and line breaks both separate its parts.
- `options`: `useSnakeCase` gives snake_case keys; the other options are not used.
- Returns: The parts found, with `country` `FR` (or `MC` or a collectivity's code), or `null` when the text is empty or holds nothing that makes it an address.

```js
import { parseFrenchAddress } from "@johnmorrisdotca/address-plus/fr";

console.log(parseFrenchAddress("Résidence Les Lilas, 12 bis rue de la Paix, 75002 Paris"));
// {"building":"Résidence Les Lilas","number":"12","numberExtension":"bis","type":"Rue","street":"de la Paix","city":"Paris","state":"75","zip":"75002","zipValid":true,"country":"FR"}
```

### parseFrenchPostcode

function

```ts
parseFrenchPostcode(postcode: string): FrenchPostcode | null
```

Takes a postcode apart: the code of the department or territory its number belongs to, and the country it delivers to (`FR` for France and its overseas departments, `MC` for Monaco, `PF`, `NC` and the other collectivities' own codes), and whether La Poste's base lists it. A few postcodes serve a commune across a department's border; the department reported is the one the number names.

- `postcode`: The postcode, with or without spaces.
- Returns: The parts, or `null` when it is not five digits.

```js
import { parseFrenchPostcode } from "@johnmorrisdotca/address-plus/fr";

console.log(parseFrenchPostcode("98714"));
// {"postcode":"98714","place":"987","country":"PF","known":true}
```

### ParseOptions

type

```ts
interface ParseOptions {
  country?:
    | "CA"
    | "US"
    | "JP"
    | "AU"
    | "GB"
    | "GY"
    | "IM"
    | "JE"
    | FrenchPostalCountry
    | "DE"
    | "GP"
    | "MQ"
    | "GF"
    | "RE"
    | "YT"
    | "auto"; // Country to optimize parsing for; JP skips the detection and parses as Japanese; AU, GB, FR, DE and the rest need their module in countries
  countries?: readonly CountryModule[]; // Country modules to read beside the US, Canada and Japan: australia from "/au", unitedKingdom from "/gb", france from "/fr", germany from "/de"
  normalize?: boolean; // Whether to normalize street types and directions
  validatePostalCode?: boolean; // Whether to validate postal/ZIP codes
  language?: "auto" | "en" | "fr"; // Language preference for bilingual parsing (Canada)
  extractFacilities?: boolean; // Whether to extract facility names
  parseParenthetical?: boolean; // Whether to parse parenthetical information
  strict?: boolean; // Whether to only extract valid ZIP/postal codes (strict mode) - true: Only extract codes that pass format validation, false (default): Extract all codes but indicate validity with zipValid field
  useSnakeCase?: boolean; // Whether to return field names in snake_case format for backward compatibility - true: Return snake_case field names (sec_unit_type, sec_unit_num, etc.), false (default): Return camelCase field names (secUnitType, secUnitNum, etc.)
}
```

Options for every parser: the country, strict postal codes, snake_case keys and the rest. Every one is optional.

```js
import { parseLocation } from "@johnmorrisdotca/address-plus";
import type { ParseOptions } from "@johnmorrisdotca/address-plus/jp";

console.log(Reflect.get(parseLocation("東京都千代田区丸の内1-2-3", { country: "JP", useSnakeCase: true }) ?? {}, "prefecture_code"));
// "13"
```

### validateFrenchAddress

function

```ts
validateFrenchAddress(address: ParsedAddress, options?: ValidationOptions): CountryValidation
```

Checks an address in France against La Poste's postcode shape and the tables: the postcode is five digits, its number names a department, a collectivity or Monaco, and La Poste's base officielle lists it. Says when a postcode is Monaco's or an overseas collectivity's, which have country codes of their own, and warns when the postcode or the commune is missing.

- `address`: The address as `parseFrenchAddress` (or `parseLocation` with the module) returns it.
- `options`: `strictPostalValidation: true` makes the postcode findings errors; the rest are not used.
- Returns: The errors and warnings, each with its field, code and message.

```js
import { parseFrenchAddress, validateFrenchAddress } from "@johnmorrisdotca/address-plus/fr";

const parsedAddress1=parseFrenchAddress("12 rue de la Paix, 75099 Paris");
if (!parsedAddress1) throw new Error("The example address did not parse.");
console.log(validateFrenchAddress(parsedAddress1).warnings.map((one) => one.code));
// ["UNRECOGNIZED_POSTAL_CODE"]
```

### ValidationError

type

```ts
interface ValidationError {
  field: string; // Field name where error occurred
  code: string; // Error code identifier
  message: string; // Human-readable error message
  severity: "error" | "warning" | "info"; // Severity level of the validation issue
}
```

One finding of a validator: the field it is about, its code, a message, and how serious it is.

```js
import { validateAddress } from "@johnmorrisdotca/address-plus";
import type { ValidationError } from "@johnmorrisdotca/address-plus/jp";

console.log(validateAddress("123 Main St, Seattle, NY 98101").warnings[0]);
// {"field":"zip","code":"POSTAL_REGION_MISMATCH","message":"ZIP code 98101 belongs to WA, not NY","severity":"warning"}
```

### ValidationOptions

type

```ts
interface ValidationOptions {
  requireStreetNumber?: boolean; // Whether street number is required
  requireStreetName?: boolean; // Whether street name is required
  requireCity?: boolean; // Whether city is required
  requireState?: boolean; // Whether state/province is required
  requirePostalCode?: boolean; // Whether postal code is required
  allowPOBox?: boolean; // Whether PO Box addresses are allowed
  allowRuralRoute?: boolean; // Whether rural route addresses are allowed
  allowGeneralDelivery?: boolean; // Whether general delivery addresses are allowed
  strictPostalValidation?: boolean; // Whether to use strict postal code validation
  country?: ParseOptions["country"]; // Country context for validation rules; AU, GB, FR, DE and the rest need their module in countries
  countries?: readonly import("./country-module").CountryModule[]; // Country modules to read beside the US, Canada and Japan
}
```

Options for the validators: which parts an address must have, which kinds are allowed, and whether a postal code that does not match its region is an error.

```js
import { validateAddress } from "@johnmorrisdotca/address-plus";
import type { ValidationOptions } from "@johnmorrisdotca/address-plus/jp";

console.log(validateAddress("123 Main St", { requirePostalCode: true }).errors.map((error) => error.code));
// ["MISSING_POSTAL_CODE"]
```


## @johnmorrisdotca/address-plus/element

### ADDRESS_FIELD_COUNTRIES

const

```ts
ADDRESS_FIELD_COUNTRIES: readonly ["US", "CA", "JP", "AU", "GB", "FR", "DE"]
```

Seven built-in field countries; auto detects among them.

```js
import { ADDRESS_FIELD_COUNTRIES } from "@johnmorrisdotca/address-plus/element";

console.log(ADDRESS_FIELD_COUNTRIES.length);
// 7
```

### ADDRESS_FIELD_PARSE_KEYS

const

```ts
ADDRESS_FIELD_PARSE_KEYS: string[]
```

Native parser options checked by builder coverage.

```js
import { ADDRESS_FIELD_PARSE_KEYS } from "@johnmorrisdotca/address-plus/element";

console.log(ADDRESS_FIELD_PARSE_KEYS.includes("strict"));
// true
```

### ADDRESS_FIELD_VALIDATION_KEYS

const

```ts
ADDRESS_FIELD_VALIDATION_KEYS: string[]
```

Native validator options checked by builder coverage.

```js
import { ADDRESS_FIELD_VALIDATION_KEYS } from "@johnmorrisdotca/address-plus/element";

console.log(ADDRESS_FIELD_VALIDATION_KEYS.includes("requirePostalCode"));
// true
```

### AddressField

const

```ts
AddressField: typeof AddressField
```

A form-associated address input using the seven native country parsers. Import this entry safely on a server; defineField registers it in a browser. The raw value is submitted under name; address and validation are local getters.

```js
import { AddressField } from "@johnmorrisdotca/address-plus/element";

console.log(typeof AddressField);
// "function"
```

### AddressFieldOptions

type

```ts
interface AddressFieldOptions {
  parse?: ParseOptions; // All native parser choices, including custom country modules
  validation?: ValidationOptions; // All native validation requirements
  strings?: Partial<(typeof FIELD_WORDS)["en"]>; // Field words over English or Japanese
  onChange?: (field: AddressField) => void; // Trusted local access to value, address and validation
}
```

Full native settings and a private callback; raw addresses never enter public events.

```js
import { ADDRESS_FIELD_PARSE_KEYS } from "@johnmorrisdotca/address-plus/element";
import type { AddressFieldOptions } from "@johnmorrisdotca/address-plus/element";

console.log(ADDRESS_FIELD_PARSE_KEYS.includes("countries"));
// true
```

### defineField

function

```ts
defineField(tagName?: string, registry?: CustomElementRegistry | undefined): void
```

Register the form field under its default or a custom tag, idempotently; safe on a server.

- `tagName`: The tag name; address-field by default.
- `registry`: The browser registry, undefined on a server.
- Returns: Nothing; existing definitions are preserved.

```js
import { defineField } from "@johnmorrisdotca/address-plus/element";

defineField();
console.log(typeof defineField);
// "function"
```


## @johnmorrisdotca/address-plus/element/define

### ADDRESS_FIELD_COUNTRIES

const

```ts
ADDRESS_FIELD_COUNTRIES: readonly ["US", "CA", "JP", "AU", "GB", "FR", "DE"]
```

Seven built-in field countries; auto detects among them.

```js
import { ADDRESS_FIELD_COUNTRIES } from "@johnmorrisdotca/address-plus/element";

console.log(ADDRESS_FIELD_COUNTRIES.length);
// 7
```

### ADDRESS_FIELD_PARSE_KEYS

const

```ts
ADDRESS_FIELD_PARSE_KEYS: string[]
```

Native parser options checked by builder coverage.

```js
import { ADDRESS_FIELD_PARSE_KEYS } from "@johnmorrisdotca/address-plus/element";

console.log(ADDRESS_FIELD_PARSE_KEYS.includes("strict"));
// true
```

### ADDRESS_FIELD_VALIDATION_KEYS

const

```ts
ADDRESS_FIELD_VALIDATION_KEYS: string[]
```

Native validator options checked by builder coverage.

```js
import { ADDRESS_FIELD_VALIDATION_KEYS } from "@johnmorrisdotca/address-plus/element";

console.log(ADDRESS_FIELD_VALIDATION_KEYS.includes("requirePostalCode"));
// true
```

### AddressField

const

```ts
AddressField: typeof AddressField
```

A form-associated address input using the seven native country parsers. Import this entry safely on a server; defineField registers it in a browser. The raw value is submitted under name; address and validation are local getters.

```js
import { AddressField } from "@johnmorrisdotca/address-plus/element";

console.log(typeof AddressField);
// "function"
```

### AddressFieldOptions

type

```ts
interface AddressFieldOptions {
  parse?: ParseOptions; // All native parser choices, including custom country modules
  validation?: ValidationOptions; // All native validation requirements
  strings?: Partial<(typeof FIELD_WORDS)["en"]>; // Field words over English or Japanese
  onChange?: (field: AddressField) => void; // Trusted local access to value, address and validation
}
```

Full native settings and a private callback; raw addresses never enter public events.

```js
import { ADDRESS_FIELD_PARSE_KEYS } from "@johnmorrisdotca/address-plus/element";
import type { AddressFieldOptions } from "@johnmorrisdotca/address-plus/element";

console.log(ADDRESS_FIELD_PARSE_KEYS.includes("countries"));
// true
```

### defineField

function

```ts
defineField(tagName?: string, registry?: CustomElementRegistry | undefined): void
```

Register the form field under its default or a custom tag, idempotently; safe on a server.

- `tagName`: The tag name; address-field by default.
- `registry`: The browser registry, undefined on a server.
- Returns: Nothing; existing definitions are preserved.

```js
import { defineField } from "@johnmorrisdotca/address-plus/element";

defineField();
console.log(typeof defineField);
// "function"
```
