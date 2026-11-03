// The first comma part of a standard address: whether it is a General Delivery line, a Puerto Rico urbanization or a
// facility's name above the address, and so which part the street is in.

import { FACILITY_INDICATORS } from "../../patterns/address-patterns";
import {
  CONNECTOR_WORDS,
  FACILITY_DELIMITER_PATTERNS,
  GENERAL_DELIVERY_PATTERNS,
  VALIDATION_PATTERNS,
} from "../../patterns/core-patterns";

import {
  CA_UNIT_CIVIC_PATTERN,
  PREFIX_UNIT_PATTERN,
  standardRegexes,
  STREET_TYPE_ABBREVIATION_AT_END,
  URBANIZATION_PATTERN,
} from "./patterns";

// What the first comma part turned out to be.
interface FacilityReading {
  isGeneralDelivery: boolean;
  generalDeliveryStation: string; // The station named after "General Delivery", or an empty string
  addressStartIndex: number; // The comma part the street is in
  facilityName: string; // The facility's name above the address, or an empty string
  addressPartOverride: string | null; // The address written inside the first part, beside a facility's name
  urbanization: string; // A Puerto Rico urbanization written above the street, or an empty string
}

// Read the first of several comma parts. A part index that is not the address is added to excludedPartIndices.
function readFacility(commaParts: readonly string[], excludedPartIndices: Set<number>): FacilityReading {
  const reading: FacilityReading = {
    isGeneralDelivery: false,
    generalDeliveryStation: "",
    addressStartIndex: 0,
    facilityName: "",
    addressPartOverride: null,
    urbanization: "",
  };
  if (commaParts.length <= 1) return reading;

  const firstPart = commaParts[0];

  // Special-case: General Delivery as the first part
  if (GENERAL_DELIVERY_PATTERNS.STANDARD.test(firstPart)) {
    reading.isGeneralDelivery = true;
    reading.addressStartIndex = 1;
    reading.generalDeliveryStation = firstPart.match(/\s(?:stn\.?|station|succ\.?|succursale)\s+(.+)$/i)?.[1] ?? "";
  }

  // Sophisticated heuristic for facility detection:
  // 1. No house numbers at the start
  // 2. Street types should be secondary (like "Park", "Center", "Building")
  // 3. Doesn't follow typical "number + street + type" pattern

  // A number written as a word, then a street that ends in a type, is an address ("One Microsoft Way").
  const writtenNumberStreet = standardRegexes().writtenNumberStreet.test(firstPart.trim());
  const hasHouseNumber = VALIDATION_PATTERNS.HOUSE_NUMBER_START.test(firstPart.trim()) || writtenNumberStreet;
  // A unit before the number ("Unit 4-123 Main St", "#4-123 Main St") starts an address too.
  const startsWithUnit = PREFIX_UNIT_PATTERN.test(firstPart.trim()) || CA_UNIT_CIVIC_PATTERN.test(firstPart.trim());
  const startsWithNumber =
    VALIDATION_PATTERNS.STARTS_WITH_NUMBER.test(firstPart) || writtenNumberStreet || startsWithUnit;

  // A Puerto Rico urbanization written above the street ("URB Las Gladiolas") is the locality.
  if (URBANIZATION_PATTERN.test(firstPart)) {
    reading.urbanization = firstPart.trim();
    reading.addressStartIndex = 1;
    excludedPartIndices.add(0);
  }

  // A first part that ends in an abbreviated street type is a street with no number ("Canal Rd").
  const endsWithTypeAbbreviation = STREET_TYPE_ABBREVIATION_AT_END.test(firstPart.trim());

  // If it starts with a number, it's likely a street address, not a facility
  if (!startsWithNumber && !hasHouseNumber && !reading.urbanization && !reading.isGeneralDelivery) {
    // Handle inline address separated by delimiter or parentheses
    const parenInline = firstPart.match(FACILITY_DELIMITER_PATTERNS.PARENTHETICAL);
    const delimInline = firstPart.match(FACILITY_DELIMITER_PATTERNS.DELIMITED);
    // Handle trailing Island-like phrases without delimiters; preserve spaces
    const trailingIsland = firstPart.match(FACILITY_DELIMITER_PATTERNS.TRAILING_ISLAND);

    if (parenInline) {
      reading.facilityName = parenInline[1].trim();
      reading.addressPartOverride = parenInline[2].trim();
      reading.addressStartIndex = 0;
      excludedPartIndices.add(0);
    } else if (delimInline) {
      reading.facilityName = delimInline[1].trim();
      reading.addressPartOverride = delimInline[3].trim();
      reading.addressStartIndex = 0;
      excludedPartIndices.add(0);
    } else if (trailingIsland) {
      // Keep trailing Island phrase as address part and preserve spacing
      reading.facilityName = trailingIsland[1].trim();
      reading.addressPartOverride = trailingIsland[3].trim();
      reading.addressStartIndex = 0;
      excludedPartIndices.add(0);
    }

    // Check if this looks like a facility name vs a street name
    const words = firstPart.trim().split(VALIDATION_PATTERNS.WHITESPACE_SPLIT);
    // Ignore connector words when checking Title Case
    const filteredWords = words.filter((w) => {
      const lw = w.toLowerCase();
      return !CONNECTOR_WORDS.has(lw);
    });

    const hasMultipleWords = words.length >= 2;
    const hasFacilityIndicator = words.some((word) =>
      FACILITY_INDICATORS.includes(
        word.toLowerCase().replace(VALIDATION_PATTERNS.NON_WORD, "") as (typeof FACILITY_INDICATORS)[number],
      ),
    );

    // If it's multiple words with facility indicators, treat as facility
    // OR if it's a proper noun pattern (Title Case) without obvious street patterns
    if (
      !reading.facilityName &&
      !endsWithTypeAbbreviation &&
      ((hasMultipleWords && hasFacilityIndicator) ||
        (hasMultipleWords &&
          filteredWords.length >= 2 &&
          filteredWords.every((word) => VALIDATION_PATTERNS.TITLE_CASE.test(word)) &&
          !words.some((word) => VALIDATION_PATTERNS.NUMERIC_ONLY.test(word))))
    ) {
      reading.facilityName = firstPart.trim();
      reading.addressStartIndex = 1;
    }
  }

  return reading;
}

export { readFacility };
export type { FacilityReading };
