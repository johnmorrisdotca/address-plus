// address-plus - A modern, TypeScript-first address parser and normalizer
// API-compatible with parse-address for seamless upgrades

import { parseAddress, parseInformalAddress, parseIntersection, parseLocation } from "./parser";
import type { AddressParser } from "./types";

/**
 * The default export, shaped like parse-address's module: `parseLocation`, `parseAddress`, `parseIntersection` and
 * `parseInformalAddress` on one object, so `import parser from "@johnmorrisdotca/address-plus"` works where
 * parse-address was imported. Named imports work too.
 *
 * @example
 * ```ts
 * import parser from "@johnmorrisdotca/address-plus";
 * import { parseLocation } from "@johnmorrisdotca/address-plus";
 *
 * const parsedAddress1=parser.parseLocation("123 Main St, New York, NY 10001");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(parsedAddress1.zip);
 * // → "10001"
 * ```
 */
const parser: AddressParser = {
  parseLocation,
  parseIntersection,
  parseInformalAddress,
  parseAddress,
};

// Export batch processing functions
export {
  parseAddresses,
  parseAddressesBatch,
  parseInformalAddresses,
  parseInformalAddressesBatch,
  parseIntersections,
  parseIntersectionsBatch,
  parseLocations,
  parseLocationsBatch,
} from "./batch-parser";

// Export parser functions
export { parseAddress, parseInformalAddress, parseIntersection, parseLocation };

// Export data and utilities for advanced usage
export * from "./constants";

// Export all types
export type * from "./types";

export * from "./utils";

// Comparison functions
export { compareAddresses, getAddressSimilarity, isSameAddress } from "./utils/address-comparison";

// Formatting functions
export { formatAddress, formatCanadaPost, formatUSPS, getAddressAbbreviations } from "./utils/address-formatting";

// Clean address functions
export { cleanAddress, cleanAddressDetailed } from "./utils/clean-address";
// Validation functions
export { getValidationErrors, isValidAddress, validateAddress } from "./utils/comprehensive-validation";

// Japanese addresses; the whole module is also "@johnmorrisdotca/address-plus/jp"
export { formatJapanese, formatJapaneseEnglish } from "./jp/format";
export type { JapaneseEnglishFormattingOptions, JapaneseFormattingOptions } from "./jp/format";
export { kanjiNumeralsToDigits, normalizeJapaneseAddressText } from "./jp/normalize";
export { looksJapanese, parseJapaneseAddress } from "./jp/parse";
export { validateJapaneseAddress } from "./jp/validate";
export type { JapaneseValidation } from "./jp/validate";

export default parser;
