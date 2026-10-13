// Writes an address in the United Kingdom the way Royal Mail asks: each part on a line of its own, from the flat to
// the localities, the POST TOWN in capitals, and the postcode in capitals on the last line, with no punctuation.

import type { FormattedAddress } from "../types/formatting";
import type { ParsedAddress } from "../types/parsed-address";

/**
 * Options for `formatRoyalMail`.
 *
 * @example
 * ```ts
 * import { formatRoyalMail, parseUKAddress } from "@johnmorrisdotca/address-plus/gb";
 * import type { RoyalMailFormattingOptions } from "@johnmorrisdotca/address-plus/gb";
 *
 * const parsedAddress1=parseUKAddress("10 Downing Street, London SW1A 2AA");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatRoyalMail(parsedAddress1, { includeCountry: true }).lines);
 * // → ["10 Downing Street","LONDON","SW1A 2AA","UNITED KINGDOM"]
 * ```
 */
interface RoyalMailFormattingOptions {
  includeCounty?: boolean; // Keep a county that was written, on the line after the post town; Royal Mail does not need it
  includeCountry?: boolean; // UNITED KINGDOM as the last line, for mail from abroad (or JERSEY, GUERNSEY, ISLE OF MAN)
}

const COUNTRY_LINES: Readonly<Record<string, string>> = {
  GB: "UNITED KINGDOM",
  GY: "GUERNSEY",
  IM: "ISLE OF MAN",
  JE: "JERSEY",
};

const joined = (...words: (string | undefined)[]): string => words.filter(Boolean).join(" ");

/**
 * Writes an address in the United Kingdom as Royal Mail asks: the flat or part of the building, the floor, the
 * building's name, the number with the dependent thoroughfare or the thoroughfare, the localities, then the post town
 * and the postcode in capitals, each on its own line. A forces address ends `BFPO 105`.
 *
 * @param address - The address as `parseUKAddress` returns it.
 * @param options - Whether to keep a county and to add the country (see `RoyalMailFormattingOptions`).
 * @returns The lines, the same on one line, the delivery line (the number and thoroughfare) and the last line.
 * @example
 * ```ts
 * import { formatRoyalMail, parseUKAddress } from "@johnmorrisdotca/address-plus/gb";
 *
 * const parsedAddress1=parseUKAddress("Flat 2, Rose Court, 14 High St, Kingsbury, London NW9 0AA");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatRoyalMail(parsedAddress1).lines);
 * // → ["Flat 2","Rose Court","14 High Street","Kingsbury","LONDON","NW9 0AA"]
 * ```
 */
function formatRoyalMail(address: ParsedAddress, options: RoyalMailFormattingOptions = {}): FormattedAddress {
  const lines: string[] = [];
  if (!address) return { lines, singleLine: "", country: "GB", format: "royal-mail" };
  if (address.subBuilding) lines.push(address.subBuilding);
  const box = address.secUnitType === "PO Box";
  if (address.secUnitType && !box) lines.push(joined(address.secUnitType, address.secUnitNum));
  if (address.floorType) lines.push(address.floor ? joined(address.floorType, address.floor) : address.floorType);
  if (address.building) lines.push(address.building);
  if (box) lines.push(joined("PO Box", address.secUnitNum));
  const street = joined(address.street, address.type);
  let deliveryLine: string | undefined;
  if (address.dependentThoroughfare) {
    lines.push(joined(address.number, address.dependentThoroughfare));
    if (street) lines.push((deliveryLine = street));
  } else if (street || address.number) {
    lines.push((deliveryLine = joined(address.number, street)));
  }
  if (address.doubleDependentLocality) lines.push(address.doubleDependentLocality);
  if (address.locality) lines.push(address.locality);
  if (address.city) lines.push(address.city.toUpperCase());
  if (options.includeCounty && address.county) lines.push(address.county);
  const lastLine = address.bfpo ? `BFPO ${address.bfpo}` : address.zip?.toUpperCase();
  if (lastLine) lines.push(lastLine);
  if (options.includeCountry) lines.push(COUNTRY_LINES[address.country ?? "GB"] ?? "UNITED KINGDOM");

  return {
    lines,
    singleLine: lines.join(", "),
    ...(deliveryLine ? { deliveryLine } : {}),
    ...(lastLine ? { lastLine } : {}),
    country: address.country ?? "GB",
    format: "royal-mail",
  };
}

export { formatRoyalMail };
export type { RoyalMailFormattingOptions };
