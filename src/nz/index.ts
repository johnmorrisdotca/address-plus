// Addresses in New Zealand: import "@johnmorrisdotca/address-plus/nz" for the parser, the validator, the NZ Post formatter,
// the comparer, the postcode lookups and the regions, and pass `newZealand` to parseLocation in `countries` to read New
// Zealand addresses beside the US, Canadian and Japanese ones. Nothing here is in the main entry point.

import { findNewZealandRegion, newZealandPostcodes, NZ_REGIONS } from "../constants/nz";
import {
  comparePostcodeCountry,
  looksLikePostcodeCountry,
  parsePostcodeCountry,
  postcodeCountryModule,
  validatePostcodeCountry,
} from "../country/postcode-country";
import type { CountryComparison, CountryModule, CountryValidation } from "../types/country-module";
import type { FormattedAddress } from "../types/formatting";
import type { ParseOptions } from "../types/parse-options";
import type { ParsedAddress } from "../types/parsed-address";
import type { PostcodeLookup } from "../types/postcode-country";
import type { ValidationOptions } from "../types/validation";
import { newZealandSpec } from "./rules";

/**
 * Options for `formatNZPost`.
 *
 * @example
 * ```ts
 * import { formatNZPost, parseNewZealandAddress } from "@johnmorrisdotca/address-plus/nz";
 * import type { NZPostFormattingOptions } from "@johnmorrisdotca/address-plus/nz";
 *
 * const options: NZPostFormattingOptions = { includeCountry: true };
 * const parsedAddress1 = parseNewZealandAddress("1 Queen Street, Auckland 1010");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatNZPost(parsedAddress1, options).lines);
 * // → ["1 Queen Street","Auckland 1010","NEW ZEALAND"]
 * ```
 */
interface NZPostFormattingOptions {
  includeCountry?: boolean; // NEW ZEALAND as the last line, for mail from abroad
}

/**
 * Writes an address in New Zealand as NZ Post asks: who it is care of, the unit and the level, the street with its number
 * (or the PO Box, the bag or the rural delivery), the suburb, then the city and the postcode, each on its own line.
 *
 * @param address - The address as `parseNewZealandAddress` returns it.
 * @param options - Whether to add the country (see `NZPostFormattingOptions`).
 * @returns The lines, the same on one line, the delivery line and the last line.
 * @example
 * ```ts
 * import { formatNZPost, parseNewZealandAddress } from "@johnmorrisdotca/address-plus/nz";
 *
 * const parsedAddress1 = parseNewZealandAddress("3/45 Dominion Rd, Mount Eden, Auckland 1024");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatNZPost(parsedAddress1).lines);
 * // → ["Unit 3","45 Dominion Rd","Mount Eden","Auckland 1024"]
 * ```
 */
function formatNZPost(address: ParsedAddress, options: NZPostFormattingOptions = {}): FormattedAddress {
  const lines: string[] = [];
  if (!address) return { lines, singleLine: "", country: "NZ", format: "nz-post" };
  if (address.careOf) lines.push(`C/- ${address.careOf}`);
  if (address.building) lines.push(address.building);
  const delivery = !address.street && address.secUnitType !== undefined;
  if (address.secUnitType && !delivery) lines.push(`${address.secUnitType} ${address.secUnitNum ?? ""}`.trim());
  if (address.floorType) lines.push(`${address.floorType} ${address.floor ?? ""}`.trim());
  const deliveryLine = delivery
    ? `${address.secUnitType} ${address.secUnitNum ?? ""}`.trim()
    : [address.number, address.street].filter(Boolean).join(" ");
  if (deliveryLine) lines.push(deliveryLine);
  if (address.locality) lines.push(address.locality);
  const lastLine = [address.city, address.zip].filter(Boolean).join(" ");
  if (lastLine) lines.push(lastLine);
  if (options.includeCountry) lines.push("NEW ZEALAND");

  return {
    lines,
    singleLine: lines.join(", "),
    ...(deliveryLine ? { deliveryLine } : {}),
    ...(lastLine ? { lastLine } : {}),
    country: "NZ",
    format: "nz-post",
  };
}

