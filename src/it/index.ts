// Addresses in Italy: import "@johnmorrisdotca/address-plus/it" for the parser, the validator, the Poste Italiane formatter,
// the comparer, the postcode lookups and the provinces, and pass `italy` to parseLocation in `countries` to read Italian
// addresses beside the US, Canadian and Japanese ones. Nothing here is in the main entry point.

import { findItalianProvince, IT_PROVINCES, italianPostcodes } from "../constants/it";
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
import { italianSpec } from "./rules";

/**
 * Options for `formatPosteItaliane`.
 *
 * @example
 * ```ts
 * import { formatPosteItaliane, parseItalianAddress } from "@johnmorrisdotca/address-plus/it";
 * import type { PosteItalianeFormattingOptions } from "@johnmorrisdotca/address-plus/it";
 *
 * const options: PosteItalianeFormattingOptions = { includeCountry: true };
 * const parsedAddress1 = parseItalianAddress("Via del Corso 1, 00186 Roma RM");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatPosteItaliane(parsedAddress1, options).lines);
 * // → ["Via del Corso 1","00186 Roma RM","ITALIA"]
 * ```
 */
interface PosteItalianeFormattingOptions {
  includeCountry?: boolean; // ITALIA as the last line, for mail from abroad
}

// The civic number with what follows it: 12/A, 12 bis, 12-14.
function civic(address: ParsedAddress): string | undefined {
  if (!address.number) return undefined;
  if (!address.numberExtension) return address.number;

  return /^(bis|ter|quater)$/.test(address.numberExtension)
    ? `${address.number} ${address.numberExtension}`
    : `${address.number}/${address.numberExtension}`;
}

/**
 * Writes an address in Italy as Poste Italiane asks: who it is care of (`c/o`), the street and its civic number, with the
 * staircase, the floor and the flat after it, or the Casella Postale, then the postcode, the place and the province's sigla,
 * each on its own line.
 *
 * @param address - The address as `parseItalianAddress` returns it.
 * @param options - Whether to add the country (see `PosteItalianeFormattingOptions`).
 * @returns The lines, the same on one line, the delivery line and the last line.
 * @example
 * ```ts
 * import { formatPosteItaliane, parseItalianAddress } from "@johnmorrisdotca/address-plus/it";
 *
 * const parsedAddress1 = parseItalianAddress("V.le Monza 12/A, Scala B, Int. 5, 20127 Milano (MI)");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatPosteItaliane(parsedAddress1).lines);
 * // → ["V.le Monza 12/A, Scala B, Interno 5","20127 Milano MI"]
 * ```
 */
function formatPosteItaliane(address: ParsedAddress, options: PosteItalianeFormattingOptions = {}): FormattedAddress {
  const lines: string[] = [];
  if (!address) return { lines, singleLine: "", country: "IT", format: "poste-italiane" };
  if (address.careOf) lines.push(`c/o ${address.careOf}`);
  if (address.building) lines.push(address.building);
  const box = address.secUnitType === "Casella Postale";
  const deliveryLine = box
    ? `Casella Postale ${address.secUnitNum}`
    : [
        [address.street, civic(address)].filter(Boolean).join(" "),
        address.staircase ? `Scala ${address.staircase}` : undefined,
        address.floorType ? `Piano ${address.floor}` : undefined,
        address.secUnitType === "Interno" ? `Interno ${address.secUnitNum}` : undefined,
      ]
        .filter(Boolean)
        .join(", ");
  if (deliveryLine) lines.push(deliveryLine);
  if (address.locality && !address.city) lines.push(address.locality);
  const lastLine = [address.zip, address.city, address.state].filter(Boolean).join(" ");
  if (lastLine) lines.push(lastLine);
  if (options.includeCountry) lines.push("ITALIA");

  return {
    lines,
    singleLine: lines.join(", "),
    ...(deliveryLine ? { deliveryLine } : {}),
    ...(lastLine ? { lastLine } : {}),
    country: "IT",
    format: "poste-italiane",
  };
}

