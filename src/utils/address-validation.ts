// Address validation functions

import { validatePostalCode, VALIDATION_PATTERNS } from "../constants";
import { buildPatterns } from "../patterns/pattern-builder";
import { wholeWord } from "../patterns/word-boundary";
import type { ParsedAddress, ParsedIntersection, ParseOptions } from "../types";

/**
 * Whether a string looks like an address at all: a number and a street, a PO box, a postal code or another recognised
 * part.
 *
 * @param address - The text to look at.
 * @returns `true` when it holds something an address is made of.
 * @example
 * ```ts
 * import { hasValidAddressComponents } from "@johnmorrisdotca/address-plus";
 *
 * console.log(hasValidAddressComponents("123 Main St, Anytown, NY 12345"));
 * // → true
 * ```
 */
function hasValidAddressComponents(address: string): boolean {
  const patterns = buildPatterns();

  // Basic validation
  if (!VALIDATION_PATTERNS.HAS_LETTERS.test(address) || address.trim().length < 3) {
    return false;
  }

  // Reject if mostly special characters
  const alphanumericCount = (address.match(VALIDATION_PATTERNS.ALPHANUMERIC) || []).length;
  if (alphanumericCount < address.length * 0.3) {
    return false;
  }

  // Check for address-like patterns
  const hasNumber = VALIDATION_PATTERNS.HAS_DIGITS.test(address);
  const hasStreetType = new RegExp(wholeWord(patterns.streetType.slice(1, -1)), "iu").test(address);
  const hasDirectional = new RegExp(wholeWord(patterns.directional.slice(1, -1)), "iu").test(address);
  const hasState = new RegExp(wholeWord(patterns.state.slice(1, -1)), "iu").test(address);
  const hasZip = new RegExp(patterns.zip, "i").test(address);
  const hasCommaStructure = address.includes(",");
  const isIntersection = new RegExp(patterns.intersection, "i").test(address);
  const hasPoBox = new RegExp(patterns.poBox, "i").test(address);

  // Valid if has any address indicators
  if (
    hasNumber ||
    hasStreetType ||
    hasDirectional ||
    hasState ||
    hasZip ||
    hasCommaStructure ||
    isIntersection ||
    hasPoBox
  ) {
    return true;
  }

  // Be lenient with longer phrases (might be facility names)
  if (address.trim().split(VALIDATION_PATTERNS.WHITESPACE_SPLIT).length >= 3) {
    return true;
  }

  return false;
}

/**
 * Sets a ZIP or postal code on a result, the way the parsers do: split into ZIP and ZIP+4, a Canadian code in capitals
 * with one space, with `zipValid` set, and in strict mode only when the code is well formed. It changes the object it
 * is given.
 *
 * @param result - The parsed address or intersection to set the code on.
 * @param zipCode - The code as written.
 * @param options - `strict` keeps a malformed code out (see `ParseOptions`).
 * @example
 * ```ts
 * import { setValidatedPostalCode } from "@johnmorrisdotca/address-plus";
 *
 * const parsed = { city: "Toronto", state: "ON" };
 * setValidatedPostalCode(parsed, "m5h2n2", {});
 * console.log(parsed);
 * // → {"city":"Toronto","state":"ON","zip":"M5H 2N2"}
 * ```
 */
function setValidatedPostalCode(
  result: ParsedAddress | ParsedIntersection,
  zipCode: string,
  options: ParseOptions,
): void {
  const validation = validatePostalCode(zipCode);

  // In strict mode, only set ZIP if valid
  if (options.strict && !validation.isValid) {
    if ("number" in result) {
      (result as ParsedAddress).zipValid = false;
    }
    if (options.validatePostalCode && validation.type && "number" in result) {
      (result as ParsedAddress).postalType = validation.type;
    }
    return;
  }

  // Set the ZIP code
  result.zip = validation.isValid && validation.formatted ? validation.formatted : zipCode;

  // Set validation info if requested
  if (options.validatePostalCode) {
    if ("number" in result) {
      (result as ParsedAddress).zipValid = validation.isValid;
    }
    if (validation.type && "number" in result) {
      (result as ParsedAddress).postalType = validation.type;
    }
  } else if ("number" in result) {
    // Always set zipValid for developer awareness
    (result as ParsedAddress).zipValid = validation.isValid;
  }
}

export { hasValidAddressComponents, setValidatedPostalCode };
