// Parsed address result with all possible fields. A Japanese address fills its own fields (prefecture,
// municipality, town, chome, ban, go, building, floor, room) and the shared ones that stand for them:
// state holds the prefecture's JIS code, city the municipality, street the town, number the block. An
// Australian, British, French or German address, read by its country's module, adds the few fields of its own.
import type { AustralianAddressFields } from "./australia";
import type { FrenchAddressFields, FrenchPostalCountry } from "./france";
import type { JapaneseAddressFields } from "./japan";
import type { UKAddressFields } from "./united-kingdom";

/**
 * What `parseLocation` returns: every part it found, each absent when the address has none. A Japanese address fills
 * its own fields and the shared ones that stand for them: `state` the prefecture's JIS code, `city` the municipality,
 * `street` the town, `number` the block, `zip` the postal code.
 *
 * @example
 * ```ts
 * import { parseLocation } from "@johnmorrisdotca/address-plus";
 * import type { ParsedAddress } from "@johnmorrisdotca/address-plus/jp";
 *
 * console.log(parseLocation("123 Main St Apt 4, Anytown, NY 12345"));
 * // → {"number":"123","secUnitType":"Apartment","secUnitNum":"4","unit":"Apt 4","street":"Main","type":"St","city":"Anytown","state":"NY","zip":"12345","zipValid":true,"country":"US"}
 * ```
 */
interface ParsedAddress extends JapaneseAddressFields, AustralianAddressFields, FrenchAddressFields, UKAddressFields {
  city?: string; // City name, or the municipality in Japan; APO, FPO or DPO in a military address
  compartment?: string; // Compartment on a Canadian rural route (the 10 in "SITE 6 COMP 10 RR 8")
  country?: "CA" | "US" | "JP" | "AU" | "GB" | "GY" | "IM" | "JE" | FrenchPostalCountry | "DE"; // Detected country; AU, GB (with Jersey, Guernsey and the Isle of Man), FR (with Monaco and the overseas collectivities) and DE only from their modules
  fraction?: string; // Fractional address number (e.g., 1/2 in "123 1/2 Main St")
  generalDelivery?: boolean; // General delivery indicator
  highwayContract?: string; // Highway contract route number (the 68 in "HC 68 BOX 23A"); ruralRoute holds "HC 68"
  locality?: string; // Sub-city locality (borough, district, neighborhood), or a Puerto Rico urbanization
  military?: string; // Military delivery line ("PSC 802 Box 74", "Unit 2050 Box 4190"); state is AA, AE or AP
  number?: string; // Street number
  place?: string; // Place name (landmark, POI, building, monument, etc.)
  plus4?: string; // Extended ZIP+4 code
  postalValid?: boolean; // Postal code validation status
  postalType?: "zip" | "postal"; // Postal code type (zip or postal)
  prefix?: string; // Directional prefix (N, S, E, W, etc.)
  rpo?: string; // Retail Postal Outlet (Canada Post) identifier
  rr?: string; // Rural Route number (RR/R.R.)
  ruralRoute?: string; // Rural route or similar
  secUnitNum?: string; // Secondary unit number
  secUnitType?: string; // Secondary unit type (apt, suite, etc.)
  secondary?: string; // Legacy properties for backward compatibility
  site?: string; // Site number on a Canadian rural route (the 6 in "SITE 6 COMP 10 RR 8")
  state?: string; // State/Province code; AA, AE or AP for a military address
  station?: string; // Station or Succursale identifier (e.g., Station A, Succ. Centre-ville)
  street?: string; // Street name
  suffix?: string; // Directional suffix
  type?: string; // Street type/suffix (St, Ave, Rd, etc.)
  unit?: string; // Legacy unit property for backward compatibility
  zip?: string; // ZIP or postal code
  zipValid?: boolean; // ZIP/postal code format validation (true if format is valid)
}

export type { ParsedAddress };
