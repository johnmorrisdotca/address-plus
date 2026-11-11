// Addresses in South Korea: import "@johnmorrisdotca/address-plus/kr" for the parser, the validator, the Korea Post formatter,
// the comparer, the postcode lookups and the provinces, and pass `southKorea` to parseLocation in `countries` to read Korean
// addresses, in Hangul or in Latin letters, beside the US, Canadian and Japanese ones. Nothing here is in the main entry point.

import { findKoreanProvince, koreanPostcodes, KR_PROVINCE_NAMES, KR_PROVINCES } from "../constants/kr";
import {
  comparePostcodeCountry,
  looksLikePostcodeCountry,
  postcodeCountryModule,
  validatePostcodeCountry,
} from "../country/postcode-country";
import type { CountryComparison, CountryModule, CountryValidation } from "../types/country-module";
import type { FormattedAddress } from "../types/formatting";
import type { ParseOptions } from "../types/parse-options";
import type { ParsedAddress } from "../types/parsed-address";
import type { PostcodeLookup } from "../types/postcode-country";
import type { ValidationOptions } from "../types/validation";
import { koreanSpec, parseKoreanText } from "./rules";

/**
 * Options for `formatKoreaPost`.
 *
 * @example
 * ```ts
 * import { formatKoreaPost, parseKoreanAddress } from "@johnmorrisdotca/address-plus/kr";
 * import type { KoreaPostFormattingOptions } from "@johnmorrisdotca/address-plus/kr";
 *
 * const options: KoreaPostFormattingOptions = { includeCountry: true };
 * const parsedAddress1 = parseKoreanAddress("110 Sejong-daero, Jung-gu, Seoul 04524");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatKoreaPost(parsedAddress1, options).lines);
 * // → ["110 Sejong-daero","Jung-gu","Seoul 04524","SOUTH KOREA"]
 * ```
 */
interface KoreaPostFormattingOptions {
  includeCountry?: boolean; // SOUTH KOREA, or 대한민국 for an address in Hangul, as the last line
}

const HANGUL = /[ㄱ-ㆎ가-힣]/;

/**
 * Parses an address in South Korea, written in Hangul from the province down (`서울특별시 중구 세종대로 110 (태평로1가)`) or
 * in Latin letters from the number up (`110 Sejong-daero, Jung-gu, Seoul 04524`). The fields mean the same in both: the
 * province or metropolitan city's code in `state` (`11` for Seoul), the district in `city` (`중구`, or `수원시 영통구` for a
 * district of a city), the road as written in `street` (`세종대로`, `Sejong-daero`), the building number on the road in
 * `number` (`110`), the dong, ri or eup in `locality`, a building's name or its block in `building`, the floor (`floorType`
 * `층` or `Floor`, and `floor`), the unit (`secUnitType` `호` or `Unit`, and `secUnitNum`) and the five-digit postcode in
 * `zip`, which may stand at either end or in brackets.
 *
 * @param text - The address as one string.
 * @param options - `useSnakeCase` gives snake_case keys; the other options are not used.
 * @returns The parts found, with `country` `KR`, or `null` when the text is empty or holds nothing that makes it an address.
 * @example
 * ```ts
 * import { parseKoreanAddress } from "@johnmorrisdotca/address-plus/kr";
 *
 * console.log(parseKoreanAddress("(04524) 서울특별시 중구 세종대로 110, 3층 (태평로1가)"));
 * // → {"state":"11","city":"중구","street":"세종대로","number":"110","locality":"태평로1가","floorType":"층","floor":"3","zip":"04524","zipValid":true,"country":"KR"}
 * ```
 */
function parseKoreanAddress(text: string, options: ParseOptions = {}): ParsedAddress | null {
  return parseKoreanText(text, options);
}

/**
 * Writes an address in South Korea as Korea Post asks. An address in Hangul is written from the province down on one line, with
 * the floor and the unit after the road and the dong in brackets, and the postcode on a line of its own; one in Latin letters
 * is written from the unit up, each of the unit, the road, the district and the province and postcode on its own line.
 *
 * @param address - The address as `parseKoreanAddress` returns it.
 * @param options - Whether to add the country (see `KoreaPostFormattingOptions`).
 * @returns The lines, the same on one line, the delivery line and the last line.
 * @example
 * ```ts
 * import { formatKoreaPost, parseKoreanAddress } from "@johnmorrisdotca/address-plus/kr";
 *
 * const parsedAddress1 = parseKoreanAddress("서울 중구 세종대로 110 3층 (태평로1가) 04524");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatKoreaPost(parsedAddress1).lines);
 * // → ["서울특별시 중구 세종대로 110, 3층 (태평로1가)","04524"]
 * ```
 */
