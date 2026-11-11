// India's postcodes (PIN codes): six digits, the first never nought, whether GeoNames' list has one, and the state or union
// territory it is in.

import { postcodeLookups } from "../../country/postcode-lookups";
import type { PostcodeRegion } from "../../types/postcode-country";
import { IN_POSTCODE_REGION_RUNS, IN_POSTCODES_PACKED } from "./postcodes.data";
import { IN_STATES } from "./regions.data";

// Six digits, the first 1 to 9, written close or with a space after the third.
const IN_POSTCODE_SHAPE = /^[1-9]\d{2}\s?\d{3}$/;

const lookups = postcodeLookups({
  shape: IN_POSTCODE_SHAPE,
  length: 6,
  packed: IN_POSTCODES_PACKED,
  runs: IN_POSTCODE_REGION_RUNS,
  normalize: (postcode) => postcode.replace(/\s+/g, ""),
});

const plain = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/&/g, "AND")
    .replace(/[^A-Z]/g, "");

// Names GeoNames and people write that differ from kuni's, by their plain form.
const ALIASES: Readonly<Record<string, string>> = {
  PONDICHERRY: "PUDUCHERRY",
  ORISSA: "ODISHA",
  UTTARANCHAL: "UTTARAKHAND",
};

/**
 * Finds a state or union territory of India by its code (`KA`, `IN-KA`) or its name in English, ignoring accents, `&` for
 * `and`, and letter case.
 *
 * @param query - The state's code or name.
 * @returns The state, or `undefined` when none has that code or name.
 * @example
 * ```ts
 * import { findIndianState } from "@johnmorrisdotca/address-plus/in";
 *
 * console.log([findIndianState("ka")?.name, findIndianState("Jammu & Kashmir")?.code, findIndianState("xx")]);
 * // → ["Karnataka","JK",null]
 * ```
 */
function findIndianState(query: string): PostcodeRegion | undefined {
  const wanted = plain(String(query ?? "")).replace(/^IN(?=[A-Z]{2}$)/, "");
  if (wanted === "") return undefined;
  const name = ALIASES[wanted] ?? wanted;

  return IN_STATES.find((state) => state.code === wanted || plain(state.name) === name);
}

export { findIndianState, IN_POSTCODE_SHAPE, IN_STATES, lookups as indianPostcodes };
