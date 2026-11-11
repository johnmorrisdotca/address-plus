// Addresses in India: import "@johnmorrisdotca/address-plus/in" for the parser, the validator, the India Post formatter, the
// comparer, the PIN code lookups and the states, and pass `india` to parseLocation in `countries` to read Indian addresses
// beside the US, Canadian and Japanese ones. Nothing here is in the main entry point.

import { findIndianState, IN_STATES, indianPostcodes } from "../constants/in";
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
import { indianSpec } from "./rules";

/**
 * Options for `formatIndiaPost`.
 *
 * @example
 * ```ts
 * import { formatIndiaPost, parseIndianAddress } from "@johnmorrisdotca/address-plus/in";
 * import type { IndiaPostFormattingOptions } from "@johnmorrisdotca/address-plus/in";
 *
 * const options: IndiaPostFormattingOptions = { includeCountry: true };
 * const parsedAddress1 = parseIndianAddress("12 MG Road, Bengaluru 560001");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatIndiaPost(parsedAddress1, options).lines);
 * // → ["12 MG Road","Bengaluru 560001","Karnataka","INDIA"]
 * ```
 */
interface IndiaPostFormattingOptions {
  includeCountry?: boolean; // INDIA as the last line, for mail from abroad
}

const unitLine = (address: ParsedAddress): string | undefined => {
  const unit =
    address.secUnitType && address.secUnitType !== "Post Box"
      ? `${address.secUnitType} ${address.secUnitNum ?? ""}`.trim()
      : undefined;
  const floor = address.floorType ? `${address.floor ?? ""} ${address.floorType}`.trim() : undefined;

  return [unit, floor].filter(Boolean).join(", ") || undefined;
};

/**
 * Writes an address in India as India Post asks: who it is care of, the flat and the building, the house number and the
 * street, a landmark, the area, then the city and the PIN code, then the state, each on its own line.
 *
 * @param address - The address as `parseIndianAddress` returns it.
 * @param options - Whether to add the country (see `IndiaPostFormattingOptions`).
 * @returns The lines, the same on one line, the delivery line and the last line.
 * @example
 * ```ts
 * import { formatIndiaPost, parseIndianAddress } from "@johnmorrisdotca/address-plus/in";
 *
 * const parsedAddress1 = parseIndianAddress("Flat 4B, Sunshine Apartments, 12 MG Road, Indiranagar, Bengaluru, Karnataka 560038");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatIndiaPost(parsedAddress1).lines);
 * // → ["Sunshine Apartments","Flat 4B","12 MG Road","Indiranagar","Bengaluru 560038","Karnataka"]
 * ```
 */
function formatIndiaPost(address: ParsedAddress, options: IndiaPostFormattingOptions = {}): FormattedAddress {
  const lines: string[] = [];
  if (!address) return { lines, singleLine: "", country: "IN", format: "india-post" };
  if (address.careOf) lines.push(`C/o ${address.careOf}`);
  if (address.building) lines.push(address.building);
  const unit = unitLine(address);
  if (unit) lines.push(unit);
  const box = address.secUnitType === "Post Box";
  const deliveryLine = box
    ? `Post Box ${address.secUnitNum}`
    : [address.number, address.street].filter(Boolean).join(" ");
  if (deliveryLine) lines.push(deliveryLine);
  if (address.place) lines.push(address.place);
  if (address.locality) lines.push(address.locality);
  const lastLine = [address.city, address.zip].filter(Boolean).join(" ");
  if (lastLine) lines.push(lastLine);
  const state = address.state ? findIndianState(address.state)?.name : undefined;
  if (state) lines.push(state);
  if (options.includeCountry) lines.push("INDIA");

  return {
    lines,
    singleLine: lines.join(", "),
    ...(deliveryLine ? { deliveryLine } : {}),
    ...(lastLine ? { lastLine } : {}),
    country: "IN",
    format: "india-post",
  };
}

