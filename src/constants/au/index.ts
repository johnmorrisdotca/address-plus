// Australia's states and postcodes: the blocks of postcodes Australia Post gives each state, the postcodes that cross
// a border (generated from the ABS's Postal Areas), and lookups over them.

import type { AustralianPostcodeRange, AustralianState, AustralianStateCode } from "../../types/australia";
import { AU_CROSS_BORDER_POSTCODES, AU_EXTERNAL_TERRITORY_POSTCODES } from "./cross-border.data";
import { AU_STATES } from "./states.data";

/**
 * The blocks of postcodes Australia Post allocates to each state and territory. A postcode outside every block is not
 * Australian. A few postcodes near a border also serve towns across it (`AU_CROSS_BORDER_POSTCODES`), and the
 * external territories have postcodes inside a state's block (`AU_EXTERNAL_TERRITORY_POSTCODES`).
 *
 * @example
 * ```ts
 * import { AU_POSTCODE_RANGES } from "@johnmorrisdotca/address-plus/au";
 *
 * console.log(AU_POSTCODE_RANGES.filter((range) => range.state === "ACT").map((range) => `${range.from}-${range.to}`));
 * // → ["0200-0299","2600-2618","2900-2920"]
 * ```
 */
const AU_POSTCODE_RANGES: readonly AustralianPostcodeRange[] = [
  { state: "NT", from: "0800", to: "0999", use: "delivery" },
  { state: "ACT", from: "0200", to: "0299", use: "delivery" },
  { state: "NSW", from: "1000", to: "1999", use: "po-box" },
  { state: "NSW", from: "2000", to: "2599", use: "delivery" },
  { state: "ACT", from: "2600", to: "2618", use: "delivery" },
  { state: "NSW", from: "2619", to: "2899", use: "delivery" },
  { state: "ACT", from: "2900", to: "2920", use: "delivery" },
  { state: "NSW", from: "2921", to: "2999", use: "delivery" },
  { state: "VIC", from: "3000", to: "3999", use: "delivery" },
  { state: "QLD", from: "4000", to: "4999", use: "delivery" },
  { state: "SA", from: "5000", to: "5999", use: "delivery" },
  { state: "WA", from: "6000", to: "6999", use: "delivery" },
  { state: "TAS", from: "7000", to: "7999", use: "delivery" },
  { state: "VIC", from: "8000", to: "8999", use: "po-box" },
  { state: "QLD", from: "9000", to: "9999", use: "po-box" },
];

const POSTCODE = /^\d{4}$/;
const NOT_LETTER = /[^A-Z]/g;

// The block a four-digit postcode falls in. Four digits compare as strings in the same order as numbers.
function rangeOf(postcode: string): AustralianPostcodeRange | undefined {
  return AU_POSTCODE_RANGES.find((range) => postcode >= range.from && postcode <= range.to);
}

/**
 * The state or territory whose block of postcodes a postcode is in. A postcode that also serves a town across a border
 * still gives the state of its block; `getStatesForAustralianPostcode` gives them all.
 *
 * @param postcode - Four digits, with or without spaces around them.
 * @returns The state's code, or `undefined` when the text is not four digits or no block holds it.
 * @example
 * ```ts
 * import { getStateFromAustralianPostcode } from "@johnmorrisdotca/address-plus/au";
 *
 * console.log(getStateFromAustralianPostcode("2620"));
 * // → "NSW"
 * ```
 */
function getStateFromAustralianPostcode(postcode: string): AustralianStateCode | undefined {
  const code = String(postcode ?? "").trim();
  if (!POSTCODE.test(code)) return undefined;

  return rangeOf(code)?.state;
}

/**
 * Every state or territory a postcode serves: its block's state, and for a postcode that crosses a border, the states
 * across it too, the one with most of the postcode's area first.
 *
 * @param postcode - Four digits.
 * @returns The states' codes; an empty array when the postcode is not in any block.
 * @example
 * ```ts
 * import { getStatesForAustralianPostcode } from "@johnmorrisdotca/address-plus/au";
 *
 * console.log(getStatesForAustralianPostcode("0872"));
 * // → ["NT","SA","WA"]
 * ```
 */
function getStatesForAustralianPostcode(postcode: string): AustralianStateCode[] {
  const code = String(postcode ?? "").trim();
  const crossing = AU_CROSS_BORDER_POSTCODES[code];
  if (crossing) return [...crossing];
  const state = getStateFromAustralianPostcode(code);

  return state ? [state] : [];
}

/**
 * Finds an Australian state or territory by its code (`VIC`, `AU-VIC`, `Vic.`) or its name in English or Japanese
 * (`Victoria`, `ビクトリア州`), in any letter case.
 *
 * @param text - The code or the name.
 * @returns The state, or `null` when nothing matches.
 * @example
 * ```ts
 * import { findAustralianState } from "@johnmorrisdotca/address-plus/au";
 *
 * console.log(findAustralianState("n.s.w.")?.name);
 * // → "New South Wales"
 * ```
 */
function findAustralianState(text: string): AustralianState | null {
  const typed = String(text ?? "").trim();
  if (typed === "") return null;
  const letters = typed.toUpperCase().replace(/^AU-/, "").replace(NOT_LETTER, "");
  const name = typed.toLowerCase().replace(/\s+/g, " ");

  return (
    AU_STATES.find(
      (state) =>
        state.code === letters ||
        state.name.toLowerCase() === name ||
        state.nameJa === typed ||
        state.nameJa.replace(/州$/, "") === typed,
    ) ?? null
  );
}

/**
 * The blocks of postcodes Australia Post allocates to a state or territory.
 *
 * @param state - The state's code or name.
 * @returns The blocks, in order; an empty array for something that is not a state.
 * @example
 * ```ts
 * import { getPostcodeRangesForAustralianState } from "@johnmorrisdotca/address-plus/au";
 *
 * console.log(getPostcodeRangesForAustralianState("Victoria").map((range) => `${range.from}-${range.to}`));
 * // → ["3000-3999","8000-8999"]
 * ```
 */
function getPostcodeRangesForAustralianState(state: string): AustralianPostcodeRange[] {
  const found = findAustralianState(state);
  if (!found) return [];

  return AU_POSTCODE_RANGES.filter((range) => range.state === found.code).sort((a, b) => a.from.localeCompare(b.from));
}

export {
  AU_CROSS_BORDER_POSTCODES,
  AU_EXTERNAL_TERRITORY_POSTCODES,
  AU_POSTCODE_RANGES,
  AU_STATES,
  findAustralianState,
  getPostcodeRangesForAustralianState,
  getStateFromAustralianPostcode,
  getStatesForAustralianPostcode,
  rangeOf,
};
