// What can be checked about an address in France from the tables alone: the postcode's shape, whether its number names
// a department, a collectivity or Monaco, whether La Poste's base lists it, and whether it is France's at all.
//
// Codes reported:
//   INVALID_POSTAL_FORMAT     the postcode is not five digits
//   UNRECOGNIZED_POSTAL_CODE  its number names no department or territory, or La Poste's base does not list it
//   OUTSIDE_FRANCE            its number is Monaco's or an overseas collectivity's, which have country codes of their own
//   MISSING_POSTAL_CODE       no postcode is given
//   MISSING_CITY              no commune is given
// A postcode with a CEDEX is not looked for in La Poste's base, which lists communes' postcodes and not CEDEX codes.
// The postcode findings are warnings, and errors with strictPostalValidation; OUTSIDE_FRANCE is always a warning.

import { isValidFrenchPostcode, parseFrenchPostcode } from "../constants/fr";
import { finding } from "../country/shared";
import type { CountryValidation } from "../types/country-module";
import type { ParsedAddress } from "../types/parsed-address";
import type { ValidationOptions } from "../types/validation";

const TERRITORY_NAMES: Readonly<Record<string, string>> = {
  BL: "Saint-Barthélemy",
  MC: "Monaco",
  MF: "Saint-Martin",
  NC: "New Caledonia",
  PF: "French Polynesia",
  PM: "Saint-Pierre-et-Miquelon",
  WF: "Wallis and Futuna",
};

/**
 * Checks an address in France against La Poste's postcode shape and the tables: the postcode is five digits, its
 * number names a department, a collectivity or Monaco, and La Poste's base officielle lists it. Says when a postcode
 * is Monaco's or an overseas collectivity's, which have country codes of their own, and warns when the postcode or the
 * commune is missing.
 *
 * @param address - The address as `parseFrenchAddress` (or `parseLocation` with the module) returns it.
 * @param options - `strictPostalValidation: true` makes the postcode findings errors; the rest are not used.
 * @returns The errors and warnings, each with its field, code and message.
 * @example
 * ```ts
 * import { parseFrenchAddress, validateFrenchAddress } from "@johnmorrisdotca/address-plus/fr";
 *
 * const parsedAddress1=parseFrenchAddress("12 rue de la Paix, 75099 Paris");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(validateFrenchAddress(parsedAddress1).warnings.map((one) => one.code));
 * // → ["UNRECOGNIZED_POSTAL_CODE"]
 * ```
 */
function validateFrenchAddress(address: ParsedAddress, options: ValidationOptions = {}): CountryValidation {
  const errors: CountryValidation["errors"] = [];
  const warnings: CountryValidation["warnings"] = [];
  if (!address) return { errors, warnings };
  const strict = options.strictPostalValidation === true;
  const add = (found: ReturnType<typeof finding>): void => {
    (found.severity === "error" ? errors : warnings).push(found);
  };

  const { zip } = address;
  if (zip) {
    const parsed = parseFrenchPostcode(zip);
    if (!isValidFrenchPostcode(zip) || !parsed) {
      add(finding("zip", "INVALID_POSTAL_FORMAT", `Postcode ${zip} is not five digits`, strict));
    } else if (address.zipValid === false) {
      add(
        finding("zip", "UNRECOGNIZED_POSTAL_CODE", `No department or territory has the number ${parsed.place}`, strict),
      );
    } else if (!parsed.known && !address.cedex) {
      add(finding("zip", "UNRECOGNIZED_POSTAL_CODE", `Postcode ${zip} is not in La Poste's base officielle`, strict));
    }
    if (parsed && parsed.country !== "FR") {
      add(
        finding(
          "zip",
          "OUTSIDE_FRANCE",
          `Postcode ${parsed.postcode} is ${TERRITORY_NAMES[parsed.country]}'s, which has a country code of its own (${parsed.country}), not France's`,
          false,
        ),
      );
    }
  } else {
    add(finding("zip", "MISSING_POSTAL_CODE", "Postcode not specified", false));
  }
  if (!address.city) add(finding("city", "MISSING_CITY", "Commune not specified", false));

  return { errors, warnings };
}

export { validateFrenchAddress };
