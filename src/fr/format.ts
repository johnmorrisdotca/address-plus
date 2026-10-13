// Writes an address in France the way La Poste asks (its specification SP 8855, volume 2, which follows the norm NF
// Z10-011): the delivery point, the building, the street, the lieu-dit or box, and the line of the postcode and the
// commune, in capitals with no accents and no punctuation.

import { foldedName } from "../constants/fr";
import type { FormattedAddress } from "../types/formatting";
import type { ParsedAddress } from "../types/parsed-address";

/**
 * Options for `formatLaPoste`.
 *
 * @example
 * ```ts
 * import { formatLaPoste, parseFrenchAddress } from "@johnmorrisdotca/address-plus/fr";
 * import type { LaPosteFormattingOptions } from "@johnmorrisdotca/address-plus/fr";
 *
 * const parsedAddress1=parseFrenchAddress("12 rue de la Paix, 75002 Paris");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatLaPoste(parsedAddress1, { includeCountry: true }).lines);
 * // → ["12 RUE DE LA PAIX","75002 PARIS","FRANCE"]
 * ```
 */
interface LaPosteFormattingOptions {
  includeCountry?: boolean; // FRANCE as the last line, for mail from abroad (or MONACO, or the collectivity's name)
  keepAccents?: boolean; // Keep the accents and the hyphens: La Poste reads them, though the norm asks for none
}

const COUNTRY_LINES: Readonly<Record<string, string>> = {
  BL: "SAINT BARTHELEMY",
  FR: "FRANCE",
  MC: "MONACO",
  MF: "SAINT MARTIN",
  NC: "NOUVELLE CALEDONIE",
  PF: "POLYNESIE FRANCAISE",
  PM: "SAINT PIERRE ET MIQUELON",
  WF: "WALLIS ET FUTUNA",
};

const joined = (...words: (string | undefined)[]): string => words.filter(Boolean).join(" ");

/**
 * Writes an address in France as La Poste's specification asks (SP 8855): the person it is care of, then the line of the
 * apartment, the floor and the staircase, the line of the entrance and the building, the number and street, the
 * lieu-dit and the box, then the postcode, the commune and its CEDEX, each on its own line, in capitals without accents
 * or punctuation. The arrondissement of Paris, Lyon or Marseille is not written when there is a postcode, which carries
 * it (`75008 PARIS`, as La Poste's own list has it); without one it is written in two digits (`PARIS 08`).
 *
 * @param address - The address as `parseFrenchAddress` returns it.
 * @param options - Whether to add the country, and whether to keep accents (see `LaPosteFormattingOptions`).
 * @returns The lines, the same on one line, the delivery line (the number and street) and the last line.
 * @example
 * ```ts
 * import { formatLaPoste, parseFrenchAddress } from "@johnmorrisdotca/address-plus/fr";
 *
 * const parsedAddress1=parseFrenchAddress("Apt 12, Résidence Les Lilas, 4 bis av. des Écoles, 31000 Toulouse");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatLaPoste(parsedAddress1).lines);
 * // → ["APPARTEMENT 12","RESIDENCE LES LILAS","4 BIS AVENUE DES ECOLES","31000 TOULOUSE"]
 * ```
 */
function formatLaPoste(address: ParsedAddress, options: LaPosteFormattingOptions = {}): FormattedAddress {
  const lines: string[] = [];
  if (!address) return { lines, singleLine: "", country: "FR", format: "la-poste" };
  const country = address.country ?? "FR";
  const write = (text: string): string => (options.keepAccents ? text.toUpperCase() : foldedName(text));
  const push = (text: string): void => {
    if (text) lines.push(write(text));
  };

  if (address.careOf) push(joined("Chez", address.careOf));
  // La Poste's second line holds the delivery point: the apartment or box number, the floor, the staircase.
  push(
    joined(
      joined(address.secUnitType, address.secUnitNum),
      joined(address.floorType, address.floor),
      address.staircase ? `Escalier ${address.staircase}` : undefined,
    ),
  );
  // And its third the entrance and the building, residence or zone.
  push(joined(address.entrance ? `Entrée ${address.entrance}` : undefined, address.building));
  const deliveryLine = write(joined(address.number, address.numberExtension, address.type, address.street));
  if (deliveryLine) lines.push(deliveryLine);
  if (address.lieuDit) push(address.lieuDit);
  if (address.postalBoxType) push(joined(address.postalBoxType, address.postalBoxNum));
  const commune = joined(
    address.city,
    address.zip ? undefined : address.arrondissement?.padStart(2, "0"),
    address.cedex,
  );
  const lastLine = joined(address.zip, commune ? write(commune) : undefined);
  if (lastLine) lines.push(lastLine);
  if (options.includeCountry) lines.push(COUNTRY_LINES[country] ?? "FRANCE");

  return {
    lines,
    singleLine: lines.join(", "),
    ...(deliveryLine ? { deliveryLine } : {}),
    ...(lastLine ? { lastLine } : {}),
    country,
    format: "la-poste",
  };
}

export { formatLaPoste };
export type { LaPosteFormattingOptions };