/**
 * Parses an address in India into the parts India Post lays out: who it is care of (`careOf`, from `C/o`, `S/o`, `D/o`,
 * `W/o`), a building's name (`building`), the flat or shop (`secUnitType` and `secUnitNum`: `Flat 4B`), the floor, the house
 * number (`number`: `12`, `12/3`, `12-A`) and the street as written (`street`: `MG Road`), a landmark (`place`: `Near City
 * Mall`), the area in `locality`, the city in `city`, the PIN code in `zip` (`560038`, with no space) and the state's code in
 * `state` (`KA`), as written or from the PIN code. The state and the city stand before the PIN code.
 *
 * @param text - The address as one string; commas and line breaks both separate its parts.
 * @param options - `useSnakeCase` gives snake_case keys; the other options are not used.
 * @returns The parts found, with `country` `IN`, or `null` when the text is empty or holds nothing that makes it an
 * address.
 * @example
 * ```ts
 * import { parseIndianAddress } from "@johnmorrisdotca/address-plus/in";
 *
 * console.log(parseIndianAddress("12 MG Road, Indiranagar, Bengaluru, Karnataka 560038"));
 * // → {"number":"12","street":"MG Road","locality":"Indiranagar","city":"Bengaluru","state":"KA","zip":"560038","zipValid":true,"country":"IN"}
 * ```
 */
function parseIndianAddress(text: string, options: ParseOptions = {}): ParsedAddress | null {
  return parsePostcodeCountry(text, indianSpec, options);
}

/**
 * Whether an address is surely Indian, with no hint: it ends with India or `IN`, or it ends with a PIN code after the word
 * `PIN` or `Pin code`, or after the name of a state or union territory of India with a PIN code that GeoNames' list has. Six
 * digits are also how China, Russia and others write a postcode, so they alone claim nothing.
 *
 * @param text - The address as one string.
 * @returns `true` when the address is Indian beyond doubt, `false` otherwise.
 * @example
 * ```ts
 * import { looksIndian } from "@johnmorrisdotca/address-plus/in";
 *
 * console.log([looksIndian("12 MG Road, Bengaluru, Karnataka 560038"), looksIndian("12 MG Road, Bengaluru 560038")]);
 * // → [true,false]
 * ```
 */
function looksIndian(text: string): boolean {
  return looksLikePostcodeCountry(text, indianSpec);
}

/**
 * Checks an address in India: the PIN code is six digits and GeoNames' list has it, the state written agrees with the PIN
 * code's, and the city and the street's number are given. The list is GeoNames' and not India Post's, so a PIN code made
 * since it was copied is flagged as unrecognised.
 *
 * @param address - The address as `parseIndianAddress` (or `parseLocation` with the module) returns it.
 * @param options - `strictPostalValidation: true` makes the postcode findings errors; the rest are not used.
 * @returns The errors and warnings, each with its field, code and message.
 * @example
 * ```ts
 * import { parseIndianAddress, validateIndianAddress } from "@johnmorrisdotca/address-plus/in";
 *
 * const parsedAddress1 = parseIndianAddress("12 MG Road, Bengaluru, Kerala 560038");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(validateIndianAddress(parsedAddress1).warnings.map((one) => one.code));
 * // → ["POSTAL_REGION_MISMATCH"]
 * ```
 */
function validateIndianAddress(address: ParsedAddress, options: ValidationOptions = {}): CountryValidation {
  return validatePostcodeCountry(address, indianSpec, options);
}

/**
 * Compares two addresses in India field by field: the unit, the street, its number, the area, the city and the PIN code.
 * Letter case, `Road` and `Rd`, `Street` and `St`, and the space in a PIN code are not differences.
 *
 * @param first - The first address, as `parseIndianAddress` returns it.
 * @param second - The second address.
 * @returns Whether they are the same delivery point, and each field that differs.
 * @example
 * ```ts
 * import { compareIndianAddresses, parseIndianAddress } from "@johnmorrisdotca/address-plus/in";
 *
 * const parsedAddress1 = parseIndianAddress("12 MG Road, Bengaluru 560038");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * const parsedAddress2 = parseIndianAddress("12 M.G. Rd, BENGALURU 560 038");
 * if (!parsedAddress2) throw new Error("The example address did not parse.");
 * console.log(compareIndianAddresses(parsedAddress1, parsedAddress2).isSame);
 * // → true
 * ```
 */
function compareIndianAddresses(first: ParsedAddress, second: ParsedAddress): CountryComparison {
  return comparePostcodeCountry(first, second, indianSpec);
}

