// What can be checked about an address in Germany from the tables alone: the postcode's shape, whether GeoNames' list has
// it, and that the place and the postcode are given.
//
// Codes reported:
//   INVALID_POSTAL_FORMAT     the postcode is not five digits
//   UNRECOGNIZED_POSTAL_CODE  GeoNames' list for Germany does not have it
//   MISSING_POSTAL_CODE       no postcode is given (a Postfach has the postcode of its own)
//   MISSING_CITY              no place is given
//   MISSING_STREET_NUMBER     a street with no house number (a street alone, a Postfach and a Packstation excepted)
// The postcode findings are warnings, and errors with strictPostalValidation; the others are warnings.

import { isKnownGermanPostcode, isValidGermanPostcode } from "../constants/de";
import { finding } from "../country/shared";
import type { CountryValidation } from "../types/country-module";
import type { ParsedAddress } from "../types/parsed-address";
import type { ValidationOptions } from "../types/validation";

/**
 * Checks an address in Germany against Deutsche Post's postcode shape and GeoNames' list: the postcode is five digits and
 * the list has it, and the place and the house number are given. The list is GeoNames' and not Deutsche Post's, so a
 * postcode made since it was copied is flagged as unrecognised.
 *
 * @param address - The address as `parseGermanAddress` (or `parseLocation` with the module) returns it.
 * @param options - `strictPostalValidation: true` makes the postcode findings errors; the rest are not used.
 * @returns The errors and warnings, each with its field, code and message.
 * @example
 * ```ts
 * import { parseGermanAddress, validateGermanAddress } from "@johnmorrisdotca/address-plus/de";
 *
 * const parsedAddress1=parseGermanAddress("Hauptstraße 12, 00000 Berlin");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(validateGermanAddress(parsedAddress1).warnings.map((one) => one.code));
 * // → ["UNRECOGNIZED_POSTAL_CODE"]
 * ```
 */
function validateGermanAddress(address: ParsedAddress, options: ValidationOptions = {}): CountryValidation {
  const errors: CountryValidation["errors"] = [];
  const warnings: CountryValidation["warnings"] = [];
  if (!address) return { errors, warnings };
  const strict = options.strictPostalValidation === true;
  const add = (found: ReturnType<typeof finding>): void => {
    (found.severity === "error" ? errors : warnings).push(found);
  };

  const { zip } = address;
  if (zip) {
    if (!isValidGermanPostcode(zip)) {
      add(finding("zip", "INVALID_POSTAL_FORMAT", `Postcode ${zip} is not five digits`, strict));
    } else if (!isKnownGermanPostcode(zip)) {
      add(finding("zip", "UNRECOGNIZED_POSTAL_CODE", `Postcode ${zip} is not in GeoNames' list for Germany`, strict));
    }
  } else {
    add(finding("zip", "MISSING_POSTAL_CODE", "Postcode not specified", false));
  }
  if (!address.city) add(finding("city", "MISSING_CITY", "Place not specified", false));
  if (address.street && !address.number) {
    add(finding("number", "MISSING_STREET_NUMBER", "House number not specified", false));
  }

  return { errors, warnings };
}

export { validateGermanAddress };
