// Australian addresses: import "@johnmorrisdotca/address-plus/au" for the parser, the validator, the Australia Post
// formatter, the comparer and the tables, and pass `australia` to parseLocation in `countries` to read Australian
// addresses beside the US, Canadian and Japanese ones. Nothing here is in the main entry point.

import type { CountryModule } from "../types/country-module";
import { compareAustralianAddresses } from "./compare";
import { formatAustraliaPost } from "./format";
import { looksAustralian, parseAustralianAddress } from "./parse";
import { validateAustralianAddress } from "./validate";

/**
 * Australia's module, for `parseLocation` and `validateAddress`: pass it in `countries`, and an address that ends with
 * a state and its postcode (or `Australia`) is read as Australian; `country: "AU"` reads any address as one.
 *
 * @example
 * ```ts
 * import { parseLocation } from "@johnmorrisdotca/address-plus";
 * import { australia } from "@johnmorrisdotca/address-plus/au";
 *
 * console.log(parseLocation("3/12 Smith St, Parramatta NSW 2150", { countries: [australia] })?.secUnitNum);
 * // → "3"
 * ```
 */
const australia: CountryModule = {
  code: "AU",
  codes: ["AU"],
  name: "Australia",
  detect: looksAustralian,
  parse: parseAustralianAddress,
  validate: validateAustralianAddress,
  format: (address) => formatAustraliaPost(address),
  compare: compareAustralianAddresses,
};

export {
  AU_CROSS_BORDER_POSTCODES,
  AU_EXTERNAL_TERRITORY_POSTCODES,
  AU_POSTCODE_RANGES,
  AU_STATES,
  findAustralianState,
  getPostcodeRangesForAustralianState,
  getStateFromAustralianPostcode,
  getStatesForAustralianPostcode,
} from "../constants/au";
export { AU_STREET_TYPES } from "../constants/au/words";
export type {
  AustralianAddressFields,
  AustralianPostcodeRange,
  AustralianState,
  AustralianStateCode,
} from "../types/australia";
export type { CountryComparison, CountryDifference, CountryModule, CountryValidation } from "../types/country-module";
export type { FormattedAddress } from "../types/formatting";
export type { ParseOptions } from "../types/parse-options";
export type { ParsedAddress } from "../types/parsed-address";
export type { ValidationError, ValidationOptions } from "../types/validation";
export { compareAustralianAddresses } from "./compare";
export { expandAustralianStreetType, formatAustraliaPost } from "./format";
export type { AustraliaPostFormattingOptions } from "./format";
export { looksAustralian, parseAustralianAddress } from "./parse";
export { validateAustralianAddress } from "./validate";
export { australia };
