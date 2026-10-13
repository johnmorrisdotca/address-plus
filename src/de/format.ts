// Writes an address in Germany the way Deutsche Post and DIN 5008 lay it out: the care-of line and the part of the
// building above, the street and its number (or a Postfach or Packstation), and the line of the postcode and the place,
// with no punctuation at the end of a line and no blank line.

import type { FormattedAddress } from "../types/formatting";
import type { ParsedAddress } from "../types/parsed-address";

/**
 * Options for `formatDeutschePost`.
 *
 * @example
 * ```ts
 * import { formatDeutschePost, parseGermanAddress } from "@johnmorrisdotca/address-plus/de";
 * import type { DeutschePostFormattingOptions } from "@johnmorrisdotca/address-plus/de";
 *
 * const parsedAddress1=parseGermanAddress("Hauptstr. 12, 10115 Berlin");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatDeutschePost(parsedAddress1, { includeCountry: true }).lines);
 * // → ["Hauptstr. 12","10115 Berlin","DEUTSCHLAND"]
 * ```
 */
interface DeutschePostFormattingOptions {
  includeCountry?: boolean; // DEUTSCHLAND as the last line, for mail from abroad
}

const joined = (...words: (string | undefined)[]): string => words.filter(Boolean).join(" ");

// A floor as it is written on a door: 2. OG, EG, 3. Etage.
const FLOOR_WORDS: Readonly<Record<string, string>> = {
  Obergeschoss: "OG",
  Erdgeschoss: "EG",
  Untergeschoss: "UG",
  Dachgeschoss: "DG",
  Etage: "Etage",
  Stock: "Stock",
};

// A Postfach's number in pairs from the right, as DIN 5008 sets it: 123456 as 12 34 56, 12345 as 1 23 45.
function groupedBoxNumber(number: string): string {
  const pairs: string[] = [];
  for (let end = number.length; end > 0; end -= 2) pairs.unshift(number.slice(Math.max(0, end - 2), end));

  return pairs.join(" ");
}

/**
 * Writes an address in Germany as Deutsche Post asks: who it is care of (`c/o`), the part of the building, the flat and
 * the floor, the street and its house number, then the postcode and the place, each on its own line, with no punctuation
 * at the end of a line. A Postfach is written with its number in pairs (`Postfach 12 34 56`) and a Packstation with its
 * number.
 *
 * @param address - The address as `parseGermanAddress` returns it.
 * @param options - Whether to add the country (see `DeutschePostFormattingOptions`).
 * @returns The lines, the same on one line, the delivery line (the street and its number) and the last line.
 * @example
 * ```ts
 * import { formatDeutschePost, parseGermanAddress } from "@johnmorrisdotca/address-plus/de";
 *
 * const parsedAddress1=parseGermanAddress("Hinterhaus, 2. OG, Kastanienallee 4 b, 10435 Berlin");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatDeutschePost(parsedAddress1).lines);
 * // → ["Hinterhaus","2. OG","Kastanienallee 4B","10435 Berlin"]
 * ```
 */
function formatDeutschePost(address: ParsedAddress, options: DeutschePostFormattingOptions = {}): FormattedAddress {
  const lines: string[] = [];
  if (!address) return { lines, singleLine: "", country: "DE", format: "deutsche-post" };
  if (address.careOf) lines.push(`c/o ${address.careOf}`);
  if (address.building) lines.push(address.building);
  const box = address.secUnitType === "Postfach";
  const station = address.secUnitType === "Packstation" || address.secUnitType === "Postfiliale";
  if (address.secUnitType && !box && !station) lines.push(joined(address.secUnitType, address.secUnitNum));
  if (address.floorType) {
    const kind = FLOOR_WORDS[address.floorType] ?? address.floorType;
    lines.push(address.floor ? `${address.floor}. ${kind}` : kind);
  }
  const deliveryLine = joined(address.street, address.number);
  if (box) lines.push(joined("Postfach", groupedBoxNumber(address.secUnitNum ?? "")));
  else if (station) lines.push(joined(address.secUnitType, address.secUnitNum));
  else if (deliveryLine) lines.push(deliveryLine);
  if (address.locality && !address.city) lines.push(address.locality);
  const lastLine = joined(
    address.zip,
    address.city,
    address.city && address.locality ? `OT ${address.locality}` : undefined,
  );
  if (lastLine) lines.push(lastLine);
  if (options.includeCountry) lines.push("DEUTSCHLAND");

  return {
    lines,
    singleLine: lines.join(", "),
    ...(!box && !station && deliveryLine ? { deliveryLine } : {}),
    ...(lastLine ? { lastLine } : {}),
    country: "DE",
    format: "deutsche-post",
  };
}

export { formatDeutschePost };
export type { DeutschePostFormattingOptions };
