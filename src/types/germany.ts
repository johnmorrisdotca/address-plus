// Addresses in Germany, as Deutsche Post and DIN 5008 lay them out: the line of who or what the address is care of, the
// building and delivery point, the street and its number (the number after the street), and the line of the five-digit
// postcode and the place.

/**
 * The code of one of the sixteen Länder of Germany, as ISO 3166-2:DE writes it after `DE-`.
 *
 * @example
 * ```ts
 * import { getStateFromGermanPostcode } from "@johnmorrisdotca/address-plus/de";
 * import type { GermanStateCode } from "@johnmorrisdotca/address-plus/de";
 *
 * console.log(getStateFromGermanPostcode("80331"));
 * // → "BY"
 * ```
 */
type GermanStateCode =
  "BB" | "BE" | "BW" | "BY" | "HB" | "HE" | "HH" | "MV" | "NI" | "NW" | "RP" | "SH" | "SL" | "SN" | "ST" | "TH";

/**
 * A Land of Germany in the tables: its code, its ISO 3166-2 code, and its name in English and in Japanese (from kuni,
 * which takes them from Unicode CLDR and Wikidata).
 *
 * @example
 * ```ts
 * import { DE_STATES } from "@johnmorrisdotca/address-plus/de";
 * import type { GermanState } from "@johnmorrisdotca/address-plus/de";
 *
 * console.log(DE_STATES.find((state) => state.code === "BY"));
 * // → {"code":"BY","iso":"DE-BY","name":"Bavaria","nameJa":"バイエルン自由州"}
 * ```
 */
interface GermanState {
  code: GermanStateCode; // BY
  iso: string; // DE-BY
  name: string; // Bavaria
  nameJa: string; // バイエルン自由州
}

/**
 * A postcode taken apart: the Land it is in, and whether GeoNames' list has it.
 *
 * @example
 * ```ts
 * import { parseGermanPostcode } from "@johnmorrisdotca/address-plus/de";
 * import type { GermanPostcode } from "@johnmorrisdotca/address-plus/de";
 *
 * console.log(parseGermanPostcode("10115"));
 * // → {"postcode":"10115","state":"BE","known":true}
 * ```
 */
interface GermanPostcode {
  postcode: string; // 10115
  state?: GermanStateCode; // BE; absent for a postcode that is not in the list
  known: boolean; // Whether GeoNames' list has it
}

/**
 * The fields an address in Germany fills beside the shared ones. The shared fields keep their meaning: `street` is the
 * whole name of the street as written (`Hauptstraße`, `Berliner Str.`, `Am Markt`), `number` the house number with its
 * letter (`12a`) or range (`12-14`), `secUnitType` and `secUnitNum` a flat (`Wohnung 12`), a box (`Postfach 12 34 56`) or
 * a Packstation, `floorType` and `floor` a floor (`OG` and `2`), `building` a wing, a house or a name (`Hinterhaus`,
 * `Haus B`), `locality` the Ortsteil, `city` the place, `state` the Land's code and `zip` the postcode.
 *
 * @example
 * ```ts
 * import { parseGermanAddress } from "@johnmorrisdotca/address-plus/de";
 * import type { GermanAddressFields } from "@johnmorrisdotca/address-plus/de";
 *
 * console.log(parseGermanAddress("c/o Weber, Hauptstraße 12a, 10115 Berlin")?.careOf);
 * // → "Weber"
 * ```
 */
interface GermanAddressFields {
  careOf?: string; // The "c/o", "bei" or "z. Hd." line: who the address is care of
}

export type { GermanAddressFields, GermanPostcode, GermanState, GermanStateCode };
