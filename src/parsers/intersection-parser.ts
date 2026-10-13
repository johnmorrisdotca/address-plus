import { CITY_PATTERNS } from "../constants";
import { COMMON_PARSER_PATTERNS, INTERSECTION_PATTERNS } from "../constants/parser-patterns";
import { buildPatterns } from "../patterns/pattern-builder";
import type { ParsedIntersection, ParseOptions } from "../types";
import { setValidatedPostalCode } from "../utils/address-validation";
import { splitStreetAndCity } from "../utils/split-city";
import { normalizeStreetType } from "../utils/street-type-normalizer";

/**
 * Parses an intersection of two streets, joined by `&`, `and`, `at` or `@`, with the city, state and ZIP that may
 * follow. With no comma before the city, the second street ends at its type, so the city may be any number of words.
 *
 * @param address - The intersection as one string, such as `Main St & Pine Ave, Tacoma, WA`.
 * @param options - How to parse (see `ParseOptions`).
 * @returns Both streets with their types and directionals, and the place, or `null` when the text does not name two
 * streets. A street with no type has `type1` or `type2` set to an empty string, as in parse-address.
 * @example
 * ```ts
 * import { parseIntersection } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseIntersection("Main St and Pine St Tacoma WA"));
 * // → {"state":"WA","city":"Tacoma","street1":"Main","type1":"St","street2":"Pine","type2":"St"}
 * ```
 */
function parseIntersection(address: string, options: ParseOptions = {}): ParsedIntersection | null {
  const patterns = buildPatterns();

  // Split on intersection indicators
  const intersectionPattern = new RegExp(patterns.intersection, "i");
  const parts = address.split(intersectionPattern);

  if (parts.length !== 2) return null;

  const result: ParsedIntersection = {};

  // Parse location info from the end of the address
  let locationText = parts[1].trim();

  // For intersections, try to extract city/state/zip from the end differently
  // Pattern: "Street2Name City State ZIP" or "Street2Name City State"
  const zipMatch = locationText.match(COMMON_PARSER_PATTERNS.ZIP_AT_END(patterns.zip));
  if (zipMatch) {
    setValidatedPostalCode(result, zipMatch[1], options);
    locationText = locationText.replace(zipMatch[0], "").trim();
  }

  // Extract state from the end
  const stateMatch = locationText.match(COMMON_PARSER_PATTERNS.STATE_AT_END(patterns.state));
  if (stateMatch) {
    result.state = stateMatch[1].toUpperCase();
    locationText = locationText.replace(stateMatch[0], "").trim();
  }

  // Extract city (1-2 words before state) - only if we have a state
  if (result.state) {
    // Remove trailing comma first
    locationText = locationText.replace(/,\s*$/, "").trim();

    // Look for city pattern: comma followed by 1-3 words at the end, or 1-3 words at the end
    let cityMatch = locationText.match(INTERSECTION_PATTERNS.CITY_WITH_COMMA);
    if (cityMatch) {
      result.city = cityMatch[1].trim();
      locationText = locationText.replace(cityMatch[0], "").trim();
    } else {
      // No comma: the second street ends at its type, and the city is what follows, of however many words
      // ("Pine St Tacoma", "Pine St Salt Lake City"). Only when no type tells the two apart are the last one or
      // two words taken as the city ("Bellamy Baton Rouge").
      const split = splitStreetAndCity(locationText, false);
      if (split.city) {
        result.city = split.city;
        locationText = split.street;
      } else {
        cityMatch = locationText.match(CITY_PATTERNS.BASIC_CITY);
        if (cityMatch) {
          result.city = cityMatch[1].trim();
          locationText = locationText.replace(cityMatch[0], "").trim();
        }
      }
    }
  } else {
    // No state, so clean up any trailing comma from the full locationText
    locationText = locationText.replace(/,\s*$/, "").trim();
  }

  // Parse first street
  const street1Text = parts[0].trim();
  const street1Match = street1Text.match(
    INTERSECTION_PATTERNS.STREET_WITH_TYPE(patterns.directional.slice(1, -1), patterns.streetType.slice(1, -1)),
  );
  if (street1Match) {
    if (street1Match[1]) result.prefix1 = street1Match[1].toUpperCase();
    result.street1 = street1Match[2].trim();
    result.type1 = normalizeStreetType(street1Match[3]);
  } else {
    // No type found, treat entire text as street name
    const simpleMatch = street1Text.match(INTERSECTION_PATTERNS.STREET_SIMPLE(patterns.directional.slice(1, -1)));
    if (simpleMatch) {
      if (simpleMatch[1]) result.prefix1 = simpleMatch[1].toUpperCase();
      result.street1 = simpleMatch[2].trim();
      result.type1 = "";
    }
  }

  // Parse second street
  const street2Text = locationText || parts[1].trim();
  const street2Match = street2Text.match(
    INTERSECTION_PATTERNS.STREET_WITH_TYPE(patterns.directional.slice(1, -1), patterns.streetType.slice(1, -1)),
  );
  if (street2Match) {
    if (street2Match[1]) result.prefix2 = street2Match[1].toUpperCase();
    result.street2 = street2Match[2].trim();
    result.type2 = normalizeStreetType(street2Match[3]);
  } else {
    // No type found, treat entire text as street name
    const simpleMatch = street2Text.match(INTERSECTION_PATTERNS.STREET_SIMPLE(patterns.directional.slice(1, -1)));
    if (simpleMatch) {
      if (simpleMatch[1]) result.prefix2 = simpleMatch[1].toUpperCase();
      result.street2 = simpleMatch[2].trim();
      result.type2 = "";
    }
  }

  // Ensure we have required fields
  if (!result.street1 || !result.street2) return null;

  // Set default empty types if not found
  if (!result.type1) result.type1 = "";
  if (!result.type2) result.type2 = "";

  return result;
}

export { parseIntersection };
