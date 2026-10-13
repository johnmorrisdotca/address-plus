// Main address parser implementation - based on the original parse-address library patterns

import { DIRECTIONAL_MAP, SECONDARY_UNIT_TYPES } from "./constants/index";
import { ALL_SUB_REGION_NAMES } from "./constants/sub-regions";
import { pickCountryModule } from "./country/pick";
import { looksJapanese, parseJapaneseAddress } from "./jp/parse";
import { parseInformalAddress } from "./parsers/informal-address-parser";
import { parseIntersection } from "./parsers/intersection-parser";
import { parseMilitary } from "./parsers/military-parser";
import { createParser, parseAddress, parser, setParseLocationImpl } from "./parsers/parser-orchestrator";
import { parsePoBox } from "./parsers/po-box-parser";
import { parseRuralRoute, RURAL_ROUTE_PART, TRAILING_RURAL_ROUTE } from "./parsers/rural-route-parser";
import {
  FACILITY_INDICATORS,
  FACILITY_PATTERNS,
  MUSIC_SQUARE_EAST_PATTERN,
  ORDINAL_FLOOR_PATTERN,
  SECONDARY_UNIT_PATTERN,
  STANDALONE_UNIT_KEYWORDS,
  UNIT_PART_PATTERN,
  UNIT_SEPARATOR,
  UNIT_TYPE_KEYWORDS,
  UNIT_TYPE_NUMBER_PATTERN,
  UNIT_VALUE,
  WRITTEN_NUMBERS,
} from "./patterns/address-patterns";
import {
  CONNECTOR_WORDS,
  FACILITY_DELIMITER_PATTERNS,
  GENERAL_DELIVERY_PATTERNS,
  ISLAND_TYPE_PATTERN,
  VALIDATION_PATTERNS,
  ZIP_VALIDATION_PATTERNS,
} from "./patterns/core-patterns";
import { CANADIAN_POSTAL_LIBERAL_PATTERN, CITY_PATTERNS, ZIP_CODE_PATTERN } from "./patterns/location-patterns";
import { BASIC_VALIDATION_PATTERNS, DIGIT_PATTERNS, ROAD_NAME_PATTERNS } from "./patterns/parser-patterns";
import { buildPatterns } from "./patterns/pattern-builder";
import { WORD_END } from "./patterns/word-boundary";
import type { ParsedAddress, ParseOptions } from "./types";
import { setValidatedPostalCode } from "./utils/address-validation";
import { capitalizeStreetName } from "./utils/capitalization";
import { toSnakeCase } from "./utils/case-converter";
import { detectCountry, parseStateProvince } from "./utils/parsing";
import { prepareInput } from "./utils/prepare-input";
import { abbreviateRegionConnectors } from "./utils/region-connectors";
import { splitStreetAndCity } from "./utils/split-city";
import { normalizeStreetType } from "./utils/street-type-normalizer";

// "Unit 4-123 Main St", "#4-123 Main St", "4A-123 Main St": groups 1 the designator, 2 a pound sign, 3 the
// unit, 4 the civic number, 5 the rest.
const CA_UNIT_CIVIC_PATTERN = new RegExp(
  `^(?:(${UNIT_TYPE_KEYWORDS})${UNIT_SEPARATOR}|(#)\\s*)?([a-z0-9]+)-(\\d+[a-z]?)\\s+(.+)$`,
  "iu",
);

// A unit before the number: group 1 the unit, group 2 the rest.
const PREFIX_UNIT_PATTERN = new RegExp(
  `^((?:${UNIT_TYPE_KEYWORDS})${UNIT_SEPARATOR}${UNIT_VALUE}|#\\s*[a-z0-9-]+|(?:lt|lot)\\d[a-z0-9]*)\\s+(.+)$`,
  "iu",
);

// A designator with no number at the end of a street line: group 1 the street, group 2 the designator.
const STANDALONE_UNIT_AT_END_PATTERN = new RegExp(`^(.*?)\\s+(${STANDALONE_UNIT_KEYWORDS})\\.?\\s*$`, "iu");

// "Hwy 7", "Highway 16", "route 132": a numbered highway, whose direction Canada Post writes after it.
const CANADIAN_NUMBERED_HIGHWAY = /^(?:hwy|highway|route|rte|autoroute|aut)\.?\s+\d+[a-z]?$/i;

