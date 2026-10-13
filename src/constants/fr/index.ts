// France's postcodes: the shape La Poste gives them, which department or territory each number belongs to, whether La
// Poste's base lists it, and lookups over the departments and the overseas collectivities.

import { unpackPostcodes } from "../../country/shared";
import type { FrenchCollectivity, FrenchDepartment, FrenchPostalCountry, FrenchPostcode } from "../../types/france";
import { FR_COLLECTIVITIES, FR_DEPARTMENTS } from "./departments.data";
import { FR_POSTCODE_PLACES, FR_POSTCODES_PACKED } from "./postcodes.data";

// A postcode is five digits. The overseas ones begin 97 or 98.
const POSTCODE_SHAPE = /^\d{5}$/;
let known: Set<string> | undefined;

// The postcodes of La Poste's base, unpacked the first time they are asked for.
function knownPostcodes(): Set<string> {
  known ??= unpackPostcodes(FR_POSTCODES_PACKED, 5);

  return known;
}

/**
 * Whether a postcode follows La Poste's shape: five digits. Whether the postcode is in use is a different question;
 * `isKnownFrenchPostcode` asks it, and the validator checks both.
 *
 * @param postcode - The postcode.
 * @returns `true` when it is five digits.
 * @example
 * ```ts
 * import { isValidFrenchPostcode } from "@johnmorrisdotca/address-plus/fr";
 *
 * console.log(["75008", "2000", "7500a", " 13001 "].map(isValidFrenchPostcode));
 * // → [true,false,false,true]
 * ```
 */
function isValidFrenchPostcode(postcode: string): boolean {
  return POSTCODE_SHAPE.test(String(postcode ?? "").trim());
}

/**
 * Whether La Poste's base officielle des codes postaux lists a postcode: France, the overseas departments and
 * collectivities and Monaco. The base is La Poste's (Licence Ouverte 2.0); a postcode created since it was copied is
 * not in it, so an unknown one is a warning for a validator to give, not proof that it does not exist.
 *
 * @param postcode - The postcode.
 * @returns `true` when La Poste's base lists it.
 * @example
 * ```ts
 * import { isKnownFrenchPostcode } from "@johnmorrisdotca/address-plus/fr";
 *
 * console.log(["75008", "75099", "98000", "00000"].map(isKnownFrenchPostcode));
 * // → [true,false,true,false]
 * ```
 */
function isKnownFrenchPostcode(postcode: string): boolean {
  return isValidFrenchPostcode(postcode) && knownPostcodes().has(String(postcode).trim());
}

// The department or territory a postcode's number belongs to: the first two digits, three overseas, and Corsica's 20
// split at 20200; La Poste's base says where that does not hold overseas (Saint-Barthélemy, Saint-Martin, Monaco).
function placeOf(postcode: string): string {
  const written = FR_POSTCODE_PLACES[postcode];
  if (written) return written;
  if (/^(97|98)/.test(postcode)) return postcode.slice(0, 3);
  if (postcode.startsWith("20")) return postcode < "20200" ? "2A" : "2B";

  return postcode.slice(0, 2);
}

/**
 * Takes a postcode apart: the code of the department or territory its number belongs to, and the country it delivers
 * to (`FR` for France and its overseas departments, `MC` for Monaco, `PF`, `NC` and the other collectivities' own
 * codes), and whether La Poste's base lists it. A few postcodes serve a commune across a department's border; the
 * department reported is the one the number names.
 *
 * @param postcode - The postcode, with or without spaces.
 * @returns The parts, or `null` when it is not five digits.
 * @example
 * ```ts
 * import { parseFrenchPostcode } from "@johnmorrisdotca/address-plus/fr";
 *
 * console.log(parseFrenchPostcode("98714"));
 * // → {"postcode":"98714","place":"987","country":"PF","known":true}
 * ```
 */
function parseFrenchPostcode(postcode: string): FrenchPostcode | null {
  const written = String(postcode ?? "").replace(/\s+/g, "");
  if (!POSTCODE_SHAPE.test(written)) return null;
  const place = placeOf(written);
  const collectivity = FR_COLLECTIVITIES.find((one) => one.code === place);
  const department = FR_DEPARTMENTS.some((one) => one.code === place) ? place : undefined;
  const country: FrenchPostalCountry = place === "99" ? "MC" : (collectivity?.country ?? "FR");

  return {
    postcode: written,
    place,
    country,
    known: knownPostcodes().has(written),
    ...(department ? { department } : {}),
  };
}

/**
 * The department a postcode's number belongs to, by its code: `75` for 75008, `2B` for 20200, `971` for 97100.
 *
 * @param postcode - The postcode.
 * @returns The department's code; `undefined` for a postcode in a collectivity or Monaco, one that no department
 * has, or text that is not a postcode.
 * @example
 * ```ts
 * import { getDepartmentFromFrenchPostcode } from "@johnmorrisdotca/address-plus/fr";
 *
 * console.log(["75008", "20190", "20200", "97400", "98714", "98000"].map(getDepartmentFromFrenchPostcode));
 * // → ["75","2A","2B","974",null,null]
 * ```
 */
function getDepartmentFromFrenchPostcode(postcode: string): string | undefined {
  return parseFrenchPostcode(postcode)?.department;
}

/**
 * Finds a department of France by its code (`75`, `2A`, `971`) or its name (`Paris`, `Haute-Corse`), without regard to
 * letter case or accents.
 *
 * @param text - The code or the name.
 * @returns The department, or `null` when nothing matches.
 * @example
 * ```ts
 * import { findFrenchDepartment } from "@johnmorrisdotca/address-plus/fr";
 *
 * console.log(findFrenchDepartment("haute-corse")?.code);
 * // → "2B"
 * ```
 */
function findFrenchDepartment(text: string): FrenchDepartment | null {
  const typed = foldedName(String(text ?? "").trim());

  return FR_DEPARTMENTS.find((one) => one.code.toUpperCase() === typed || foldedName(one.name) === typed) ?? null;
}

// A name in capitals, with no accents, and one space for a hyphen, an apostrophe, a full stop or a comma.
function foldedName(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[-'’.,\s]+/g, " ")
    .trim();
}

export {
  findFrenchDepartment,
  foldedName,
  FR_COLLECTIVITIES,
  FR_DEPARTMENTS,
  getDepartmentFromFrenchPostcode,
  isKnownFrenchPostcode,
  isValidFrenchPostcode,
  parseFrenchPostcode,
  POSTCODE_SHAPE,
};
export type { FrenchCollectivity, FrenchDepartment };
