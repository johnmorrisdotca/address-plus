// Whether two addresses in France are the same delivery point: each field put in one form first, so a type of voie
// abbreviated or written out, letter case, accents, hyphens and Saint or St compare equal.

import { foldedName } from "../constants/fr";
import { FR_STREET_TYPES } from "../constants/fr/words";
import { compareFields } from "../country/shared";
import type { CountryComparison } from "../types/country-module";
import type { ParsedAddress } from "../types/parsed-address";

const STREET_TYPES: Map<string, string> = new Map(
  Object.entries(FR_STREET_TYPES).flatMap(([type, forms]) => [
    [foldedName(type), foldedName(type)] as const,
    ...forms.map((form) => [foldedName(form), foldedName(type)] as const),
  ]),
);

const FIELDS: readonly (keyof ParsedAddress)[] = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floor",
  "staircase",
  "entrance",
  "number",
  "numberExtension",
  "type",
  "street",
  "lieuDit",
  "postalBoxType",
  "postalBoxNum",
  "city",
  "arrondissement",
  "zip",
];

// St and Ste are Saint and Sainte, whole words only, in a commune's or a street's name.
const saints = (text: string): string => text.replace(/\bSTE\b/g, "SAINTE").replace(/\bST\b/g, "SAINT");

function normalize(field: keyof ParsedAddress, value: string | undefined): string | undefined {
  if (value === undefined || value === "") return undefined;
  const same = foldedName(value);
  if (field === "type") return STREET_TYPES.get(same) ?? same;
  if (field === "zip") return same.replace(/\s+/g, "");
  if (field === "arrondissement") return String(Number(same) || same);
  if (field === "street" || field === "city" || field === "building" || field === "lieuDit") return saints(same);

  return same;
}

/**
 * Compares two addresses in France field by field: the delivery point, the building, the number and its extension, the
 * type and name of the street, the lieu-dit, the box, the commune and the postcode. Letter case, accents, hyphens, a
 * type of voie abbreviated (`av.`, `bd`) and `St` for `Saint` are not differences. The CEDEX and the department are
 * left out: the postcode already says them.
 *
 * @param first - The first address, as `parseFrenchAddress` returns it.
 * @param second - The second address.
 * @returns Whether they are the same delivery point, and each field that differs.
 * @example
 * ```ts
 * import { compareFrenchAddresses, parseFrenchAddress } from "@johnmorrisdotca/address-plus/fr";
 *
 * const parsedAddress1=parseFrenchAddress("12 rue de l'Église, 38000 Saint-Étienne");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * const parsedAddress2=parseFrenchAddress("12 R. DE L EGLISE, 38000 ST ETIENNE");
 * if (!parsedAddress2) throw new Error("The example address did not parse.");
 * console.log(compareFrenchAddresses(parsedAddress1, parsedAddress2).isSame);
 * // → true
 * ```
 */
function compareFrenchAddresses(first: ParsedAddress, second: ParsedAddress): CountryComparison {
  return compareFields(first, second, FIELDS, normalize);
}

export { compareFrenchAddresses };
