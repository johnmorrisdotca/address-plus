// The standard parser: a US or Canadian street address with a number, street, type, city, state and ZIP. The
// work is in stages, each in a file of its own: the first comma part is read for a facility or General Delivery
// (facility.ts), the city, state and ZIP are taken off the end (locality-single-line.ts, locality-commas.ts), the
// street line is read (street-line.ts), and the parts are written onto the result (finish.ts).

import { FACILITY_PATTERNS } from "../../constants/index";
import { UNIT_PART_PATTERN } from "../../patterns/address-patterns";
import { GENERAL_DELIVERY_PATTERNS } from "../../patterns/core-patterns";
import { BASIC_VALIDATION_PATTERNS } from "../../patterns/parser-patterns";
import type { ParsedAddress, ParseOptions } from "../../types";
import { splitStreetAndCity } from "../../utils/split-city";
import { RURAL_ROUTE_PART } from "../rural-route-parser";

import { readFacility } from "./facility";
import { finishAddress } from "./finish";
import { readCommaLocality } from "./locality-commas";
import { readSingleLineLocality } from "./locality-single-line";
import type { Locality, LocalityContext } from "./locality.types";
import { PREFIX_UNIT_PATTERN } from "./patterns";
import { hasValidAddressComponents, isCanadianContext } from "./shared";
import { readStreetLine } from "./street-line";

// Parse standard addresses with number, street, type, city, state, zip
function parseStandardAddress(
  address: string,
  options: ParseOptions = {},
  countryHint?: "US" | "CA",
): ParsedAddress | null {
  // Check if input contains valid address components
  if (!hasValidAddressComponents(address)) {
    return null;
  }

  // Normalize newlines to commas for consistent parsing
  const normalizedAddress = address.replace(BASIC_VALIDATION_PATTERNS.NEWLINE_TO_COMMA, ", ");

  // Split by comma to handle comma-separated components
  const commaParts = normalizedAddress.split(",").map((p) => p.trim());

  // Comma parts that are not the city: a facility's name, a unit, a rural route
  const excludedPartIndices = new Set<number>();

  // Detect facility addresses (facility name comes first, followed by actual address)
  const facility = readFacility(commaParts, excludedPartIndices);
  const { addressStartIndex, facilityName, addressPartOverride, urbanization, generalDeliveryStation } = facility;

  // Units and rural routes written in comma parts of their own, between the street and the city: "123 Main
  // St, Unit 4, Toronto", "1234 River Rd, RR 2, Lakefield". Set aside now, so none is taken for the city.
  let secondaryUnitPart = "";
  let ruralRouteNumber = "";
  const lastCommaPart = commaParts[commaParts.length - 1];
  if (commaParts.length > 1 && UNIT_PART_PATTERN.test(lastCommaPart) && !/\d{5}/.test(lastCommaPart)) {
    secondaryUnitPart = commaParts.pop()!.trim();
  }
  for (let i = addressStartIndex + 1; i < commaParts.length - 1; i++) {
    const part = commaParts[i].trim();
    if (!secondaryUnitPart && UNIT_PART_PATTERN.test(part)) {
      secondaryUnitPart = part;
      excludedPartIndices.add(i);
      continue;
    }
    const ruralRoute = part.match(RURAL_ROUTE_PART);
    if (!ruralRouteNumber && ruralRoute) {
      ruralRouteNumber = ruralRoute[1];
      excludedPartIndices.add(i);
    }
  }

  // The comma part that holds the street, until the locality stage says otherwise
  let addressPart = commaParts[addressStartIndex] || commaParts[0];

  if (addressPartOverride) {
    // Use inline address found in first part; parse separately from facility
    addressPart = addressPartOverride;
  }

  if (facilityName && addressStartIndex > 0) {
    excludedPartIndices.add(0); // Exclude facility name part
  }
  if (facility.isGeneralDelivery) {
    excludedPartIndices.add(0); // Exclude General Delivery from city parsing
  }

  const context: LocalityContext = { commaParts, addressStartIndex, excludedPartIndices, options, countryHint };
  const start: Locality = {
    zipPart: "",
    statePart: "",
    cityPart: "",
    addressPart,
    isGeneralDelivery: facility.isGeneralDelivery,
  };
  const locality = commaParts.length === 1 ? readSingleLineLocality(start, context) : readCommaLocality(start, context);
  const { zipPart, statePart, isGeneralDelivery } = locality;
  let { cityPart } = locality;
  addressPart = locality.addressPart;

  // "Ste 1 Brooklyn": a unit written at the start of the city's part.
  const unitBeforeCity = cityPart ? cityPart.match(PREFIX_UNIT_PATTERN) : null;
  if (unitBeforeCity && !secondaryUnitPart && !/\d/.test(unitBeforeCity[2])) {
    secondaryUnitPart = unitBeforeCity[1];
    cityPart = unitBeforeCity[2].trim();
  }

  // With a state but no city part, the city may run on after the street: "1005 N Gravenstein Hwy Suite 500
  // Sebastopol, CA", "2672 Industrial Row Troy, MI 48084".
  if (commaParts.length > 1 && !cityPart && statePart && !isGeneralDelivery && !addressPartOverride) {
    const split = splitStreetAndCity(addressPart, isCanadianContext(zipPart, statePart, options, countryHint));
    if (split.city) {
      cityPart = split.city;
      addressPart = split.street;
    }
  }

  // Fallback: If General Delivery and city wasn't captured, try to extract city between it and the province/state
  if (isGeneralDelivery && !cityPart) {
    // Example non-comma formats:
    //  - General Delivery Whitehorse YT Y1A 2T6
    //  - General Delivery Iqaluit NU X0A 0H0
    const gdCityMatch = address.match(GENERAL_DELIVERY_PATTERNS.WITH_CITY);
    if (gdCityMatch) {
      cityPart = gdCityMatch[1].trim();
    }
  }

  // Check for facility names in middle comma parts (units and rural routes were set aside above)
  let facilityPart = "";

  if (commaParts.length > 2) {
    for (let i = 1; i < commaParts.length - 1; i++) {
      if (excludedPartIndices.has(i)) continue;
      const part = commaParts[i].trim();

      for (const pattern of FACILITY_PATTERNS) {
        if (pattern.test(part)) {
          facilityPart = part;
          excludedPartIndices.add(i);
          break;
        }
      }
    }
  }

  const { result, secondaryInfo } = readStreetLine({
    addressPart,
    isGeneralDelivery,
    secondaryUnitPart,
    ruralRouteNumber,
    facilityName,
    zipPart,
    statePart,
    options,
    countryHint,
  });

  return finishAddress({
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
  });
}

export { parseStandardAddress };
