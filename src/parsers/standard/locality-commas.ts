// The city, state and ZIP of an address written with commas, read from its last part and the parts before it:
// "123 Main St, Springfield, IL 62701".

import { SECONDARY_UNIT_TYPES } from "../../constants/index";
import { CANADIAN_POSTAL_LIBERAL_PATTERN } from "../../patterns/location-patterns";
import { BASIC_VALIDATION_PATTERNS, DIGIT_PATTERNS } from "../../patterns/parser-patterns";

import type { Locality, LocalityContext } from "./locality.types";
import { COUNTY_PATTERN, standardRegexes } from "./patterns";

// Read the locality of an address that is several comma parts, starting from what the stages before it found.
function readCommaLocality(start: Locality, context: LocalityContext): Locality {
  const { commaParts, addressStartIndex, excludedPartIndices } = context;
  const rx = standardRegexes();
  let { zipPart, statePart, cityPart, addressPart } = start;

  const lastPart = commaParts[commaParts.length - 1];
  const zipMatch = lastPart.match(rx.zipAnywhere);
  const caPostalMatch = lastPart.match(CANADIAN_POSTAL_LIBERAL_PATTERN);

  if (zipMatch) {
    zipPart = zipMatch[1];
    // Remove ZIP from the part and see what's left (might be city + state)
    const remainingAfterZip = lastPart.replace(zipMatch[0], "").trim();
    if (remainingAfterZip) {
      // Try to parse city and state from remaining text
      const cityStateAbbrevMatch = remainingAfterZip.match(rx.cityStateAbbrev);
      if (cityStateAbbrevMatch) {
        cityPart = cityStateAbbrevMatch[1].trim();
        statePart = cityStateAbbrevMatch[2].trim();
      } else {
        const cityStateFullMatch = remainingAfterZip.match(rx.cityAndFullState);
        if (cityStateFullMatch) {
          cityPart = (cityStateFullMatch[1] ?? "").trim();
          statePart = cityStateFullMatch[2].trim();
        } else if (rx.onlyState.test(remainingAfterZip)) {
          statePart = remainingAfterZip;
        } else {
          // "Brooklyn 11201": no state, so what is left beside the ZIP is the city.
          cityPart = remainingAfterZip;
        }
      }
    }
    // Check if we have city in previous part (but skip excluded parts like secondary units)
    // Also consider if we skipped a facility name (addressStartIndex > 0)
    if (commaParts.length > 2) {
      // Find the last non-excluded part that could be a city
      // But don't go back before the address start index (to skip facility names)
      for (let i = commaParts.length - 2; i >= Math.max(1, addressStartIndex); i--) {
        // "Seattle, King County, WA": a county is not the city.
        if (COUNTY_PATTERN.test(commaParts[i])) continue;
        if (!excludedPartIndices.has(i)) {
          // Set city if we haven't already parsed it from city/state pattern
          if (!cityPart) {
            cityPart = commaParts[i].trim();
          }
          break;
        }
      }
    } else if (commaParts.length === 2 && !statePart) {
      // No ZIP was removed, so this might be city, state
      const remainingText = lastPart.replace(zipMatch[0], "").trim();
      const cityStateAbbrevMatch = remainingText.match(rx.cityStateAbbrev);
      if (cityStateAbbrevMatch) {
        cityPart = cityStateAbbrevMatch[1].trim();
        statePart = cityStateAbbrevMatch[2].trim();
      } else {
        const cityStateFullMatch = remainingText.match(rx.cityAndFullState);
        if (cityStateFullMatch) {
          cityPart = (cityStateFullMatch[1] ?? "").trim();
          statePart = cityStateFullMatch[2].trim();
        } else {
          // Before assigning remaining text as city, check if it's a standalone secondary unit type
          if (remainingText.toLowerCase() in SECONDARY_UNIT_TYPES) {
            // The entire remaining text is just a secondary unit type (no city)
            // Don't assign it as city, let parseStandardAddress handle it
            // cityPart remains empty
          } else {
            const standaloneUnitMatch = remainingText.match(rx.cityBeforeUnitType);
            if (standaloneUnitMatch && standaloneUnitMatch[1].trim()) {
              // Found a secondary unit, extract city from the part before it
              cityPart = standaloneUnitMatch[1].trim();
              // Note: The secondary unit will be processed later in parseStandardAddress
            } else {
              cityPart = remainingText;
            }
          }
        }
      }
    }
  } else if (caPostalMatch) {
    // Canadian postal code
    zipPart = caPostalMatch[1];
    const remainingAfterZip = lastPart.replace(caPostalMatch[0], "").trim();
    if (remainingAfterZip) {
      statePart = remainingAfterZip;
    }
    // "Toronto ON M5H 2N2": the city and province share the last part.
    const lastCityProvince = remainingAfterZip.match(rx.cityStateAbbrevDotted);
    const lastCityProvinceFull = lastCityProvince ? null : remainingAfterZip.match(rx.cityAndFullState);
    if (commaParts.length > 2 && lastCityProvince) {
      cityPart = lastCityProvince[1].trim();
      statePart = lastCityProvince[2].trim();
    } else if (commaParts.length > 2 && lastCityProvinceFull?.[1]) {
      cityPart = lastCityProvinceFull[1].trim();
      statePart = lastCityProvinceFull[2].trim();
    } else if (commaParts.length > 2) {
      // The last part before the postal code that is not a unit or a route set aside above.
      for (let i = commaParts.length - 2; i >= Math.max(1, addressStartIndex); i--) {
        if (!excludedPartIndices.has(i)) {
          cityPart = commaParts[i].trim();
          break;
        }
      }
    } else if (commaParts.length === 2) {
      const cityStateText = lastPart.replace(caPostalMatch[0], "").trim();
      const cityStateAbbrevMatch = cityStateText.match(rx.cityStateAbbrev);
      if (cityStateAbbrevMatch) {
        cityPart = cityStateAbbrevMatch[1].trim();
        statePart = cityStateAbbrevMatch[2].trim();
      } else {
        const cityStateFullMatch = cityStateText.match(rx.cityAndFullState);
        if (cityStateFullMatch) {
          cityPart = (cityStateFullMatch[1] ?? "").trim();
          statePart = cityStateFullMatch[2].trim();
        } else {
          cityPart = cityStateText;
        }
      }
    }
  } else {
    // No ZIP found, try to parse city/state from remaining parts after facility
    // Skip facility name if present and properly parse remaining parts
    const startIndex = addressStartIndex;
    const remainingParts = commaParts.slice(startIndex);

    if (remainingParts.length > 0) {
      // Join remaining parts and re-split for proper city/state/zip parsing
      const remainingText = remainingParts.join(", ");

      // First try to match with state abbreviations (more specific)
      const cityStateAbbrevMatch = remainingText.match(rx.cityStateAbbrev);
      if (cityStateAbbrevMatch) {
        const beforeState = cityStateAbbrevMatch[1].trim();
        statePart = cityStateAbbrevMatch[2].trim();

        // Remove any trailing comma from beforeState
        const cleanBeforeState = beforeState.replace(BASIC_VALIDATION_PATTERNS.TRAILING_COMMAS, "").trim();

        // Split the part before state to get address and city
        const beforeStateParts = cleanBeforeState
          .split(",")
          .map((p) => p.trim())
          .filter((p) => p.length > 0);
        if (beforeStateParts.length >= 2) {
          addressPart = beforeStateParts[0];
          // The city is typically the last part before state
          cityPart = beforeStateParts[beforeStateParts.length - 1];
        } else if (beforeStateParts.length === 1) {
          // One part before state - could be address or city
          // Heuristic: if it has numbers, it's probably address; if not, city
          if (DIGIT_PATTERNS.HAS_DIGIT.test(beforeStateParts[0])) {
            addressPart = beforeStateParts[0];
          } else {
            cityPart = beforeStateParts[0];
          }
        }
      } else {
        // Then try full state names
        const cityStateFullMatch = remainingText.match(rx.cityAndFullState);
        if (cityStateFullMatch) {
          const beforeState = (cityStateFullMatch[1] ?? "").trim();
          statePart = cityStateFullMatch[2].trim();

          // Remove any trailing comma from beforeState
          const cleanBeforeState = beforeState.replace(BASIC_VALIDATION_PATTERNS.TRAILING_COMMAS, "").trim();

          // Split the part before state to get address and city
          const beforeStateParts = cleanBeforeState
            .split(",")
            .map((p) => p.trim())
            .filter((p) => p.length > 0);
          if (beforeStateParts.length >= 2) {
            addressPart = beforeStateParts[0];
            // The city is typically the last part before state
            cityPart = beforeStateParts[beforeStateParts.length - 1];
          } else if (beforeStateParts.length === 1) {
            // One part before state
            if (DIGIT_PATTERNS.HAS_DIGIT.test(beforeStateParts[0])) {
              addressPart = beforeStateParts[0];
            } else {
              cityPart = beforeStateParts[0];
            }
          }
        } else {
          // Check if the entire text is a state/province (abbreviation first)
          const justStateAbbrevMatch = remainingText.match(rx.onlyStateAbbrev);
          if (justStateAbbrevMatch) {
            statePart = justStateAbbrevMatch[1].trim();
          } else {
            const justStateFullMatch = remainingText.match(rx.onlyStateFull);
            if (justStateFullMatch) {
              statePart = justStateFullMatch[1].trim();
            } else if (remainingParts.length === 1) {
              // One remaining part, treat as address
              addressPart = remainingParts[0];
            } else {
              // Multiple parts but no state found - treat first as address, rest as city
              addressPart = remainingParts[0];
              cityPart = remainingParts.slice(1).join(", ");
            }
          }
        }
      }
    }
  }
  return { zipPart, statePart, cityPart, addressPart, isGeneralDelivery: start.isGeneralDelivery };
}

export { readCommaLocality };
