// Addresses in France (and Monaco, and the overseas departments and collectivities, which La Poste addresses the same
// way): import "@johnmorrisdotca/address-plus/fr" for the parser, the validator, the La Poste formatter, the comparer,
// the postcode lookups and the tables, and pass `france` to parseLocation in `countries` to read French addresses
// beside the US, Canadian and Japanese ones. Nothing here is in the main entry point.

import type { CountryModule } from "../types/country-module";
import { compareFrenchAddresses } from "./compare";
import { formatLaPoste } from "./format";
import { looksFrench, parseFrenchAddress } from "./parse";
import { validateFrenchAddress } from "./validate";

/**
 * France's module, for `parseLocation` and `validateAddress`: pass it in `countries`, and an address that ends with
 * France (or Monaco or an overseas territory), holds CEDEX, or has a French type of voie and a postcode first on its
 * last line is read as French; `country: "FR"` reads any address as one, and so does the code of an overseas department
 * or collectivity. It reads Monaco (`MC`) and the collectivities (`PM`, `BL`, `MF`, `WF`, `PF`, `NC`) too, and reports
 * their own codes.
 *
 * @example
 * ```ts
 * import { parseLocation } from "@johnmorrisdotca/address-plus";
 * import { france } from "@johnmorrisdotca/address-plus/fr";
 *
 * console.log(parseLocation("12 bis rue de la Paix, 75002 Paris, France", { countries: [france] })?.numberExtension);
 * // → "bis"
 * ```
 */
const france: CountryModule = {
  code: "FR",
  codes: ["FR", "MC", "GP", "MQ", "GF", "RE", "YT", "PM", "BL", "MF", "WF", "PF", "NC"],
  name: "France",
  detect: looksFrench,
  parse: parseFrenchAddress,
  validate: validateFrenchAddress,
  format: (address) => formatLaPoste(address),
  compare: compareFrenchAddresses,
};

export {
  findFrenchDepartment,
  FR_COLLECTIVITIES,
  FR_DEPARTMENTS,
  getDepartmentFromFrenchPostcode,
  isKnownFrenchPostcode,
  isValidFrenchPostcode,
  parseFrenchPostcode,
} from "../constants/fr";
export { FR_BUILDING_WORDS, FR_NUMBER_EXTENSIONS, FR_STREET_TYPES, FR_UNIT_TYPES } from "../constants/fr/words";
export type { CountryComparison, CountryDifference, CountryModule, CountryValidation } from "../types/country-module";
export type { FormattedAddress } from "../types/formatting";
export type {
  FrenchAddressFields,
  FrenchCollectivity,
  FrenchDepartment,
  FrenchPostalCountry,
  FrenchPostcode,
} from "../types/france";
export type { ParseOptions } from "../types/parse-options";
export type { ParsedAddress } from "../types/parsed-address";
export type { ValidationError, ValidationOptions } from "../types/validation";
export { compareFrenchAddresses } from "./compare";
export { formatLaPoste } from "./format";
export type { LaPosteFormattingOptions } from "./format";
export { looksFrench, parseFrenchAddress } from "./parse";
export { france, validateFrenchAddress };