// Puerto Rico writes the type first, in Spanish order: "Calle A", "Ave Ponce de Leon".
const SPANISH_ORDER_STATE = /^(?:pr|puerto\s+rico)$/i;

// "URB Las Gladiolas", "Urb. Royal Oak": a Puerto Rico urbanization.
const URBANIZATION_PATTERN = /^urb\.?\s+\S/i;

// "King County", "Comté de Gatineau" is not a city.
const COUNTY_PATTERN = /\s(?:county|parish|borough)$/i;

// A part ending in a street type's abbreviation: "Canal Rd".
const STREET_TYPE_ABBREVIATION_AT_END = /\s(?:st|ave|av|rd|dr|ln|blvd|ct|pl|hwy|pkwy|cir|ter|trl|cres)\.?$/i;

// A city, then a state or province by its full name. The city is tried absent first, so "West Virginia"
// on its own is the state, not the city West in Virginia; "Charleston West Virginia" still splits.
const cityAndFullState = (patterns: ReturnType<typeof buildPatterns>): RegExp =>
  new RegExp(`^(?:(.+?)\\s+)??(${patterns.stateFullName.slice(1, -1)})\\s*$`, "i");

/**
 * Parses a US, Canadian or Japanese address into its parts. The country is detected from the text (a state, a
 * province, a postal code, Japanese script or romaji designators) unless `options.country` names it. A Japanese
 * address fills its own fields (`prefecture`, `municipality`, `town`, `chome`, `ban`, `go`) and the shared ones that
 * stand for them. Australia and the United Kingdom are read too when their modules are passed in `options.countries`
 * (`australia` from `/au`, `unitedKingdom` from `/gb`): `options.country` picks one, or each module's own detection
 * decides, before the US, Canada and Japan are tried.
 *
 * @param address - The address as one string; commas, line breaks and full-width characters are all read.
 * @param options - How to parse: the country, strict postal codes, snake_case keys and the rest (see `ParseOptions`).
 * @returns The parts found, or `null` when the text is empty or holds nothing that can be read as an address. A part
 * that is not in the address is absent from the result, never an empty string.
 * @example
 * ```ts
 * import { parseLocation } from "@johnmorrisdotca/address-plus";
 *
 * console.log(parseLocation("1600 Pennsylvania Ave NW, Washington, DC 20500"));
 * // → {"number":"1600","street":"Pennsylvania","type":"Ave","suffix":"NW","city":"Washington","state":"DC","zip":"20500","zipValid":true,"country":"US"}
 * ```
 */
function parseLocation(address: string, options: ParseOptions = {}): ParsedAddress | null {
  if (!address || typeof address !== "string") {
    return null;
  }

  let original = address.trim();

  // Strip surrounding parentheses if present
  if (original.startsWith("(") && original.endsWith(")")) {
    original = original.slice(1, -1).trim();
  }

  // "N/A", "-", "?": no word of two letters and no digit is not an address.
  if (!/\p{L}{2}/u.test(original) && !/\d/.test(original)) {
    return null;
  }

  // A country read by a module the caller handed in (Australia, the United Kingdom): the hint names it, or the
  // module's own detection is sure of the address. Without countries, nothing here changes.
  const countryModule = pickCountryModule(original, options.country, options.countries);
  if (countryModule) return countryModule.parse(original, options);

  // Japan writes addresses differently enough to have a parser of its own.
  if (options.country === "JP" || (options.country !== "US" && options.country !== "CA" && looksJapanese(original))) {
    return parseJapaneseAddress(original, options);
  }

  // Tidy spacing, a trailing country, a province in parentheses and the comma placements that only
  // move a part around, so the parsers below see one form of each.
  const prepared = prepareInput(original);
  // "Newfoundland and Labrador" is a province, not two streets meeting: names holding a connector are
  // written as their code before anything else reads the text.
  const text = abbreviateRegionConnectors(prepared.text);
  const finish = (result: ParsedAddress | null): ParsedAddress | null => {
    if (!result) return null;
    if (!result.country && prepared.country) result.country = prepared.country;
    return options.useSnakeCase ? (toSnakeCase(result) as unknown as ParsedAddress) : result;
  };

  // Check for intersection first
  const patterns = buildPatterns();
  if (new RegExp(patterns.intersection, "i").test(text)) {
    const result = parseIntersection(text, options);
    if (result && options.useSnakeCase) {
      return toSnakeCase(result) as unknown as ParsedAddress;
    }
    return result;
  }

  // Delivery lines that are not streets: military, rural and highway contract routes, PO boxes.
  const special = parseMilitary(text, options) ?? parseRuralRoute(text, options);
  if (special) return finish(special);

  // A place's name run straight into its address, with no comma: "Barboncino 781 Franklin Ave".
  const leadingPlace = takeLeadingPlace(text, patterns);
  const addressText = leadingPlace ? leadingPlace.rest : text;
  const withPlace = (result: ParsedAddress | null): ParsedAddress | null => {
    if (result && leadingPlace && !result.place) result.place = leadingPlace.place;
    return finish(result);
  };

  const poBoxMatch = addressText.match(new RegExp(`^\\s*${patterns.poBox}`, "i"));
  if (poBoxMatch) {
    return withPlace(parsePoBox(addressText, options));
  }

  // Try standard address parsing
  return withPlace(
    parseStandardAddress(addressText, options, prepared.country) || parseInformalAddress(addressText, options),
  );
}

