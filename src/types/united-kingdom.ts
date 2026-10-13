// Addresses in the United Kingdom, in the shape of Royal Mail's Postcode Address File (PAF): a sub-building, a building
// name, a number and a thoroughfare, the localities, the POST TOWN and the postcode.

/**
 * The code of one of the four nations of the United Kingdom, as ISO 3166-2:GB writes it after `GB-`.
 *
 * @example
 * ```ts
 * import { getNationFromUKPostcode } from "@johnmorrisdotca/address-plus/gb";
 * import type { UKNationCode } from "@johnmorrisdotca/address-plus/gb";
 *
 * console.log(getNationFromUKPostcode("CF10 1AA"));
 * // → "WLS"
 * ```
 */
type UKNationCode = "ENG" | "NIR" | "SCT" | "WLS";

/**
 * A nation of the United Kingdom in the tables: its code, its ISO 3166-2 code, and its name in English and in Japanese
 * (from kuni, which takes them from Unicode CLDR and Wikidata).
 *
 * @example
 * ```ts
 * import { GB_NATIONS } from "@johnmorrisdotca/address-plus/gb";
 * import type { UKNation } from "@johnmorrisdotca/address-plus/gb";
 *
 * console.log(GB_NATIONS.find((nation) => nation.code === "SCT"));
 * // → {"code":"SCT","iso":"GB-SCT","name":"Scotland","nameJa":"スコットランド"}
 * ```
 */
interface UKNation {
  code: UKNationCode;
  iso: string; // GB-SCT
  name: string; // Scotland
  nameJa: string; // スコットランド
}

/**
 * A postcode taken apart: the outward code (area and district) and the inward code (sector and unit), and where it
 * delivers. `country` is `GB` for the United Kingdom and `JE`, `GY` or `IM` for Jersey, Guernsey and the Isle of Man,
 * which use Royal Mail's postcodes but are not part of the United Kingdom.
 *
 * @example
 * ```ts
 * import { parseUKPostcode } from "@johnmorrisdotca/address-plus/gb";
 * import type { UKPostcode } from "@johnmorrisdotca/address-plus/gb";
 *
 * console.log(parseUKPostcode("ec1a1bb"));
 * // → {"postcode":"EC1A 1BB","outward":"EC1A","inward":"1BB","area":"EC","district":"EC1A","sector":"EC1A 1","country":"GB","nation":"ENG"}
 * ```
 */
interface UKPostcode {
  postcode: string; // Capitals, one space: EC1A 1BB
  outward: string; // EC1A
  inward: string; // 1BB
  area: string; // EC
  district: string; // EC1A, the same as the outward code
  sector: string; // EC1A 1
  country: "GB" | "GY" | "IM" | "JE";
  nation?: UKNationCode; // Absent outside the United Kingdom, and for a non-geographic area (BX, BF)
}

/**
 * The fields an address in the United Kingdom fills beside the shared ones. The shared fields keep their meaning:
 * `number` is the building number, `street` and `type` the thoroughfare's name and its descriptor in full (`Upper` and
 * `Street`, as Royal Mail writes it), `secUnitType` and `secUnitNum` a flat or unit (`Flat 2`) or a PO Box, `building`
 * the building's name, `locality` the dependent locality, `city` the post town and `zip` the postcode.
 *
 * @example
 * ```ts
 * import { parseUKAddress } from "@johnmorrisdotca/address-plus/gb";
 * import type { UKAddressFields } from "@johnmorrisdotca/address-plus/gb";
 *
 * console.log(parseUKAddress("Flat 2, Rose Court, 14 High Street, Kingsbury, LONDON NW9 0AA")?.locality);
 * // → "Kingsbury"
 * ```
 */
interface UKAddressFields {
  subBuilding?: string; // A part of a building with no number: "Basement Flat", "Stables Flat"
  dependentThoroughfare?: string; // A thoroughfare inside another: the "Seastone Cottages" of "1A Seastone Cottages, Station Road"
  doubleDependentLocality?: string; // A locality inside the dependent locality, written above it
  county?: string; // A county, when one is written; Royal Mail no longer needs it
  nation?: UKNationCode; // The nation the postcode delivers to, from the tables
  bfpo?: string; // A British Forces Post Office number: the 105 of "BFPO 105"
}

export type { UKAddressFields, UKNation, UKNationCode, UKPostcode };