function formatKoreaPost(address: ParsedAddress, options: KoreaPostFormattingOptions = {}): FormattedAddress {
  const lines: string[] = [];
  if (!address) return { lines, singleLine: "", country: "KR", format: "korea-post" };
  const names = address.state ? KR_PROVINCE_NAMES[address.state] : undefined;
  const hangul = [address.street, address.city, address.locality].some(
    (part) => part !== undefined && HANGUL.test(part),
  );
  let deliveryLine: string;
  let lastLine: string | undefined;
  if (hangul) {
    const unit = [
      address.floorType
        ? `${address.floor?.startsWith("B") ? `지하${address.floor.slice(1)}` : address.floor}층`
        : undefined,
      address.secUnitType ? `${address.secUnitNum}호` : undefined,
    ]
      .filter(Boolean)
      .join(" ");
    const road = [address.state && names ? names[0] : undefined, address.city, address.street, address.number]
      .filter(Boolean)
      .join(" ");
    deliveryLine = [
      [road, address.building, unit].filter(Boolean).join(", "),
      address.locality ? `(${address.locality})` : undefined,
    ]
      .filter(Boolean)
      .join(" ");
    lastLine = address.zip;
    lines.push(deliveryLine);
    if (lastLine) lines.push(lastLine);
    if (options.includeCountry) lines.push("대한민국");
  } else {
    if (address.building) lines.push(address.building);
    const unit = [
      address.floorType ? `${address.floor?.startsWith("B") ? address.floor : `${address.floor}F`}` : undefined,
      address.secUnitType ? `Unit ${address.secUnitNum}` : undefined,
    ]
      .filter(Boolean)
      .join(", ");
    if (unit) lines.push(unit);
    deliveryLine = [address.number, address.street].filter(Boolean).join(" ");
    if (deliveryLine) lines.push(deliveryLine);
    if (address.locality) lines.push(address.locality);
    for (const district of (address.city ?? "").split(" ").filter(Boolean).reverse()) lines.push(district);
    lastLine = [names ? names[2] : undefined, address.zip].filter(Boolean).join(" ");
    if (lastLine) lines.push(lastLine);
    if (options.includeCountry) lines.push("SOUTH KOREA");
  }

  return {
    lines,
    singleLine: lines.join(", "),
    ...(deliveryLine ? { deliveryLine } : {}),
    ...(lastLine ? { lastLine } : {}),
    country: "KR",
    format: "korea-post",
  };
}

/**
 * Whether an address is surely Korean, with no hint: it ends with South Korea, Korea or 대한민국, or it is written in Hangul with
 * the name of a metropolitan city or province, or a road and its number, or it is written in Latin letters with a road (`-ro`,
 * `-daero`, `-gil`), a province's name and a postcode the list has before the end.
 *
 * @param text - The address as one string.
 * @returns `true` when the address is Korean beyond doubt, `false` otherwise.
 * @example
 * ```ts
 * import { looksKorean } from "@johnmorrisdotca/address-plus/kr";
 *
 * console.log([looksKorean("서울특별시 중구 세종대로 110"), looksKorean("110 Sejong-daero, Jung-gu, Seoul 04524"), looksKorean("123 Main St, Seattle, WA 98101")]);
 * // → [true,true,false]
 * ```
 */
function looksKorean(text: string): boolean {
  return looksLikePostcodeCountry(text, koreanSpec);
}

/**
 * Checks an address in South Korea: the postcode is five digits and GeoNames' list has it, the province written agrees with
 * the postcode's, and the road's building number and the district are given. The list is GeoNames' and not Korea Post's, so a
 * postcode made since it was copied is flagged as unrecognised.
 *
 * @param address - The address as `parseKoreanAddress` (or `parseLocation` with the module) returns it.
 * @param options - `strictPostalValidation: true` makes the postcode findings errors; the rest are not used.
 * @returns The errors and warnings, each with its field, code and message.
 * @example
 * ```ts
 * import { parseKoreanAddress, validateKoreanAddress } from "@johnmorrisdotca/address-plus/kr";
 *
 * const parsedAddress1 = parseKoreanAddress("부산광역시 중구 중앙대로 100 04524");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(validateKoreanAddress(parsedAddress1).warnings.map((one) => one.code));
 * // → ["POSTAL_REGION_MISMATCH"]
 * ```
 */
function validateKoreanAddress(address: ParsedAddress, options: ValidationOptions = {}): CountryValidation {
  return validatePostcodeCountry(address, koreanSpec, options);
}

/**
 * Compares two addresses in South Korea field by field: the province, the district, the road and its number, the dong, the
 * floor, the unit and the postcode. Spaces and hyphens in a road's name and letter case in Latin letters are not differences.
 *
 * @param first - The first address, as `parseKoreanAddress` returns it.
 * @param second - The second address.
 * @returns Whether they are the same delivery point, and each field that differs.
 * @example
 * ```ts
 * import { compareKoreanAddresses, parseKoreanAddress } from "@johnmorrisdotca/address-plus/kr";
 *
 * const parsedAddress1 = parseKoreanAddress("110 Sejong-daero, Jung-gu, Seoul 04524");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * const parsedAddress2 = parseKoreanAddress("110 SEJONGDAERO, JUNG-GU, SEOUL 04524");
 * if (!parsedAddress2) throw new Error("The example address did not parse.");
 * console.log(compareKoreanAddresses(parsedAddress1, parsedAddress2).isSame);
 * // → true
 * ```
 */
