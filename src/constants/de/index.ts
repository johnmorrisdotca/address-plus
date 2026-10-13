// Germany's postcodes: the shape Deutsche Post gives them (five digits), whether GeoNames' list has one, which Land it
// is in, and lookups over the Länder.

import { unpackPostcodes } from "../../country/shared";
import type { GermanPostcode, GermanState, GermanStateCode } from "../../types/germany";
import { DE_POSTCODE_STATE_RUNS, DE_POSTCODES_PACKED } from "./postcodes.data";
import { DE_STATES } from "./states.data";

const POSTCODE_SHAPE = /^\d{5}$/;
const BASE36 = "0123456789abcdefghijklmnopqrstuvwxyz";

let known: Set<string> | undefined;
let runs: { start: number; state: GermanStateCode }[] | undefined;

// The postcodes of GeoNames' list, unpacked the first time they are asked for.
function knownPostcodes(): Set<string> {
  known ??= unpackPostcodes(DE_POSTCODES_PACKED, 5);

  return known;
}

// Where each Land's postcodes begin, unpacked the first time: a step in base 36 (a tilde and three digits from 36 on),
// then the Land's two letters.
function stateRuns(): { start: number; state: GermanStateCode }[] {
  if (runs) return runs;
  const found: { start: number; state: GermanStateCode }[] = [];
  let start = 0;
  for (let at = 0; at < DE_POSTCODE_STATE_RUNS.length;) {
    const long = DE_POSTCODE_STATE_RUNS[at] === "~";
    const digits = long ? DE_POSTCODE_STATE_RUNS.slice(at + 1, at + 4) : DE_POSTCODE_STATE_RUNS[at];
    at += long ? 4 : 1;
    start += [...digits].reduce((sum, digit) => sum * 36 + BASE36.indexOf(digit), 0);
    found.push({ start, state: DE_POSTCODE_STATE_RUNS.slice(at, at + 2) as GermanStateCode });
    at += 2;
  }
  runs = found;

  return found;
}

/**
 * Whether a postcode follows Deutsche Post's shape: five digits. Whether the postcode is in use is a different question;
 * `isKnownGermanPostcode` asks it, and the validator checks both.
 *
 * @param postcode - The postcode.
 * @returns `true` when it is five digits.
 * @example
 * ```ts
 * import { isValidGermanPostcode } from "@johnmorrisdotca/address-plus/de";
 *
 * console.log(["10115", "1011", "1011a", " 80331 "].map(isValidGermanPostcode));
 * // → [true,false,false,true]
 * ```
 */
function isValidGermanPostcode(postcode: string): boolean {
  return POSTCODE_SHAPE.test(String(postcode ?? "").trim());
}

/**
 * Whether GeoNames' list for Germany has a postcode (its places include those of large firms, whose postcodes are their
 * own). The list is GeoNames' (CC BY 4.0), not Deutsche Post's, so a postcode made since it was copied is not in it:
 * an unknown one is a warning for a validator to give, not proof that it does not exist.
 *
 * @param postcode - The postcode.
 * @returns `true` when the list has it.
 * @example
 * ```ts
 * import { isKnownGermanPostcode } from "@johnmorrisdotca/address-plus/de";
 *
 * console.log(["10115", "80331", "00000", "99999"].map(isKnownGermanPostcode));
 * // → [true,true,false,false]
 * ```
 */
function isKnownGermanPostcode(postcode: string): boolean {
  return isValidGermanPostcode(postcode) && knownPostcodes().has(String(postcode).trim());
}

/**
 * Takes a postcode apart: the Land it is in, from GeoNames' list (a postcode with places in two Länder takes the one
 * most are in), and whether the list has it.
 *
 * @param postcode - The postcode, with or without spaces.
 * @returns The parts, or `null` when it is not five digits.
 * @example
 * ```ts
 * import { parseGermanPostcode } from "@johnmorrisdotca/address-plus/de";
 *
 * console.log(parseGermanPostcode("80331"));
 * // → {"postcode":"80331","state":"BY","known":true}
 * ```
 */
