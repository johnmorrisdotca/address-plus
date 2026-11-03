// The street line of a standard address, read step by step: a unit before the number, the number, a directional
// before the street, a rural route or unit after it, then the street type and a directional after it.

import { DIRECTIONAL_MAP, SECONDARY_UNIT_TYPES } from "../../constants/index";
import { MUSIC_SQUARE_EAST_PATTERN, SECONDARY_UNIT_PATTERN, UNIT_PART_PATTERN } from "../../patterns/address-patterns";
import { ISLAND_TYPE_PATTERN } from "../../patterns/core-patterns";
import { BASIC_VALIDATION_PATTERNS, ROAD_NAME_PATTERNS } from "../../patterns/parser-patterns";
import type { ParsedAddress, ParseOptions } from "../../types";
import { capitalizeStreetName } from "../../utils/capitalization";
import { normalizeStreetType } from "../../utils/street-type-normalizer";
import { TRAILING_RURAL_ROUTE } from "../rural-route-parser";

import {
  CA_UNIT_CIVIC_PATTERN,
  CANADIAN_NUMBERED_HIGHWAY,
  PREFIX_UNIT_PATTERN,
  SPANISH_ORDER_STATE,
  STANDALONE_UNIT_AT_END_PATTERN,
  standardRegexes,
} from "./patterns";
import { applyUnit, isCanadianContext } from "./shared";

// What the street line is read from: the text, and what the locality and the units set aside already said of it.
interface StreetLineInput {
  addressPart: string; // The comma part that holds the street
  isGeneralDelivery: boolean; // A General Delivery address has no street to read
  secondaryUnitPart: string; // A unit written in a comma part of its own, or an empty string
  ruralRouteNumber: string; // A rural route number written in a comma part of its own, or an empty string
  facilityName: string; // The facility's name above the address, or an empty string
  zipPart: string; // The ZIP or postal code as written
  statePart: string; // The state or province as written
  options: ParseOptions;
  countryHint?: "US" | "CA";
}

// What was read: the parts of the street line, and the note written in parentheses after it.
interface StreetLine {
  result: ParsedAddress;
  secondaryInfo: string; // The text of a trailing "(...)" note, or an empty string
}

