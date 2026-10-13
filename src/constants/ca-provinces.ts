import type { Region } from "../types/region.js";

// Canadian provinces and territories mapping

/**
 * Every Canadian province and territory by its English name in lower case, to its two-letter code.
 *
 * @example
 * ```ts
 * import { CA_PROVINCE_NAMES_EN } from "@johnmorrisdotca/address-plus";
 *
 * console.log(CA_PROVINCE_NAMES_EN["british columbia"]);
 * // → "BC"
 * ```
 */
const CA_PROVINCE_NAMES_EN: Record<string, string> = {
  alberta: "AB",
  "british columbia": "BC",
  manitoba: "MB",
  "new brunswick": "NB",
  "newfoundland and labrador": "NL",
  "northwest territories": "NT",
  "nova scotia": "NS",
  nunavut: "NU",
  ontario: "ON",
  "prince edward island": "PE",
  quebec: "QC",
  saskatchewan: "SK",
  yukon: "YT",
};

/**
 * Every Canadian province and territory by its French name in lower case, to its two-letter code.
 *
 * @example
 * ```ts
 * import { CA_PROVINCE_NAMES_FR } from "@johnmorrisdotca/address-plus";
 *
 * console.log(CA_PROVINCE_NAMES_FR["colombie-britannique"]);
 * // → "BC"
 * ```
 */
const CA_PROVINCE_NAMES_FR: Record<string, string> = {
  alberta: "AB", // Same in French
  "colombie-britannique": "BC",
  manitoba: "MB", // Same in French
  "nouveau-brunswick": "NB",
  "terre-neuve-et-labrador": "NL",
  "territoires du nord-ouest": "NT",
  "nouvelle-écosse": "NS",
  nunavut: "NU", // Same in French (Inuktitut origin)
  ontario: "ON", // Same in French
  "île-du-prince-édouard": "PE",
  québec: "QC",
  saskatchewan: "SK", // Same in French (Cree origin)
  yukon: "YT", // Same in French
};

/**
 * Every Canadian province and territory by its English or French name, to its code.
 *
 * @example
 * ```ts
 * import { CA_PROVINCE_NAMES } from "@johnmorrisdotca/address-plus";
 *
 * console.log(CA_PROVINCE_NAMES["québec"]);
 * // → "QC"
 * ```
 */
const CA_PROVINCE_NAMES: Record<string, string> = {
  ...CA_PROVINCE_NAMES_EN,
  ...CA_PROVINCE_NAMES_FR,
};

/**
 * Other ways Canadian provinces are written (old and informal abbreviations such as `PQ`, `Que.`, `Nfld.`), in lower
 * case, to their codes.
 *
 * @example
 * ```ts
 * import { CA_PROVINCE_ALTERNATIVES } from "@johnmorrisdotca/address-plus";
 *
 * console.log(CA_PROVINCE_ALTERNATIVES["pq"]);
 * // → "QC"
 * ```
 */
const CA_PROVINCE_ALTERNATIVES: Record<string, string> = {
  // Alberta
  alb: "AB",
  alta: "AB",

  // Manitoba
  man: "MB",

  // Newfoundland and Labrador (NF and Nfld. are the codes used before 2002)
  newfoundland: "NL",
  nf: "NL",
  nfld: "NL",
  labrador: "NL",
  "terre-neuve": "NL",
  "terre neuve": "NL",
  "terre neuve et labrador": "NL",
  tnl: "NL",

  // Northwest Territories
  northwest: "NT",
  territories: "NT",
  territoires: "NT",
  nwt: "NT",
  "tn-o": "NT",

  // Nunavut
  nvt: "NU",

  // Ontario
  ont: "ON",

  // Prince Edward Island
  pei: "PE",
  "prince edward": "PE",
  "ile-du-prince-édouard": "PE", // without circumflex
  "île du prince édouard": "PE", // without hyphens
  "ile du prince édouard": "PE", // without circumflex or hyphens
  îpé: "PE",

  // Quebec (PQ was its code before 1990; Que. is the old abbreviation)
  pq: "QC",
  que: "QC",

  // Saskatchewan
  sask: "SK",
};

/**
 * Every name and other spelling of a Canadian province, to its code: the names and the alternatives together.
 *
 * @example
 * ```ts
 * import { CA_PROVINCES } from "@johnmorrisdotca/address-plus";
 *
 * console.log(CA_PROVINCES["nfld"]);
 * // → "NL"
 * ```
 */
const CA_PROVINCES: Record<string, string> = {
  ...CA_PROVINCE_NAMES,
  ...CA_PROVINCE_ALTERNATIVES,
};

/**
 * Every name and other spelling of a Canadian province or territory as a `Region` object, for fuzzy matching by
 * `normalizeRegion`.
 *
 * @example
 * ```ts
 * import { CA_REGIONS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(CA_REGIONS.filter((region) => region.abbr === "QC").map((region) => region.name));
 * // → ["quebec","québec","pq","que"]
 * ```
 */
const CA_REGIONS: Region[] = Object.entries(CA_PROVINCES).map(([name, abbr]) => ({
  abbr,
  country: "CA",
  name,
}));

/**
 * Each Canadian province's code in lower case, to its English name in lower case.
 *
 * @example
 * ```ts
 * import { PROVINCE_EXPANSIONS_EN } from "@johnmorrisdotca/address-plus";
 *
 * console.log(PROVINCE_EXPANSIONS_EN["qc"]);
 * // → "quebec"
 * ```
 */
const PROVINCE_EXPANSIONS_EN: Record<string, string> = Object.fromEntries(
  Object.entries(CA_PROVINCE_NAMES_EN).map(([name, abbr]) => [abbr.toLowerCase(), name]),
);

/**
 * Each Canadian province's code in lower case, to its French name in lower case.
 *
 * @example
 * ```ts
 * import { PROVINCE_EXPANSIONS_FR } from "@johnmorrisdotca/address-plus";
 *
 * console.log(PROVINCE_EXPANSIONS_FR["qc"]);
 * // → "québec"
 * ```
 */
const PROVINCE_EXPANSIONS_FR: Record<string, string> = Object.fromEntries(
  Object.entries(CA_PROVINCE_NAMES_FR).map(([name, abbr]) => [abbr.toLowerCase(), name]),
);

/**
 * Each Canadian province's code in lower case, to its name in lower case: English by default, the French names under
 * their own keys.
 *
 * @example
 * ```ts
 * import { PROVINCE_EXPANSIONS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(PROVINCE_EXPANSIONS["on"]);
 * // → "ontario"
 * ```
 */
const PROVINCE_EXPANSIONS: Record<string, string> = {
  ...PROVINCE_EXPANSIONS_EN,
  // Add French alternatives with _fr suffix for explicit French usage
  ...Object.fromEntries(Object.entries(PROVINCE_EXPANSIONS_FR).map(([abbr, name]) => [`${abbr}_fr`, name])),
};

export {
  CA_PROVINCE_ALTERNATIVES,
  CA_PROVINCE_NAMES,
  CA_PROVINCE_NAMES_EN,
  CA_PROVINCE_NAMES_FR,
  CA_PROVINCES,
  CA_REGIONS,
  PROVINCE_EXPANSIONS,
  PROVINCE_EXPANSIONS_EN,
  PROVINCE_EXPANSIONS_FR,
};
