// What can be checked about an Australian address from the tables alone: the postcode's shape, whether a state's
// block holds it, and whether that is the state named. A postcode that crosses a border passes with any state it
// serves, and the external territories' postcodes are not judged against a state.
//
// Codes reported:
//   INVALID_POSTAL_FORMAT     the postcode is not four digits
//   UNRECOGNIZED_POSTAL_CODE  no state's block of postcodes holds it
//   POSTAL_REGION_MISMATCH    the postcode belongs to another state than the one named
//   MISSING_STATE             no state or territory is given
//   MISSING_POSTAL_CODE       no postcode is given
//   MISSING_CITY              no suburb or town is given
// The postal findings are warnings, and errors with strictPostalValidation, as for the US, Canada and Japan.

import {
  AU_EXTERNAL_TERRITORY_POSTCODES,
  getStateFromAustralianPostcode,
  getStatesForAustralianPostcode,
} from "../constants/au";
import { finding } from "../country/shared";
import type { AustralianStateCode } from "../types/australia";
import type { CountryValidation } from "../types/country-module";
import type { ParsedAddress } from "../types/parsed-address";
import type { ValidationOptions } from "../types/validation";

const POSTCODE = /^\d{4}$/;

/**
 * Checks an Australian address against Australia Post's blocks of postcodes: the postcode is four digits, some
 * state's block holds it, and it is the state named, or one it serves across a border (from the ABS's Postal Areas).
 * Also warns when the state, the postcode or the suburb is missing.
 *
 * @param address - The address as `parseAustralianAddress` (or `parseLocation` with the module) returns it.
 * @param options - `strictPostalValidation: true` makes the postcode findings errors; the rest are not used.
 * @returns The errors and warnings, each with its field, code and message.
 * @example
 * ```ts
 * import { parseAustralianAddress, validateAustralianAddress } from "@johnmorrisdotca/address-plus/au";
 *
 * const parsedAddress1=parseAustralianAddress("1 Main St, Sydney VIC 2000");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(validateAustralianAddress(parsedAddress1).warnings[0].message);
 * // → "Postcode 2000 belongs to NSW, not VIC"
 * ```
 */
function validateAustralianAddress(address: ParsedAddress, options: ValidationOptions = {}): CountryValidation {
  const errors: CountryValidation["errors"] = [];
  const warnings: CountryValidation["warnings"] = [];
  if (!address) return { errors, warnings };
  const strict = options.strictPostalValidation === true;
  const add = (found: ReturnType<typeof finding>): void => {
    (found.severity === "error" ? errors : warnings).push(found);
  };

  const { zip, state } = address;
  if (zip) {
    if (!POSTCODE.test(zip)) {
      add(finding("zip", "INVALID_POSTAL_FORMAT", `Postcode ${zip} is not four digits`, strict));
    } else if (!getStateFromAustralianPostcode(zip)) {
      add(finding("zip", "UNRECOGNIZED_POSTAL_CODE", `No Australian state's postcodes include ${zip}`, strict));
    } else if (state && !AU_EXTERNAL_TERRITORY_POSTCODES.includes(zip)) {
      const serves = getStatesForAustralianPostcode(zip);
      if (!serves.includes(state as AustralianStateCode)) {
        add(
          finding(
            "zip",
            "POSTAL_REGION_MISMATCH",
            `Postcode ${zip} belongs to ${serves.join(" or ")}, not ${state}`,
            strict,
          ),
        );
      }
    }
  } else {
    add(finding("zip", "MISSING_POSTAL_CODE", "Postcode not specified", false));
  }
  if (!state) add(finding("state", "MISSING_STATE", "State or territory not specified", false));
  if (!address.city) add(finding("city", "MISSING_CITY", "Suburb or town not specified", false));

  return { errors, warnings };
}

export { validateAustralianAddress };
