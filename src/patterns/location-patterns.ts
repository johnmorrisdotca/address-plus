// Geographic and postal code patterns for location parsing

/**
 * A US ZIP code with an optional ZIP+4.
 *
 * @example
 * ```ts
 * import { ZIP_CODE_PATTERN } from "@johnmorrisdotca/address-plus";
 *
 * console.log(ZIP_CODE_PATTERN.test("98101-1234"));
 * // → true
 * ```
 */
const ZIP_CODE_PATTERN = /^(\d{5})(?:[-\s]*(\d{4}))?$/;

/**
 * The source of `ZIP_CODE_PATTERN`, for building larger patterns.
 *
 * @example
 * ```ts
 * import { ZIP_CODE_REGEX_PATTERN } from "@johnmorrisdotca/address-plus";
 *
 * console.log(ZIP_CODE_REGEX_PATTERN.length > 0);
 * // → true
 * ```
 */
const ZIP_CODE_REGEX_PATTERN = String.raw`(\d{5}(?:[-\s]*\d{4})?)`;

/**
 * A Canadian postal code with the letters Canada Post assigns, with or without its space.
 *
 * @example
 * ```ts
 * import { CANADIAN_POSTAL_CODE_PATTERN } from "@johnmorrisdotca/address-plus";
 *
 * console.log(CANADIAN_POSTAL_CODE_PATTERN.test("M5H 2N2"));
 * // → true
 * ```
 */
const CANADIAN_POSTAL_CODE_PATTERN = /^([A-Z]\d[A-Z])[-\s]*(\d[A-Z]\d)$/i;

/**
 * A Canadian postal code of any letters, for finding one before it is checked.
 *
 * @example
 * ```ts
 * import { CANADIAN_POSTAL_LIBERAL_PATTERN } from "@johnmorrisdotca/address-plus";
 *
 * console.log(CANADIAN_POSTAL_LIBERAL_PATTERN.test("m5h2n2"));
 * // → true
 * ```
 */
const CANADIAN_POSTAL_LIBERAL_PATTERN = /([A-Z]\d[A-Z][-\s]*\d[A-Z]\d)/i;

// City name extraction patterns. A word is letters of any alphabet, with apostrophes and hyphens inside
// it (Montréal, Trois-Rivières, Coeur d'Alene's "d'Alene"), so the patterns carry the `u` flag.
const CITY_WORD = String.raw`\p{L}[\p{L}'’-]*`;
/**
 * Patterns for a city of one or more words at the end of a text, after a space, used where no comma marks it. A word
 * is letters of any alphabet, with apostrophes and hyphens inside it.
 *
 * @example
 * ```ts
 * import { CITY_PATTERNS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(CITY_PATTERNS.SINGLE_WORD_CITY.exec("Pine St Tacoma")?.[1]);
 * // → "Tacoma"
 * ```
 */
const CITY_PATTERNS = {
  BASIC_CITY: new RegExp(String.raw`\s+(${CITY_WORD}(?:\s+${CITY_WORD})?)$`, "u"),
  MULTI_WORD_CITY: new RegExp(String.raw`\s+(${CITY_WORD}(?: ${CITY_WORD})*?)(?:\s+[A-Z]{2,3})?\s*$`, "u"),
  SINGLE_WORD_CITY: new RegExp(String.raw`\s+(${CITY_WORD})$`, "u"),
  TWO_WORD_CITY: new RegExp(String.raw`\s+(${CITY_WORD}\s+${CITY_WORD})$`, "u"),
} as const;

export {
  CANADIAN_POSTAL_CODE_PATTERN,
  CANADIAN_POSTAL_LIBERAL_PATTERN,
  CITY_PATTERNS,
  ZIP_CODE_PATTERN,
  ZIP_CODE_REGEX_PATTERN,
};
