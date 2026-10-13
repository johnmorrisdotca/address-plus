// What can be checked about an address in the United Kingdom from the tables alone: the postcode's grammar, whether
// Royal Mail uses its area, and, in Great Britain, whether Code-Point Open lists its district. Northern Ireland's
// districts are not in the open data, so a BT postcode is checked only to its area.
//
// Codes reported:
//   INVALID_POSTAL_FORMAT     the postcode does not follow Royal Mail's grammar
//   UNRECOGNIZED_POSTAL_CODE  its area is not one Royal Mail uses, or its district is not in Code-Point Open
//   OUTSIDE_UK                its area is Jersey's, Guernsey's or the Isle of Man's, which are not in the UK
//   MISSING_POSTAL_CODE       no postcode (and no BFPO number) is given
//   MISSING_CITY              no post town is given
// The postcode findings are warnings, and errors with strictPostalValidation; OUTSIDE_UK is always a warning.

import { GB_POSTCODE_AREAS, isKnownUKDistrict, isValidUKPostcode, parseUKPostcode } from "../constants/gb";
import { finding } from "../country/shared";
import type { CountryValidation } from "../types/country-module";
import type { ParsedAddress } from "../types/parsed-address";
import type { ValidationOptions } from "../types/validation";

const CROWN_DEPENDENCY_NAMES: Readonly<Record<string, string>> = {
  GY: "Guernsey",
  IM: "the Isle of Man",
  JE: "Jersey",
};

/**
 * Checks an address in the United Kingdom against Royal Mail's postcode grammar and the tables: the postcode is well
 * formed, Royal Mail uses its area, and in Great Britain Code-Point Open lists its district. Says when a postcode is
 * Jersey's, Guernsey's or the Isle of Man's, which are not part of the UK, and warns when the postcode or the post
 * town is missing.
 *
 * @param address - The address as `parseUKAddress` (or `parseLocation` with the module) returns it.
 * @param options - `strictPostalValidation: true` makes the postcode findings errors; the rest are not used.
 * @returns The errors and warnings, each with its field, code and message.
 * @example
 * ```ts
 * import { parseUKAddress, validateUKAddress } from "@johnmorrisdotca/address-plus/gb";
 *
 * const parsedAddress1=parseUKAddress("1 High Street, London EC9Z 1AA");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(validateUKAddress(parsedAddress1).warnings.map((one) => one.code));
 * // → ["INVALID_POSTAL_FORMAT"]
 * ```
 */
function validateUKAddress(address: ParsedAddress, options: ValidationOptions = {}): CountryValidation {
  const errors: CountryValidation["errors"] = [];
  const warnings: CountryValidation["warnings"] = [];
  if (!address) return { errors, warnings };
  const strict = options.strictPostalValidation === true;
  const add = (found: ReturnType<typeof finding>): void => {
    (found.severity === "error" ? errors : warnings).push(found);
  };

  const { zip } = address;
  if (zip) {
    const parsed = parseUKPostcode(zip);
    if (!isValidUKPostcode(zip)) {
      add(
        finding("zip", "INVALID_POSTAL_FORMAT", `Postcode ${zip} does not follow Royal Mail's postcode format`, strict),
      );
    } else if (!parsed) {
      const area = /^[A-Z]+/i.exec(zip)?.[0].toUpperCase();
      add(finding("zip", "UNRECOGNIZED_POSTAL_CODE", `No postcode area ${area} is in use`, strict));
    } else if (isKnownUKDistrict(parsed.district) === false) {
      add(
        finding(
          "zip",
          "UNRECOGNIZED_POSTAL_CODE",
          `No postcode district ${parsed.district} is in use in the ${GB_POSTCODE_AREAS[parsed.area]?.name ?? parsed.area} area`,
          strict,
        ),
      );
    }
    if (parsed && parsed.country !== "GB") {
      add(
        finding(
          "zip",
          "OUTSIDE_UK",
          `Postcode ${parsed.postcode} is ${CROWN_DEPENDENCY_NAMES[parsed.country]}'s, which is not part of the United Kingdom`,
          false,
        ),
      );
    }
  } else if (!address.bfpo) {
    add(finding("zip", "MISSING_POSTAL_CODE", "Postcode not specified", false));
  }
  if (!address.city && !address.bfpo) add(finding("city", "MISSING_CITY", "Post town not specified", false));

  return { errors, warnings };
}

export { validateUKAddress };
