// Addresses in Spain: import "@johnmorrisdotca/address-plus/es" for the parser, the validator, the Correos formatter, the
// comparer, the postcode lookups and the provinces, and pass `spain` to parseLocation in `countries` to read Spanish
// addresses beside the US, Canadian and Japanese ones. Nothing here is in the main entry point.

import { ES_PROVINCES, findSpanishProvince, spanishPostcodes } from "../constants/es";
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
import { spanishSpec } from "./rules";

/**
 * Options for `formatCorreos`.
 *
 * @example
 * ```ts
 * import { formatCorreos, parseSpanishAddress } from "@johnmorrisdotca/address-plus/es";
 * import type { CorreosFormattingOptions } from "@johnmorrisdotca/address-plus/es";
 *
 * const options: CorreosFormattingOptions = { includeCountry: true };
 * const parsedAddress1 = parseSpanishAddress("Calle de Alcalá, 42, 28014 Madrid");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatCorreos(parsedAddress1, options).lines);
 * // → ["Calle de Alcalá, 42","28014 Madrid","ESPAÑA"]
 * ```
 */
interface CorreosFormattingOptions {
  includeCountry?: boolean; // ESPAÑA as the last line, for mail from abroad
}

// The floor and the door as they are written on the letter: 3º B, Bajo, Puerta B.
function floorAndDoor(address: ParsedAddress): string | undefined {
  const door = address.secUnitNum;
  if (address.floorType === "Piso" && address.floor) return `${address.floor}º${door ? ` ${door}` : ""}`;
  if (address.floorType) return `${address.floorType}${door ? ` ${door}` : ""}`;
  if (address.secUnitType && door) return `${address.secUnitType} ${door}`;

  return undefined;
}

/**
 * Writes an address in Spain as Correos asks: who it is care of (`A/A`), the street with its number and the floor and the
 * door (`Calle de Alcalá, 42, 3º B`), or the Apartado de Correos, then the postcode and the place, each on its own line.
 *
 * @param address - The address as `parseSpanishAddress` returns it.
 * @param options - Whether to add the country (see `CorreosFormattingOptions`).
 * @returns The lines, the same on one line, the delivery line and the last line.
 * @example
 * ```ts
 * import { formatCorreos, parseSpanishAddress } from "@johnmorrisdotca/address-plus/es";
 *
 * const parsedAddress1 = parseSpanishAddress("c/ Mayor 5, 3º izda, 28013 Madrid");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatCorreos(parsedAddress1).lines);
 * // → ["c/ Mayor, 5, 3º izda","28013 Madrid"]
 * ```
 */
function formatCorreos(address: ParsedAddress, options: CorreosFormattingOptions = {}): FormattedAddress {
  const lines: string[] = [];
  if (!address) return { lines, singleLine: "", country: "ES", format: "correos" };
  if (address.careOf) lines.push(`A/A ${address.careOf}`);
  if (address.building) lines.push(address.building);
  const box = address.secUnitType === "Apartado de Correos";
  const deliveryLine = box
    ? `Apartado de Correos ${address.secUnitNum}`
    : [
        address.street,
        address.number,
        address.staircase ? `Esc. ${address.staircase}` : undefined,
        floorAndDoor(address),
      ]
        .filter(Boolean)
        .join(", ");
  if (deliveryLine) lines.push(deliveryLine);
  const lastLine =
    [address.zip, address.city].filter(Boolean).join(" ") + (address.county ? ` (${address.county})` : "");
  if (lastLine.trim()) lines.push(lastLine.trim());
  if (options.includeCountry) lines.push("ESPAÑA");

  return {
    lines,
    singleLine: lines.join(", "),
    ...(deliveryLine ? { deliveryLine } : {}),
    ...(lastLine.trim() ? { lastLine: lastLine.trim() } : {}),
    country: "ES",
    format: "correos",
  };
}

