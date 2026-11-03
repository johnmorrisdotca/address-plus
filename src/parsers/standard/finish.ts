// The last stage of a standard address: the city, state and ZIP the earlier stages found are validated and written
// onto the street line's result, with the place, the locality and the notes, and the country is detected.

import { SECONDARY_UNIT_TYPES } from "../../constants/index";
import { isSubRegionName } from "../../constants/sub-regions";
import { VALIDATION_PATTERNS, ZIP_VALIDATION_PATTERNS } from "../../patterns/core-patterns";
import { ZIP_CODE_PATTERN } from "../../patterns/location-patterns";
import { BASIC_VALIDATION_PATTERNS } from "../../patterns/parser-patterns";
import type { ParsedAddress, ParseOptions } from "../../types";
import { setValidatedPostalCode } from "../../utils/address-validation";
import { detectCountry, parseStateProvince } from "../../utils/parsing";

// Everything the earlier stages found that the result still needs.
interface FinishInput {
  result: ParsedAddress; // The street line's parts
  address: string; // The address as it was given to the parser
  commaParts: readonly string[]; // The address split at its commas
  cityPart: string;
  statePart: string;
  zipPart: string;
  facilityName: string; // The facility's name above the address
  facilityPart: string; // A facility named in a middle comma part
  urbanization: string; // A Puerto Rico urbanization
  secondaryInfo: string; // The text of a trailing "(...)" note
  isGeneralDelivery: boolean;
  generalDeliveryStation: string;
  options: ParseOptions;
}

// Write the locality onto the result, and return it, or null when nothing meaningful was read.
function finishAddress(input: FinishInput): ParsedAddress | null {
  const {
    result,
    address,
    commaParts,
    cityPart,
    statePart,
    zipPart,
    facilityName,
    facilityPart,
    urbanization,
    secondaryInfo,
    isGeneralDelivery,
    generalDeliveryStation,
    options,
  } = input;

  // Add city, locality (if available), state, zip
  if (cityPart) result.city = cityPart;

  // Fix: If city was incorrectly assigned a secondary unit type, move it to secUnitType
  if (result.city && !result.secUnitType && result.city.toLowerCase() in SECONDARY_UNIT_TYPES) {
    result.secUnitType = SECONDARY_UNIT_TYPES[result.city.toLowerCase()];
    result.unit = result.city; // Store original text
    delete result.city; // Remove incorrect city assignment
  }

  // If we have a facility and the next comma part is a sub-region (NYC borough, DC quadrant, etc.), treat it as locality
  if (facilityName && commaParts.length > 1) {
    const maybeLocalityRaw: string = commaParts[1].trim();
    const normLocality: string = maybeLocalityRaw.toLowerCase().replace(VALIDATION_PATTERNS.NON_WORD, "");
    if (isSubRegionName(normLocality)) {
      result.locality = maybeLocalityRaw;
    }
  }
  if (statePart) {
    // Use parseStateProvince to properly normalize state names to abbreviations
    const cleanedState = statePart.replace(BASIC_VALIDATION_PATTERNS.REMOVE_PERIODS, "").trim();
    const stateInfo = parseStateProvince(cleanedState);
    result.state = stateInfo.state || cleanedState.toUpperCase();
  }
  if (zipPart) {
    // Handle ZIP+4 format: 12345-6789, 123456789, 12345 6789
    const zipMatch = zipPart.match(ZIP_CODE_PATTERN);
    if (zipMatch) {
      setValidatedPostalCode(result, zipMatch[1], options);
      if (zipMatch[2]) {
        result.plus4 = zipMatch[2];
      }
    } else {
      setValidatedPostalCode(result, zipPart, options);
    }
  } else if (options.strict) {
    // In strict mode, check if there were invalid ZIP patterns that we should validate
    // Look for ZIP-like patterns in the original address
    const originalParts = address.split(",");
    const lastOriginalPart = originalParts[originalParts.length - 1] || "";
    const potentialZipMatch = lastOriginalPart.match(ZIP_VALIDATION_PATTERNS.POTENTIAL_ZIP);
    if (potentialZipMatch) {
      // Found a potential ZIP pattern that wasn't extracted in strict mode
      setValidatedPostalCode(result, potentialZipMatch[1], options);
    }
  }

  // Mark General Delivery if detected
  if (isGeneralDelivery) {
    result.generalDelivery = true;
    if (generalDeliveryStation) result.station = generalDeliveryStation;
  }

  if (urbanization) result.locality = urbanization;

  // Add place if found (from either initial detection or middle parts)
  if (facilityName) {
    result.place = facilityName;
  } else if (facilityPart) {
    result.place = facilityPart;
  }

  // Add secondary information if found
  if (secondaryInfo) result.secondary = secondaryInfo;

  // Detect country if not set
  result.country = detectCountry(result);

  // Return result if we have meaningful components
  const finalResult = result.number || result.street || result.generalDelivery ? result : null;

  return finalResult;
}

export { finishAddress };
export type { FinishInput };
