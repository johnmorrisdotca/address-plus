// Types for address comparison and similarity functions

import type { ParsedAddress } from "./index";

/**
 * Options for comparing addresses: what to normalize before comparing, whether to allow small typos, and whether every
 * field must match exactly.
 *
 * @example
 * ```ts
 * import { isSameAddress, parseLocation } from "@johnmorrisdotca/address-plus";
 * import type { AddressComparisonOptions } from "@johnmorrisdotca/address-plus";
 *
 * const parsedAddress1=parseLocation("123 Main St, Anytown, NY 12345");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * const parsedAddress2=parseLocation("123 Main Stret, Anytown, NY 12345");
 * if (!parsedAddress2) throw new Error("The example address did not parse.");
 * console.log(isSameAddress(parsedAddress1, parsedAddress2, { fuzzyMatching: false }));
 * // → false
 * ```
 */
interface AddressComparisonOptions {
  ignoreCase?: boolean; // Whether to ignore case when comparing text
  ignorePunctuation?: boolean; // Whether to ignore punctuation marks
  normalizeStreetTypes?: boolean; // Whether to normalize street type abbreviations
  normalizeDirections?: boolean; // Whether to normalize directional abbreviations
  normalizeStates?: boolean; // Whether to normalize state/province names
  fuzzyMatching?: boolean; // Whether to use fuzzy string matching
  strictPostalCode?: boolean; // Whether postal codes must match exactly
  requireExactMatch?: boolean; // Whether all fields must match exactly
}

/**
 * How alike two addresses are: an overall score from 0 to 1, a score for each part, and the differences.
 *
 * @example
 * ```ts
 * import { getAddressSimilarity, parseLocation } from "@johnmorrisdotca/address-plus";
 * import type { AddressSimilarityResult } from "@johnmorrisdotca/address-plus";
 *
 * const parsedAddress1=parseLocation("123 Main St, Anytown, NY 12345");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * const parsedAddress2=parseLocation("123 Main Street, Anytown, NY 12345");
 * if (!parsedAddress2) throw new Error("The example address did not parse.");
 * console.log(getAddressSimilarity(parsedAddress1, parsedAddress2).score);
 * // → 1
 * ```
 */
interface AddressSimilarityResult {
  score: number; // 0-1 similarity score
  isMatch: boolean; // Whether addresses are considered a match
  confidence: number; // 0-1 confidence in the match
  details: {
    streetScore: number; // Street name similarity score
    cityScore: number; // City name similarity score
    stateScore: number; // State/province similarity score
    postalScore: number; // Postal code similarity score
    overallScore: number; // Combined overall similarity score
  };
  differences: AddressDifference[];
  suggestions?: string[];
}

/**
 * One part on which two addresses differ, with both values and the kind of difference.
 *
 * @example
 * ```ts
 * import { getAddressSimilarity, parseLocation } from "@johnmorrisdotca/address-plus";
 * import type { AddressDifference } from "@johnmorrisdotca/address-plus";
 *
 * const parsedAddress1=parseLocation("123 Main St, Anytown, NY 12345");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * const parsedAddress2=parseLocation("125 Main St, Anytown, NY 12345");
 * if (!parsedAddress2) throw new Error("The example address did not parse.");
 * console.log(getAddressSimilarity(parsedAddress1, parsedAddress2).differences[0]);
 * // → {"field":"number","value1":"123","value2":"125","type":"typo","confidence":0.6}
 * ```
 */
interface AddressDifference {
  field: keyof ParsedAddress; // Which address field differs
  value1: string | undefined; // Value from first address
  value2: string | undefined; // Value from second address
  type: "missing" | "different" | "similar" | "typo"; // Type of difference
  confidence: number; // Confidence in the difference assessment
}

/**
 * How strongly two addresses match, from `exact` to `none`.
 *
 * @example
 * ```ts
 * import { compareAddresses, parseLocation } from "@johnmorrisdotca/address-plus";
 * import type { AddressMatchType } from "@johnmorrisdotca/address-plus";
 *
 * const parsedAddress1=parseLocation("123 Main St, Anytown, NY 12345");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * const parsedAddress2=parseLocation("456 Oak Ave, Portland, OR 97201");
 * if (!parsedAddress2) throw new Error("The example address did not parse.");
 * console.log(compareAddresses(parsedAddress1, parsedAddress2).matchType);
 * // → "none"
 * ```
 */
type AddressMatchType = "exact" | "strong" | "moderate" | "weak" | "none";

/**
 * What `compareAddresses` returns: the verdict, the match type and the similarity.
 *
 * @example
 * ```ts
 * import { compareAddresses, parseLocation } from "@johnmorrisdotca/address-plus";
 * import type { AddressComparisonResult } from "@johnmorrisdotca/address-plus";
 *
 * const parsedAddress1=parseLocation("123 Main St, Anytown, NY 12345");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * const parsedAddress2=parseLocation("123 Main Street, Anytown, NY 12345");
 * if (!parsedAddress2) throw new Error("The example address did not parse.");
 * console.log(compareAddresses(parsedAddress1, parsedAddress2).isSame);
 * // → true
 * ```
 */
interface AddressComparisonResult {
  isSame: boolean; // Whether addresses are considered the same
  matchType: AddressMatchType; // Type of match found
  similarity: AddressSimilarityResult; // Detailed similarity analysis
  normalizedAddress1: ParsedAddress; // First address after normalization
  normalizedAddress2: ParsedAddress; // Second address after normalization
}

/**
 * Settings for fuzzy string matching: the lowest similarity that counts, the largest edit distance, and phonetic
 * matching.
 *
 * @example
 * ```ts
 * import type { FuzzyMatchOptions } from "@johnmorrisdotca/address-plus";
 *
 * console.log(({ threshold: 0.8, maxDistance: 2 }).maxDistance);
 * // → 2
 * ```
 */
interface FuzzyMatchOptions {
  threshold: number; // 0-1 minimum similarity threshold
  maxDistance: number; // Maximum edit distance for string matching
  enableSoundex?: boolean; // Use soundex for phonetic matching
  enableMetaphone?: boolean; // Use metaphone for phonetic matching
}

export type {
  AddressComparisonOptions,
  AddressComparisonResult,
  AddressDifference,
  AddressMatchType,
  AddressSimilarityResult,
  FuzzyMatchOptions,
};
