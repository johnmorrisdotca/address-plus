// Directional abbreviations for US and Canadian addresses

/**
 * Each directional word, in English or French, in lower case, to its abbreviation (`northwest` and `nord-ouest` to
 * `NW` and `NO`).
 *
 * @example
 * ```ts
 * import { DIRECTIONAL_MAP } from "@johnmorrisdotca/address-plus";
 *
 * console.log(DIRECTIONAL_MAP["northwest"]);
 * // → "NW"
 * ```
 */
const DIRECTIONAL_MAP: Record<string, string> = {
  // English
  east: "E",
  north: "N",
  northeast: "NE",
  northwest: "NW",
  south: "S",
  southeast: "SE",
  southwest: "SW",
  west: "W",

  // Short forms
  e: "E",
  n: "N",
  ne: "NE",
  nw: "NW",
  s: "S",
  se: "SE",
  sw: "SW",
  w: "W",

  // Dotted forms (common in formal addresses)
  "e.": "E",
  "n.": "N",
  "n.e.": "NE",
  "ne.": "NE",
  "n.w.": "NW",
  "nw.": "NW",
  "s.": "S",
  "s.e.": "SE",
  "se.": "SE",
  "s.w.": "SW",
  "sw.": "SW",
  "w.": "W",
  // Canadian dotted forms sometimes use uppercase with periods
  "E.": "E",
  "N.": "N",
  "S.": "S",
  "W.": "W",
  "S.E.": "SE",
  "S.W.": "SW",
  "N.E.": "NE",
  "N.W.": "NW",

  // French (for Canada)
  est: "E",
  nord: "N",
  "nord-est": "NE",
  "nord-ouest": "NO", // Canada Post's French symbols: NO and SO, not NW and SW
  // For French Canadian usage, use "O" (Ouest)
  ouest: "O",
  o: "O", // French abbreviation for ouest
  sud: "S",
  "sud-est": "SE",
  "sud-ouest": "SO",
  // French dotted forms (different from English)
  "o.": "O", // Ouest
  // Variants with hyphens and dots like "N.-O." (Nord-Ouest) and "S.-E."
  "n.-o.": "NO",
  "n.-e.": "NE",
  "s.-o.": "SO",
  "s.-e.": "SE",
  "N.-O.": "NO",
  "N.-E.": "NE",
  "S.-O.": "SO",
  "S.-E.": "SE",
};

/**
 * Each directional abbreviation in lower case, to the word in full.
 *
 * @example
 * ```ts
 * import { DIRECTION_EXPANSIONS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(DIRECTION_EXPANSIONS["ne"]);
 * // → "Northeast"
 * ```
 */
const DIRECTION_EXPANSIONS: Record<string, string> = {
  n: "North",
  s: "South",
  e: "East",
  w: "West",
  ne: "Northeast",
  nw: "Northwest",
  se: "Southeast",
  sw: "Southwest",
  o: "Ouest", // French
};

export { DIRECTIONAL_MAP, DIRECTION_EXPANSIONS };
