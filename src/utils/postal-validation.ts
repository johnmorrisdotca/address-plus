// Postal code validation utilities

import { CANADIAN_POSTAL_CODE_PATTERN, ZIP_CODE_PATTERN } from "../patterns/location-patterns";

/**
 * What `validatePostalCode` returns: whether the code is well formed, its type, and the code written the standard way.
 *
 * @example
 * ```ts
 * import { validatePostalCode } from "@johnmorrisdotca/address-plus";
 * import type { PostalValidationResult } from "@johnmorrisdotca/address-plus";
 *
 * console.log(validatePostalCode("98101"));
 * // → {"isValid":true,"type":"zip","formatted":"98101","message":"Valid US ZIP code format"}
 * ```
 */
interface PostalValidationResult {
  isValid: boolean;
  type: "zip" | "postal" | null;
  formatted?: string;
  message?: string;
}

/**
 * Checks the shape of a US ZIP code or a Canadian postal code.
 *
 * @param code - The code, with or without the space or the ZIP+4.
 * @returns Whether it is well formed, its type (`zip` or `postal`), and the code written the standard way.
 * @example
 * ```ts
 * import { validatePostalCode } from "@johnmorrisdotca/address-plus";
 *
 * console.log(validatePostalCode("k1a0b1"));
 * // → {"isValid":true,"type":"postal","formatted":"K1A 0B1","message":"Valid Canadian postal code format"}
 * ```
 */
const validatePostalCode = (code: string): PostalValidationResult => {
  if (!code || typeof code !== "string") {
    return {
      isValid: false,
      type: null,
      message: "No postal code provided",
    };
  }

  const trimmed = code.trim();

  // Check US ZIP code format
  if (ZIP_CODE_PATTERN.test(trimmed)) {
    const match = trimmed.match(ZIP_CODE_PATTERN);
    if (match) {
      const formatted = match[2] ? `${match[1]}-${match[2]}` : match[1];

      return {
        isValid: true,
        type: "zip",
        formatted,
        message: "Valid US ZIP code format",
      };
    }
  }

  // Check Canadian postal code format
  if (CANADIAN_POSTAL_CODE_PATTERN.test(trimmed)) {
    const match = trimmed.toUpperCase().match(CANADIAN_POSTAL_CODE_PATTERN);
    if (match) {
      const formatted = `${match[1]} ${match[2]}`;

      return {
        isValid: true,
        type: "postal",
        formatted,
        message: "Valid Canadian postal code format",
      };
    }
  }

  return {
    isValid: false,
    type: null,
    message: "Invalid postal code format. Expected US ZIP (12345 or 12345-6789) or Canadian postal code (A1A 1A1)",
  };
};

export { validatePostalCode };
export type { PostalValidationResult };
