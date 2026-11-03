// The street types the formatter writes out in full.

/**
 * Each USPS street type abbreviation in lower case, to the word in full.
 *
 * @example
 * ```ts
 * import { STREET_TYPE_EXPANSIONS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(STREET_TYPE_EXPANSIONS["blvd"]);
 * // → "Boulevard"
 * ```
 */
const STREET_TYPE_EXPANSIONS: Record<string, string> = {
  ave: "Avenue",
  blvd: "Boulevard",
  cir: "Circle",
  ct: "Court",
  dr: "Drive",
  ln: "Lane",
  pl: "Place",
  rd: "Road",
  st: "Street",
  ter: "Terrace",
  trl: "Trail",
  way: "Way",
  hwy: "Highway",
  pkwy: "Parkway",
};

export { STREET_TYPE_EXPANSIONS };
