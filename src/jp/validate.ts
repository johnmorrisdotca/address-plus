// What can be checked about a Japanese address from the tables alone: the postal code's shape, which
// prefecture it delivers to, and whether the municipality is a real one in that prefecture.
//
// Codes reported:
//   INVALID_POSTAL_FORMAT            the postal code is not NNN-NNNN
//   UNRECOGNIZED_POSTAL_CODE         no Japanese postal code begins with its first three digits
//   POSTAL_REGION_MISMATCH           the postal code delivers to another prefecture
//   UNRECOGNIZED_MUNICIPALITY        the municipality is not in the table
//   AMBIGUOUS_MUNICIPALITY           the municipality's name is shared, and nothing says which is meant
//   MUNICIPALITY_PREFECTURE_MISMATCH the municipality is in another prefecture than the one named
// The postal findings are warnings, and errors with strictPostalValidation, as for the US and Canada.
// The municipality findings are always warnings: the tables can be a year behind a merger.

import {
  findMunicipalitiesByName,
  findMunicipalityByCode,
  findPrefecture,
  getPrefectureFromJapanesePostalCode,
  JP_POSTAL_PREFIXES,
} from "../constants/jp";
import type { ParsedAddress } from "../types/parsed-address";
import type { ValidationError, ValidationOptions } from "../types/validation";
import { POSTAL_CODE_SHAPE } from "./patterns";

/**
 * What `validateJapaneseAddress` returns: the errors and the warnings found.
 *
 * @example
 * ```ts
 * import { validateJapaneseAddress } from "@johnmorrisdotca/address-plus/jp";
 * import { parseLocation } from "@johnmorrisdotca/address-plus";
 * import type { JapaneseValidation } from "@johnmorrisdotca/address-plus/jp";
 *
 * const parsedAddress1=parseLocation("東京都大阪市北区梅田1-1");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(validateJapaneseAddress(parsedAddress1).warnings.map((one) => one.code));
 * // → ["MUNICIPALITY_PREFECTURE_MISMATCH"]
 * ```
 */
interface JapaneseValidation {
  errors: ValidationError[];
  warnings: ValidationError[];
}

type Finding = Omit<ValidationError, "severity">;

// The postal code's shape, whether it exists, and whether it delivers to the prefecture named.
function postalFindings(address: ParsedAddress): Finding[] {
  const { postalCode, prefectureCode } = address;
  if (!postalCode) return [];
  if (!POSTAL_CODE_SHAPE.test(postalCode)) {
    return [{ code: "INVALID_POSTAL_FORMAT", field: "zip", message: `Postal code ${postalCode} is not NNN-NNNN` }];
  }
  if (!JP_POSTAL_PREFIXES[postalCode.slice(0, 3)]) {
    return [
      {
        code: "UNRECOGNIZED_POSTAL_CODE",
        field: "zip",
        message: `No Japanese postal code begins with ${postalCode.slice(0, 3)}`,
      },
    ];
  }
  const delivered = getPrefectureFromJapanesePostalCode(postalCode);
  if (!prefectureCode || !delivered || delivered === prefectureCode) return [];
  const to = findPrefecture(delivered)?.name ?? delivered;
  const named = findPrefecture(prefectureCode)?.name ?? prefectureCode;

  return [
    {
      code: "POSTAL_REGION_MISMATCH",
      field: "zip",
      message: `Postal code ${postalCode} belongs to ${to}, not ${named}`,
    },
  ];
}

// Whether the municipality is known, and known to be in the prefecture named.
function municipalityFindings(address: ParsedAddress): Finding[] {
  const { municipality: name, municipalityCode, prefecture, prefectureCode } = address;
  if (name && !municipalityCode) {
    const sharing = findMunicipalitiesByName(name, prefectureCode);
    if (sharing.length > 1) {
      const where = sharing.map((candidate) => findPrefecture(candidate.prefecture)?.name ?? candidate.prefecture);

      return [
        {
          code: "AMBIGUOUS_MUNICIPALITY",
          field: "city",
          message: `${name} could be in ${where.join(" or ")}; add the prefecture or postal code`,
        },
      ];
    }

    return [
      { code: "UNRECOGNIZED_MUNICIPALITY", field: "city", message: `${name} is not a municipality in the table` },
    ];
  }
  if (!municipalityCode || !prefectureCode) return [];
  const municipality = findMunicipalityByCode(municipalityCode);
  if (!municipality || municipality.prefecture === prefectureCode) return [];
  const actual = findPrefecture(municipality.prefecture)?.name ?? municipality.prefecture;

  return [
    {
      code: "MUNICIPALITY_PREFECTURE_MISMATCH",
      field: "city",
      message: `${municipality.name} is in ${actual}, not ${prefecture ?? prefectureCode}`,
    },
  ];
}

/**
 * Checks a parsed Japanese address against the tables: the postal code's shape, whether any code begins with its first
 * three digits, whether it delivers to the prefecture named, and whether the municipality is a real one in that
 * prefecture.
 *
 * @param address - The address, as `parseLocation` returns it for a Japanese address.
 * @param options - `strictPostalValidation` makes the postal findings errors rather than warnings; the municipality
 * findings stay warnings.
 * @returns The errors and the warnings, each with its field, code and message.
 * @example
 * ```ts
 * import { validateJapaneseAddress } from "@johnmorrisdotca/address-plus/jp";
 * import { parseLocation } from "@johnmorrisdotca/address-plus";
 *
 * const parsedAddress1=parseLocation("〒530-0001 東京都千代田区丸の内1-2-3");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(validateJapaneseAddress(parsedAddress1).warnings.map((one) => one.code));
 * // → ["POSTAL_REGION_MISMATCH"]
 * ```
 */
function validateJapaneseAddress(address: ParsedAddress, options: ValidationOptions = {}): JapaneseValidation {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const strict = options.strictPostalValidation === true;
  for (const finding of postalFindings(address)) {
    if (strict) errors.push({ ...finding, severity: "error" });
    else warnings.push({ ...finding, severity: "warning" });
  }
  for (const finding of municipalityFindings(address)) warnings.push({ ...finding, severity: "warning" });

  return { errors, warnings };
}

export { validateJapaneseAddress };
export type { JapaneseValidation };
