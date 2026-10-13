// Sub-region type definition for address parsing
// Represents administrative subdivisions like boroughs, parishes, districts, etc.

/**
 * An administrative part of a city (a borough, a parish, a ward, an arrondissement) that may be written where the city
 * is expected.
 *
 * @example
 * ```ts
 * import type { SubRegion } from "@johnmorrisdotca/address-plus";
 *
 * console.log(({ name: "brooklyn", parentCity: "new york", state: "NY", country: "US", type: "borough" }).type);
 * // → "borough"
 * ```
 */
interface SubRegion {
  name: string; // Primary normalized name (lowercase, trimmed)
  parentCity: string; // Parent city name (empty if not applicable)
  state: string; // State/province code (e.g., "NY", "QC")
  country: "US" | "CA"; // Country code
  type: "borough" | "parish" | "district" | "ward" | "arrondissement" | "quadrant"; // Administrative type
  aliases?: string[]; // Alternative names, abbreviations, bilingual variants, no-space versions
}

export type { SubRegion };
