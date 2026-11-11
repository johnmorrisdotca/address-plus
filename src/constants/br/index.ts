// Brazil's postcodes (CEP): eight digits written 01310-200, and the state told from the range of the first five digits. A CEP
// is "known" when its first five digits fall in a state's range; there is no list of CEPs.

import type { PostcodeRegion } from "../../types/postcode-country";
import { BR_RANGES } from "./ranges";
import { BR_STATES } from "./regions.data";

const BR_POSTCODE_SHAPE = /^\d{5}-?\d{3}$/;

const digitsOf = (postcode: string): string =>
  String(postcode ?? "")
    .trim()
    .replace("-", "");

/**
 * Whether a CEP follows the Correios' shape: eight digits, with a hyphen after the fifth or none.
 *
 * @param postcode - The CEP.
 * @returns `true` when it has the shape.
 * @example
 * ```ts
 * import { isValidBrazilianPostcode } from "@johnmorrisdotca/address-plus/br";
 *
 * console.log(["01310-200", "01310200", "01310-20", "1310-200"].map(isValidBrazilianPostcode));
 * // → [true,true,false,false]
 * ```
 */
function isValidBrazilianPostcode(postcode: string): boolean {
  return BR_POSTCODE_SHAPE.test(String(postcode ?? "").trim());
}

/**
 * The state a CEP is in, by its code (`SP`): the state whose range holds the CEP's first five digits.
 *
 * @param postcode - The CEP.
 * @returns The state's code, or `undefined` when the CEP has not the shape or no state's range holds it.
 * @example
 * ```ts
 * import { getStateFromBrazilianPostcode } from "@johnmorrisdotca/address-plus/br";
 *
 * console.log(["01310-200", "20040-020", "70040-010", "69900-000", "00999-000"].map(getStateFromBrazilianPostcode));
 * // → ["SP","RJ","DF","AC",null]
 * ```
 */
function getStateFromBrazilianPostcode(postcode: string): string | undefined {
  if (!isValidBrazilianPostcode(postcode)) return undefined;
  const first = Number(digitsOf(postcode).slice(0, 5));
  for (const [state, ranges] of Object.entries(BR_RANGES)) {
    if (ranges.some(([from, to]) => first >= from && first <= to)) return state;
  }

  return undefined;
}

/**
 * Whether a CEP is in a range the Correios gave a state: it has the shape and its first five digits fall in a state's range.
 * This says nothing of whether the CEP itself is in use; there is no list of them here.
 *
 * @param postcode - The CEP.
 * @returns `true` when a state's range holds it.
 * @example
 * ```ts
 * import { isKnownBrazilianPostcode } from "@johnmorrisdotca/address-plus/br";
 *
 * console.log(["01310-200", "00999-000", "01310"].map(isKnownBrazilianPostcode));
 * // → [true,false,false]
 * ```
 */
function isKnownBrazilianPostcode(postcode: string): boolean {
  return getStateFromBrazilianPostcode(postcode) !== undefined;
}

const normalizeBrazilianPostcode = (postcode: string): string => {
  const digits = digitsOf(postcode);

  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : String(postcode ?? "").trim();
};

const plain = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

/**
 * Finds a state of Brazil by its code (`SP`, `BR-SP`) or its name in English or Portuguese, ignoring accents and letter case.
 *
 * @param query - The state's code or name.
 * @returns The state, or `undefined` when none has that code or name.
 * @example
 * ```ts
 * import { findBrazilianState } from "@johnmorrisdotca/address-plus/br";
 *
 * console.log([findBrazilianState("sp")?.name, findBrazilianState("Bahia")?.code, findBrazilianState("Distrito Federal")?.code, findBrazilianState("x")]);
 * // → ["São Paulo","BA","DF",null]
 * ```
 */
function findBrazilianState(query: string): PostcodeRegion | undefined {
  const wanted = plain(String(query ?? "")).replace(/^BR(?=[A-Z]{2}$)/, "");
  if (wanted === "") return undefined;
  const name = wanted === "DISTRITOFEDERAL" ? "FEDERALDISTRICT" : wanted;

  return BR_STATES.find((state) => state.code === wanted || plain(state.name) === name);
}

export {
  BR_POSTCODE_SHAPE,
  BR_RANGES,
  BR_STATES,
  findBrazilianState,
  getStateFromBrazilianPostcode,
  isKnownBrazilianPostcode,
  isValidBrazilianPostcode,
  normalizeBrazilianPostcode,
};