function parseGermanPostcode(postcode: string): GermanPostcode | null {
  const written = String(postcode ?? "").replace(/\s+/g, "");
  if (!POSTCODE_SHAPE.test(written)) return null;
  const isKnown = knownPostcodes().has(written);
  let state: GermanStateCode | undefined;
  if (isKnown) {
    const number = Number(written);
    for (const run of stateRuns()) {
      if (run.start > number) break;
      state = run.state;
    }
  }

  return { postcode: written, ...(state ? { state } : {}), known: isKnown };
}

/**
 * The Land a postcode is in, by its code: `BY` for 80331, `BE` for 10115.
 *
 * @param postcode - The postcode.
 * @returns The Land's code; `undefined` for a postcode GeoNames' list does not have, or text that is not a postcode.
 * @example
 * ```ts
 * import { getStateFromGermanPostcode } from "@johnmorrisdotca/address-plus/de";
 *
 * console.log(["80331", "10115", "20095", "00000"].map(getStateFromGermanPostcode));
 * // → ["BY","BE","HH",null]
 * ```
 */
function getStateFromGermanPostcode(postcode: string): GermanStateCode | undefined {
  return parseGermanPostcode(postcode)?.state;
}

/**
 * Finds a Land of Germany by its code (`BY`, `DE-BY`) or its name in English, German or Japanese, without regard to
 * letter case or umlauts written as `ae`, `oe`, `ue`.
 *
 * @param text - The code or the name.
 * @returns The Land, or `null` when nothing matches.
 * @example
 * ```ts
 * import { findGermanState } from "@johnmorrisdotca/address-plus/de";
 *
 * console.log([findGermanState("Bayern")?.code, findGermanState("thueringen")?.code, findGermanState("Lower Saxony")?.code]);
 * // → ["BY","TH","NI"]
 * ```
 */
function findGermanState(text: string): GermanState | null {
  const typed = String(text ?? "").trim();
  const upper = foldedName(typed).replace(/^DE /, "");

  return (
    DE_STATES.find(
      (state) =>
        state.code === upper ||
        foldedName(state.name) === upper ||
        foldedName(GERMAN_NAMES[state.code]) === upper ||
        state.nameJa === typed,
    ) ?? null
  );
}

// The Länder as Germans write them: the English names differ from them for six.
const GERMAN_NAMES: Readonly<Record<GermanStateCode, string>> = {
  BB: "Brandenburg",
  BE: "Berlin",
  BW: "Baden-Württemberg",
  BY: "Bayern",
  HB: "Bremen",
  HE: "Hessen",
  HH: "Hamburg",
  MV: "Mecklenburg-Vorpommern",
  NI: "Niedersachsen",
  NW: "Nordrhein-Westfalen",
  RP: "Rheinland-Pfalz",
  SH: "Schleswig-Holstein",
  SL: "Saarland",
  SN: "Sachsen",
  ST: "Sachsen-Anhalt",
  TH: "Thüringen",
};

// A name in capitals, with the umlauts and ß written out (ä as AE, ö as OE, ü as UE, ß as SS, so that Müller and Mueller
// are one name), other accents taken off, and one space for a hyphen, a full stop, an apostrophe or a comma.
function foldedName(text: string): string {
  return text
    .replace(/[äÄ]/g, "ae")
    .replace(/[öÖ]/g, "oe")
    .replace(/[üÜ]/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[-'’.,\s]+/g, " ")
    .trim();
}

export {
  DE_STATES,
  findGermanState,
  foldedName,
  getStateFromGermanPostcode,
  isKnownGermanPostcode,
  isValidGermanPostcode,
  parseGermanPostcode,
  POSTCODE_SHAPE,
};
export type { GermanState, GermanStateCode };