// A place's name before the number, with no comma between: "Black Alliance for Just Immigration 660
// Nostrand Ave", "ACLU DC P.O. Box 11637". Taken only when the name ends in a word that is not a street
// type, a unit or a route word, and what follows the number names a street type or is a PO box.
function takeLeadingPlace(
  text: string,
  patterns: ReturnType<typeof buildPatterns>,
): { place: string; rest: string } | null {
  if (new RegExp(`^\\s*${patterns.poBox}`, "i").test(text)) return null;
  const commaAt = text.indexOf(",");
  const firstPart = commaAt === -1 ? text : text.slice(0, commaAt);
  const match = firstPart.match(
    new RegExp(`^([^\\d,#]*?\\p{L}[^\\d,#]*?)\\s+((?:\\d+(?:-\\d+)?[a-z]?|${patterns.poBox})\\s+.+)$`, "iu"),
  );
  if (!match) return null;

  const place = match[1].trim();
  const lastWord = place.split(/\s+/).pop() ?? "";
  const notName = new RegExp(
    `^(?:${patterns.streetType.slice(1, -1)}|${patterns.directional.slice(1, -1)}|${UNIT_TYPE_KEYWORDS}|${STANDALONE_UNIT_KEYWORDS}|rr|r\\.r\\.|hc|route|rte|site|comp|box|general|delivery)\\.?$`,
    "iu",
  );
  if (notName.test(lastWord) || /[:;|\u2013\u2014-]$/.test(place)) return null;
  if (new RegExp(`^(?:${WRITTEN_NUMBERS})$`, "i").test(place)) return null;

  const afterNumber = match[2];
  const isPoBox = new RegExp(`^${patterns.poBox}`, "i").test(afterNumber);
  const namesType = new RegExp(`\\s(?:${patterns.streetType.slice(1, -1)})\\.?(?![\\p{L}\\p{N}])`, "iu").test(
    afterNumber,
  );
  if (!isPoBox && !namesType) return null;

  return { place, rest: `${afterNumber}${commaAt === -1 ? "" : text.slice(commaAt)}` };
}

