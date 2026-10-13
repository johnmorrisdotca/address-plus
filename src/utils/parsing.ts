// Core parsing utilities and regex patterns
import {
  CA_PROVINCES,
  CA_STREET_TYPES,
  COUNTRIES,
  DIRECTIONAL_MAP,
  FACILITY_PATTERNS,
  getProvinceFromPostalCode,
  SECONDARY_UNIT_TYPES,
  US_STATES,
  US_STREET_TYPES,
} from "../constants";
import { CANADIAN_POSTAL_CODE_PATTERN, ZIP_CODE_PATTERN } from "../patterns/location-patterns";
import { wholeWord, WORD_END, WORD_START } from "../patterns/word-boundary";
import { ParsedAddress } from "../types";

import { capitalizeStreetName, capitalizeWords } from "./capitalization";

// Regex patterns for parsing components
const ZIP_MATCH_PATTERN = /\b(\d{5})(?:[-\s]?(\d{4}))?\b/;
const POSTAL_MATCH_PATTERN = /\b([A-Za-z]\d[A-Za-z])\s?(\d[A-Za-z]\d)\b/;
const UNIT_NUMBER_PATTERN = /\b(apt|apartment|unit|ste|suite|#)\s*(\d+\w*)\b/i;
const FRACTIONAL_NUMBER_PATTERN = new RegExp("^\\s*(\\d+(?:\\s*[-\\/]\\s*\\d+\\/\\d+|\\s+\\d+\\/\\d+)?)\\b");

/**
 * Lower-cases a string, turns its periods, commas and semicolons into spaces, folds runs of spaces to one and trims
 * it: the form the parsers compare words in.
 *
 * @param text - The text.
 * @returns The text in lower case, without that punctuation, with single spaces and none at either end.
 * @example
 * ```ts
 * import { normalizeText } from "@johnmorrisdotca/address-plus";
 *
 * console.log(normalizeText("  123   Main  St  "));
 * // → "123 main st"
 * ```
 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").replace(/[.,;]/g, " ").trim();
}

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A regular expression matching any key of a dictionary as a whole word, longest first. Words match in any alphabet,
 * so `québec` is found at the start of a string and `al` is not found inside `Montréal`.
 *
 * @param dict - The dictionary whose keys are matched.
 * @param capture - Whether to wrap the alternatives in a capturing group; default `true`.
 * @returns The expression, case-insensitive.
 * @example
 * ```ts
 * import { buildRegexFromDict } from "@johnmorrisdotca/address-plus";
 *
 * console.log(buildRegexFromDict({ street: "St", avenue: "Ave" }).test("avenue"));
 * // → true
 * ```
 */
function buildRegexFromDict(dict: Record<string, string>, capture: boolean = true): RegExp {
  const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
  const pattern = keys.map(escapeRegExp).join("|");
  return new RegExp(capture ? `${WORD_START}(${pattern})${WORD_END}` : wholeWord(pattern), "iu");
}

// The same search for one known word, used to take a match back out of the text.
const wordPattern = (word: string, flags: string): RegExp => new RegExp(wholeWord(escapeRegExp(word)), flags);

/**
 * Takes a leading directional off a street (`NW Main St`), abbreviated.
 *
 * @param text - The street text.
 * @returns The directional (`undefined` when there is none) and the text that remains.
 * @example
 * ```ts
 * import { parseDirectional } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseDirectional("NW Main St"));
 * // → {"direction":"NW","remaining":"Main St"}
 * ```
 */
function parseDirectional(text: string): { direction: string | undefined; remaining: string } {
  const dirPattern = buildRegexFromDict(DIRECTIONAL_MAP);
  const match = text.match(dirPattern);

  if (match) {
    const direction = DIRECTIONAL_MAP[match[1].toLowerCase()];
    const remaining = text.replace(dirPattern, " ").replace(/\s+/g, " ").trim();
    return { direction, remaining };
  }

  return { direction: undefined, remaining: text };
}

/**
 * Takes the street type off the end of a street, abbreviated the USPS way.
 *
 * @param text - The street text.
 * @param country - `US` or `CA`, for the types only one country uses.
 * @returns The type's USPS abbreviation in lower case (`undefined` when there is none) and the text that remains.
 * @example
 * ```ts
 * import { parseStreetType } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseStreetType("Main Street"));
 * // → {"type":"st","remaining":"Main"}
 * ```
 */
function parseStreetType(
  text: string,
  country: "US" | "CA" = COUNTRIES.UNITED_STATES,
): { type: string | undefined; remaining: string } {
  const typeMap = country === COUNTRIES.CANADA ? { ...US_STREET_TYPES, ...CA_STREET_TYPES } : US_STREET_TYPES;
  const typePattern = buildRegexFromDict(typeMap);
  const match = text.match(typePattern);

  if (match) {
    const type = typeMap[match[1].toLowerCase()];
    const remaining = text.replace(typePattern, " ").replace(/\s+/g, " ").trim();
    return { type, remaining };
  }

  return { type: undefined, remaining: text };
}

/**
 * Takes a US state or Canadian province off the end of a text, by code or by name.
 *
 * @param text - The text, such as `Anytown NY`.
 * @returns The two-letter code (`undefined` when there is none), the text that remains, and the country it points to.
 * @example
 * ```ts
 * import { parseStateProvince } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseStateProvince("Anytown NY"));
 * // → {"state":"NY","remaining":"Anytown","detectedCountry":"US"}
 * ```
 */
function parseStateProvince(text: string): {
  state: string | undefined;
  remaining: string;
  detectedCountry?: "US" | "CA";
} {
  // Try US state abbreviations first (more specific than full names)
  const usAbbrevPattern = new RegExp(`${WORD_START}(${Object.values(US_STATES).join("|")})${WORD_END}`, "iu");
  let match = text.match(usAbbrevPattern);
  if (match) {
    const state = match[1].toUpperCase();
    const remaining = text.replace(wordPattern(match[1], "iu"), " ").replace(/\s+/g, " ").trim();
    return { state, remaining, detectedCountry: COUNTRIES.UNITED_STATES };
  }

  // Try Canadian province abbreviations
  const caAbbrevPattern = new RegExp(`${WORD_START}(${Object.values(CA_PROVINCES).join("|")})${WORD_END}`, "iu");
  match = text.match(caAbbrevPattern);
  if (match) {
    const state = match[1].toUpperCase();
    const remaining = text.replace(wordPattern(match[1], "iu"), " ").replace(/\s+/g, " ").trim();
    return { state, remaining, detectedCountry: COUNTRIES.CANADA };
  }

  // Try US states full names (only if no abbreviation found)
  const usPattern = buildRegexFromDict(US_STATES);
  match = text.match(usPattern);
  if (match) {
    const state = US_STATES[match[1].toLowerCase()];
    const remaining = text.replace(wordPattern(match[1], "giu"), " ").replace(/\s+/g, " ").trim();
    return { state, remaining, detectedCountry: COUNTRIES.UNITED_STATES };
  }

  // Try Canadian provinces full names
  const caPattern = buildRegexFromDict(CA_PROVINCES);
  match = text.match(caPattern);
  if (match) {
    const state = CA_PROVINCES[match[1].toLowerCase()];
    const remaining = text.replace(wordPattern(match[1], "giu"), " ").replace(/\s+/g, " ").trim();
    return { state, remaining, detectedCountry: COUNTRIES.CANADA };
  }

  return { state: undefined, remaining: text };
}

/**
 * Takes a ZIP code, ZIP+4 or Canadian postal code off the end of a text.
 *
 * @param text - The text, such as `Toronto ON M5H 2N2`.
 * @returns The code and its ZIP+4 (`undefined` when there is none), the text that remains, and the country and
 * province the code points to.
 * @example
 * ```ts
 * import { parsePostalCode } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parsePostalCode("Toronto ON M5H 2N2"));
 * // → {"zip":"M5H 2N2","remaining":"Toronto ON","detectedCountry":"CA","detectedProvince":"ON"}
 * ```
 */
function parsePostalCode(text: string): {
  zip: string | undefined;
  plus4: string | undefined;
  remaining: string;
  detectedCountry?: "US" | "CA";
  detectedProvince?: string;
} {
  // Try US ZIP code - use centralized pattern
  const zipMatch = text.match(ZIP_MATCH_PATTERN);
  if (zipMatch) {
    // Validate with the proper pattern from validation.ts
    const fullZip = zipMatch[0].replace(/\s+/g, "");
    if (ZIP_CODE_PATTERN.test(fullZip)) {
      const zip = zipMatch[1];
      const plus4 = zipMatch[2];
      const remaining = text.replace(zipMatch[0], "").trim();
      return { zip, plus4, remaining, detectedCountry: COUNTRIES.UNITED_STATES };
    }
  }

  // Try Canadian postal code - use centralized pattern
  const postalMatch = text.match(POSTAL_MATCH_PATTERN);
  if (postalMatch) {
    // Validate with the proper pattern from validation.ts
    const fullPostal = `${postalMatch[1]} ${postalMatch[2]}`.toUpperCase();
    if (CANADIAN_POSTAL_CODE_PATTERN.test(fullPostal)) {
      const zip = fullPostal;
      const remaining = text.replace(postalMatch[0], " ").replace(/\s+/g, " ").trim();
      const detectedProvince = getProvinceFromPostalCode(zip) || undefined;
      return { zip, plus4: undefined, remaining, detectedCountry: COUNTRIES.CANADA, detectedProvince };
    }
  }

  return { zip: undefined, plus4: undefined, remaining: text };
}

/**
 * Takes a secondary unit (apartment, suite, floor and the rest) off a street line.
 *
 * @param text - The street line.
 * @returns The unit as written, its designator in full and its number (each `undefined` when there is none), and the
 * text that remains.
 * @example
 * ```ts
 * import { parseSecondaryUnit } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseSecondaryUnit("123 Main St Apt 4"));
 * // → {"unit":"Apartment 4","secUnitType":"Apartment","secUnitNum":"4","remaining":"123 Main St"}
 * ```
 */
function parseSecondaryUnit(text: string): {
  unit: string | undefined;
  secUnitType: string | undefined;
  secUnitNum: string | undefined;
  remaining: string;
} {
  const unitPattern = buildRegexFromDict(SECONDARY_UNIT_TYPES);

  // Look for unit type followed by number
  const unitMatch = text.match(new RegExp(`${unitPattern.source}\\s*(\\d+\\w*|[a-zA-Z]+\\d*)`));
  if (unitMatch) {
    const secUnitType = SECONDARY_UNIT_TYPES[unitMatch[1].toLowerCase()];
    const secUnitNum = unitMatch[2];
    const unit = `${secUnitType} ${secUnitNum}`;
    const remaining = text.replace(unitMatch[0], " ").replace(/\s+/g, " ").trim();
    return { unit, secUnitType, secUnitNum, remaining };
  }

  // Look for numbers that might be unit numbers
  const numberMatch = text.match(UNIT_NUMBER_PATTERN);
  if (numberMatch) {
    const secUnitType = SECONDARY_UNIT_TYPES[numberMatch[1].toLowerCase()] || numberMatch[1].toLowerCase();
    const secUnitNum = numberMatch[2];
    const unit = `${secUnitType} ${secUnitNum}`;
    const remaining = text.replace(numberMatch[0], " ").replace(/\s+/g, " ").trim();
    return { unit, secUnitType, secUnitNum, remaining };
  }

  return { unit: undefined, secUnitType: undefined, secUnitNum: undefined, remaining: text };
}

/**
 * Takes a facility's name (a building, a park, a hospital) off the start of an address.
 *
 * @param text - The address text.
 * @returns The facility (`undefined` when there is none) and the text that remains.
 * @example
 * ```ts
 * import { parseFacility } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseFacility("Empire State Building, 350 5th Ave"));
 * // → {"facility":"Empire State Building","remaining":", 350 5th Ave"}
 * ```
 */
function parseFacility(text: string): { facility: string | undefined; remaining: string } {
  for (const pattern of FACILITY_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      // Try to extract the full facility name (word before + match + word after if relevant)
      const fullMatch = text.match(new RegExp(`\\b[\\w\\s]*${match[0]}[\\w\\s]*\\b`, "i"));
      if (fullMatch) {
        const facility = fullMatch[0].trim();
        const remaining = text.replace(fullMatch[0], " ").replace(/\s+/g, " ").trim();
        return { facility, remaining };
      }
    }
  }

  return { facility: undefined, remaining: text };
}

