// What more than one stage of the standard parser needs: the cheap validity check, a unit's type and number, and
// whether an address is Canadian so far.

import { SECONDARY_UNIT_TYPES } from "../../constants/index";
import { ORDINAL_FLOOR_PATTERN, UNIT_TYPE_NUMBER_PATTERN } from "../../patterns/address-patterns";
import { CANADIAN_POSTAL_LIBERAL_PATTERN } from "../../patterns/location-patterns";
import { BASIC_VALIDATION_PATTERNS } from "../../patterns/parser-patterns";
import type { ParsedAddress, ParseOptions } from "../../types";
import { parseStateProvince } from "../../utils/parsing";

import { STREET_TYPE_ABBREVIATION_AT_END } from "./patterns";

// Simple validation to check if address contains basic components
function hasValidAddressComponents(address: string): boolean {
  // A street with no number, then a city and state: "Canal Rd, Deltona FL".
  const firstPart = address.split(",")[0];
  if (address.includes(",") && STREET_TYPE_ABBREVIATION_AT_END.test(firstPart.trim()) && /\s[A-Z]{2}$/.test(address)) {
    return true;
  }

  // Basic check for numbers and letters
  return (
    BASIC_VALIDATION_PATTERNS.HAS_DIGITS.test(address) &&
    BASIC_VALIDATION_PATTERNS.HAS_LETTERS.test(address) &&
    address.trim().length > 3
  );
}

// Set a unit's type and number on result from the unit's text ("Apt. #4B", "Ste 500", "lt42", "#12", "Bsmt").
// keepText also stores the text as written in unit, as the street-line units always have.
function applyUnit(result: ParsedAddress, unitText: string, keepText: boolean): void {
  const ordinalFloor = unitText.trim().match(ORDINAL_FLOOR_PATTERN);
  const unitParts = ordinalFloor ? null : unitText.match(UNIT_TYPE_NUMBER_PATTERN);
  if (ordinalFloor) {
    result.secUnitType = "Floor";
    result.secUnitNum = ordinalFloor[1];
  } else if (unitParts) {
    if (unitParts[1] && unitParts[2]) {
      const rawType = unitParts[1].toLowerCase();
      result.secUnitType = SECONDARY_UNIT_TYPES[rawType] || rawType;
      result.secUnitNum = unitParts[2];
    } else if (unitParts[3] && unitParts[4]) {
      const rawType = unitParts[3].toLowerCase();
      result.secUnitType = SECONDARY_UNIT_TYPES[rawType] || rawType;
      result.secUnitNum = unitParts[4];
    } else if (unitParts[5]) {
      result.secUnitType = "#";
      result.secUnitNum = unitParts[5];
    }
  } else {
    const rawType = unitText.trim().replace(/\.$/, "").toLowerCase();
    if (!(rawType in SECONDARY_UNIT_TYPES)) return;
    result.secUnitType = SECONDARY_UNIT_TYPES[rawType];
  }
  if (keepText) result.unit = unitText.trim();
}

// Whether an address is Canadian, from what has been read of it so far.
function isCanadianContext(
  zipPart: string,
  statePart: string,
  options: ParseOptions,
  countryHint?: "US" | "CA",
): boolean {
  if (options.country === "CA" || countryHint === "CA") return true;
  if (options.country === "US" || countryHint === "US") return false;
  if (zipPart && CANADIAN_POSTAL_LIBERAL_PATTERN.test(zipPart)) return true;
  if (statePart) {
    const state = parseStateProvince(statePart.replace(/\./g, "").trim());
    return state.detectedCountry === "CA";
  }
  return false;
}

export { applyUnit, hasValidAddressComponents, isCanadianContext };
