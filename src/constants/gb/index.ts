// The United Kingdom's postcodes: the grammar Royal Mail gives them, the areas with the town each is named for and
// the nation it delivers to, the districts Code-Point Open lists for Great Britain, and lookups over them.

import type { UKNationCode, UKPostcode } from "../../types/united-kingdom";
import { GB_AREA_NATIONS, GB_DISTRICT_NATIONS, GB_POSTCODE_DISTRICTS } from "./districts.data";
import { GB_NATIONS } from "./nations.data";

/**
 * A postcode area: the town Royal Mail names it for, the country it delivers to (`GB`, or `JE`, `GY` and `IM` for the
 * Crown Dependencies), and for the United Kingdom the nation, absent for an area that is not a place (`BF`, `BX`).
 *
 * @example
 * ```ts
 * import { GB_POSTCODE_AREAS } from "@johnmorrisdotca/address-plus/gb";
 * import type { UKPostcodeArea } from "@johnmorrisdotca/address-plus/gb";
 *
 * console.log(GB_POSTCODE_AREAS.BT);
 * // → {"name":"Northern Ireland","country":"GB","nation":"NIR"}
 * ```
 */
interface UKPostcodeArea {
  name: string;
  country: "GB" | "GY" | "IM" | "JE";
  nation?: UKNationCode;
}

// The areas and the towns they are named for, as Royal Mail lists them (through the UPU's addressing sheet for the
// United Kingdom); the nation of each area in Great Britain is read from Code-Point Open when the tables are made.
const AREA_NAMES: Readonly<Record<string, string>> = {
  AB: "Aberdeen",
  AL: "St Albans",
  B: "Birmingham",
  BA: "Bath",
  BB: "Blackburn",
  BD: "Bradford",
  BH: "Bournemouth",
  BL: "Bolton",
  BN: "Brighton",
  BR: "Bromley",
  BS: "Bristol",
  BT: "Northern Ireland",
  CA: "Carlisle",
  CB: "Cambridge",
  CF: "Cardiff",
  CH: "Chester",
  CM: "Chelmsford",
  CO: "Colchester",
  CR: "Croydon",
  CT: "Canterbury",
  CV: "Coventry",
  CW: "Crewe",
  DA: "Dartford",
  DD: "Dundee",
  DE: "Derby",
  DG: "Dumfries",
  DH: "Durham",
  DL: "Darlington",
  DN: "Doncaster",
  DT: "Dorchester",
  DY: "Dudley",
  E: "London E",
  EC: "London EC",
  EH: "Edinburgh",
  EN: "Enfield",
  EX: "Exeter",
  FK: "Falkirk",
  FY: "Blackpool",
  G: "Glasgow",
  GL: "Gloucester",
  GU: "Guildford",
  GY: "Guernsey",
  HA: "Harrow",
  HD: "Huddersfield",
  HG: "Harrogate",
  HP: "Hemel Hempstead",
  HR: "Hereford",
  HS: "Outer Hebrides",
  HU: "Hull",
  HX: "Halifax",
  IG: "Ilford",
  IM: "Isle of Man",
  IP: "Ipswich",
  IV: "Inverness",
  JE: "Jersey",
  KA: "Kilmarnock",
  KT: "Kingston upon Thames",
  KW: "Kirkwall",
  KY: "Kirkcaldy",
  L: "Liverpool",
  LA: "Lancaster",
  LD: "Llandrindod Wells",
  LE: "Leicester",
  LL: "Llandudno",
  LN: "Lincoln",
  LS: "Leeds",
  LU: "Luton",
  M: "Manchester",
  ME: "Medway",
  MK: "Milton Keynes",
  ML: "Motherwell",
  N: "London N",
  NE: "Newcastle upon Tyne",
  NG: "Nottingham",
  NN: "Northampton",
  NP: "Newport",
  NR: "Norwich",
  NW: "London NW",
  OL: "Oldham",
  OX: "Oxford",
  PA: "Paisley",
  PE: "Peterborough",
  PH: "Perth",
  PL: "Plymouth",
  PO: "Portsmouth",
  PR: "Preston",
  RG: "Reading",
  RH: "Redhill",
  RM: "Romford",
  S: "Sheffield",
  SA: "Swansea",
  SE: "London SE",
  SG: "Stevenage",
  SK: "Stockport",
  SL: "Slough",
  SM: "Sutton",
  SN: "Swindon",
  SO: "Southampton",
  SP: "Salisbury",
  SR: "Sunderland",
  SS: "Southend-on-Sea",
  ST: "Stoke-on-Trent",
  SW: "London SW",
  SY: "Shrewsbury",
  TA: "Taunton",
  TD: "Galashiels",
  TF: "Telford",
  TN: "Tonbridge",
  TQ: "Torquay",
  TR: "Truro",
  TS: "Cleveland",
  TW: "Twickenham",
  UB: "Southall",
  W: "London W",
  WA: "Warrington",
  WC: "London WC",
  WD: "Watford",
  WF: "Wakefield",
  WN: "Wigan",
  WR: "Worcester",
  WS: "Walsall",
  WV: "Wolverhampton",
  YO: "York",
  ZE: "Lerwick",
};

