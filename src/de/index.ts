// Addresses in Germany: import "@johnmorrisdotca/address-plus/de" for the parser, the validator, the Deutsche Post
// formatter, the comparer, the postcode lookups and the tables, and pass `germany` to parseLocation in `countries` to read
// German addresses beside the US, Canadian and Japanese ones. Nothing here is in the main entry point.

import type { CountryModule } from "../types/country-module";
import { compareGermanAddresses } from "./compare";
import { formatDeutschePost } from "./format";
import { looksGerman, parseGermanAddress } from "./parse";
import { validateGermanAddress } from "./validate";

/**
 * Germany's module, for `parseLocation` and `validateAddress`: pass it in `countries`, and an address that ends with
 * Germany or Deutschland, or has a German street and its number and a postcode first on its last line, is read as German;
 * `country: "DE"` reads any address as one.
 *
 * @example
 * ```ts
 * import { parseLocation } from "@johnmorrisdotca/address-plus";
 * import { germany } from "@johnmorrisdotca/address-plus/de";
 *
 * console.log(parseLocation("Hauptstraße 12a, 10115 Berlin", { countries: [germany] })?.number);
 * // → "12A"
 * ```
 */
const germany: CountryModule = {
  code: "DE",
  codes: ["DE"],
  name: "Germany",
  detect: looksGerman,
  parse: parseGermanAddress,
  validate: validateGermanAddress,
  format: (address) => formatDeutschePost(address),
  compare: compareGermanAddresses,
};

export {
  DE_STATES,
  findGermanState,
  getStateFromGermanPostcode,
  isKnownGermanPostcode,
  isValidGermanPostcode,
  parseGermanPostcode,
} from "../constants/de";
export {
  DE_BUILDING_WORDS,
  DE_COUNTRY_NAMES,
  DE_STREET_OPENERS,
  DE_STREET_SUFFIXES,
  DE_UNIT_TYPES,
} from "../constants/de/words";
export type { CountryComparison, CountryDifference, CountryModule, CountryValidation } from "../types/country-module";
export type { FormattedAddress } from "../types/formatting";
export type { GermanAddressFields, GermanPostcode, GermanState, GermanStateCode } from "../types/germany";
export type { ParseOptions } from "../types/parse-options";
export type { ParsedAddress } from "../types/parsed-address";
export type { ValidationError, ValidationOptions } from "../types/validation";
export { compareGermanAddresses } from "./compare";
export { formatDeutschePost } from "./format";
export type { DeutschePostFormattingOptions } from "./format";
export { looksGerman, parseGermanAddress } from "./parse";
export { germany, validateGermanAddress };
