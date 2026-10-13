// Australian addresses, as Australia Post and AS4590 describe them: a delivery line (a unit, a level, a number and a
// street, or a postal delivery such as a PO Box), then the suburb or town, the state and the postcode.

/**
 * The code of an Australian state or territory, as Australia Post writes it on the last line of an address.
 *
 * @example
 * ```ts
 * import { getStateFromAustralianPostcode } from "@johnmorrisdotca/address-plus/au";
 * import type { AustralianStateCode } from "@johnmorrisdotca/address-plus/au";
 *
 * console.log(getStateFromAustralianPostcode("3000"));
 * // → "VIC"
 * ```
 */
type AustralianStateCode = "ACT" | "NSW" | "NT" | "QLD" | "SA" | "TAS" | "VIC" | "WA";

/**
 * An Australian state or territory in the tables: Australia Post's code, the ISO 3166-2 code, and its name in English
 * and in Japanese (from kuni, which takes them from Unicode CLDR and Wikidata).
 *
 * @example
 * ```ts
 * import { findAustralianState } from "@johnmorrisdotca/address-plus/au";
 * import type { AustralianState } from "@johnmorrisdotca/address-plus/au";
 *
 * console.log(findAustralianState("Victoria"));
 * // → {"code":"VIC","iso":"AU-VIC","name":"Victoria","nameJa":"ビクトリア州","kind":"state"}
 * ```
 */
interface AustralianState {
  code: AustralianStateCode; // The code on an envelope: VIC
  iso: string; // ISO 3166-2: AU-VIC
  name: string; // English: Victoria
  nameJa: string; // Japanese: ビクトリア州
  kind: "state" | "territory"; // The ACT and the NT are territories
}

/**
 * One block of postcodes Australia Post allocates to a state or territory: every postcode from `from` to `to`,
 * inclusive, written as four digits.
 *
 * @example
 * ```ts
 * import { AU_POSTCODE_RANGES } from "@johnmorrisdotca/address-plus/au";
 * import type { AustralianPostcodeRange } from "@johnmorrisdotca/address-plus/au";
 *
 * console.log(AU_POSTCODE_RANGES.find((range) => range.state === "TAS"));
 * // → {"state":"TAS","from":"7000","to":"7999","use":"delivery"}
 * ```
 */
interface AustralianPostcodeRange {
  state: AustralianStateCode;
  from: string; // First postcode of the block: "2000"
  to: string; // Last postcode of the block: "2599"
  use: "delivery" | "po-box"; // Street delivery, or PO boxes and large-volume receivers (NSW 1000 to 1999, VIC 8000 to 8999, QLD 9000 to 9999)
}

/**
 * The fields an Australian address fills beside the shared ones. The shared fields keep their meaning: `number` is the
 * street number, `street` and `type` the street's name and its type (Australia Post's abbreviation, `St`, `Pde`,
 * `Cres`), `secUnitType` and `secUnitNum` the unit (`Unit 3`) or the postal delivery (`PO Box 37`, `Locked Bag 801`),
 * `city` the suburb or town, `state` the state's code and `zip` the postcode.
 *
 * @example
 * ```ts
 * import { parseAustralianAddress } from "@johnmorrisdotca/address-plus/au";
 * import type { AustralianAddressFields } from "@johnmorrisdotca/address-plus/au";
 *
 * console.log(parseAustralianAddress("Level 6, 51 Jacobson St, Brisbane QLD 4000")?.floorType);
 * // → "Level"
 * ```
 */
interface AustralianAddressFields {
  floorType?: string; // A level or floor: Level, Floor, Ground Floor, Lower Ground Floor, Upper Ground Floor, Basement, Mezzanine
  lot?: string; // A lot number where a street number is not yet given: the 12 in "Lot 12 Smith Rd"
}

export type { AustralianAddressFields, AustralianPostcodeRange, AustralianState, AustralianStateCode };
