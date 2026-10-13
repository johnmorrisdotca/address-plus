// Addresses in the United Kingdom (and Jersey, Guernsey and the Isle of Man, which share Royal Mail's postcodes):
// import "@johnmorrisdotca/address-plus/gb" for the parser, the validator, the Royal Mail formatter, the comparer, the
// postcode lookups and the tables, and pass `unitedKingdom` to parseLocation in `countries` to read British addresses
// beside the US, Canadian and Japanese ones. Nothing here is in the main entry point.

import type { CountryModule } from "../types/country-module";
import { compareUKAddresses } from "./compare";
import { formatRoyalMail } from "./format";
import { looksBritish, parseUKAddress } from "./parse";
import { validateUKAddress } from "./validate";

/**
 * The United Kingdom's module, for `parseLocation` and `validateAddress`: pass it in `countries`, and an address with a
 * British postcode (or ending with the United Kingdom or a nation) is read as British; `country: "GB"` reads any
 * address as one. It reads Jersey (`JE`), Guernsey (`GY`) and the Isle of Man (`IM`) too.
 *
 * @example
 * ```ts
 * import { parseLocation } from "@johnmorrisdotca/address-plus";
 * import { unitedKingdom } from "@johnmorrisdotca/address-plus/gb";
 *
 * console.log(parseLocation("221B Baker Street, London NW1 6XE", { countries: [unitedKingdom] })?.number);
 * // → "221B"
 * ```
 */
const unitedKingdom: CountryModule = {
  code: "GB",
  codes: ["GB", "JE", "GY", "IM"],
  name: "United Kingdom",
  detect: looksBritish,
  parse: parseUKAddress,
  validate: validateUKAddress,
  format: (address) => formatRoyalMail(address),
  compare: compareUKAddresses,
};

export {
  findUKNation,
  GB_DISTRICT_NATIONS,
  GB_NATIONS,
  GB_POSTCODE_AREAS,
  GB_POSTCODE_DISTRICTS,
  getNationFromUKPostcode,
  getNationsForUKPostcode,
  isValidUKPostcode,
  parseUKPostcode,
} from "../constants/gb";
export type { UKPostcodeArea } from "../constants/gb";
export { GB_THOROUGHFARE_DESCRIPTORS } from "../constants/gb/words";
export type { CountryComparison, CountryDifference, CountryModule, CountryValidation } from "../types/country-module";
export type { FormattedAddress } from "../types/formatting";
export type { ParseOptions } from "../types/parse-options";
export type { ParsedAddress } from "../types/parsed-address";
export type { UKAddressFields, UKNation, UKNationCode, UKPostcode } from "../types/united-kingdom";
export type { ValidationError, ValidationOptions } from "../types/validation";
export { compareUKAddresses } from "./compare";
export { formatRoyalMail } from "./format";
export type { RoyalMailFormattingOptions } from "./format";
export { looksBritish, parseUKAddress } from "./parse";
export { validateUKAddress } from "./validate";
export { unitedKingdom };
