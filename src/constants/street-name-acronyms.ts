// Acronyms that should be capitalized specially in street names

/**
 * Acronyms written in capitals inside a street name (`US`, `FBI`), from their lower-case form, for
 * `capitalizeStreetName`.
 *
 * @example
 * ```ts
 * import { STREET_NAME_ACRONYMS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(STREET_NAME_ACRONYMS.get("fbi"));
 * // → "FBI"
 * ```
 */
const STREET_NAME_ACRONYMS = new Map<string, string>([
  // Common country/state/civic acronyms used in roads
  ["us", "US"],

  // Government & Public Agencies
  ["fbi", "FBI"],
  ["cia", "CIA"],
  ["epa", "EPA"],
  ["irs", "IRS"],
  ["hud", "HUD"],
  ["fema", "FEMA"],
  ["osha", "OSHA"],
  ["usps", "USPS"],

  // Canadian Government & Public Agencies
  ["rcmp", "RCMP"], // Royal Canadian Mounted Police
  ["cra", "CRA"], // Canada Revenue Agency
  ["cic", "CIC"], // Citizenship and Immigration Canada
  ["cbsa", "CBSA"], // Canada Border Services Agency
  ["cmhc", "CMHC"], // Canada Mortgage and Housing Corporation
  ["statcan", "StatCan"], // Statistics Canada
  ["clsc", "CLSC"], // Local Community Service Centre (Quebec)
  ["cegep", "CÉGEP"], // Collège d'enseignement général et professionnel
  ["rpo", "RPO"], // Retail Postal Outlet
  ["cn", "CN"], // Canadian National / CN Tower

  // International & Nonprofit Organizations
  ["nasa", "NASA"],
  ["who", "WHO"],
  ["unicef", "UNICEF"],
  ["wwf", "WWF"],
  ["nato", "NATO"],
  ["iso", "ISO"],
  ["aclu", "ACLU"],
  ["aarp", "AARP"],
  ["ymca", "YMCA"],

  // Commercial Entities
  ["at&t", "AT&T"],
  ["atnt", "AT&T"],
  ["ibm", "IBM"],
  ["ups", "UPS"],
  ["fedex", "FedEx"],
  ["gm", "GM"],
  ["ge", "GE"],
  ["3m", "3M"],
  ["hrblock", "H&R Block"],
  ["aw", "A&W"],

  // Civic & Facility Terms
  ["mlk", "MLK"],
]);

export { STREET_NAME_ACRONYMS };