/**
 * Parses an address in New Zealand into the parts NZ Post lays out: who it is care of (`careOf`), the unit (`secUnitType`
 * and `secUnitNum`, from `Unit 3` or the 3 of `3/45`), the level (`floorType` and `floor`), the street's number (`number`:
 * `45`, `12A`, `12-14`) and its name as written (`street`: `Dominion Road`), the suburb in `locality`, the city in `city`,
 * a PO Box, a Private Bag or a rural delivery (`secUnitType` `RD` and `secUnitNum`), the postcode in `zip` and the
 * region's code in `state` (`AUK`), from the postcode. The city stands before the postcode.
 *
 * @param text - The address as one string; commas and line breaks both separate its parts.
 * @param options - `useSnakeCase` gives snake_case keys; the other options are not used.
 * @returns The parts found, with `country` `NZ`, or `null` when the text is empty or holds nothing that makes it an
 * address.
 * @example
 * ```ts
 * import { parseNewZealandAddress } from "@johnmorrisdotca/address-plus/nz";
 *
 * console.log(parseNewZealandAddress("3/45 Dominion Road, Mount Eden, Auckland 1024"));
 * // → {"secUnitType":"Unit","secUnitNum":"3","number":"45","street":"Dominion Road","locality":"Mount Eden","city":"Auckland","state":"AUK","zip":"1024","zipValid":true,"country":"NZ"}
 * ```
 */
function parseNewZealandAddress(text: string, options: ParseOptions = {}): ParsedAddress | null {
  return parsePostcodeCountry(text, newZealandSpec, options);
}

/**
 * Whether an address is surely from New Zealand, with no hint: it ends with New Zealand, Aotearoa or `NZ`, or it ends
 * with a place and a postcode that GeoNames' list for New Zealand has and has a Private Bag, a rural delivery (`RD 2`) or
 * Aotearoa in it. Four digits after the place are also how Australia and others write a postcode, so they alone claim
 * nothing.
 *
 * @param text - The address as one string.
 * @returns `true` when the address is from New Zealand beyond doubt, `false` otherwise.
 * @example
 * ```ts
 * import { looksNewZealand } from "@johnmorrisdotca/address-plus/nz";
 *
 * console.log([looksNewZealand("1 Queen Street, Auckland 1010, New Zealand"), looksNewZealand("1 Queen Street, Auckland 1010")]);
 * // → [true,false]
 * ```
 */
function looksNewZealand(text: string): boolean {
  return looksLikePostcodeCountry(text, newZealandSpec);
}

/**
 * Checks an address in New Zealand: the postcode is four digits and GeoNames' list has it, and the city and the street's
 * number are given. The list is GeoNames' and not NZ Post's, so a postcode made since it was copied is flagged as
 * unrecognised.
 *
 * @param address - The address as `parseNewZealandAddress` (or `parseLocation` with the module) returns it.
 * @param options - `strictPostalValidation: true` makes the postcode findings errors; the rest are not used.
 * @returns The errors and warnings, each with its field, code and message.
 * @example
 * ```ts
 * import { parseNewZealandAddress, validateNewZealandAddress } from "@johnmorrisdotca/address-plus/nz";
 *
 * const parsedAddress1 = parseNewZealandAddress("1 Queen Street, Auckland 9999");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(validateNewZealandAddress(parsedAddress1).warnings.map((one) => one.code));
 * // → ["UNRECOGNIZED_POSTAL_CODE"]
 * ```
 */
function validateNewZealandAddress(address: ParsedAddress, options: ValidationOptions = {}): CountryValidation {
  return validatePostcodeCountry(address, newZealandSpec, options);
}

/**
 * Compares two addresses in New Zealand field by field: the unit, the street, its number, the city and the postcode.
 * Letter case, macrons, `Road` and `Rd`, `Street` and `St`, and `Mt` and `Mount` are not differences.
 *
 * @param first - The first address, as `parseNewZealandAddress` returns it.
 * @param second - The second address.
 * @returns Whether they are the same delivery point, and each field that differs.
 * @example
 * ```ts
 * import { compareNewZealandAddresses, parseNewZealandAddress } from "@johnmorrisdotca/address-plus/nz";
 *
 * const parsedAddress1 = parseNewZealandAddress("45 Dominion Road, Auckland 1024");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * const parsedAddress2 = parseNewZealandAddress("45 DOMINION RD, AUCKLAND 1024");
 * if (!parsedAddress2) throw new Error("The example address did not parse.");
 * console.log(compareNewZealandAddresses(parsedAddress1, parsedAddress2).isSame);
 * // → true
 * ```
 */
function compareNewZealandAddresses(first: ParsedAddress, second: ParsedAddress): CountryComparison {
  return comparePostcodeCountry(first, second, newZealandSpec);
}