/**
 * Every postcode area Royal Mail uses: the 121 of the United Kingdom, the three Crown Dependencies (`GY`, `IM`,
 * `JE`), and the two that are not places, `BF` (the British Forces Post Office) and `BX` (addresses kept for
 * organisations wherever they are). Each with the town it is named for, its country and its nation.
 *
 * @example
 * ```ts
 * import { GB_POSTCODE_AREAS } from "@johnmorrisdotca/address-plus/gb";
 *
 * console.log([GB_POSTCODE_AREAS.CF.nation, GB_POSTCODE_AREAS.JE.country]);
 * // → ["WLS","JE"]
 * ```
 */
const GB_POSTCODE_AREAS: Readonly<Record<string, UKPostcodeArea>> = Object.fromEntries([
  ...Object.entries(AREA_NAMES).map(([area, name]): [string, UKPostcodeArea] => {
    if (area === "JE" || area === "GY" || area === "IM") return [area, { name, country: area }];
    if (area === "BT") return [area, { name, country: "GB", nation: "NIR" }];
    const nation = GB_AREA_NATIONS[area];
    if (!nation) throw new Error(`No nation for the postcode area ${area}`);
    return [area, { name, country: "GB", nation }];
  }),
  ["BF", { name: "British Forces Post Office", country: "GB" }],
  ["BX", { name: "Non-geographic", country: "GB" }],
]);

// The grammar: A9, A99, AA9, AA99, A9A or AA9A, then 9AA. The first letter is never Q, V or X; the second never I, J
// or Z; the third, in A9A, one of A to H, J, K, P, S, T, U and W; the fourth, in AA9A, one of A, B, E, H, M, N, P, R
// and V to Y; the inward letters never C, I, K, M, O or V. GIR 0AA, once Girobank's, is the one exception.
const OUTWARD =
  "(?:[A-PR-UWYZ][0-9]{1,2}|[A-PR-UWYZ][A-HK-Y][0-9]{1,2}|[A-PR-UWYZ][0-9][A-HJKPSTUW]|[A-PR-UWYZ][A-HK-Y][0-9][ABEHMNPRV-Y])";
const INWARD = "[0-9][ABD-HJLNP-UW-Z]{2}";
const STRICT_POSTCODE = new RegExp(`^(?:(${OUTWARD})\\s?(${INWARD})|(GIR)\\s?(0AA))$`, "i");
// The shape of a postcode, before its letters are checked: what the parser takes out of an address.
const POSTCODE_SHAPE = /\b([A-Z]{1,2}[0-9][A-Z0-9]?)\s*([0-9][A-Z]{2})\b/gi;

/**
 * Whether a postcode follows Royal Mail's grammar: one of the six shapes (`M2 5BQ`, `M34 4AB`, `CR0 2YR`, `DN16 9AA`,
 * `W1A 4ZZ`, `EC1A 1HQ`) with the letters each place allows, or `GIR 0AA`. Letter case and the space do not matter.
 * Whether the postcode is in use is a different question; `parseUKPostcode` and the validator also check its area
 * and district.
 *
 * @param postcode - The postcode.
 * @returns `true` when it has a postcode's shape and letters.
 * @example
 * ```ts
 * import { isValidUKPostcode } from "@johnmorrisdotca/address-plus/gb";
 *
 * console.log(["EC1A 1BB", "sw1a1aa", "GIR 0AA", "Q1 1AA", "M5V 1A1"].map(isValidUKPostcode));
 * // → [true,true,true,false,false]
 * ```
 */
function isValidUKPostcode(postcode: string): boolean {
  return STRICT_POSTCODE.test(String(postcode ?? "").trim());
}

/**
 * Takes a postcode apart: outward code, inward code, area, district and sector, and says where it delivers: the
 * country (`GB`, or `JE`, `GY` or `IM` for the Crown Dependencies) and, in the United Kingdom, the nation. A district
 * that crosses a border gives the nation most of its postcodes are in; `getNationsForUKPostcode` gives them all.
 *
 * @param postcode - The postcode, in any letter case, with or without its space.
 * @returns The parts, or `null` when it does not follow the grammar or its area is not one Royal Mail uses.
 * @example
 * ```ts
 * import { parseUKPostcode } from "@johnmorrisdotca/address-plus/gb";
 *
 * console.log(parseUKPostcode("JE2 3AB"));
 * // → {"postcode":"JE2 3AB","outward":"JE2","inward":"3AB","area":"JE","district":"JE2","sector":"JE2 3","country":"JE"}
 * ```
 */
