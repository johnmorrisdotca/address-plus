// Addresses in France, as La Poste writes them (its specification SP 8855, which follows the norm NF Z10-011): the
// delivery point and the building, the number and the street, a lieu-dit or a postal box, and the line of the postcode,
// the commune and a CEDEX. The overseas departments and collectivities and Monaco are written the same way.

/**
 * The country an address in La Poste's base belongs to: `FR` for France (the metropolis and the overseas
 * departments), `MC` for Monaco, and the ISO 3166-1 code of an overseas collectivity (`PM`, `BL`, `MF`, `WF`, `PF`,
 * `NC`), which is French but has a country code of its own and is listed apart by the Universal Postal Union.
 *
 * @example
 * ```ts
 * import { parseFrenchAddress } from "@johnmorrisdotca/address-plus/fr";
 * import type { FrenchPostalCountry } from "@johnmorrisdotca/address-plus/fr";
 *
 * console.log(parseFrenchAddress("Avenue Pouvanaa a Oopa, 98713 Papeete, Polynésie française")?.country);
 * // → "PF"
 * ```
 */
type FrenchPostalCountry = "BL" | "FR" | "MC" | "MF" | "NC" | "PF" | "PM" | "WF";

/**
 * A department of France in the tables: its code (`75`, `2A`, `971`), its name and its region's, from INSEE's Code
 * officiel géographique.
 *
 * @example
 * ```ts
 * import { FR_DEPARTMENTS } from "@johnmorrisdotca/address-plus/fr";
 * import type { FrenchDepartment } from "@johnmorrisdotca/address-plus/fr";
 *
 * console.log(FR_DEPARTMENTS.find((department) => department.code === "75"));
 * // → {"code":"75","name":"Paris","region":"Île-de-France"}
 * ```
 */
interface FrenchDepartment {
  code: string; // 75, 2A, 971
  name: string; // Paris
  region: string; // Île-de-France
}

/**
 * An overseas collectivity of France in the tables: its code (`987`), the ISO 3166-1 country code an address in it
 * reads as (`PF`) and its name.
 *
 * @example
 * ```ts
 * import { FR_COLLECTIVITIES } from "@johnmorrisdotca/address-plus/fr";
 * import type { FrenchCollectivity } from "@johnmorrisdotca/address-plus/fr";
 *
 * console.log(FR_COLLECTIVITIES.find((one) => one.code === "988"));
 * // → {"code":"988","country":"NC","name":"Nouvelle-Calédonie"}
 * ```
 */
interface FrenchCollectivity {
  code: string; // 988
  country: FrenchPostalCountry; // NC
  name: string; // Nouvelle-Calédonie
}

/**
 * A postcode taken apart: the code of the department or territory its number belongs to, the country it delivers to,
 * and whether La Poste's base has it. `place` is a department's code (`75`, `2A`, `971`), a collectivity's (`987`) or
 * `99` for Monaco.
 *
 * @example
 * ```ts
 * import { parseFrenchPostcode } from "@johnmorrisdotca/address-plus/fr";
 * import type { FrenchPostcode } from "@johnmorrisdotca/address-plus/fr";
 *
 * console.log(parseFrenchPostcode("20200"));
 * // → {"postcode":"20200","place":"2B","country":"FR","known":true,"department":"2B"}
 * ```
 */
interface FrenchPostcode {
  postcode: string; // 75008
  place: string; // 75, 2B, 971, 987, 99
  country: FrenchPostalCountry;
  known: boolean; // Whether La Poste's base lists it
  department?: string; // The department's code, absent for a collectivity and for Monaco
}

/**
 * The fields an address in France fills beside the shared ones. The shared fields keep their meaning: `number` is the
 * street number, `street` the name of the street without its type and `type` the type in full (`Rue`; the name is
 * `de la Paix`), `secUnitType` and `secUnitNum` an apartment or a door, `floorType` and `floor` a floor, `building`
 * the building's or the residence's name, `city` the commune, `state` the department's code and `zip` the postcode.
 *
 * @example
 * ```ts
 * import { parseFrenchAddress } from "@johnmorrisdotca/address-plus/fr";
 * import type { FrenchAddressFields } from "@johnmorrisdotca/address-plus/fr";
 *
 * console.log(parseFrenchAddress("12 bis rue de la Paix, 75002 Paris")?.numberExtension);
 * // → "bis"
 * ```
 */
interface FrenchAddressFields {
  numberExtension?: string; // The indice de répétition after the number: bis, ter, quater, or a letter (the B of 12 B)
  staircase?: string; // The staircase: the B of "Escalier B"
  entrance?: string; // The entrance: the A of "Entrée A"
  lieuDit?: string; // A lieu-dit: a named place (a hamlet, a farm) that goes on a line of its own
  postalBoxType?: "BP" | "CS" | "TSA"; // A boîte postale, a course spéciale or a tri service arrivée
  postalBoxNum?: string; // The number of the box: 123 in "BP 123"
  cedex?: string; // The CEDEX the commune line ends with, as La Poste writes it: "CEDEX 09", or "CEDEX" alone
  arrondissement?: string; // The arrondissement of Paris, Lyon or Marseille, as a number: 8 for "Paris 8e"
  careOf?: string; // The "chez" line: who the address is care of
}

export type { FrenchAddressFields, FrenchCollectivity, FrenchDepartment, FrenchPostalCountry, FrenchPostcode };
