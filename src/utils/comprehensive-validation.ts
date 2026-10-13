// Comprehensive address validation with confidence scoring and detailed error reporting

import { getProvinceFromPostalCode, getStateFromZip, validatePostalCode } from "../constants";
import { validateJapaneseAddress } from "../jp/validate";
import { parseLocation } from "../parser";
import type { AddressValidationResult, ParsedAddress, ValidationError, ValidationOptions } from "../types";
import { normalizeRegion } from "../utils";

// Constants for validation scoring
const CONFIDENCE_WEIGHTS = {
  streetNumber: 0.15,
  streetName: 0.25,
  streetType: 0.1,
  city: 0.2,
  state: 0.15,
  postalCode: 0.15,
};

const COMPLETENESS_WEIGHTS = {
  streetNumber: 0.2,
  streetName: 0.25,
  city: 0.2,
  state: 0.15,
  postalCode: 0.2,
};

/**
 * Checks an address: whether it has what an address needs, whether its ZIP or postal code is well formed and belongs
 * to the state, province or prefecture named, and how sure the parser is. With country modules in
 * `options.countries`, an Australian or British address is checked by its module's validator.
 *
 * @param addressString - The address as one string.
 * @param options - What to require and how strict to be (see `ValidationOptions`).
 * @returns Whether it is valid, the confidence and completeness from 0 to 1, every error and warning with its code,
 * suggestions, and the parsed address (`null` when it could not be parsed).
 * @example
 * ```ts
 * import { validateAddress } from "@johnmorrisdotca/address-plus";
 *
 * console.log(validateAddress("123 Main St, Seattle, NY 98101").warnings[0].code);
 * // → "POSTAL_REGION_MISMATCH"
 * ```
 */
function validateAddress(addressString: string, options: ValidationOptions = {}): AddressValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const suggestions: string[] = [];

  // Parse the address first
  const parsedAddress = parseLocation(addressString, {
    country: options.country,
    countries: options.countries,
    strict: options.strictPostalValidation,
    validatePostalCode: true,
  });

  // Check if address is actually parseable (has meaningful components)
  const isUnparseable =
    !parsedAddress ||
    (!parsedAddress.number &&
      !parsedAddress.city &&
      !parsedAddress.state &&
      !parsedAddress.zip &&
      parsedAddress.street &&
      !/\b(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|lane|ln|court|ct|place|pl)\b/i.test(
        parsedAddress.street,
      ));

  if (isUnparseable) {
    return {
      isValid: false,
      confidence: 0,
      completeness: 0,
      errors: [
        {
          field: "address",
          code: "UNPARSEABLE",
          message: "Address could not be parsed",
          severity: "error",
        },
      ],
      warnings: [],
      suggestions: ["Check address format and try again"],
      parsedAddress: null,
    };
  }

  // Validate required fields
  validateRequiredFields(parsedAddress, options, errors);

  // An address a country module read is checked by that module, completeness included: it knows what its
  // country's addresses must hold (the United Kingdom has no state to miss).
  const countryModule = options.countries?.find((module) => module.codes.includes(parsedAddress.country ?? ""));
  if (countryModule) {
    const found = countryModule.validate(parsedAddress, options);
    errors.push(...found.errors);
    warnings.push(...found.warnings);
  } else if (parsedAddress.country === "JP") {
    // A Japanese address has no street type or state abbreviation to check; its own checks replace them.
    const japan = validateJapaneseAddress(parsedAddress, options);
    errors.push(...japan.errors);
    warnings.push(...japan.warnings);
  } else {
    // Validate field formats and content
    validateFieldFormats(parsedAddress, errors, warnings);

    // Validate postal code if present
    validatePostalCodeField(parsedAddress, options, errors, warnings);

    // Validate state/province
    validateStateProvince(parsedAddress, warnings);

    // The postal code must belong to the state or province named
    validatePostalRegion(parsedAddress, options, errors, warnings);
  }

  // Check for incomplete addresses and add warnings
  if (!countryModule) checkCompletenessWarnings(parsedAddress, warnings);

  // Generate suggestions
  generateSuggestions(parsedAddress, addressString, suggestions);

  // Calculate confidence and completeness scores
  const confidence = calculateConfidence(parsedAddress, errors.length);
  const completeness = calculateCompleteness(parsedAddress);

  return {
    isValid: errors.length === 0,
    confidence,
    completeness,
    errors,
    warnings,
    suggestions,
    parsedAddress,
  };
}

/**
 * Whether an address passes `validateAddress`.
 *
 * @param addressString - The address as one string.
 * @param options - What to require and how strict to be (see `ValidationOptions`).
 * @returns `true` when it has no errors, `false` otherwise. Warnings do not make it invalid unless
 * `strictPostalValidation` turns them into errors.
 * @example
 * ```ts
 * import { isValidAddress } from "@johnmorrisdotca/address-plus";
 *
 * console.log(isValidAddress("123 Main St, Seattle, NY 98101", { strictPostalValidation: true }));
 * // → false
 * ```
 */
