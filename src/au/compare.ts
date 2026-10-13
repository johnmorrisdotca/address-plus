// Whether two Australian addresses are the same delivery point: each field put in one form first, so a street type
// written out or abbreviated, a state by its name or its code, and "3/12" or "Unit 3, 12" compare equal.

import { findAustralianState } from "../constants/au";
import { comparable, compareFields } from "../country/shared";
import type { CountryComparison } from "../types/country-module";
import type { ParsedAddress } from "../types/parsed-address";
import { streetTypeOf } from "./parse";

const FIELDS: readonly (keyof ParsedAddress)[] = [
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "lot",
  "number",
  "street",
  "type",
  "suffix",
  "city",
  "state",
  "zip",
];

function normalize(field: keyof ParsedAddress, value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (field === "type") return comparable(streetTypeOf(value) ?? value);
  if (field === "state") return findAustralianState(value)?.code ?? comparable(value);

  return comparable(value);
}

/**
 * Compares two Australian addresses field by field: the unit, level, lot, number, street, suburb, state and postcode.
 * Letter case, punctuation, a street type written out or abbreviated (`Street`, `St`) and a state by name or code are
 * not differences.
 *
 * @param first - The first address, as `parseAustralianAddress` returns it.
 * @param second - The second address.
 * @returns Whether they are the same delivery point, and each field that differs.
 * @example
 * ```ts
 * import { compareAustralianAddresses, parseAustralianAddress } from "@johnmorrisdotca/address-plus/au";
 *
 * const parsedAddress1=parseAustralianAddress("12 Smith Street, Parramatta NSW 2150");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * const parsedAddress2=parseAustralianAddress("14 Smith St, Parramatta New South Wales 2150");
 * if (!parsedAddress2) throw new Error("The example address did not parse.");
 * console.log(compareAustralianAddresses(parsedAddress1, parsedAddress2));
 * // → {"isSame":false,"differences":[{"field":"number","first":"12","second":"14"}]}
 * ```
 */
function compareAustralianAddresses(first: ParsedAddress, second: ParsedAddress): CountryComparison {
  return compareFields(first, second, FIELDS, normalize);
}

export { compareAustralianAddresses };
