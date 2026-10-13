// Canadian postal code to province mapping
// Based on Canada Post guidelines: https://www.canadapost-postescanada.ca/cpc/en/support/articles/addressing-guidelines/postal-codes.page

import { normalizeRegion } from "../utils/normalize-region";

/**
 * Each first letter of a Canadian postal code, to the province or territory it is assigned to. X is shared by the
 * Northwest Territories and Nunavut and is resolved with `TERRITORY_POSTAL_RANGES`.
 *
 * @example
 * ```ts
 * import { POSTAL_CODE_TO_PROVINCE } from "@johnmorrisdotca/address-plus";
 *
 * console.log(POSTAL_CODE_TO_PROVINCE["V"]);
 * // → "BC"
 * ```
 */
const POSTAL_CODE_TO_PROVINCE: Record<string, string> = {
  // Newfoundland and Labrador
  A: "NL",

  // Nova Scotia
  B: "NS",

  // Prince Edward Island
  C: "PE",

  // New Brunswick
  E: "NB",

  // Quebec (Eastern)
  G: "QC",
  H: "QC",
  J: "QC",

  // Ontario (Eastern)
  K: "ON",
  L: "ON",
  M: "ON", // Toronto area
  N: "ON",
  P: "ON",

  // Manitoba
  R: "MB",

  // Saskatchewan
  S: "SK",

  // Alberta
  T: "AB",

  // British Columbia
  V: "BC",

  // Northwest Territories, Nunavut, Yukon
  X: "NT", // Also covers NU and YT - more specific mapping needed
  Y: "YT",
};

/**
 * The patterns that tell the Northwest Territories' X codes from Nunavut's, by their first three characters.
 *
 * @example
 * ```ts
 * import { TERRITORY_POSTAL_RANGES } from "@johnmorrisdotca/address-plus";
 *
 * console.log(TERRITORY_POSTAL_RANGES.find((range) => range.pattern.test("X0A"))?.province);
 * // → "NU"
 * ```
 */
const TERRITORY_POSTAL_RANGES: Array<{ pattern: RegExp; province: string }> = [
  // Yukon Territory - Y prefix
  { pattern: /^Y/, province: "YT" },

  // Nunavut - X0A, X0B, X0C ranges
  { pattern: /^X0[ABC]/, province: "NU" },

  // Northwest Territories - X0E, X0G, X1A ranges
  { pattern: /^X[01]/, province: "NT" },
];

/**
 * The province or territory a Canadian postal code is in, from its first letter, and for the X codes of the north, its
 * first three characters.
 *
 * @param postalCode - The postal code, with or without its space.
 * @returns The two-letter code, or `null` for a code that is not Canadian.
 * @example
 * ```ts
 * import { getProvinceFromPostalCode } from "@johnmorrisdotca/address-plus";
 *
 * console.log(getProvinceFromPostalCode("H3G 1P1"));
 * // → "QC"
 * ```
 */
function getProvinceFromPostalCode(postalCode: string): string | null {
  if (!postalCode) return null;

  // Clean and normalize postal code
  const cleaned = postalCode.replace(/\s+/g, "").toUpperCase();

  // Validate Canadian postal code format (Letter-Digit-Letter Digit-Letter-Digit)
  if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleaned)) {
    return null;
  }

  const firstLetter = cleaned.charAt(0);

  // Check territory ranges first (for X prefix codes)
  if (firstLetter === "X" || firstLetter === "Y") {
    for (const range of TERRITORY_POSTAL_RANGES) {
      if (range.pattern.test(cleaned)) {
        return range.province;
      }
    }
  }

  // Use standard first-letter mapping
  const province = POSTAL_CODE_TO_PROVINCE[firstLetter];
  return province || null;
}

/**
 * The first three characters of each territory's postal codes, since the territories share a first letter.
 *
 * @example
 * ```ts
 * import { TERRITORY_POSTAL_PREFIXES } from "@johnmorrisdotca/address-plus";
 *
 * console.log(TERRITORY_POSTAL_PREFIXES["NU"]);
 * // → ["X0A","X0B","X0C"]
 * ```
 */
const TERRITORY_POSTAL_PREFIXES: Record<string, string[]> = {
  NU: ["X0A", "X0B", "X0C"],
  NT: ["X0E", "X0G", "X1A"],
  YT: ["Y"],
};

/**
 * The postal code prefixes a province or territory uses, the reverse of `getProvinceFromPostalCode`. Every code
 * starting with one of them belongs to that province.
 *
 * @param province - The province or territory's two-letter code.
 * @returns The prefixes, a letter or, for the territories, three characters; an empty array for an unknown code.
 * @example
 * ```ts
 * import { getPostalPrefixesForProvince } from "@johnmorrisdotca/address-plus";
 *
 * console.log(getPostalPrefixesForProvince("NU"));
 * // → ["X0A","X0B","X0C"]
 * ```
 */
function getPostalPrefixesForProvince(province: string): string[] {
  // A name ("Quebec", "Québec") is resolved to its code first; a code passes through unchanged.
  const region = normalizeRegion(province ?? "");
  const code = region?.country === "CA" ? region.abbr : (province ?? "").trim().toUpperCase();
  const territory = TERRITORY_POSTAL_PREFIXES[code];
  if (territory) return [...territory];
  return Object.entries(POSTAL_CODE_TO_PROVINCE)
    .filter(([letter, owner]) => owner === code && letter !== "X")
    .map(([letter]) => letter);
}

export {
  getPostalPrefixesForProvince,
  getProvinceFromPostalCode,
  POSTAL_CODE_TO_PROVINCE,
  TERRITORY_POSTAL_PREFIXES,
  TERRITORY_POSTAL_RANGES,
};
