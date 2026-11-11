// Addresses in the Netherlands: import "@johnmorrisdotca/address-plus/nl" for the parser, the validator, the PostNL
// formatter, the comparer, the postcode lookups and the tables, and pass `netherlands` to parseLocation in `countries` to
// read Dutch addresses beside the US, Canadian and Japanese ones. Nothing here is in the main entry point.

import { dutchPostcodes } from "../constants/nl";
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
import { dutchSpec } from "./rules";

/**
 * Options for `formatPostNL`.
 *
 * @example
 * ```ts
 * import { formatPostNL, parseDutchAddress } from "@johnmorrisdotca/address-plus/nl";
 * import type { PostNLFormattingOptions } from "@johnmorrisdotca/address-plus/nl";
 *
 * const options: PostNLFormattingOptions = { includeCountry: true };
 * const parsedAddress1 = parseDutchAddress("Keizersgracht 123, 1015 CJ Amsterdam");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatPostNL(parsedAddress1, options).lines);
 * // → ["Keizersgracht 123","1015 CJ Amsterdam","NEDERLAND"]
 * ```
 */
interface PostNLFormattingOptions {
  includeCountry?: boolean; // NEDERLAND as the last line, for mail from abroad
}

const joined = (...words: (string | undefined)[]): string => words.filter(Boolean).join(" ");

// The house number with its addition: a letter or a word after a space, a floor after a hyphen.
const houseNumber = (address: ParsedAddress): string | undefined =>
  address.number
    ? `${address.number}${address.numberExtension ? (/^\d+$/.test(address.numberExtension) ? `-${address.numberExtension}` : ` ${address.numberExtension}`) : ""}`
    : undefined;

/**
 * Writes an address in the Netherlands as PostNL asks: who it is care of (`t.a.v.`), the street with its house number and
 * addition, or the Postbus, then the postcode (four digits, a space, two capitals) and the place, each on its own line.
 *
 * @param address - The address as `parseDutchAddress` returns it.
 * @param options - Whether to add the country (see `PostNLFormattingOptions`).
 * @returns The lines, the same on one line, the delivery line and the last line.
 * @example
 * ```ts
 * import { formatPostNL, parseDutchAddress } from "@johnmorrisdotca/address-plus/nl";
 *
 * const parsedAddress1 = parseDutchAddress("t.a.v. De Vries, Damstraat 1-2, 1012pk Amsterdam");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatPostNL(parsedAddress1).lines);
 * // → ["t.a.v. De Vries","Damstraat 1-2","1012 PK Amsterdam"]
 * ```
 */
function formatPostNL(address: ParsedAddress, options: PostNLFormattingOptions = {}): FormattedAddress {
  const lines: string[] = [];
  if (!address) return { lines, singleLine: "", country: "NL", format: "postnl" };
  if (address.careOf) lines.push(`t.a.v. ${address.careOf}`);
  if (address.building) lines.push(address.building);
  const box = address.secUnitType === "Postbus";
  const deliveryLine = box ? joined("Postbus", address.secUnitNum) : joined(address.street, houseNumber(address));
  if (deliveryLine) lines.push(deliveryLine);
  const lastLine = joined(address.zip, address.city);
  if (lastLine) lines.push(lastLine);
  if (options.includeCountry) lines.push("NEDERLAND");

  return {
    lines,
    singleLine: lines.join(", "),
    ...(deliveryLine ? { deliveryLine } : {}),
    ...(lastLine ? { lastLine } : {}),
    country: "NL",
    format: "postnl",
  };
}

