// Whether two addresses in the United Kingdom are the same delivery point: each field put in one form first, so a
// descriptor abbreviated or written out, letter case and the postcode's spacing compare equal.

import { GB_THOROUGHFARE_DESCRIPTORS } from "../constants/gb/words";
import { comparable, compareFields } from "../country/shared";
import type { CountryComparison } from "../types/country-module";
import type { ParsedAddress } from "../types/parsed-address";

const DESCRIPTORS: Map<string, string> = new Map(
  Object.entries(GB_THOROUGHFARE_DESCRIPTORS).flatMap(([word, forms]) => [
    [word.toUpperCase(), word.toUpperCase()] as const,
    ...forms.map((form) => [form, word.toUpperCase()] as const),
  ]),
);

const FIELDS: readonly (keyof ParsedAddress)[] = [
  "subBuilding",
  "secUnitType",
  "secUnitNum",
  "building",
  "number",
  "dependentThoroughfare",
  "street",
  "type",
  "city",
  "zip",
  "bfpo",
];

function normalize(field: keyof ParsedAddress, value: string | undefined): string | undefined {
  const same = comparable(value);
  if (same === undefined) return undefined;
  if (field === "type") return DESCRIPTORS.get(same) ?? same;
  if (field === "zip") return same.replace(/\s+/g, "");

  return same;
}

/**
 * Compares two addresses in the United Kingdom field by field: the flat, the building, the number, the thoroughfare,
 * the post town and the postcode. Letter case, punctuation, a descriptor abbreviated (`St`, `Rd`) and the postcode's
 * space are not differences. The localities and the county are left out, since Royal Mail needs neither when the
 * postcode is given.
 *
 * @param first - The first address, as `parseUKAddress` returns it.
 * @param second - The second address.
 * @returns Whether they are the same delivery point, and each field that differs.
 * @example
 * ```ts
 * import { compareUKAddresses, parseUKAddress } from "@johnmorrisdotca/address-plus/gb";
 *
 * const parsedAddress1=parseUKAddress("10 Downing Street, London SW1A 2AA");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * const parsedAddress2=parseUKAddress("10 DOWNING ST, LONDON, SW1A2AA");
 * if (!parsedAddress2) throw new Error("The example address did not parse.");
 * console.log(compareUKAddresses(parsedAddress1, parsedAddress2).isSame);
 * // → true
 * ```
 */
function compareUKAddresses(first: ParsedAddress, second: ParsedAddress): CountryComparison {
  return compareFields(first, second, FIELDS, normalize);
}

export { compareUKAddresses };