function isValidAddress(addressString: string, options: ValidationOptions = {}): boolean {
  const result = validateAddress(addressString, options);

  // Consider address valid if it has no errors and meets minimum confidence
  // For basic validation without strict requirements, lower the confidence threshold
  const minConfidence = hasStrictRequirements(options) ? 0.7 : 0.5;

  return result.isValid && result.confidence >= minConfidence;
}

// Check if validation options have strict requirements
function hasStrictRequirements(options: ValidationOptions): boolean {
  return !!(
    options.requireCity ||
    options.requireState ||
    options.requirePostalCode ||
    options.requireStreetName ||
    options.requireStreetNumber ||
    options.strictPostalValidation
  );
}

/**
 * The errors `validateAddress` finds, without the rest of its result.
 *
 * @param addressString - The address as one string.
 * @param options - What to require and how strict to be (see `ValidationOptions`).
 * @returns The errors, each with its field, code and message; an empty array when there are none.
 * @example
 * ```ts
 * import { getValidationErrors } from "@johnmorrisdotca/address-plus";
 *
 * console.log(getValidationErrors("123 Main St, Seattle, NY 98101", { strictPostalValidation: true }).map((error) => error.code));
 * // → ["POSTAL_REGION_MISMATCH"]
 * ```
 */
function getValidationErrors(addressString: string, options: ValidationOptions = {}): ValidationError[] {
  const result = validateAddress(addressString, options);
  return [...result.errors, ...result.warnings];
}

// Helper functions

function validateRequiredFields(address: ParsedAddress, options: ValidationOptions, errors: ValidationError[]): void {
  if (options.requireStreetNumber && !address.number) {
    errors.push({
      field: "number",
      code: "MISSING_STREET_NUMBER",
      message: "Street number is required",
      severity: "error",
    });
  }

  if (options.requireStreetName && !address.street) {
    errors.push({
      field: "street",
      code: "MISSING_STREET_NAME",
      message: "Street name is required",
      severity: "error",
    });
  }

  if (options.requireCity && !address.city) {
    errors.push({
      field: "city",
      code: "MISSING_CITY",
      message: "City is required",
      severity: "error",
    });
  }

  if (options.requireState && !address.state) {
    errors.push({
      field: "state",
      code: "MISSING_STATE",
      message: "State/Province is required",
      severity: "error",
    });
  }

  if (options.requirePostalCode && !address.zip) {
    errors.push({
      field: "zip",
      code: "MISSING_POSTAL_CODE",
      message: "Postal/ZIP code is required",
      severity: "error",
    });
  }
}

function validateFieldFormats(address: ParsedAddress, errors: ValidationError[], warnings: ValidationError[]): void {
  // Validate street number format
  if (address.number && !/^\d+[A-Z]?(-\d+)?$/.test(address.number)) {
    if (!/^\d/.test(address.number)) {
      errors.push({
        field: "number",
        code: "INVALID_STREET_NUMBER",
        message: "Street number should start with a digit",
        severity: "error",
      });
    }
  }

  // Check for suspicious street names
  if (address.street && address.street.length < 2) {
    warnings.push({
      field: "street",
      code: "SHORT_STREET_NAME",
      message: "Street name appears unusually short",
      severity: "warning",
    });
  }

  // Check for missing street type
  if (address.street && !address.type && !address.street.match(/\b(st|ave|rd|dr|blvd|ln|ct|pl)\b/i)) {
    warnings.push({
      field: "type",
      code: "MISSING_STREET_TYPE",
      message: "Street type (St, Ave, Rd, etc.) not specified",
      severity: "warning",
    });
  }
}

function validatePostalCodeField(
  address: ParsedAddress,
  options: ValidationOptions,
  errors: ValidationError[],
  warnings: ValidationError[],
): void {
  if (address.zip) {
    const validationResult = validatePostalCode(address.zip);

    if (!validationResult.isValid && options.strictPostalValidation) {
      errors.push({
        field: "zip",
        code: "INVALID_POSTAL_FORMAT",
        message: `Invalid ${address.country === "CA" ? "postal" : "ZIP"} code format`,
        severity: "error",
      });
    } else if (!validationResult.isValid) {
      warnings.push({
        field: "zip",
        code: "QUESTIONABLE_POSTAL_FORMAT",
        message: `${address.country === "CA" ? "Postal" : "ZIP"} code format may be incorrect`,
        severity: "warning",
      });
    }

    // Additional validation: check if postal code type matches country
    if (validationResult.isValid && validationResult.type) {
      if (address.country === "CA" && validationResult.type === "zip") {
        warnings.push({
          field: "zip",
          code: "POSTAL_COUNTRY_MISMATCH",
          message: "ZIP code format detected but country appears to be Canada",
          severity: "warning",
        });
      } else if (address.country === "US" && validationResult.type === "postal") {
        warnings.push({
          field: "zip",
          code: "POSTAL_COUNTRY_MISMATCH",
          message: "Canadian postal code format detected but country appears to be US",
          severity: "warning",
        });
      }
    }
  }
}