/**
 * Whether a PIN code follows India Post's shape: six digits, the first not nought, with or without a space after the third.
 * Whether it is in use is a different question; `isKnownIndianPostcode` asks it, and the validator checks both.
 *
 * @param postcode - The PIN code.
 * @returns `true` when it has the shape.
 * @example
 * ```ts
 * import { isValidIndianPostcode } from "@johnmorrisdotca/address-plus/in";
 *
 * console.log(["560038", "560 038", "060038", "56003", "5600381"].map(isValidIndianPostcode));
 * // → [true,true,false,false,false]
 * ```
 */
function isValidIndianPostcode(postcode: string): boolean {
  return indianPostcodes.isValid(postcode);
}

/**
 * Whether GeoNames' list for India has a PIN code (19,238 of them). The list is GeoNames' (CC BY 4.0), not India Post's, so a
 * PIN code made since it was copied is not in it: an unknown one is a warning for a validator to give, not proof that it does
 * not exist.
 *
 * @param postcode - The PIN code.
 * @returns `true` when it has the shape and the list has it.
 * @example
 * ```ts
 * import { isKnownIndianPostcode } from "@johnmorrisdotca/address-plus/in";
 *
 * console.log(["560038", "110001", "400001", "999999"].map(isKnownIndianPostcode));
 * // → [true,true,true,false]
 * ```
 */
function isKnownIndianPostcode(postcode: string): boolean {
  return indianPostcodes.isKnown(postcode);
}

/**
 * The state or union territory a PIN code is in, by its code without `IN-` (`KA` for Karnataka): the one most of GeoNames'
 * places for the PIN code are in.
 *
 * @param postcode - The PIN code.
 * @returns The state's code, or `undefined` when the list does not have the PIN code.
 * @example
 * ```ts
 * import { getStateFromIndianPostcode } from "@johnmorrisdotca/address-plus/in";
 *
 * console.log(["560038", "110001", "400001", "600001", "999999"].map(getStateFromIndianPostcode));
 * // → ["KA","DL","MH","TN",null]
 * ```
 */
function getStateFromIndianPostcode(postcode: string): string | undefined {
  return indianPostcodes.regionOf(postcode);
}

/**
 * Takes a PIN code apart: the state it is in, and whether GeoNames' list has it.
 *
 * @param postcode - The PIN code.
 * @returns The PIN code, its state (when the list has it) and whether the list has it.
 * @example
 * ```ts
 * import { parseIndianPostcode } from "@johnmorrisdotca/address-plus/in";
 *
 * console.log(parseIndianPostcode("560 038"));
 * // → {"postcode":"560038","region":"KA","known":true}
 * ```
 */
function parseIndianPostcode(postcode: string): PostcodeLookup {
  return indianPostcodes.lookup(postcode);
}

/**
 * India's module, for `parseLocation` and `validateAddress`: pass it in `countries`, and an address that ends with India or
 * `IN`, or with the word `PIN` and a PIN code, or with a state's name and a PIN code the list has, is read as Indian;
 * `country: "IN"` reads any address as one.
 *
 * @example
 * ```ts
 * import { parseLocation } from "@johnmorrisdotca/address-plus";
 * import { india } from "@johnmorrisdotca/address-plus/in";
 *
 * console.log(parseLocation("12 MG Road, Bengaluru, Karnataka 560038", { countries: [india] })?.state);
 * // → "KA"
 * ```
 */
const india: CountryModule = postcodeCountryModule(indianSpec, (address) => formatIndiaPost(address));

export type { CountryComparison, CountryDifference, CountryModule, CountryValidation } from "../types/country-module";
export type { FormattedAddress } from "../types/formatting";
export type { ParseOptions } from "../types/parse-options";
export type { ParsedAddress } from "../types/parsed-address";
export type { PostcodeLookup, PostcodeRegion } from "../types/postcode-country";
export type { ValidationError, ValidationOptions } from "../types/validation";
export {
  compareIndianAddresses,
  findIndianState,
  formatIndiaPost,
  getStateFromIndianPostcode,
  IN_STATES,
  india,
  isKnownIndianPostcode,
  isValidIndianPostcode,
  looksIndian,
  parseIndianAddress,
  parseIndianPostcode,
  validateIndianAddress,
};
export type { IndiaPostFormattingOptions };
