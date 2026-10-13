// Regex patterns for parser functions
// These patterns are used by specific parsers and should not be confused with base patterns

/**
 * The regular expressions the PO box parser uses: the box itself, a station after it, a box number first, and a
 * trailing comma.
 *
 * @example
 * ```ts
 * import { PO_BOX_PATTERNS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(PO_BOX_PATTERNS.US_PO_BOX.exec("PO Box 123, Springfield, IL 62701")?.slice(1));
 * // → ["123","Springfield","IL","62701"]
 * ```
 */
const PO_BOX_PATTERNS = {
  // US PO Box strict pattern: indicator + number + city + state + zip
  US_PO_BOX:
    /^(?:p\.?\s*o\.?\s*box|post\s*office\s*box|pobox|po\s*box)\s*(\d+)\s*,?\s*([^,]+?)\s*,?\s*([A-Za-z]{2})\s*(\d{5}(?:[-\s]?\d{4})?)?\s*$/i,

  // Station/Succursale/RPO/RR pattern for Canadian addresses
  STATION_PATTERN:
    /^(station|stn\.?|succ(?:\.|ursale)?|rpo|rr|r\.r\.)\s+([A-Za-z0-9]+(?:\s*[A-Za-z0-9-]+)*?)(?=\s+[A-Z][a-z]|\s*,|$)/i,

  // Leading box number pattern
  LEADING_BOX_NUMBER: /^([0-9A-Za-z-]+)\b[,\s]*/,

  // Trailing comma cleanup
  TRAILING_COMMA: /,\s*$/,
} as const;

/**
 * The regular expressions and pattern builders the intersection parser uses to find the city and each street with its
 * type.
 *
 * @example
 * ```ts
 * import { INTERSECTION_PATTERNS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(INTERSECTION_PATTERNS.CITY_WITH_COMMA.exec("Pine St, Tacoma")?.[1]);
 * // → "Tacoma"
 * ```
 */
const INTERSECTION_PATTERNS = {
  // Basic city pattern for intersection parsing
  BASIC_CITY: /\s+([A-Za-z\s]{1,30})\s*$/,

  // City with comma pattern
  CITY_WITH_COMMA: /,\s+([A-Za-z\s]+)$/,

  // Street pattern with directional prefix and type
  STREET_WITH_TYPE: (directionalPattern: string, streetTypePattern: string) =>
    new RegExp(`^(?:(${directionalPattern})\\s+)?([^\\s]+(?:\\s+[^\\s]+)*)\\s+(${streetTypePattern})\\b`, "i"),

  // Simple street pattern with optional directional
  STREET_SIMPLE: (directionalPattern: string) => new RegExp(`^(?:(${directionalPattern})\\s+)?(.+)$`, "i"),
} as const;

/**
 * Pattern builders the parsers share: a ZIP, a state or a postal code at the end of a text, and a city before a state.
 * Each takes the source of a pattern wrapped in one pair of parentheses or anchors, which it strips.
 *
 * @example
 * ```ts
 * import { COMMON_PARSER_PATTERNS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(COMMON_PARSER_PATTERNS.ZIP_AT_END("(\\d{5})").exec("Tacoma WA 98402")?.[1]);
 * // → "98402"
 * ```
 */
const COMMON_PARSER_PATTERNS = {
  // ZIP/Postal at end of string
  ZIP_AT_END: (zipPattern: string) => new RegExp(`\\s+(${zipPattern.slice(1, -1)})\\s*$`),

  // State abbreviation at end of string
  STATE_AT_END: (statePattern: string) => new RegExp(`\\s+(${statePattern.slice(1, -1)})\\s*$`, "i"),

  // City and state pattern combined
  CITY_STATE_PATTERN: (stateAbbrevPattern: string) =>
    new RegExp(`^(.+?)\\s+(${stateAbbrevPattern.slice(1, -1)})\\s*$`, "i"),

  // Postal code at end with international pattern
  POSTAL_AT_END: (postalPattern: string) => new RegExp(postalPattern + "$", "i"),
} as const;

export { COMMON_PARSER_PATTERNS, INTERSECTION_PATTERNS, PO_BOX_PATTERNS };
