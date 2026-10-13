// Types for clean address string functionality

import type { AddressFormattingOptions } from "./formatting";

/**
 * Options for `cleanAddress`: which tidying to do, and the letter case to set.
 *
 * @example
 * ```ts
 * import { cleanAddress } from "@johnmorrisdotca/address-plus";
 * import type { CleanAddressOptions } from "@johnmorrisdotca/address-plus";
 *
 * console.log(cleanAddress("123 main st, anytown, ny 12345", { standardizeCase: "upper" }));
 * // → "123 MAIN ST, ANYTOWN NY 12345"
 * ```
 */
interface CleanAddressOptions extends AddressFormattingOptions {
  format?: "standard" | "usps" | "canada-post"; // Desired output format
  removeExtraSpaces?: boolean; // Whether to remove redundant spaces
  standardizeCase?: "upper" | "lower" | "title" | "none"; // Case standardization option
  expandAbbreviations?: boolean; // Whether to expand abbreviations to full forms
}

/**
 * What `cleanAddressDetailed` returns: the tidied address and what changed.
 *
 * @example
 * ```ts
 * import { cleanAddressDetailed } from "@johnmorrisdotca/address-plus";
 * import type { CleanAddressResult } from "@johnmorrisdotca/address-plus";
 *
 * console.log(cleanAddressDetailed("123 main st, anytown, ny 12345").wasModified);
 * // → true
 * ```
 */
interface CleanAddressResult {
  cleanedAddress: string; // The cleaned address string
  wasModified: boolean; // Whether any modifications were made
  changes: string[]; // List of changes made to the address
}

export type { CleanAddressOptions, CleanAddressResult };
