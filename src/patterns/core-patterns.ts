// Core validation and formatting patterns used throughout address parsing

/**
 * Small regular expressions the validators share: letters, digits, a house number at the start, and the like.
 *
 * @example
 * ```ts
 * import { VALIDATION_PATTERNS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(VALIDATION_PATTERNS.STARTS_WITH_NUMBER.test("123 Main St"));
 * // → true
 * ```
 */
const VALIDATION_PATTERNS = {
  HAS_LETTERS: /[a-zA-Z]/,
  ALPHANUMERIC: /[a-zA-Z0-9]/g,
  HAS_DIGITS: /\d/,
  HOUSE_NUMBER_START: /^(\d+|\w\d+\w\d+)\b/,
  STARTS_WITH_NUMBER: /^\s*(\d|\w\d+\w\d+)/,
  WHITESPACE_SPLIT: /\s+/,
  TITLE_CASE: /^[A-Z]/,
  NUMERIC_ONLY: /^\d+$/,
  NON_WORD: /[^\w]/g,
  REGEX_ESCAPE: /[.*+?^${}()|[\]\\]/g,
  NORMALIZE_SPACES: /\s+/g,
  PO_BOX_NORMALIZE: /^p\.o\.\s*box$/i,
} as const;

/**
 * General delivery written alone or before a city.
 *
 * @example
 * ```ts
 * import { GENERAL_DELIVERY_PATTERNS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(GENERAL_DELIVERY_PATTERNS.STANDARD.test("General Delivery"));
 * // → true
 * ```
 */
const GENERAL_DELIVERY_PATTERNS = {
  // General delivery in English, Canada Post's GD and its French poste restante, with an optional station.
  STANDARD: /^(?:general\s+delivery|gd|poste\s+restante)(?:\s+(?:stn\.?|station|succ\.?|succursale)\s+\S.*)?$/i,
  WITH_CITY: /^\s*general\s+delivery\s+([^,]+?)\s+([A-Za-z]{2})\b/i,
} as const;

/**
 * The shape of something that could be a ZIP code.
 *
 * @example
 * ```ts
 * import { ZIP_VALIDATION_PATTERNS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(ZIP_VALIDATION_PATTERNS.POTENTIAL_ZIP.test("98101"));
 * // → true
 * ```
 */
const ZIP_VALIDATION_PATTERNS = {
  POTENTIAL_ZIP: /\b([A-Z0-9]{3,9}(?:[-\s][A-Z0-9]{1,4})?)\s*$/i,
} as const;

/**
 * The ways a facility's name is set off from an address: in parentheses, before a delimiter, or as a trailing island.
 *
 * @example
 * ```ts
 * import { FACILITY_DELIMITER_PATTERNS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(FACILITY_DELIMITER_PATTERNS.PARENTHETICAL.test("(City Hall)"));
 * // → true
 * ```
 */
const FACILITY_DELIMITER_PATTERNS = {
  PARENTHETICAL: /^(.*?)\s*\(([^)]+)\)\s*$/,
  DELIMITED: /^(.*?)\s*([:;|\u2013\u2014-])\s*(.+)$/,
  TRAILING_ISLAND: /^(.*?)(\s+)(\b.+\s+(?:Island|Isl\.?|Is\.?)\b.*)$/i,
} as const;

/**
 * The words for an island, for addresses on one (`Island`, `Isle`, `Île`).
 *
 * @example
 * ```ts
 * import { ISLAND_TYPE_PATTERN } from "@johnmorrisdotca/address-plus";
 *
 * console.log(ISLAND_TYPE_PATTERN.test("Island"));
 * // → true
 * ```
 */
const ISLAND_TYPE_PATTERN = /^(island|is\.?|isl\.?|isle\.?|ils\.?)$/i;

/**
 * Small words (`of`, `the`, `and`) that may be in lower case inside a facility's name written in title case.
 *
 * @example
 * ```ts
 * import { CONNECTOR_WORDS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(CONNECTOR_WORDS.has("of"));
 * // → true
 * ```
 */
const CONNECTOR_WORDS = new Set([
  "of",
  "the",
  "and",
  "at",
  "on",
  "in",
  "for",
  "to",
  "from",
  "by",
  "with",
  "without",
  "de",
  "la",
  "le",
  "les",
  "du",
  "des",
  "l'",
  "d'",
  "o'",
  "y'",
]);

/**
 * Street names common enough that they must not be taken as part of a city's name.
 *
 * @example
 * ```ts
 * import { COMMON_STREET_NAMES_PATTERN } from "@johnmorrisdotca/address-plus";
 *
 * console.log(COMMON_STREET_NAMES_PATTERN.test("Main"));
 * // → true
 * ```
 */
const COMMON_STREET_NAMES_PATTERN = new RegExp(
  "^(" +
    "broadway|main|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|" +
    "market|church|park|oak|elm|pine|maple|cedar|" +
    "washington|lincoln|madison|jefferson|jackson|franklin|harrison|" +
    "central|mill|spring|hill|river|lake|green|" +
    "north|south|east|west" +
    ")$",
  "i",
);

export {
  COMMON_STREET_NAMES_PATTERN,
  CONNECTOR_WORDS,
  FACILITY_DELIMITER_PATTERNS,
  GENERAL_DELIVERY_PATTERNS,
  ISLAND_TYPE_PATTERN,
  VALIDATION_PATTERNS,
  ZIP_VALIDATION_PATTERNS,
};