/**
 * Parses an address in Italy into the parts Poste Italiane lays out: who it is care of (`careOf`), a building (`building`:
 * `Palazzo Rossi`), the street as written with its type (`street`: `Via del Corso`, `V.le Monza`), its civic number in
 * `number` (`12`, `12-14`, or `SNC` for senza numero civico) with its letter or sub-number in `numberExtension` (the A of
 * `12/A`, `bis`), the staircase (`staircase`), the floor (`floorType` `Piano` and `floor`), the flat (`secUnitType`
 * `Interno` and `secUnitNum`), a Casella Postale, the frazione in `locality`, the place in `city`, the postcode (CAP) in
 * `zip` and the province's sigla in `state` (`RM`), as written or from the postcode.
 *
 * @param text - The address as one string; commas and line breaks both separate its parts.
 * @param options - `useSnakeCase` gives snake_case keys; the other options are not used.
 * @returns The parts found, with `country` `IT`, or `null` when the text is empty or holds nothing that makes it an
 * address.
 * @example
 * ```ts
 * import { parseItalianAddress } from "@johnmorrisdotca/address-plus/it";
 *
 * console.log(parseItalianAddress("Via del Corso, 12/A, 00186 Roma RM"));
 * // → {"number":"12","numberExtension":"A","street":"Via del Corso","city":"Roma","state":"RM","zip":"00186","zipValid":true,"country":"IT"}
 * ```
 */
function parseItalianAddress(text: string, options: ParseOptions = {}): ParsedAddress | null {
  return parsePostcodeCountry(text, italianSpec, options);
}

/**
 * Whether an address is surely Italian, with no hint: it ends with Italy, Italia or `IT`, or its last line is a postcode of
 * five digits and a place while a part of the address begins with an Italian street's type (`Via`, `Viale`, `Corso`,
 * `Piazza`, `Largo`) or is a Casella Postale, and no state's code stands before the postcode.
 *
 * @param text - The address as one string.
 * @returns `true` when the address is Italian beyond doubt, `false` otherwise.
 * @example
 * ```ts
 * import { looksItalian } from "@johnmorrisdotca/address-plus/it";
 *
 * console.log([looksItalian("Via Roma 12, 20121 Milano"), looksItalian("123 Main St, Seattle, WA 98101")]);
 * // → [true,false]
 * ```
 */
function looksItalian(text: string): boolean {
  return looksLikePostcodeCountry(text, italianSpec);
}

/**
 * Checks an address in Italy: the postcode is five digits and GeoNames' list has it, the province written agrees with the
 * postcode's, and the place and the civic number are given. The list is GeoNames' and not Poste Italiane's, so a postcode
 * made since it was copied is flagged as unrecognised.
 *
 * @param address - The address as `parseItalianAddress` (or `parseLocation` with the module) returns it.
 * @param options - `strictPostalValidation: true` makes the postcode findings errors; the rest are not used.
 * @returns The errors and warnings, each with its field, code and message.
 * @example
 * ```ts
 * import { parseItalianAddress, validateItalianAddress } from "@johnmorrisdotca/address-plus/it";
 *
 * const parsedAddress1 = parseItalianAddress("Via Roma 12, 20121 Milano RM");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(validateItalianAddress(parsedAddress1).warnings.map((one) => one.code));
 * // → ["POSTAL_REGION_MISMATCH"]
 * ```
 */
function validateItalianAddress(address: ParsedAddress, options: ValidationOptions = {}): CountryValidation {
  return validatePostcodeCountry(address, italianSpec, options);
}

/**
 * Compares two addresses in Italy field by field: the street, the civic number, the staircase, the flat, the place and
 * the postcode. Letter case, accents, `Via` and `V.` and `Viale` and `V.le`, and an article after the type are not
 * differences.
 *
 * @param first - The first address, as `parseItalianAddress` returns it.
 * @param second - The second address.
 * @returns Whether they are the same delivery point, and each field that differs.
 * @example
 * ```ts
 * import { compareItalianAddresses, parseItalianAddress } from "@johnmorrisdotca/address-plus/it";
 *
 * const parsedAddress1 = parseItalianAddress("Via del Corso 1, 00186 Roma");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * const parsedAddress2 = parseItalianAddress("V. del Corso, 1, 00186 ROMA");
 * if (!parsedAddress2) throw new Error("The example address did not parse.");
 * console.log(compareItalianAddresses(parsedAddress1, parsedAddress2).isSame);
 * // → true
 * ```
 */
function compareItalianAddresses(first: ParsedAddress, second: ParsedAddress): CountryComparison {
  return comparePostcodeCountry(first, second, italianSpec);
}