// Simple validation to check if address contains basic components
function hasValidAddressComponentsLocal(address: string): boolean {
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

// Parse standard addresses with number, street, type, city, state, zip
function parseStandardAddress(
  address: string,
  options: ParseOptions = {},
  countryHint?: "US" | "CA",
): ParsedAddress | null {
  const patterns = buildPatterns();

  // Check if input contains valid address components
  if (!hasValidAddressComponentsLocal(address)) {
    return null;
  }

  // Normalize newlines to commas for consistent parsing
  const normalizedAddress = address.replace(BASIC_VALIDATION_PATTERNS.NEWLINE_TO_COMMA, ", ");

  // Split by comma to handle comma-separated components
  const commaParts = normalizedAddress.split(",").map((p) => p.trim());

  // Track General Delivery flag and excluded parts
  let isGeneralDelivery = false;
  const excludedPartIndices = new Set<number>();

  // Detect facility addresses (facility name comes first, followed by actual address)
  let addressStartIndex = 0;
  let facilityName = "";
  // Address part override when inline address found in first comma part
  let addressPartOverride: string | null = null;
  let urbanization = "";
  let generalDeliveryStation = "";

  if (commaParts.length > 1) {
    const firstPart = commaParts[0];

    // Special-case: General Delivery as the first part
    if (GENERAL_DELIVERY_PATTERNS.STANDARD.test(firstPart)) {
      isGeneralDelivery = true;
      addressStartIndex = 1;
      generalDeliveryStation = firstPart.match(/\s(?:stn\.?|station|succ\.?|succursale)\s+(.+)$/i)?.[1] ?? "";
    }

    // Sophisticated heuristic for facility detection:
    // 1. No house numbers at the start
    // 2. Street types should be secondary (like "Park", "Center", "Building")
    // 3. Doesn't follow typical "number + street + type" pattern

    // A number written as a word, then a street that ends in a type, is an address ("One Microsoft Way").
    const writtenNumberStreet = new RegExp(
      `^(?:${WRITTEN_NUMBERS})\\s+\\S.*\\s(?:${patterns.streetType.slice(1, -1)})\\.?$`,
      "iu",
    ).test(firstPart.trim());
    const hasHouseNumber = VALIDATION_PATTERNS.HOUSE_NUMBER_START.test(firstPart.trim()) || writtenNumberStreet;
    // A unit before the number ("Unit 4-123 Main St", "#4-123 Main St") starts an address too.
    const startsWithUnit = PREFIX_UNIT_PATTERN.test(firstPart.trim()) || CA_UNIT_CIVIC_PATTERN.test(firstPart.trim());
    const startsWithNumber =
      VALIDATION_PATTERNS.STARTS_WITH_NUMBER.test(firstPart) || writtenNumberStreet || startsWithUnit;

    // A Puerto Rico urbanization written above the street ("URB Las Gladiolas") is the locality.
    if (URBANIZATION_PATTERN.test(firstPart)) {
      urbanization = firstPart.trim();
      addressStartIndex = 1;
      excludedPartIndices.add(0);
    }

    // A first part that ends in an abbreviated street type is a street with no number ("Canal Rd").
    const endsWithTypeAbbreviation = STREET_TYPE_ABBREVIATION_AT_END.test(firstPart.trim());

    // If it starts with a number, it's likely a street address, not a facility
    if (!startsWithNumber && !hasHouseNumber && !urbanization && !isGeneralDelivery) {
      // Handle inline address separated by delimiter or parentheses
      const parenInline = firstPart.match(FACILITY_DELIMITER_PATTERNS.PARENTHETICAL);
      const delimInline = firstPart.match(FACILITY_DELIMITER_PATTERNS.DELIMITED);
      // Handle trailing Island-like phrases without delimiters; preserve spaces
      const trailingIsland = firstPart.match(FACILITY_DELIMITER_PATTERNS.TRAILING_ISLAND);

      if (parenInline) {
        facilityName = parenInline[1].trim();
        addressPartOverride = parenInline[2].trim();
        addressStartIndex = 0;
        excludedPartIndices.add(0);
      } else if (delimInline) {
        facilityName = delimInline[1].trim();
        addressPartOverride = delimInline[3].trim();
        addressStartIndex = 0;
        excludedPartIndices.add(0);
      } else if (trailingIsland) {
        // Keep trailing Island phrase as address part and preserve spacing
        facilityName = trailingIsland[1].trim();
        addressPartOverride = trailingIsland[3].trim();
        addressStartIndex = 0;
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
        !facilityName &&
        !endsWithTypeAbbreviation &&
        ((hasMultipleWords && hasFacilityIndicator) ||
          (hasMultipleWords &&
            filteredWords.length >= 2 &&
            filteredWords.every((word) => VALIDATION_PATTERNS.TITLE_CASE.test(word)) &&
            !words.some((word) => VALIDATION_PATTERNS.NUMERIC_ONLY.test(word))))
      ) {
        facilityName = firstPart.trim();
        addressStartIndex = 1;
      }
    }
  }

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

  // Extract ZIP from end and work backwards
  let zipPart = "";
  let statePart = "";
  let cityPart = "";
  let addressPart = commaParts[addressStartIndex] || commaParts[0];

  if (addressPartOverride) {
    // Use inline address found in first part; parse separately from facility
    addressPart = addressPartOverride;
  }

  if (facilityName && addressStartIndex > 0) {
    excludedPartIndices.add(0); // Exclude facility name part
  }
  if (isGeneralDelivery) {
    excludedPartIndices.add(0); // Exclude General Delivery from city parsing
  }

  // Handle non-comma separated addresses
  if (commaParts.length === 1) {
    // No commas, try to parse city/state/zip from the end
    let remainingText = commaParts[0];
    // Special-case: strip leading General Delivery (with optional comma/space)
    const leadingGeneralDelivery = remainingText.match(BASIC_VALIDATION_PATTERNS.LEADING_GENERAL_DELIVERY);
    if (leadingGeneralDelivery) {
      isGeneralDelivery = true;
      remainingText = remainingText.slice(leadingGeneralDelivery[0].length).trim();
    }

    // Extract ZIP first
    const zipMatch = remainingText.match(new RegExp(`\\s+(${patterns.zip.slice(1, -1)})\\s*$`));
    const caPostalMatch = remainingText.match(new RegExp(`\\s+(${CANADIAN_POSTAL_LIBERAL_PATTERN.source})\\s*$`));

    if (zipMatch) {
      zipPart = zipMatch[1];
      remainingText = remainingText.replace(zipMatch[0], "").trim();
    } else if (caPostalMatch) {
      zipPart = caPostalMatch[1];
      remainingText = remainingText.replace(caPostalMatch[0], "").trim();
    }

    // Extract state (try abbreviations first, then full names)
    const stateAbbrevMatch = remainingText.match(new RegExp(`\\s+(${patterns.stateAbbrev.slice(1, -1)})\\s*$`, "i"));
    const stateFullMatch = remainingText.match(new RegExp(`\\s+(${patterns.stateFullName.slice(1, -1)})\\s*$`, "i"));

    // "26th St 6th Fl": FL after an ordinal is the floor, not Florida.
    const floorNotState =
      !!stateAbbrevMatch &&
      /^fl$/i.test(stateAbbrevMatch[1]) &&
      /\d(?:st|nd|rd|th)$/i.test(remainingText.slice(0, stateAbbrevMatch.index).trim());

    if (stateAbbrevMatch && !floorNotState) {
      statePart = stateAbbrevMatch[1];
      remainingText = remainingText.replace(stateAbbrevMatch[0], "").trim();
    } else if (stateFullMatch) {
      statePart = stateFullMatch[1];
      remainingText = remainingText.replace(stateFullMatch[0], "").trim();
    }

    // Extract city (what's left after removing ZIP and state, taking the last word(s))
    if (remainingText) {
      // Look for city at the end of remaining text, but be smart about it
      // If we have a state, we can be more confident about city extraction
      // If no state, extract city if we can identify a non-street-type word
      const hasState = !!statePart;

      if (hasState) {
        // With a state, the city is whatever follows the street; splitStreetAndCity finds the edge.
        const canadian = isCanadianContext(zipPart, statePart, options, countryHint);
        const split = splitStreetAndCity(remainingText, canadian);
        if (split.city) {
          cityPart = split.city;
          remainingText = split.street;
        }
      } else {
        // Without state, be conservative about city extraction
        // Extract if we have a clear non-street-type word at the end
        // AND the remaining text suggests a full address (at least 4+ words)
        const wordCount = remainingText.split(VALIDATION_PATTERNS.WHITESPACE_SPLIT).length;
        const split =
          wordCount >= 5 && zipPart
            ? splitStreetAndCity(remainingText, isCanadianContext(zipPart, statePart, options, countryHint))
            : null;
        if (split?.city) {
          // A ZIP and a street whose type is found: the city is what follows it.
          cityPart = split.city;
          remainingText = split.street;
        } else if (wordCount >= 5) {
          // More conservative: at least "number prefix street type city"
          const singleWordCityMatch = remainingText.match(CITY_PATTERNS.SINGLE_WORD_CITY);

          if (singleWordCityMatch) {
            const potentialCity = singleWordCityMatch[1].trim();
            const isStreetType = new RegExp(`^(${patterns.streetType.slice(1, -1)})$`, "i").test(potentialCity);
            const isDirectional = new RegExp(`^(${patterns.directional.slice(1, -1)})$`, "i").test(potentialCity);

            // A unit word ending the line ("Sixth Floor") is not a city either.
            const isUnitWord = potentialCity.toLowerCase() in SECONDARY_UNIT_TYPES;

            // Extract if it's clearly not a street component
            if (!isStreetType && !isDirectional && !isUnitWord && potentialCity.length > 2) {
              cityPart = potentialCity;
              remainingText = remainingText.replace(singleWordCityMatch[0], "").trim();
            }
          }
        }
      }
    }

    // Use remaining text as address part (after removing city/state/zip)
    if (remainingText) {
      addressPart = remainingText;
    }
  } else {
    const lastPart = commaParts[commaParts.length - 1];
    const zipMatch = lastPart.match(new RegExp(`(${patterns.zip.slice(1, -1)})`));
    const caPostalMatch = lastPart.match(CANADIAN_POSTAL_LIBERAL_PATTERN);

    if (zipMatch) {
      zipPart = zipMatch[1];
      // Remove ZIP from the part and see what's left (might be city + state)
      const remainingAfterZip = lastPart.replace(zipMatch[0], "").trim();
      if (remainingAfterZip) {
        // Try to parse city and state from remaining text
        const cityStateAbbrevMatch = remainingAfterZip.match(
          new RegExp(`^(.+?)\\s+(${patterns.stateAbbrev.slice(1, -1)})\\s*$`, "i"),
        );
        if (cityStateAbbrevMatch) {
          cityPart = cityStateAbbrevMatch[1].trim();
          statePart = cityStateAbbrevMatch[2].trim();
        } else {
          const cityStateFullMatch = remainingAfterZip.match(cityAndFullState(patterns));
          if (cityStateFullMatch) {
            cityPart = (cityStateFullMatch[1] ?? "").trim();
            statePart = cityStateFullMatch[2].trim();
          } else if (new RegExp(`^(?:${patterns.state.slice(1, -1)})\\.?$`, "iu").test(remainingAfterZip)) {
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
        const cityStateAbbrevMatch = remainingText.match(
          new RegExp(`^(.+?)\\s+(${patterns.stateAbbrev.slice(1, -1)})\\s*$`, "i"),
        );
        if (cityStateAbbrevMatch) {
          cityPart = cityStateAbbrevMatch[1].trim();
          statePart = cityStateAbbrevMatch[2].trim();
        } else {
          const cityStateFullMatch = remainingText.match(cityAndFullState(patterns));
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
              const standaloneUnitMatch = remainingText.match(
                new RegExp(`^(.*?)\\s+(${Object.keys(SECONDARY_UNIT_TYPES).join("|")})\\s*$`, "i"),
              );
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
      const lastCityProvince = remainingAfterZip.match(
        new RegExp(`^(.+?)\\s+(${patterns.stateAbbrev.slice(1, -1)})\\.?\\s*$`, "iu"),
      );
      const lastCityProvinceFull = lastCityProvince ? null : remainingAfterZip.match(cityAndFullState(patterns));
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
        const cityStateAbbrevMatch = cityStateText.match(
          new RegExp(`^(.+?)\\s+(${patterns.stateAbbrev.slice(1, -1)})\\s*$`, "i"),
        );
        if (cityStateAbbrevMatch) {
          cityPart = cityStateAbbrevMatch[1].trim();
          statePart = cityStateAbbrevMatch[2].trim();
        } else {
          const cityStateFullMatch = cityStateText.match(cityAndFullState(patterns));
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
        const cityStateAbbrevMatch = remainingText.match(
          new RegExp(`^(.+?)\\s+(${patterns.stateAbbrev.slice(1, -1)})\\s*$`, "i"),
        );
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
          const cityStateFullMatch = remainingText.match(cityAndFullState(patterns));
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
            const justStateAbbrevMatch = remainingText.match(
              new RegExp(`^(${patterns.stateAbbrev.slice(1, -1)})\\s*$`, "i"),
            );
            if (justStateAbbrevMatch) {
              statePart = justStateAbbrevMatch[1].trim();
            } else {
              const justStateFullMatch = remainingText.match(
                new RegExp(`^(${patterns.stateFullName.slice(1, -1)})\\s*$`, "i"),
              );
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
  }

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
  const numberMatch = remaining.match(
    new RegExp(`^(${patterns.number.slice(1, -1)})(?:\\s+(${patterns.fraction.slice(1, -1)}))?\\s+(.*)$`, "i"),
  );

  // If no match, try to detect number immediately followed by directional (like "48S")
  if (!numberMatch) {
    const numberDirectionalMatch = remaining.match(
      new RegExp(`^(\\d+)(${patterns.directional.slice(1, -1)})\\s+(.*)$`, "i"),
    );
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
    const prefixMatch = remaining.match(new RegExp(`^(${patterns.directional.slice(1, -1)})\\s+(.*)$`, "i"));
    // A directional followed only by a type is the street's name, not a predirectional (Pub 28: "North St").
    const onlyTypeFollows =
      !!prefixMatch && new RegExp(`^(?:${patterns.streetType.slice(1, -1)})\\.?$`, "iu").test(prefixMatch[2].trim());
    if (prefixMatch && !onlyTypeFollows) {
      const normalizedDirectional = DIRECTIONAL_MAP[prefixMatch[1].toLowerCase()];
      result.prefix = normalizedDirectional || prefixMatch[1].toUpperCase();
      remaining = prefixMatch[2];
    }
  }

  // 2.5. Check for spaced grid address pattern (e.g., "2200 W" or "400 E")
  if (result.number && result.prefix && !result.street) {
    // Look for pattern: NUMBER DIRECTION at the start of remaining text
    const gridMatch = remaining.match(
      new RegExp(`^(\\d+)\\s+(${patterns.directional.slice(1, -1)})${WORD_END}(.*)$`, "iu"),
    );
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
      const isAlsoType = new RegExp(`^(?:${patterns.streetType.slice(1, -1)})$`, "iu").test(standaloneUnitMatch[2]);
      const beforeEndsWithType = new RegExp(`\\s(?:${patterns.streetType.slice(1, -1)})\\.?$`, "iu").test(` ${before}`);
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
    const streetTypeWithDirectionalMatch = remaining.match(
      new RegExp(
        `^(.*?)\\s+(${patterns.streetType.slice(1, -1)})${WORD_END}\\.?\\s+(${patterns.directional.slice(1, -1)})\\s*$`,
        "iu",
      ),
    );

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
    const suffixMatch = remaining.match(new RegExp(`^(.*?)\\s+(${patterns.directional.slice(1, -1)})\\.?\\s*$`, "i"));
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
    const streetTypeWithDirectionalMatch = remaining.match(
      new RegExp(
        `^(.*?)\\s+(${patterns.streetType.slice(1, -1)})${WORD_END}\\.?\\s+(${patterns.directional.slice(1, -1)})\\s*$`,
        "iu",
      ),
    );

    // Pattern: "Street Type Number" (e.g., "US Hwy 101", "Route 66")
    const streetTypeNumberMatch = remaining.match(
      new RegExp(`^(.*?)\\s+(${patterns.streetType.slice(1, -1)})\\s+(\\d+[A-Za-z]?)\\s*$`, "iu"),
    );

    // Pattern: "Street Type." or "Street Type" at the end
    const streetTypeSuffixMatch = remaining.match(
      new RegExp(`^(.*?)\\s+(${patterns.streetType.slice(1, -1)})\\.?\\s*$`, "iu"),
    );

    // Pattern: French pattern: "Type Street"
    const streetTypePrefixMatch = remaining.match(
      new RegExp(`^(${patterns.streetType.slice(1, -1)})${WORD_END}\\.?\\s+(.*)$`, "iu"),
    );

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
      const numberDirectionalStreetMatch = remaining
        .trim()
        .match(new RegExp(`^(\\d+)(${patterns.directional.slice(1, -1)})$`, "i"));
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
    if (ALL_SUB_REGION_NAMES.has(normLocality)) {
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

// Parse informal addresses (fallback)

// Inject parseLocation implementation to break circular dependency
setParseLocationImpl(parseLocation);

// Re-export main functions
export { createParser, parseAddress, parseInformalAddress, parseIntersection, parseLocation, parser };