// Read the street line of an address.
function readStreetLine(input: StreetLineInput): StreetLine {
  const { isGeneralDelivery, secondaryUnitPart, facilityName, zipPart, statePart, options, countryHint } = input;
  let { addressPart, ruralRouteNumber } = input;
  const rx = standardRegexes();

  const result: ParsedAddress = {};

  // Extract parenthetical information first
  let secondaryInfo = "";
  const parentheticalMatch = addressPart.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (parentheticalMatch) {
    addressPart = parentheticalMatch[1].trim();
    secondaryInfo = parentheticalMatch[2].trim();
  }

  // Parse address part using step-by-step approach. A general delivery address has no street to parse.
  let remaining = isGeneralDelivery ? "" : addressPart.trim();

  // 0. A unit written before the number. Canada Post joins a unit to the civic number with a hyphen, unit
  //    first ("4-123 Main St", "Unit 4-123", "#4-123"); in the United States a hyphenated number such as
  //    Queens' "87-11" is one number, so the pair is split only in a Canadian address.
  const canadian = isCanadianContext(zipPart, statePart, options, countryHint);
  // When the address names a unit elsewhere ("53-55 Water St., Suite 400"), the hyphen joins a range.
  const namesUnitElsewhere = !!secondaryUnitPart || SECONDARY_UNIT_PATTERN.test(remaining);
  const unitCivic = canadian && !namesUnitElsewhere ? remaining.match(CA_UNIT_CIVIC_PATTERN) : null;
  if (unitCivic) {
    if (unitCivic[2]) {
      result.secUnitType = "#";
    } else {
      const rawType = (unitCivic[1] ?? "unit").toLowerCase();
      result.secUnitType = SECONDARY_UNIT_TYPES[rawType] || rawType;
    }
    result.secUnitNum = unitCivic[3].toUpperCase();
    remaining = `${unitCivic[4]} ${unitCivic[5]}`;
  } else {
    // "#42 233 S Wacker Dr", "lt42 99 Some Road", "Suite 5 100 Main St": a unit, then the street.
    const prefixSecUnitMatch = remaining.match(PREFIX_UNIT_PATTERN);
    if (prefixSecUnitMatch) {
      applyUnit(result, prefixSecUnitMatch[1], false);
      remaining = prefixSecUnitMatch[2];
    }
  }

  // 1. Extract number (including fractions and complex formats)
  // First try the standard pattern with space after number
  const numberMatch = remaining.match(rx.number);

  // If no match, try to detect number immediately followed by directional (like "48S")
  if (!numberMatch) {
    const numberDirectionalMatch = remaining.match(rx.numberThenDirectional);
    if (numberDirectionalMatch) {
      result.number = numberDirectionalMatch[1];
      // Set the directional as prefix and continue with remaining
      const normalizedDirectional = DIRECTIONAL_MAP[numberDirectionalMatch[2].toLowerCase()];
      result.prefix = normalizedDirectional || numberDirectionalMatch[2].toUpperCase();
      remaining = numberDirectionalMatch[3] || "";
    }
  } else {
    result.number = numberMatch[1];

    // Capitalize written numbers (One, Two, etc.)
    if (BASIC_VALIDATION_PATTERNS.LETTERS_ONLY.test(result.number)) {
      result.number = result.number.charAt(0).toUpperCase() + result.number.slice(1).toLowerCase();
    }

    if (numberMatch[2]) {
      result.number = `${result.number} ${numberMatch[2]}`;
    }
    remaining = numberMatch[3] || "";
  }

  // If no number found, try without number
  if (!result.number && remaining) {
    // This is a street name without number
    // continue processing with the full text
  }

  // 2. Extract prefix directional (if not already extracted with number)
  if (!result.prefix) {
    const prefixMatch = remaining.match(rx.leadingDirectional);
    // A directional followed only by a type is the street's name, not a predirectional (Pub 28: "North St").
    const onlyTypeFollows = !!prefixMatch && rx.streetTypeBareDotted.test(prefixMatch[2].trim());
    if (prefixMatch && !onlyTypeFollows) {
      const normalizedDirectional = DIRECTIONAL_MAP[prefixMatch[1].toLowerCase()];
      result.prefix = normalizedDirectional || prefixMatch[1].toUpperCase();
      remaining = prefixMatch[2];
    }
  }

  // 2.5. Check for spaced grid address pattern (e.g., "2200 W" or "400 E")
  if (result.number && result.prefix && !result.street) {
    // Look for pattern: NUMBER DIRECTION at the start of remaining text
    const gridMatch = remaining.match(rx.gridStreet);
    if (gridMatch) {
      result.street = gridMatch[1];
      const normalizedDirectional = DIRECTIONAL_MAP[gridMatch[2].toLowerCase()];
      result.suffix = normalizedDirectional || gridMatch[2].toUpperCase();
      remaining = gridMatch[3].trim();
      // "725 N 300 W #1410": a unit after a grid street has no street name before it.
      if (UNIT_PART_PATTERN.test(remaining)) {
        applyUnit(result, remaining, true);
        remaining = "";
      }
    }
  }

  // 2.7. A rural route after the street: "1234 River Rd RR 2".
  const trailingRuralRoute = remaining.match(TRAILING_RURAL_ROUTE);
  if (trailingRuralRoute && trailingRuralRoute[1].trim() && !ruralRouteNumber) {
    ruralRouteNumber = trailingRuralRoute[2];
    remaining = trailingRuralRoute[1].trim();
  }
  if (ruralRouteNumber) {
    result.rr = ruralRouteNumber;
    result.ruralRoute = `RR ${ruralRouteNumber}`;
  }

  // 3. A unit at the end of the street line, or else one found in a comma part of its own.
  const secUnitMatch = remaining.match(SECONDARY_UNIT_PATTERN);
  if (secUnitMatch && secUnitMatch[1].trim()) {
    remaining = secUnitMatch[1];
    applyUnit(result, secUnitMatch[2], true);
  } else if (secondaryUnitPart) {
    applyUnit(result, secondaryUnitPart, true);
  }

  // 3.5. A designator that takes no number ("Rear", "Bsmt", "PH") at the end of the street line. One that is
  //      also a street type (Front) is a unit only after a street type: "Rideau Front" is a street.
  if (!result.secUnitType && !result.secUnitNum) {
    const standaloneUnitMatch = remaining.match(STANDALONE_UNIT_AT_END_PATTERN);
    if (standaloneUnitMatch) {
      const before = standaloneUnitMatch[1].trim();
      const isAlsoType = rx.streetTypeBare.test(standaloneUnitMatch[2]);
      const beforeEndsWithType = rx.endsWithStreetType.test(` ${before}`);
      if (!isAlsoType || beforeEndsWithType) {
        remaining = before;
        applyUnit(result, standaloneUnitMatch[2], true);
      }
    }
  }

  // 4. Special case: Check if "East" at the end should be treated as a street type
  // This handles the specific case "Music Square East" where "East" becomes type "E"
  const musicSquareEastMatch = remaining.match(MUSIC_SQUARE_EAST_PATTERN);
  if (musicSquareEastMatch) {
    result.street = musicSquareEastMatch[1].trim();
    result.type = "E";
    remaining = "";
  }

  // If General Delivery was detected, force street to "General Delivery" and skip further street parsing
  if (isGeneralDelivery) {
    result.number = undefined;
    result.prefix = undefined;
    result.type = undefined;
    result.suffix = undefined;
    result.street = "General Delivery";
    remaining = "";
  }

  // 5. Extract street type and directional combinations first (before standalone directionals)
  if (!result.type) {
    // Pattern: "Street Type. Directional" (e.g., "Ave. N.W.")
    const streetTypeWithDirectionalMatch = remaining.match(rx.typeThenDirectional);

    if (streetTypeWithDirectionalMatch) {
      result.street = streetTypeWithDirectionalMatch[1].trim();
      result.type = normalizeStreetType(streetTypeWithDirectionalMatch[2]);
      const normalizedDirectional = DIRECTIONAL_MAP[streetTypeWithDirectionalMatch[3].toLowerCase()];
      result.suffix = normalizedDirectional || streetTypeWithDirectionalMatch[3].toUpperCase();
      remaining = ""; // Consumed everything
    }
  }

  // 6. Extract suffix directional from the end (only if street type wasn't handled above)
  if (!result.type) {
    // Allow optional whitespace before directional, and also handle cases like "O." (French) or attached without extra tokens
    // IMPORTANT: Require at least one whitespace before directional so we don't
    // accidentally capture the trailing letter in words like "Street" as "E" or "Pass" as "S".
    // Support dotted forms like "O." but only when separated by whitespace.
    // Avoid matching directionals that are part of road names like "County Road 250 East" or "1st Street North West"
    const suffixMatch = remaining.match(rx.directionalAtEnd);
    if (suffixMatch) {
      const beforeDirectional = suffixMatch[1].trim();
      const dirRaw = suffixMatch[2].toLowerCase();

      // Don't extract directionals that are clearly part of road names
      const isPartOfRoadName =
        ROAD_NAME_PATTERNS.NUMBERED_ROAD.test(beforeDirectional) || // "County Road 250", "State Highway 1A"
        ROAD_NAME_PATTERNS.ORDINAL_STREET.test(beforeDirectional) || // "1st Street", "42nd Avenue"
        ROAD_NAME_PATTERNS.DIRECTIONAL_STREET.test(beforeDirectional); // "North Street", "West Avenue"

      // Canada Post writes a numbered highway's direction as a suffix: "Hwy 7 E".
      const canadianHighway = canadian && CANADIAN_NUMBERED_HIGHWAY.test(beforeDirectional);
      // "Est" is the French East only in Canada; elsewhere it is the type Estate ("5074 Willow Est").
      const estateNotEast = dirRaw.replace(/\.$/, "") === "est" && !canadian;

      if ((!isPartOfRoadName || canadianHighway) && !estateNotEast) {
        remaining = beforeDirectional;
        // Try multiple directional formats: exact match, without dot, with dot
        const normalizedDirectional =
          DIRECTIONAL_MAP[dirRaw] ||
          DIRECTIONAL_MAP[dirRaw.replace(BASIC_VALIDATION_PATTERNS.TRAILING_DOT, "")] ||
          DIRECTIONAL_MAP[dirRaw + "."];
        result.suffix = normalizedDirectional || suffixMatch[2].toUpperCase();
      }
    }
  }

  // 7. Extract street type from the end (English pattern) or beginning (French pattern) - if not already set
  if (!result.type) {
    // Pattern: "Street Type + Directional" (e.g., "Main St West")
    const streetTypeWithDirectionalMatch = remaining.match(rx.typeThenDirectional);

    // Pattern: "Street Type Number" (e.g., "US Hwy 101", "Route 66")
    const streetTypeNumberMatch = remaining.match(rx.typeThenNumber);

    // Pattern: "Street Type." or "Street Type" at the end
    const streetTypeSuffixMatch = remaining.match(rx.typeAtEnd);

    // Pattern: French pattern: "Type Street"
    const streetTypePrefixMatch = remaining.match(rx.typeAtStart);

    if (streetTypeWithDirectionalMatch) {
      // English pattern with directional: "Main St West" or "Front Street West"
      result.street = capitalizeStreetName(streetTypeWithDirectionalMatch[1].trim());
      result.type = normalizeStreetType(streetTypeWithDirectionalMatch[2]);
      const dirRaw = streetTypeWithDirectionalMatch[3]
        .toLowerCase()
        .replace(BASIC_VALIDATION_PATTERNS.TRAILING_DOT, ""); // Remove trailing dot
      const normalizedDirectional =
        DIRECTIONAL_MAP[dirRaw] ||
        DIRECTIONAL_MAP[dirRaw + "."] ||
        DIRECTIONAL_MAP[streetTypeWithDirectionalMatch[3].toLowerCase()];
      result.suffix = normalizedDirectional || streetTypeWithDirectionalMatch[3].toUpperCase();
    } else if (streetTypeNumberMatch) {
      if (result.number) {
        // Fix: When a house number exists, do NOT overwrite it with the route number.
        // Instead, keep the route number as part of the street name.
        const streetCore = `${capitalizeStreetName(streetTypeNumberMatch[1].trim())} ${normalizeStreetType(streetTypeNumberMatch[2])} ${streetTypeNumberMatch[3]}`;
        result.street = streetCore.trim();
        // Leave result.type undefined to match expectations like "State Highway 116" as street
      } else {
        // No house number: keep the route as full street (e.g., "US Hwy 101")
        const streetCore = `${capitalizeStreetName(streetTypeNumberMatch[1].trim())} ${normalizeStreetType(streetTypeNumberMatch[2])} ${streetTypeNumberMatch[3]}`;
        result.street = streetCore.trim();
      }
    } else if (streetTypeSuffixMatch) {
      // English pattern: "Main St" or "Main St."
      const rawType = streetTypeSuffixMatch[2];
      const normalizedType = normalizeStreetType(rawType);
      // Special case: Facility + "Island" with no house number should keep full phrase as street
      if (facilityName && !result.number && ISLAND_TYPE_PATTERN.test(rawType)) {
        result.street = capitalizeStreetName(`${streetTypeSuffixMatch[1].trim()} Island`);
        // Do not set type in this special facility case
      } else {
        result.street = capitalizeStreetName(streetTypeSuffixMatch[1].trim());
        result.type = normalizedType;
      }
    } else if (streetTypePrefixMatch && (canadian || SPANISH_ORDER_STATE.test(statePart.trim()))) {
      // French pattern: "Rue Main". Only in Canada: in "Avenue of the Americas" or "Estate Enighed" the
      // type word is part of the name, and Pub 28 gives such a street no suffix.
      result.type = normalizeStreetType(streetTypePrefixMatch[1]);
      result.street = capitalizeStreetName(streetTypePrefixMatch[2].trim());
    } else {
      // No street type found, check if remaining is a number+directional (like "400E")
      const numberDirectionalStreetMatch = remaining.trim().match(rx.numberAndDirectionalOnly);
      if (numberDirectionalStreetMatch) {
        result.street = numberDirectionalStreetMatch[1];
        const normalizedDirectional = DIRECTIONAL_MAP[numberDirectionalStreetMatch[2].toLowerCase()];
        result.suffix = normalizedDirectional || numberDirectionalStreetMatch[2].toUpperCase();
      } else {
        // Everything remaining is street name
        if (!result.street) {
          result.street = remaining.trim();
        }
      }
    }
  }

  return { result, secondaryInfo };
}

export { readStreetLine };
export type { StreetLine, StreetLineInput };