function parseUKPostcode(postcode: string): UKPostcode | null {
  const match = STRICT_POSTCODE.exec(String(postcode ?? "").trim());
  if (!match) return null;
  const outward = (match[1] ?? match[3]).toUpperCase();
  const inward = (match[2] ?? match[4]).toUpperCase();
  const area = /^[A-Z]+/.exec(outward)![0];
  const known = outward === "GIR" ? { name: "Girobank", country: "GB" as const } : GB_POSTCODE_AREAS[area];
  if (!known) return null;
  const nation = GB_DISTRICT_NATIONS[outward]?.[0] ?? known.nation;

  return {
    postcode: `${outward} ${inward}`,
    outward,
    inward,
    area: outward === "GIR" ? "GIR" : area,
    district: outward,
    sector: `${outward} ${inward.charAt(0)}`,
    country: known.country,
    ...(nation ? { nation } : {}),
  };
}

/**
 * The nation of the United Kingdom a postcode delivers to, by its area, or by its district where the district crosses
 * the border with Wales or with Scotland (the nation most of its postcodes are in).
 *
 * @param postcode - The postcode.
 * @returns `ENG`, `NIR`, `SCT` or `WLS`; `undefined` for a postcode outside the United Kingdom, one that is not a
 * place (BFPO), or text that is not a postcode.
 * @example
 * ```ts
 * import { getNationFromUKPostcode } from "@johnmorrisdotca/address-plus/gb";
 *
 * console.log(["CH5 1AA", "BT1 1AA", "EH1 1YZ", "JE2 3AB"].map(getNationFromUKPostcode));
 * // → ["WLS","NIR","SCT",null]
 * ```
 */
function getNationFromUKPostcode(postcode: string): UKNationCode | undefined {
  return parseUKPostcode(postcode)?.nation;
}

/**
 * Every nation a postcode's district delivers to: one for most, two for the districts along the borders of Wales and
 * of Scotland (from Code-Point Open), the nation with most of the district's postcodes first.
 *
 * @param postcode - The postcode.
 * @returns The nations; an empty array outside the United Kingdom or for text that is not a postcode.
 * @example
 * ```ts
 * import { getNationsForUKPostcode } from "@johnmorrisdotca/address-plus/gb";
 *
 * console.log(getNationsForUKPostcode("SY10 7AA"));
 * // → ["ENG","WLS"]
 * ```
 */
function getNationsForUKPostcode(postcode: string): UKNationCode[] {
  const parsed = parseUKPostcode(postcode);
  if (!parsed) return [];
  const crossing = GB_DISTRICT_NATIONS[parsed.district];

  return crossing ? [...crossing] : parsed.nation ? [parsed.nation] : [];
}

// Whether an outward code is one of the districts Code-Point Open lists, or `undefined` where it lists none for the
// area (Northern Ireland, the Crown Dependencies, BFPO and BX), so the question cannot be answered.
function isKnownUKDistrict(outward: string): boolean | undefined {
  const [, area, suffix] = /^([A-Z]+)(.*)$/.exec(outward) ?? [];
  const runs = area ? GB_POSTCODE_DISTRICTS[area] : undefined;
  if (runs === undefined) return undefined;
  for (const run of runs.split(",")) {
    const [from, to] = run.split("-");
    if (to === undefined ? run === suffix : /^\d+$/.test(suffix) && +suffix >= +from && +suffix <= +to) return true;
  }

  return false;
}

/**
 * Finds a nation of the United Kingdom by its code (`SCT`, `GB-SCT`) or its name in English or Japanese.
 *
 * @param text - The code or the name.
 * @returns The nation, or `null` when nothing matches.
 * @example
 * ```ts
 * import { findUKNation } from "@johnmorrisdotca/address-plus/gb";
 *
 * console.log(findUKNation("wales")?.code);
 * // → "WLS"
 * ```
 */
function findUKNation(text: string): (typeof GB_NATIONS)[number] | null {
  const typed = String(text ?? "").trim();
  const upper = typed.toUpperCase().replace(/^GB-/, "");

  return (
    GB_NATIONS.find(
      (nation) => nation.code === upper || nation.name.toUpperCase() === upper || nation.nameJa === typed,
    ) ?? null
  );
}

export {
  findUKNation,
  GB_DISTRICT_NATIONS,
  GB_NATIONS,
  GB_POSTCODE_AREAS,
  GB_POSTCODE_DISTRICTS,
  getNationFromUKPostcode,
  getNationsForUKPostcode,
  isKnownUKDistrict,
  isValidUKPostcode,
  parseUKPostcode,
  POSTCODE_SHAPE,
};
export type { UKPostcodeArea };