/**
 * Parses an address in the Netherlands into the parts PostNL lays out: who it is care of (`careOf`), a building or name
 * above the street (`building`), the street in `street`, the house number in `number` with its addition in
 * `numberExtension` (the A of `123A`, the 2 of `123-2`, `bis`), a Postbus (`secUnitType` and `secUnitNum`), the place in
 * `city` and the postcode in `zip` in its canonical form (`1015 CJ`). `NL-1015CJ` is read as `1015 CJ`.
 *
 * @param text - The address as one string; commas and line breaks both separate its parts.
 * @param options - `useSnakeCase` gives snake_case keys; the other options are not used.
 * @returns The parts found, with `country` `NL`, or `null` when the text is empty or holds nothing that makes it an
 * address.
 * @example
 * ```ts
 * import { parseDutchAddress } from "@johnmorrisdotca/address-plus/nl";
 *
 * console.log(parseDutchAddress("Keizersgracht 123A, 1015 CJ Amsterdam"));
 * // → {"number":"123","numberExtension":"A","street":"Keizersgracht","city":"Amsterdam","zip":"1015 CJ","zipValid":true,"country":"NL"}
 * ```
 */
function parseDutchAddress(text: string, options: ParseOptions = {}): ParsedAddress | null {
  return parsePostcodeCountry(text, dutchSpec, options);
}

/**
 * Whether an address is surely Dutch, with no hint: it ends with the Netherlands, Nederland or `NL`, or its last line is
 * a postcode of four digits and two letters (`1015 CJ`, never beginning SA, SD or SS) and a place. No other country writes
 * a postcode that way, so no address of another country has that shape.
 *
 * @param text - The address as one string.
 * @returns `true` when the address is Dutch beyond doubt, `false` otherwise.
 * @example
 * ```ts
 * import { looksDutch } from "@johnmorrisdotca/address-plus/nl";
 *
 * console.log([looksDutch("Keizersgracht 123, 1015 CJ Amsterdam"), looksDutch("123 Main St, Seattle, WA 98101")]);
 * // → [true,false]
 * ```
 */
function looksDutch(text: string): boolean {
  return looksLikePostcodeCountry(text, dutchSpec);
}

/**
 * Checks an address in the Netherlands: the postcode is four digits and two letters and CBS's list of postcode areas has
 * the digits, and the place and the house number are given. The list is CBS's statistics for 2023, so a postcode area made
 * since is flagged as unrecognised.
 *
 * @param address - The address as `parseDutchAddress` (or `parseLocation` with the module) returns it.
 * @param options - `strictPostalValidation: true` makes the postcode findings errors; the rest are not used.
 * @returns The errors and warnings, each with its field, code and message.
 * @example
 * ```ts
 * import { parseDutchAddress, validateDutchAddress } from "@johnmorrisdotca/address-plus/nl";
 *
 * const parsedAddress1 = parseDutchAddress("Keizersgracht 123, 1000 AA Amsterdam");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(validateDutchAddress(parsedAddress1).warnings.map((one) => one.code));
 * // → ["UNRECOGNIZED_POSTAL_CODE"]
 * ```
 */
function validateDutchAddress(address: ParsedAddress, options: ValidationOptions = {}): CountryValidation {
  return validatePostcodeCountry(address, dutchSpec, options);
}

/**
 * Compares two addresses in the Netherlands field by field: the street, the house number and its addition, the place and the
 * postcode. Letter case, accents, `straat` and `str.`, and the postcode's space are not differences.
 *
 * @param first - The first address, as `parseDutchAddress` returns it.
 * @param second - The second address.
 * @returns Whether they are the same delivery point, and each field that differs.
 * @example
 * ```ts
 * import { compareDutchAddresses, parseDutchAddress } from "@johnmorrisdotca/address-plus/nl";
 *
 * const parsedAddress1 = parseDutchAddress("Keizersgracht 123, 1015 CJ Amsterdam");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * const parsedAddress2 = parseDutchAddress("KEIZERSGRACHT 123, 1015CJ AMSTERDAM");
 * if (!parsedAddress2) throw new Error("The example address did not parse.");
 * console.log(compareDutchAddresses(parsedAddress1, parsedAddress2).isSame);
 * // → true
 * ```
 */
