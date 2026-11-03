// The city, state and ZIP of an address written with no commas, taken off its end: "123 Main St Springfield IL 62701".

import { SECONDARY_UNIT_TYPES } from "../../constants/index";
import { VALIDATION_PATTERNS } from "../../patterns/core-patterns";
import { CITY_PATTERNS } from "../../patterns/location-patterns";
import { BASIC_VALIDATION_PATTERNS } from "../../patterns/parser-patterns";
import { splitStreetAndCity } from "../../utils/split-city";

import type { Locality, LocalityContext } from "./locality.types";
import { standardRegexes } from "./patterns";
import { isCanadianContext } from "./shared";

// Read the locality of an address that is one comma part, starting from what the stages before it found.
function readSingleLineLocality(start: Locality, context: LocalityContext): Locality {
  const { commaParts, options, countryHint } = context;
  const rx = standardRegexes();
  let { zipPart, statePart, cityPart, addressPart, isGeneralDelivery } = start;

  // No commas, try to parse city/state/zip from the end
  let remainingText = commaParts[0];
  // Special-case: strip leading General Delivery (with optional comma/space)
  const leadingGeneralDelivery = remainingText.match(BASIC_VALIDATION_PATTERNS.LEADING_GENERAL_DELIVERY);
  if (leadingGeneralDelivery) {
    isGeneralDelivery = true;
    remainingText = remainingText.slice(leadingGeneralDelivery[0].length).trim();
  }

  // Extract ZIP first
  const zipMatch = remainingText.match(rx.zipAtEnd);
  const caPostalMatch = remainingText.match(rx.caPostalAtEnd);

  if (zipMatch) {
    zipPart = zipMatch[1];
    remainingText = remainingText.replace(zipMatch[0], "").trim();
  } else if (caPostalMatch) {
    zipPart = caPostalMatch[1];
    remainingText = remainingText.replace(caPostalMatch[0], "").trim();
  }

  // Extract state (try abbreviations first, then full names)
  const stateAbbrevMatch = remainingText.match(rx.stateAbbrevAtEnd);
  const stateFullMatch = remainingText.match(rx.stateFullAtEnd);

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
          const isStreetType = rx.streetTypeWhole.test(potentialCity);
          const isDirectional = rx.directionalWhole.test(potentialCity);

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
  return { zipPart, statePart, cityPart, addressPart, isGeneralDelivery };
}

export { readSingleLineLocality };