/**
 * Whether a postcode follows Poste Italiane's shape: five digits. Whether it is in use is a different question;
 * `isKnownItalianPostcode` asks it, and the validator checks both.
 *
 * @param postcode - The postcode.
 * @returns `true` when it is five digits.
 * @example
 * ```ts
 * import { isValidItalianPostcode } from "@johnmorrisdotca/address-plus/it";
 *
 * console.log(["00186", "20121", "2012", "2012a"].map(isValidItalianPostcode));
 * // → [true,true,false,false]
 * ```
 */
function isValidItalianPostcode(postcode: string): boolean {
  return italianPostcodes.isValid(postcode);
}

/**
 * Whether GeoNames' list for Italy has a postcode (4,736 of them). The list is GeoNames' (CC BY 4.0), not Poste
 * Italiane's, and some postcodes of the large cities are listed under the city's general one, so an unknown postcode is a
 * warning for a validator to give, not proof that it does not exist.
 *
 * @param postcode - The postcode.
 * @returns `true` when it has the shape and the list has it.
 * @example
 * ```ts
 * import { isKnownItalianPostcode } from "@johnmorrisdotca/address-plus/it";
 *
 * console.log(["00186", "20121", "00000", "99999"].map(isKnownItalianPostcode));
 * // → [true,true,false,false]
 * ```
 */
function isKnownItalianPostcode(postcode: string): boolean {
  return italianPostcodes.isKnown(postcode);
}

/**
 * The province a postcode is in, by its sigla (`RM`): the one most of GeoNames' places for the postcode are in.
 *
 * @param postcode - The postcode.
 * @returns The province's sigla, or `undefined` when the list does not have the postcode.
 * @example
 * ```ts
 * import { getProvinceFromItalianPostcode } from "@johnmorrisdotca/address-plus/it";
 *
 * console.log(["00186", "20121", "80132", "10121", "00000"].map(getProvinceFromItalianPostcode));
 * // → ["RM","MI","NA","TO",null]
 * ```
 */
function getProvinceFromItalianPostcode(postcode: string): string | undefined {
  return italianPostcodes.regionOf(postcode);
}

/**
 * Takes a postcode apart: the province it is in, and whether GeoNames' list has it.
 *
 * @param postcode - The postcode.
 * @returns The postcode, its province (when the list has it) and whether the list has it.
 * @example
 * ```ts
 * import { parseItalianPostcode } from "@johnmorrisdotca/address-plus/it";
 *
 * console.log(parseItalianPostcode("20121"));
 * // → {"postcode":"20121","region":"MI","known":true}
 * ```
 */
function parseItalianPostcode(postcode: string): PostcodeLookup {
  return italianPostcodes.lookup(postcode);
}

/**
 * Italy's module, for `parseLocation` and `validateAddress`: pass it in `countries`, and an address that ends with Italy,
 * Italia or `IT`, or has an Italian street's type and a postcode of five digits and a place on its last line, is read as
 * Italian; `country: "IT"` reads any address as one.
 *
 * @example
 * ```ts
 * import { parseLocation } from "@johnmorrisdotca/address-plus";
 * import { italy } from "@johnmorrisdotca/address-plus/it";
 *
 * console.log(parseLocation("Via del Corso, 12/A, 00186 Roma", { countries: [italy] })?.state);
 * // → "RM"
 * ```
 */
const italy: CountryModule = postcodeCountryModule(italianSpec, (address) => formatPosteItaliane(address));

export type { CountryComparison, CountryDifference, CountryModule, CountryValidation } from "../types/country-module";
export type { FormattedAddress } from "../types/formatting";
export type { ParseOptions } from "../types/parse-options";
export type { ParsedAddress } from "../types/parsed-address";
export type { PostcodeLookup, PostcodeRegion } from "../types/postcode-country";
export type { ValidationError, ValidationOptions } from "../types/validation";
export {
  compareItalianAddresses,
  findItalianProvince,
  formatPosteItaliane,
  getProvinceFromItalianPostcode,
  isKnownItalianPostcode,
  isValidItalianPostcode,
  IT_PROVINCES,
  italy,
  looksItalian,
  parseItalianAddress,
  parseItalianPostcode,
  validateItalianAddress,
};
export type { PosteItalianeFormattingOptions };