/**
 * Takes words in parentheses out of an address, such as `(Rear Entrance)`.
 *
 * @param text - The address text.
 * @returns The words in the parentheses (`undefined` when there are none) and the text without them.
 * @example
 * ```ts
 * import { parseParenthetical } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseParenthetical("123 Main St (Rear Entrance)"));
 * // → {"secondary":"Rear Entrance","remaining":"123 Main St"}
 * ```
 */
function parseParenthetical(text: string): { secondary: string | undefined; remaining: string } {
  const parenMatch = text.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const secondary = parenMatch[1].trim();
    const remaining = text.replace(parenMatch[0], " ").replace(/\s+/g, " ").trim();
    return { secondary, remaining };
  }

  return { secondary: undefined, remaining: text };
}

/**
 * Takes the house number off the start of a street line, with a fraction or a letter if it has one.
 *
 * @param text - The street line.
 * @returns The number (`undefined` when there is none) and the text that remains.
 * @example
 * ```ts
 * import { parseStreetNumber } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseStreetNumber("123 Main St"));
 * // → {"number":"123","remaining":"Main St"}
 * ```
 */
function parseStreetNumber(text: string): { number: string | undefined; remaining: string } {
  // Handle fractional numbers like "123 1/2" or "123-1/2"
  const fracMatch = text.match(FRACTIONAL_NUMBER_PATTERN);
  if (fracMatch) {
    const number = fracMatch[1].replace(/\s+/g, " ").trim();
    const remaining = text.replace(fracMatch[0], " ").replace(/\s+/g, " ").trim();
    return { number, remaining };
  }

  // Handle simple numbers
  const numMatch = text.match(/^\s*(\d+)\b/);
  if (numMatch) {
    const number = numMatch[1];
    const remaining = text.replace(numMatch[0], " ").replace(/\s+/g, " ").trim();
    return { number, remaining };
  }

  return { number: undefined, remaining: text };
}

