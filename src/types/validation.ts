// Types for address validation results and confidence scoring

import type { ParseOptions } from "./parse-options";

/**
 * One finding of a validator: the field it is about, its code, a message, and how serious it is.
 *
 * @example
 * ```ts
 * import { validateAddress } from "@johnmorrisdotca/address-plus";
 * import type { ValidationError } from "@johnmorrisdotca/address-plus/jp";
 *
 * console.log(validateAddress("123 Main St, Seattle, NY 98101").warnings[0]);
 * // → {"field":"zip","code":"POSTAL_REGION_MISMATCH","message":"ZIP code 98101 belongs to WA, not NY","severity":"warning"}
 * ```
 */
interface ValidationError {
  field: string; // Field name where error occurred
  code: string; // Error code identifier
  message: string; // Human-readable error message
  severity: "error" | "warning" | "info"; // Severity level of the validation issue
}

/**
 * What `validateAddress` returns.
 *
 * @example
 * ```ts
 * import { validateAddress } from "@johnmorrisdotca/address-plus";
 * import type { AddressValidationResult } from "@johnmorrisdotca/address-plus";
 *
 * console.log(validateAddress("1600 Pennsylvania Ave NW, Washington, DC 20500").isValid);
 * // → true
 * ```
 */
interface AddressValidationResult {
  isValid: boolean; // Whether the address passed validation
  confidence: number; // 0-1 score indicating parsing confidence
  completeness: number; // 0-1 score indicating how complete the address is
  errors: ValidationError[]; // List of validation errors found
  warnings: ValidationError[]; // List of validation warnings
  suggestions: string[]; // Suggestions for improving the address
  parsedAddress: import("./parsed-address").ParsedAddress | null; // Parsed address result or null if parsing failed
}

/**
 * Options for the validators: which parts an address must have, which kinds are allowed, and whether a postal code
 * that does not match its region is an error.
 *
 * @example
 * ```ts
 * import { validateAddress } from "@johnmorrisdotca/address-plus";
 * import type { ValidationOptions } from "@johnmorrisdotca/address-plus/jp";
 *
 * console.log(validateAddress("123 Main St", { requirePostalCode: true }).errors.map((error) => error.code));
 * // → ["MISSING_POSTAL_CODE"]
 * ```
 */
interface ValidationOptions {
  requireStreetNumber?: boolean; // Whether street number is required
  requireStreetName?: boolean; // Whether street name is required
  requireCity?: boolean; // Whether city is required
  requireState?: boolean; // Whether state/province is required
  requirePostalCode?: boolean; // Whether postal code is required
  allowPOBox?: boolean; // Whether PO Box addresses are allowed
  allowRuralRoute?: boolean; // Whether rural route addresses are allowed
  allowGeneralDelivery?: boolean; // Whether general delivery addresses are allowed
  strictPostalValidation?: boolean; // Whether to use strict postal code validation
  country?: ParseOptions["country"]; // Country context for validation rules; AU, GB, FR, DE and the rest need their module in countries
  countries?: readonly import("./country-module").CountryModule[]; // Country modules to read beside the US, Canada and Japan
}

export type { AddressValidationResult, ValidationError, ValidationOptions };