function compareDutchAddresses(first: ParsedAddress, second: ParsedAddress): CountryComparison {
  return comparePostcodeCountry(first, second, dutchSpec);
}

/**
 * Whether a postcode follows PostNL's shape: four digits (the first not nought) and two letters (not beginning SA, SD or
 * SS), with or without the space between. Whether it is in use is a different question; `isKnownDutchPostcode` asks it,
 * and the validator checks both.
 *
 * @param postcode - The postcode.
 * @returns `true` when it has the shape.
 * @example
 * ```ts
 * import { isValidDutchPostcode } from "@johnmorrisdotca/address-plus/nl";
 *
 * console.log(["1015 CJ", "1015cj", "1015", "1015 SS", "0123 AB"].map(isValidDutchPostcode));
 * // → [true,true,false,false,false]
 * ```
 */
function isValidDutchPostcode(postcode: string): boolean {
  return dutchPostcodes.isValid(postcode);
}

/**
 * Whether CBS's list of four-digit postcode areas for the Netherlands has the digits of a postcode (4,070 areas, from the
 * statistics for 2023). The list is not PostNL's, so a postcode area made since it was published is not in it: an unknown
 * one is a warning for a validator to give, not proof that it does not exist. The two letters are not checked.
 *
 * @param postcode - The postcode.
 * @returns `true` when it has the shape and the list has its digits.
 * @example
 * ```ts
 * import { isKnownDutchPostcode } from "@johnmorrisdotca/address-plus/nl";
 *
 * console.log(["1015 CJ", "9711 LM", "1000 AA", "1015"].map(isKnownDutchPostcode));
 * // → [true,true,false,false]
 * ```
 */
function isKnownDutchPostcode(postcode: string): boolean {
  return dutchPostcodes.isKnown(postcode);
}

/**
 * Takes a postcode apart: its canonical form (`1015 CJ`) and whether CBS's list has its digits. The Netherlands has no
 * region in its table, so there is none in the answer.
 *
 * @param postcode - The postcode.
 * @returns The postcode, and whether the list has it.
 * @example
 * ```ts
 * import { parseDutchPostcode } from "@johnmorrisdotca/address-plus/nl";
 *
 * console.log(parseDutchPostcode("1015cj"));
 * // → {"postcode":"1015 CJ","known":true}
 * ```
 */
function parseDutchPostcode(postcode: string): PostcodeLookup {
  return dutchPostcodes.lookup(postcode);
}

/**
 * The Netherlands' module, for `parseLocation` and `validateAddress`: pass it in `countries`, and an address that ends
 * with the Netherlands, Nederland or `NL`, or has a postcode of four digits and two letters and a place on its last line, is
 * read as Dutch; `country: "NL"` reads any address as one.
 *
 * @example
 * ```ts
 * import { parseLocation } from "@johnmorrisdotca/address-plus";
 * import { netherlands } from "@johnmorrisdotca/address-plus/nl";
 *
 * console.log(parseLocation("Keizersgracht 123A, 1015 CJ Amsterdam", { countries: [netherlands] })?.numberExtension);
 * // → "A"
 * ```
 */
const netherlands: CountryModule = postcodeCountryModule(dutchSpec, (address) => formatPostNL(address));

export type { CountryComparison, CountryDifference, CountryModule, CountryValidation } from "../types/country-module";
export type { FormattedAddress } from "../types/formatting";
export type { ParseOptions } from "../types/parse-options";
export type { ParsedAddress } from "../types/parsed-address";
export type { PostcodeLookup, PostcodeRegion } from "../types/postcode-country";
export type { ValidationError, ValidationOptions } from "../types/validation";
export {
  compareDutchAddresses,
  formatPostNL,
  isKnownDutchPostcode,
  isValidDutchPostcode,
  looksDutch,
  netherlands,
  parseDutchAddress,
  parseDutchPostcode,
  validateDutchAddress,
};
export type { PostNLFormattingOptions };
