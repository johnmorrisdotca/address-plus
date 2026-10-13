import { COUNTRIES } from "../constants";
import { buildPatterns } from "../patterns/pattern-builder";
import type { ParsedAddress, ParseOptions } from "../types";
import { hasValidAddressComponents, setValidatedPostalCode } from "../utils/address-validation";

/**
 * Reads an address written loosely, as a fallback when `parseLocation` finds no street address: a description such as
 * `Downtown near City Hall` is kept whole as the street, with any ZIP code after it.
 *
 * @param address - The address as one string.
 * @param options - How to parse (see `ParseOptions`).
 * @returns The street and the ZIP code it could find, or `null` when the text is empty.
 * @example
 * ```ts
 * import { parseInformalAddress } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseInformalAddress("Downtown near City Hall, Springfield IL 62701"));
 * // → {"street":"Downtown near City Hall","zip":"62701","country":"US"}
 * ```
 */
function parseInformalAddress(address: string, options: ParseOptions = {}): ParsedAddress | null {
  const patterns = buildPatterns();

  // Check if input contains valid address components
  if (!hasValidAddressComponents(address)) {
    return null;
  }

  // Simple fallback pattern
  const parts = address.split(/\s*,\s*/);
  if (parts.length === 0) return null;

  const result: ParsedAddress = {};

  // Try to extract number from first part
  const firstPart = parts[0];
  const numberMatch = firstPart.match(new RegExp(`^\\s*${patterns.number}\\s+(.+)$`));
  if (numberMatch) {
    result.number = numberMatch[1];
    result.street = numberMatch[2];
  } else {
    result.street = firstPart;
  }

  // Extract ZIP from last part
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    const zipMatch = lastPart.match(new RegExp(patterns.zip));
    if (zipMatch) {
      setValidatedPostalCode(result, zipMatch[1], options);
      result.country = COUNTRIES.UNITED_STATES;
    }
  }

  return result;
}

export { parseInformalAddress };