/**
 * Parses an address in Spain into the parts Correos lays out: who it is care of (`careOf`), the street as written with
 * its type (`street`: `Calle de Alcalá`, `C/ Mayor`), its number in `number` (`42`, `12-14`, `S/N`), the floor and the door
 * (`floorType` `Piso` and `floor`, `secUnitType` `Puerta` and `secUnitNum`: `3º B`), the staircase and the entrance, an
 * Apartado de Correos, the place in `city`, the province in `county` when it is written in brackets, the postcode in `zip`
 * and the province's code in `state` (`M` for Madrid), from the postcode. The number may follow the street after a
 * comma or not.
 *
 * @param text - The address as one string; commas and line breaks both separate its parts.
 * @param options - `useSnakeCase` gives snake_case keys; the other options are not used.
 * @returns The parts found, with `country` `ES`, or `null` when the text is empty or holds nothing that makes it an
 * address.
 * @example
 * ```ts
 * import { parseSpanishAddress } from "@johnmorrisdotca/address-plus/es";
 *
 * console.log(parseSpanishAddress("Calle de Alcalá, 42, 3º B, 28014 Madrid"));
 * // → {"secUnitType":"Puerta","secUnitNum":"B","floorType":"Piso","floor":"3","number":"42","street":"Calle de Alcalá","city":"Madrid","state":"M","zip":"28014","zipValid":true,"country":"ES"}
 * ```
 */
function parseSpanishAddress(text: string, options: ParseOptions = {}): ParsedAddress | null {
  return parsePostcodeCountry(text, spanishSpec, options);
}

/**
 * Whether an address is surely Spanish, with no hint: it ends with Spain, España or `ES`, or its last line is a postcode
 * of five digits (the first two 01 to 52) and a place while a part of the address begins with a Spanish street's type
 * (`Calle`, `C/`, `Avenida`, `Paseo`, `Plaza`) or is an Apartado de Correos, and no state's code stands before the
 * postcode.
 *
 * @param text - The address as one string.
 * @returns `true` when the address is Spanish beyond doubt, `false` otherwise.
 * @example
 * ```ts
 * import { looksSpanish } from "@johnmorrisdotca/address-plus/es";
 *
 * console.log([looksSpanish("Calle Mayor 5, 28013 Madrid"), looksSpanish("Calle Ocho, Miami, FL 33135")]);
 * // → [true,false]
 * ```
 */
function looksSpanish(text: string): boolean {
  return looksLikePostcodeCountry(text, spanishSpec);
}

/**
 * Checks an address in Spain: the postcode is five digits with a province's number first and GeoNames' list has it, the
 * province written agrees with the postcode's, and the place and the street's number are given. The list is GeoNames' and
 * not Correos', so a postcode made since it was copied is flagged as unrecognised.
 *
 * @param address - The address as `parseSpanishAddress` (or `parseLocation` with the module) returns it.
 * @param options - `strictPostalValidation: true` makes the postcode findings errors; the rest are not used.
 * @returns The errors and warnings, each with its field, code and message.
 * @example
 * ```ts
 * import { parseSpanishAddress, validateSpanishAddress } from "@johnmorrisdotca/address-plus/es";
 *
 * const parsedAddress1 = parseSpanishAddress("Calle Mayor 5, 28999 Madrid");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(validateSpanishAddress(parsedAddress1).warnings.map((one) => one.code));
 * // → ["UNRECOGNIZED_POSTAL_CODE"]
 * ```
 */
function validateSpanishAddress(address: ParsedAddress, options: ValidationOptions = {}): CountryValidation {
  return validatePostcodeCountry(address, spanishSpec, options);
}

/**
 * Compares two addresses in Spain field by field: the street, the number, the floor and the door, the place and the
 * postcode. Letter case, accents, `Calle`, `C/` and `Cl.` and a `de` after the type are not differences.
 *
 * @param first - The first address, as `parseSpanishAddress` returns it.
 * @param second - The second address.
 * @returns Whether they are the same delivery point, and each field that differs.
 * @example
 * ```ts
 * import { compareSpanishAddresses, parseSpanishAddress } from "@johnmorrisdotca/address-plus/es";
 *
 * const parsedAddress1 = parseSpanishAddress("Calle de Alcalá, 42, 28014 Madrid");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * const parsedAddress2 = parseSpanishAddress("C/ Alcala 42, 28014 MADRID");
 * if (!parsedAddress2) throw new Error("The example address did not parse.");
 * console.log(compareSpanishAddresses(parsedAddress1, parsedAddress2).isSame);
 * // → true
 * ```
 */
function compareSpanishAddresses(first: ParsedAddress, second: ParsedAddress): CountryComparison {
  return comparePostcodeCountry(first, second, spanishSpec);
}