function validateStateProvince(address: ParsedAddress, warnings: ValidationError[]): void {
  if (address.state) {
    const normalized = normalizeRegion(address.state);
    if (!normalized) {
      warnings.push({
        field: "state",
        code: "UNRECOGNIZED_STATE",
        message: "State/Province not recognized",
        severity: "warning",
      });
    }
  }
}

// A Canadian postal code's first letter, and a US ZIP code's first three digits, name the province or
// state they belong to. A code that names another one is a mistake in the address, however well formed.
function validatePostalRegion(
  address: ParsedAddress,
  options: ValidationOptions,
  errors: ValidationError[],
  warnings: ValidationError[],
): void {
  if (!address.zip || !address.state) return;
  const region = normalizeRegion(address.state);
  if (!region) return;

  const codeRegion =
    region.country === "CA" ? getProvinceFromPostalCode(address.zip) : getStateFromZip(address.zip.trim());
  // A code that names no region is reported by the format checks; silence here rather than a guess.
  if (!codeRegion || codeRegion === region.abbr) return;
  // X covers all three territories, and only some of its prefixes are told apart.
  if (region.country === "CA" && /^X/i.test(address.zip.trim()) && ["NT", "NU"].includes(region.abbr)) return;

  const finding: ValidationError = {
    field: "zip",
    code: "POSTAL_REGION_MISMATCH",
    message: `${region.country === "CA" ? "Postal" : "ZIP"} code ${address.zip} belongs to ${codeRegion}, not ${region.abbr}`,
    severity: options.strictPostalValidation ? "error" : "warning",
  };
  (options.strictPostalValidation ? errors : warnings).push(finding);
}

function checkCompletenessWarnings(address: ParsedAddress, warnings: ValidationError[]): void {
  // Check for incomplete address components
  if (!address.city && !address.state && !address.zip) {
    warnings.push({
      field: "address",
      code: "INCOMPLETE_ADDRESS",
      message: "Address appears incomplete - missing city, state, and postal code",
      severity: "warning",
    });
  } else if (!address.city && !address.state) {
    warnings.push({
      field: "address",
      code: "MISSING_LOCATION",
      message: "Address missing city and state/province information",
      severity: "warning",
    });
  } else if (!address.city) {
    warnings.push({
      field: "city",
      code: "MISSING_CITY",
      message: "City not specified",
      severity: "warning",
    });
  } else if (!address.state) {
    warnings.push({
      field: "state",
      code: "MISSING_STATE",
      message: "State/Province not specified",
      severity: "warning",
    });
  }

  if (!address.zip) {
    warnings.push({
      field: "zip",
      code: "MISSING_POSTAL_CODE",
      message: "Postal/ZIP code not specified",
      severity: "warning",
    });
  }
}

function generateSuggestions(address: ParsedAddress, originalInput: string, suggestions: string[]): void {
  // Suggest adding missing components; a Japanese address has no street type to add
  if (!address.type && address.street && (address.country === undefined || ["US", "CA"].includes(address.country))) {
    suggestions.push("Consider adding street type (St, Ave, Rd, etc.)");
  }

  if (!address.city && address.state) {
    suggestions.push("Add city name for better address completeness");
  }

  if (!address.zip) {
    suggestions.push("Add postal/ZIP code for full address");
  }

  // Suggest format improvements
  if (originalInput.includes(",") && !address.city) {
    suggestions.push("Check comma placement - it may be affecting city parsing");
  }

  if (address.secUnitType && !address.secUnitNum) {
    suggestions.push("Unit type specified but unit number missing");
  }
}

function calculateConfidence(address: ParsedAddress, errorCount: number): number {
  let score = 0;

  // Add points for each parsed field
  if (address.number) score += CONFIDENCE_WEIGHTS.streetNumber;
  if (address.street) score += CONFIDENCE_WEIGHTS.streetName;
  if (address.type) score += CONFIDENCE_WEIGHTS.streetType;
  if (address.city) score += CONFIDENCE_WEIGHTS.city;
  if (address.state) score += CONFIDENCE_WEIGHTS.state;
  if (address.zip && address.zipValid) score += CONFIDENCE_WEIGHTS.postalCode;

  // Reduce score for errors
  score = Math.max(0, score - errorCount * 0.1);

  return Math.round(score * 100) / 100;
}

function calculateCompleteness(address: ParsedAddress): number {
  let score = 0;

  if (address.number) score += COMPLETENESS_WEIGHTS.streetNumber;
  if (address.street) score += COMPLETENESS_WEIGHTS.streetName;
  if (address.city) score += COMPLETENESS_WEIGHTS.city;
  if (address.state) score += COMPLETENESS_WEIGHTS.state;
  if (address.zip) score += COMPLETENESS_WEIGHTS.postalCode;

  return Math.round(score * 100) / 100;
}

export { getValidationErrors, isValidAddress, validateAddress };
