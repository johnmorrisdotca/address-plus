// Whether two addresses in Germany are the same delivery point: each field put in one form first, so Straße, Strasse and
// Str. compare equal, as do ä and ae, letter case, the house number's letter and the postcode's spacing.

import { foldedName } from "../constants/de";
import { compareFields } from "../country/shared";
import type { CountryComparison } from "../types/country-module";
import type { ParsedAddress } from "../types/parsed-address";

const FIELDS: readonly (keyof ParsedAddress)[] = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floor",
  "street",
  "number",
  "city",
  "zip",
];

// A street's name with its suffix in one spelling: Hauptstraße, Hauptstrasse, Hauptstr. and Haupt Str. are one name.
const streetForm = (folded: string): string => folded.replace(/\s?STRASSE$/, " STR").replace(/\s?STR$/, " STR");

function normalize(field: keyof ParsedAddress, value: string | undefined): string | undefined {
  if (value === undefined || value === "") return undefined;
  const same = foldedName(value);
  if (field === "street") return streetForm(same);
  if (field === "zip" || field === "number") return same.replace(/\s+/g, "");
  if (field === "secUnitNum") return same.replace(/\s+/g, "");

  return same;
}

/**
 * Compares two addresses in Germany field by field: who it is care of, the building, the flat and floor, the street, the
 * house number, the place and the postcode. Letter case, ä and ae, ß and ss, a street's suffix written `Straße`, `Strasse`
 * or `Str.`, and the postcode's spacing are not differences. The Land and the Ortsteil are left out, since the postcode
 * already says the first.
 *
 * @param first - The first address, as `parseGermanAddress` returns it.
 * @param second - The second address.
 * @returns Whether they are the same delivery point, and each field that differs.
 * @example
 * ```ts
 * import { compareGermanAddresses, parseGermanAddress } from "@johnmorrisdotca/address-plus/de";
 *
 * const parsedAddress1=parseGermanAddress("Müllerstraße 5, 13353 Berlin");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * const parsedAddress2=parseGermanAddress("MUELLERSTR. 5, 13353 BERLIN");
 * if (!parsedAddress2) throw new Error("The example address did not parse.");
 * console.log(compareGermanAddresses(parsedAddress1, parsedAddress2).isSame);
 * // → true
 * ```
 */
function compareGermanAddresses(first: ParsedAddress, second: ParsedAddress): CountryComparison {
  return compareFields(first, second, FIELDS, normalize);
}

export { compareGermanAddresses };