/**
 * Whether a postcode follows NZ Post's shape: four digits. Whether it is in use is a different question;
 * `isKnownNewZealandPostcode` asks it, and the validator checks both.
 *
 * @param postcode - The postcode.
 * @returns `true` when it is four digits.
 * @example
 * ```ts
 * import { isValidNewZealandPostcode } from "@johnmorrisdotca/address-plus/nz";
 *
 * console.log(["1010", "0110", "101", "10100"].map(isValidNewZealandPostcode));
 * // → [true,true,false,false]
 * ```
 */
function isValidNewZealandPostcode(postcode: string): boolean {
  return newZealandPostcodes.isValid(postcode);
}

/**
 * Whether GeoNames' list for New Zealand has a postcode (1,737 of them). The list is GeoNames' (CC BY 4.0), not NZ Post's,
 * so a postcode made since it was copied is not in it: an unknown one is a warning for a validator to give, not proof that
 * it does not exist.
 *
 * @param postcode - The postcode.
 * @returns `true` when it has the shape and the list has it.
 * @example
 * ```ts
 * import { isKnownNewZealandPostcode } from "@johnmorrisdotca/address-plus/nz";
 *
 * console.log(["1010", "6011", "8011", "9999"].map(isKnownNewZealandPostcode));
 * // → [true,true,true,false]
 * ```
 */
function isKnownNewZealandPostcode(postcode: string): boolean {
  return newZealandPostcodes.isKnown(postcode);
}

/**
 * The region a postcode is in, by its ISO 3166-2 code without `NZ-` (`AUK` for Auckland): the one most of GeoNames' places
 * for the postcode are in.
 *
 * @param postcode - The postcode.
 * @returns The region's code, or `undefined` when the list does not have the postcode or gives it no region.
 * @example
 * ```ts
 * import { getRegionFromNewZealandPostcode } from "@johnmorrisdotca/address-plus/nz";
 *
 * console.log(["1010", "6011", "8011", "9016", "9999"].map(getRegionFromNewZealandPostcode));
 * // → ["AUK","WGN","CAN","OTA",null]
 * ```
 */
function getRegionFromNewZealandPostcode(postcode: string): string | undefined {
  return newZealandPostcodes.regionOf(postcode);
}

/**
 * Takes a postcode apart: the region it is in, and whether GeoNames' list has it.
 *
 * @param postcode - The postcode.
 * @returns The postcode, its region (when the list gives one) and whether the list has it.
 * @example
 * ```ts
 * import { parseNewZealandPostcode } from "@johnmorrisdotca/address-plus/nz";
 *
 * console.log(parseNewZealandPostcode("1010"));
 * // → {"postcode":"1010","region":"AUK","known":true}
 * ```
 */
function parseNewZealandPostcode(postcode: string): PostcodeLookup {
  return newZealandPostcodes.lookup(postcode);
}

/**
 * New Zealand's module, for `parseLocation` and `validateAddress`: pass it in `countries`, and an address that ends with
 * New Zealand, Aotearoa or `NZ` is read as from New Zealand; `country: "NZ"` reads any address as one.
 *
 * @example
 * ```ts
 * import { parseLocation } from "@johnmorrisdotca/address-plus";
 * import { newZealand } from "@johnmorrisdotca/address-plus/nz";
 *
 * console.log(parseLocation("45 Dominion Road, Auckland 1024, New Zealand", { countries: [newZealand] })?.state);
 * // → "AUK"
 * ```
 */
const newZealand: CountryModule = postcodeCountryModule(newZealandSpec, (address) => formatNZPost(address));

export type { CountryComparison, CountryDifference, CountryModule, CountryValidation } from "../types/country-module";
export type { FormattedAddress } from "../types/formatting";
export type { ParseOptions } from "../types/parse-options";
export type { ParsedAddress } from "../types/parsed-address";
export type { PostcodeLookup, PostcodeRegion } from "../types/postcode-country";
export type { ValidationError, ValidationOptions } from "../types/validation";
export {
  compareNewZealandAddresses,
  findNewZealandRegion,
  formatNZPost,
  getRegionFromNewZealandPostcode,
  isKnownNewZealandPostcode,
  isValidNewZealandPostcode,
  looksNewZealand,
  newZealand,
  NZ_REGIONS,
  parseNewZealandAddress,
  parseNewZealandPostcode,
  validateNewZealandAddress,
};
export type { NZPostFormattingOptions };