function compareKoreanAddresses(first: ParsedAddress, second: ParsedAddress): CountryComparison {
  return comparePostcodeCountry(first, second, koreanSpec);
}

/**
 * Whether a postcode follows Korea Post's shape: five digits. Whether it is in use is a different question;
 * `isKnownKoreanPostcode` asks it, and the validator checks both.
 *
 * @param postcode - The postcode.
 * @returns `true` when it is five digits.
 * @example
 * ```ts
 * import { isValidKoreanPostcode } from "@johnmorrisdotca/address-plus/kr";
 *
 * console.log(["04524", "63000", "0452", "0452a"].map(isValidKoreanPostcode));
 * // → [true,true,false,false]
 * ```
 */
function isValidKoreanPostcode(postcode: string): boolean {
  return koreanPostcodes.isValid(postcode);
}

/**
 * Whether GeoNames' list for South Korea has a postcode (34,249 of them). The list is GeoNames' (CC BY 4.0), not Korea Post's,
 * so a postcode made since it was copied is not in it: an unknown one is a warning for a validator to give, not proof that it
 * does not exist.
 *
 * @param postcode - The postcode.
 * @returns `true` when it has the shape and the list has it.
 * @example
 * ```ts
 * import { isKnownKoreanPostcode } from "@johnmorrisdotca/address-plus/kr";
 *
 * console.log(["04524", "63000", "00000", "99999"].map(isKnownKoreanPostcode));
 * // → [true,true,false,false]
 * ```
 */
function isKnownKoreanPostcode(postcode: string): boolean {
  return koreanPostcodes.isKnown(postcode);
}

/**
 * The province or metropolitan city a postcode is in, by its ISO 3166-2 code without `KR-` (`11` for Seoul).
 *
 * @param postcode - The postcode.
 * @returns The province's code, or `undefined` when the list does not have the postcode.
 * @example
 * ```ts
 * import { getProvinceFromKoreanPostcode } from "@johnmorrisdotca/address-plus/kr";
 *
 * console.log(["04524", "48058", "63000", "16490", "00000"].map(getProvinceFromKoreanPostcode));
 * // → ["11","26","49","41",null]
 * ```
 */
function getProvinceFromKoreanPostcode(postcode: string): string | undefined {
  return koreanPostcodes.regionOf(postcode);
}

/**
 * Takes a postcode apart: the province it is in, and whether GeoNames' list has it.
 *
 * @param postcode - The postcode.
 * @returns The postcode, its province (when the list has it) and whether the list has it.
 * @example
 * ```ts
 * import { parseKoreanPostcode } from "@johnmorrisdotca/address-plus/kr";
 *
 * console.log(parseKoreanPostcode("04524"));
 * // → {"postcode":"04524","region":"11","known":true}
 * ```
 */
function parseKoreanPostcode(postcode: string): PostcodeLookup {
  return koreanPostcodes.lookup(postcode);
}

/**
 * South Korea's module, for `parseLocation` and `validateAddress`: pass it in `countries`, and an address that ends with South
 * Korea, Korea or 대한민국, or is written in Hangul with a province's name or a road and its number, is read as Korean;
 * `country: "KR"` reads any address as one.
 *
 * @example
 * ```ts
 * import { parseLocation } from "@johnmorrisdotca/address-plus";
 * import { southKorea } from "@johnmorrisdotca/address-plus/kr";
 *
 * console.log(parseLocation("서울특별시 중구 세종대로 110", { countries: [southKorea] })?.number);
 * // → "110"
 * ```
 */
const southKorea: CountryModule = {
  ...postcodeCountryModule(koreanSpec, (address) => formatKoreaPost(address)),
  parse: (text, options) => parseKoreanText(text, options),
};

export type { CountryComparison, CountryDifference, CountryModule, CountryValidation } from "../types/country-module";
export type { FormattedAddress } from "../types/formatting";
export type { ParseOptions } from "../types/parse-options";
export type { ParsedAddress } from "../types/parsed-address";
export type { PostcodeLookup, PostcodeRegion } from "../types/postcode-country";
export type { ValidationError, ValidationOptions } from "../types/validation";
export {
  compareKoreanAddresses,
  findKoreanProvince,
  formatKoreaPost,
  getProvinceFromKoreanPostcode,
  isKnownKoreanPostcode,
  isValidKoreanPostcode,
  KR_PROVINCES,
  looksKorean,
  parseKoreanAddress,
  parseKoreanPostcode,
  southKorea,
  validateKoreanAddress,
};
export type { KoreaPostFormattingOptions };
