/**
 * What `parseIntersection` returns: two streets, each with its name, type and directionals, and the place.
 *
 * @example
 * ```ts
 * import { parseIntersection } from "@johnmorrisdotca/address-plus";
 * import type { ParsedIntersection } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseIntersection("Hollywood Blvd and Vine St, Los Angeles, CA"));
 * // → {"state":"CA","city":"Los Angeles","street1":"Hollywood","type1":"Blvd","street2":"Vine","type2":"St"}
 * ```
 */
interface ParsedIntersection {
  street1?: string; // First street
  type1?: string; // First street type
  prefix1?: string; // First street prefix
  suffix1?: string; // First street suffix
  street2?: string; // Second street
  type2?: string; // Second street type
  prefix2?: string; // Second street prefix
  suffix2?: string; // Second street suffix
  city?: string; // City
  state?: string; // State/Province
  zip?: string; // ZIP/Postal code
  plus4?: string; // Extended ZIP+4 code
  country?: "CA" | "US"; // Country
  postalValid?: boolean; // Postal code validation status
  postalType?: "zip" | "postal"; // Postal code type (zip or postal)
}

export type { ParsedIntersection };
