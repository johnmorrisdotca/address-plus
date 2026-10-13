// Writes an Australian address the way Australia Post asks for it: a building's name on its own line, then the
// delivery line with the unit and level before the number, then the suburb, the state and the postcode, the last two
// lines in capitals, with no punctuation.

import { AU_POSTAL_DELIVERY_TYPES, AU_STREET_TYPES } from "../constants/au/words";
import type { FormattedAddress } from "../types/formatting";
import type { ParsedAddress } from "../types/parsed-address";

/**
 * Options for `formatAustraliaPost`.
 *
 * @example
 * ```ts
 * import { formatAustraliaPost, parseAustralianAddress } from "@johnmorrisdotca/address-plus/au";
 * import type { AustraliaPostFormattingOptions } from "@johnmorrisdotca/address-plus/au";
 *
 * const parsedAddress1=parseAustralianAddress("Unit 3, 12 Smith St, Parramatta NSW 2150");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatAustraliaPost(parsedAddress1, { unitStyle: "slash" }).lines);
 * // → ["3/12 SMITH ST","PARRAMATTA NSW 2150"]
 * ```
 */
interface AustraliaPostFormattingOptions {
  unitStyle?: "words" | "slash"; // "UNIT 3 12 SMITH ST" (the default) or "3/12 SMITH ST"
  wideSpacing?: boolean; // Two spaces before the state and before the postcode, as Australia Post prefers on a typed label
  includeCountry?: boolean; // AUSTRALIA as the last line, for mail from abroad
}

const POSTAL_DELIVERY_TYPES = new Set(Object.keys(AU_POSTAL_DELIVERY_TYPES));
const joined = (...words: (string | undefined)[]): string => words.filter(Boolean).join(" ");

/**
 * Writes an Australian address as Australia Post asks: the building's name, then the delivery line (unit and level
 * before the number, the street type abbreviated), then the suburb, state and postcode, both in capitals with no
 * punctuation. A postal delivery (`PO BOX 37`) takes the delivery line's place.
 *
 * @param address - The address as `parseAustralianAddress` returns it.
 * @param options - The unit's style, the spacing of the last line, and whether to add AUSTRALIA (see
 * `AustraliaPostFormattingOptions`).
 * @returns The lines, the same on one line, the delivery line and the last line.
 * @example
 * ```ts
 * import { formatAustraliaPost, parseAustralianAddress } from "@johnmorrisdotca/address-plus/au";
 *
 * const parsedAddress1=parseAustralianAddress("Level 6, 51 Jacobson Street, Brisbane Qld 4000");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatAustraliaPost(parsedAddress1).lines);
 * // → ["LEVEL 6 51 JACOBSON ST","BRISBANE QLD 4000"]
 * ```
 */
function formatAustraliaPost(address: ParsedAddress, options: AustraliaPostFormattingOptions = {}): FormattedAddress {
  const lines: string[] = [];
  if (!address) return { lines, singleLine: "", country: "AU", format: "australia-post" };
  if (address.building) lines.push(address.building);

  const { secUnitType, secUnitNum } = address;
  const street = joined(address.street, address.type, address.suffix);
  const level = address.floorType ? joined(address.floorType, address.floor) : undefined;
  const lot = address.lot ? `Lot ${address.lot}` : undefined;
  let delivery: string;
  if (secUnitType && POSTAL_DELIVERY_TYPES.has(secUnitType)) {
    // A box or a bag, with the road a rural service is on: PO BOX 37, RMB 1234 STURT HWY.
    delivery = joined(secUnitType, secUnitNum, address.number, street);
  } else if (secUnitType && address.number && options.unitStyle === "slash" && !level && !lot) {
    delivery = joined(`${secUnitNum}/${address.number}`, street);
  } else {
    delivery = joined(secUnitType, secUnitNum, level, lot, address.number, street);
  }
  const deliveryLine = delivery.toUpperCase();
  if (deliveryLine) lines.push(deliveryLine);

  const gap = options.wideSpacing ? "  " : " ";
  const lastLine = [address.city, address.state, address.zip].filter(Boolean).join(gap).toUpperCase();
  if (lastLine) lines.push(lastLine);
  if (options.includeCountry) lines.push("AUSTRALIA");

  return {
    lines,
    singleLine: lines.join(", "),
    ...(deliveryLine ? { deliveryLine } : {}),
    ...(lastLine ? { lastLine } : {}),
    country: "AU",
    format: "australia-post",
  };
}

/**
 * The word an AS4590 street type stands for: `Pde` is `Parade`. Any other text comes back as it is.
 *
 * @param type - The abbreviation, in any letter case.
 * @returns The word.
 * @example
 * ```ts
 * import { expandAustralianStreetType } from "@johnmorrisdotca/address-plus/au";
 *
 * console.log(expandAustralianStreetType("CRES"));
 * // → "Crescent"
 * ```
 */
function expandAustralianStreetType(type: string): string {
  const code = Object.keys(AU_STREET_TYPES).find((key) => key.toUpperCase() === String(type ?? "").toUpperCase());

  return code ? AU_STREET_TYPES[code] : type;
}

export { expandAustralianStreetType, formatAustraliaPost };
export type { AustraliaPostFormattingOptions };