/**
 * Whether a postcode follows Correos' shape: five digits, the first two a province's number (01 to 52). Whether it is in
 * use is a different question; `isKnownSpanishPostcode` asks it, and the validator checks both.
 *
 * @param postcode - The postcode.
 * @returns `true` when it has the shape.
 * @example
 * ```ts
 * import { isValidSpanishPostcode } from "@johnmorrisdotca/address-plus/es";
 *
 * console.log(["28014", "01001", "52080", "00100", "53000", "2801"].map(isValidSpanishPostcode));
 * // → [true,true,true,false,false,false]
 * ```
 */
function isValidSpanishPostcode(postcode: string): boolean {
  return spanishPostcodes.isValid(postcode);
}

/**
 * Whether GeoNames' list for Spain has a postcode (11,150 of them). The list is GeoNames' (CC BY 4.0), not Correos', so
 * a postcode made since it was copied is not in it: an unknown one is a warning for a validator to give, not proof that
 * it does not exist.
 *
 * @param postcode - The postcode.
 * @returns `true` when it has the shape and the list has it.
 * @example
 * ```ts
 * import { isKnownSpanishPostcode } from "@johnmorrisdotca/address-plus/es";
 *
 * console.log(["28014", "08001", "28999", "99999"].map(isKnownSpanishPostcode));
 * // → [true,true,false,false]
 * ```
 */
function isKnownSpanishPostcode(postcode: string): boolean {
  return spanishPostcodes.isKnown(postcode);
}

/**
 * The province a postcode is in, as its ISO 3166-2 code without `ES-`: the province its first two digits name.
 *
 * @param postcode - The postcode.
 * @returns The province's code (`M` for Madrid), or `undefined` when the postcode has not the shape.
 * @example
 * ```ts
 * import { getProvinceFromSpanishPostcode } from "@johnmorrisdotca/address-plus/es";
 *
 * console.log(["28014", "08001", "41001", "35001", "1234"].map(getProvinceFromSpanishPostcode));
 * // → ["M","B","SE","GC",null]
 * ```
 */
function getProvinceFromSpanishPostcode(postcode: string): string | undefined {
  return spanishPostcodes.regionOf(postcode);
}

/**
 * Takes a postcode apart: the province it is in, and whether GeoNames' list has it.
 *
 * @param postcode - The postcode.
 * @returns The postcode, its province (when it has the shape) and whether the list has it.
 * @example
 * ```ts
 * import { parseSpanishPostcode } from "@johnmorrisdotca/address-plus/es";
 *
 * console.log(parseSpanishPostcode("28014"));
 * // → {"postcode":"28014","region":"M","known":true}
 * ```
 */
function parseSpanishPostcode(postcode: string): PostcodeLookup {
  return spanishPostcodes.lookup(postcode);
}

/**
 * Spain's module, for `parseLocation` and `validateAddress`: pass it in `countries`, and an address that ends with Spain,
 * España or `ES`, or has a Spanish street's type and a postcode of five digits and a place on its last line, is read as
 * Spanish; `country: "ES"` reads any address as one.
 *
 * @example
 * ```ts
 * import { parseLocation } from "@johnmorrisdotca/address-plus";
 * import { spain } from "@johnmorrisdotca/address-plus/es";
 *
 * console.log(parseLocation("Calle de Alcalá, 42, 28014 Madrid", { countries: [spain] })?.state);
 * // → "M"
 * ```
 */
const spain: CountryModule = postcodeCountryModule(spanishSpec, (address) => formatCorreos(address));

export type { CountryComparison, CountryDifference, CountryModule, CountryValidation } from "../types/country-module";
export type { FormattedAddress } from "../types/formatting";
export type { ParseOptions } from "../types/parse-options";
export type { ParsedAddress } from "../types/parsed-address";
export type { PostcodeLookup, PostcodeRegion } from "../types/postcode-country";
export type { ValidationError, ValidationOptions } from "../types/validation";
export {
  compareSpanishAddresses,
  ES_PROVINCES,
  findSpanishProvince,
  formatCorreos,
  getProvinceFromSpanishPostcode,
  isKnownSpanishPostcode,
  isValidSpanishPostcode,
  looksSpanish,
  parseSpanishAddress,
  parseSpanishPostcode,
  spain,
  validateSpanishAddress,
};
export type { CorreosFormattingOptions };
