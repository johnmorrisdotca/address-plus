import type { Region } from "../types/region.js";

import { CA_PROVINCE_ALTERNATIVES, CA_PROVINCE_NAMES } from "./ca-provinces.js";

// US States and territories mapping

/**
 * Every US state, DC and territory by its name in lower case, to its two-letter code.
 *
 * @example
 * ```ts
 * import { US_STATE_NAMES } from "@johnmorrisdotca/address-plus";
 *
 * console.log(US_STATE_NAMES["new york"]);
 * // → "NY"
 * ```
 */
const US_STATE_NAMES: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  "american samoa": "AS",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  "district of columbia": "DC",
  florida: "FL",
  georgia: "GA",
  guam: "GU",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  "northern mariana islands": "MP",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "puerto rico": "PR",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  "virgin islands": "VI",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
};

/**
 * Other ways US states are written (shortened forms, old abbreviations, `D.C.`), in lower case, to their codes.
 *
 * @example
 * ```ts
 * import { US_STATE_ALTERNATIVES } from "@johnmorrisdotca/address-plus";
 *
 * console.log(US_STATE_ALTERNATIVES["calif"]);
 * // → "CA"
 * ```
 */
const US_STATE_ALTERNATIVES: Record<string, string> = {
  // Alabama
  ala: "AL",
  bama: "AL",

  // Arizona
  ariz: "AZ",

  // Arkansas
  ark: "AR",

  // California
  cal: "CA",
  cali: "CA",
  calif: "CA",

  // Colorado
  colo: "CO",

  // Connecticut
  conn: "CT",

  // Delaware
  del: "DE",

  // District of Columbia
  dc: "DC",

  // Florida
  fla: "FL",

  // Illinois
  ill: "IL",

  // Indiana
  ind: "IN",

  // Kansas
  kan: "KS",
  kans: "KS",

  // Kentucky
  ky: "KY",
  kent: "KY",

  // Louisiana
  la: "LA",
  lou: "LA",

  // Massachusetts
  mass: "MA",

  // Michigan
  mich: "MI",

  // Minnesota
  minn: "MN",

  // Mississippi
  miss: "MS",

  // Missouri
  mo: "MO",

  // Montana
  mont: "MT",

  // Nebraska
  neb: "NE",
  nebr: "NE",

  // Nevada
  nev: "NV",

  // New Hampshire
  "new hamp": "NH",
  "new hampsh": "NH",

  // New Jersey
  "new jers": "NJ",

  // New Mexico
  "new mex": "NM",
  "new mexic": "NM",

  // North Carolina
  "n carolina": "NC",
  "north car": "NC",

  // North Dakota
  "n dakota": "ND",
  "north dak": "ND",

  // Oklahoma
  okla: "OK",

  // Oregon
  ore: "OR",
  oreg: "OR",

  // Pennsylvania
  penn: "PA",
  pa: "PA",
  penna: "PA",
  pennsyl: "PA",

  // Rhode Island
  "rhode isl": "RI",

  // South Carolina
  "s carolina": "SC",
  "south car": "SC",

  // South Dakota
  "s dakota": "SD",
  "south dak": "SD",

  // Tennessee
  tenn: "TN",

  // Texas
  tex: "TX",

  // Vermont
  vt: "VT",

  // Virginia
  va: "VA",
  virg: "VA",

  // Washington
  wash: "WA",

  // West Virginia
  "west va": "WV",
  "west virg": "WV",

  // Wisconsin
  wis: "WI",
  wisc: "WI",

  // Wyoming
  wyo: "WY",
};

/**
 * Every name and other spelling of a US state in lower case, to its code: `US_STATE_NAMES` and `US_STATE_ALTERNATIVES`
 * together.
 *
 * @example
 * ```ts
 * import { US_STATES } from "@johnmorrisdotca/address-plus";
 *
 * console.log(US_STATES["mass"]);
 * // → "MA"
 * ```
 */
const US_STATES: Record<string, string> = {
  ...US_STATE_NAMES,
  ...US_STATE_ALTERNATIVES,
};

/**
 * Every name and other spelling of a US state, DC or territory as a `Region` object, for fuzzy matching by
 * `normalizeRegion`.
 *
 * @example
 * ```ts
 * import { US_REGIONS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(US_REGIONS.find((region) => region.abbr === "WA")?.name);
 * // → "washington"
 * ```
 */
const US_REGIONS: Region[] = Object.entries(US_STATES).map(([name, abbr]) => ({
  abbr,
  country: "US",
  name,
}));

/**
 * Each US state's code in lower case, to its name in lower case: the reverse of `US_STATE_NAMES`.
 *
 * @example
 * ```ts
 * import { US_STATE_EXPANSIONS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(US_STATE_EXPANSIONS["wa"]);
 * // → "washington"
 * ```
 */
const US_STATE_EXPANSIONS: Record<string, string> = Object.fromEntries(
  Object.entries(US_STATE_NAMES).map(([name, abbr]) => [abbr.toLowerCase(), name]),
);

/**
 * The code of a US state or Canadian province written in full, in lower case.
 *
 * @param stateName - The name in full, in English or French, any letter case.
 * @returns The code in lower case, or `undefined` for a name that is not a state or province.
 * @example
 * ```ts
 * import { normalizeStateProvinceName } from "@johnmorrisdotca/address-plus";
 *
 * console.log(normalizeStateProvinceName("Nova Scotia"));
 * // → "ns"
 * ```
 */
function normalizeStateProvinceName(stateName: string): string | undefined {
  const normalizedInput = stateName.toLowerCase().replace(/\./g, "").trim();

  // Check US states first (convert to lowercase to match existing usage)
  const usState = US_STATES[normalizedInput];
  if (usState) {
    return usState.toLowerCase();
  }

  // Check Canadian provinces (convert to lowercase to match existing usage)
  const caProvince = CA_PROVINCE_NAMES[normalizedInput] || CA_PROVINCE_ALTERNATIVES[normalizedInput];
  if (caProvince) {
    return caProvince.toLowerCase();
  }

  return undefined;
}

export {
  normalizeStateProvinceName,
  US_REGIONS,
  US_STATE_ALTERNATIVES,
  US_STATE_EXPANSIONS,
  US_STATE_NAMES,
  US_STATES,
};