/**
 * Which country a parsed address is in, from its postal code, then its state or province.
 *
 * @param address - The parsed address, or any object with its `zip` and `state`.
 * @returns `US` or `CA`, or `undefined` when nothing says.
 * @example
 * ```ts
 * import { detectCountry } from "@johnmorrisdotca/address-plus";
 *
 * console.log(detectCountry({ zip: "M5H 2N2" }));
 * // → "CA"
 * ```
 */
function detectCountry(address: ParsedAddress): "US" | "CA" | undefined {
  if (address.state) {
    if (
      Object.values(US_STATES).includes(address.state) ||
      Object.keys(US_STATES).includes(address.state.toLowerCase())
    ) {
      return COUNTRIES.UNITED_STATES;
    }
    if (
      Object.values(CA_PROVINCES).includes(address.state) ||
      Object.keys(CA_PROVINCES).includes(address.state.toLowerCase())
    ) {
      return COUNTRIES.CANADA;
    }
  }

  if (address.zip) {
    if (ZIP_CODE_PATTERN.test(address.zip)) {
      return COUNTRIES.UNITED_STATES;
    }
    if (CANADIAN_POSTAL_CODE_PATTERN.test(address.zip)) {
      return COUNTRIES.CANADA;
    }
  }

  return undefined;
}

export {
  buildRegexFromDict,
  capitalizeStreetName,
  capitalizeWords,
  detectCountry,
  normalizeText,
  parseDirectional,
  parseFacility,
  parseParenthetical,
  parsePostalCode,
  parseSecondaryUnit,
  parseStateProvince,
  parseStreetNumber,
  parseStreetType,
};
