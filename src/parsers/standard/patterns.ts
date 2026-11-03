// Every regular expression the standard (US and Canadian) parser builds from the tables, made once. They were built
// again inside each call, from the same strings, and building them (a pattern of some six hundred street types
// being joined, escaped and compiled) was four fifths of the time a US address took. The expressions carry no `g` or `y`
// flag, so sharing one holds no `lastIndex` between calls.

import { SECONDARY_UNIT_TYPES } from "../../constants";
import {
  STANDALONE_UNIT_KEYWORDS,
  UNIT_SEPARATOR,
  UNIT_TYPE_KEYWORDS,
  UNIT_VALUE,
  WRITTEN_NUMBERS,
} from "../../patterns/address-patterns";
import { CANADIAN_POSTAL_LIBERAL_PATTERN } from "../../patterns/location-patterns";
import { buildPatterns } from "../../patterns/pattern-builder";
import { WORD_END } from "../../patterns/word-boundary";

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

// The expressions the tables decide, named for what they match. A group of every match is listed beside it.
interface StandardRegexes {
  intersection: RegExp; // two streets: "Main St and 1st Ave"
  poBoxStart: RegExp; // a PO box at the start, after optional spaces
  poBoxAtStart: RegExp; // a PO box at the very start
  leadingPlace: RegExp; // a place's name run into the address: 1 the name, 2 the address
  notPlaceName: RegExp; // a last word that cannot end a place's name
  writtenNumber: RegExp; // a written number and nothing else
  streetTypeAfterNumber: RegExp; // a space, a street type, and no letter after it
  writtenNumberStreet: RegExp; // "One Microsoft Way"
  zipAtEnd: RegExp; // 1 a ZIP at the end of a one-part address
  caPostalAtEnd: RegExp; // 1 a Canadian postal code at the end of a one-part address
  stateAbbrevAtEnd: RegExp; // 1 a state code at the end
  stateFullAtEnd: RegExp; // 1 a state name at the end
  streetTypeWhole: RegExp; // 1 a street type and nothing else
  directionalWhole: RegExp; // 1 a directional and nothing else
  zipAnywhere: RegExp; // 1 a ZIP inside a part
  cityStateAbbrev: RegExp; // 1 the city, 2 a state code
  cityStateAbbrevDotted: RegExp; // 1 the city, 2 a state code that may end in a period (Canada)
  onlyState: RegExp; // a state, by code or name, with an optional period
  cityBeforeUnitType: RegExp; // 1 the city, 2 a unit type with no number
  onlyStateAbbrev: RegExp; // 1 a state code and nothing else
  onlyStateFull: RegExp; // 1 a state name and nothing else
  number: RegExp; // 1 the number, 2 a fraction, 3 the rest
  numberThenDirectional: RegExp; // "48S Main St": 1 the number, 2 the directional, 3 the rest
  leadingDirectional: RegExp; // 1 the directional, 2 the rest
  gridStreet: RegExp; // "2200 W": 1 the number, 2 the directional, 3 the rest
  streetTypeBare: RegExp; // a street type and nothing else
  streetTypeBareDotted: RegExp; // a street type and nothing else, with an optional period
  endsWithStreetType: RegExp; // a space and a street type at the end
  typeThenDirectional: RegExp; // "Main St West": 1 the street, 2 the type, 3 the directional
  directionalAtEnd: RegExp; // 1 the rest, 2 a directional at the end
  typeThenNumber: RegExp; // "US Hwy 101": 1 the street, 2 the type, 3 the number
  typeAtEnd: RegExp; // "Main St.": 1 the street, 2 the type
  typeAtStart: RegExp; // "Rue Main": 1 the type, 2 the street
  numberAndDirectionalOnly: RegExp; // "400E": 1 the number, 2 the directional
  cityAndFullState: RegExp; // 1 an optional city, 2 a state name
}

let cached: StandardRegexes | undefined;

// The text of a pattern group without its parentheses.
const inner = (group: string): string => group.slice(1, -1);

// Built on first use, so importing the package costs none of it.
function standardRegexes(): StandardRegexes {
  if (cached) return cached;
  const patterns = buildPatterns();
  const streetType = inner(patterns.streetType);
  const directional = inner(patterns.directional);
  const stateAbbrev = inner(patterns.stateAbbrev);
  const stateFullName = inner(patterns.stateFullName);
  const poBox = patterns.poBox;

  cached = {
    intersection: new RegExp(patterns.intersection, "i"),
    poBoxStart: new RegExp(`^\\s*${poBox}`, "i"),
    poBoxAtStart: new RegExp(`^${poBox}`, "i"),
    leadingPlace: new RegExp(`^([^\\d,#]*?\\p{L}[^\\d,#]*?)\\s+((?:\\d+(?:-\\d+)?[a-z]?|${poBox})\\s+.+)$`, "iu"),
    notPlaceName: new RegExp(
      `^(?:${streetType}|${directional}|${UNIT_TYPE_KEYWORDS}|${STANDALONE_UNIT_KEYWORDS}|rr|r\\.r\\.|hc|route|rte|site|comp|box|general|delivery)\\.?$`,
      "iu",
    ),
    writtenNumber: new RegExp(`^(?:${WRITTEN_NUMBERS})$`, "i"),
    streetTypeAfterNumber: new RegExp(`\\s(?:${streetType})\\.?(?![\\p{L}\\p{N}])`, "iu"),
    writtenNumberStreet: new RegExp(`^(?:${WRITTEN_NUMBERS})\\s+\\S.*\\s(?:${streetType})\\.?$`, "iu"),
    zipAtEnd: new RegExp(`\\s+(${inner(patterns.zip)})\\s*$`),
    caPostalAtEnd: new RegExp(`\\s+(${CANADIAN_POSTAL_LIBERAL_PATTERN.source})\\s*$`),
    stateAbbrevAtEnd: new RegExp(`\\s+(${stateAbbrev})\\s*$`, "i"),
    stateFullAtEnd: new RegExp(`\\s+(${stateFullName})\\s*$`, "i"),
    streetTypeWhole: new RegExp(`^(${streetType})$`, "i"),
    directionalWhole: new RegExp(`^(${directional})$`, "i"),
    zipAnywhere: new RegExp(`(${inner(patterns.zip)})`),
    cityStateAbbrev: new RegExp(`^(.+?)\\s+(${stateAbbrev})\\s*$`, "i"),
    cityStateAbbrevDotted: new RegExp(`^(.+?)\\s+(${stateAbbrev})\\.?\\s*$`, "iu"),
    onlyState: new RegExp(`^(?:${inner(patterns.state)})\\.?$`, "iu"),
    cityBeforeUnitType: new RegExp(`^(.*?)\\s+(${Object.keys(SECONDARY_UNIT_TYPES).join("|")})\\s*$`, "i"),
    onlyStateAbbrev: new RegExp(`^(${stateAbbrev})\\s*$`, "i"),
    onlyStateFull: new RegExp(`^(${stateFullName})\\s*$`, "i"),
    number: new RegExp(`^(${inner(patterns.number)})(?:\\s+(${inner(patterns.fraction)}))?\\s+(.*)$`, "i"),
    numberThenDirectional: new RegExp(`^(\\d+)(${directional})\\s+(.*)$`, "i"),
    leadingDirectional: new RegExp(`^(${directional})\\s+(.*)$`, "i"),
    gridStreet: new RegExp(`^(\\d+)\\s+(${directional})${WORD_END}(.*)$`, "iu"),
    streetTypeBare: new RegExp(`^(?:${streetType})$`, "iu"),
    streetTypeBareDotted: new RegExp(`^(?:${streetType})\\.?$`, "iu"),
    endsWithStreetType: new RegExp(`\\s(?:${streetType})\\.?$`, "iu"),
    typeThenDirectional: new RegExp(`^(.*?)\\s+(${streetType})${WORD_END}\\.?\\s+(${directional})\\s*$`, "iu"),
    directionalAtEnd: new RegExp(`^(.*?)\\s+(${directional})\\.?\\s*$`, "i"),
    typeThenNumber: new RegExp(`^(.*?)\\s+(${streetType})\\s+(\\d+[A-Za-z]?)\\s*$`, "iu"),
    typeAtEnd: new RegExp(`^(.*?)\\s+(${streetType})\\.?\\s*$`, "iu"),
    typeAtStart: new RegExp(`^(${streetType})${WORD_END}\\.?\\s+(.*)$`, "iu"),
    numberAndDirectionalOnly: new RegExp(`^(\\d+)(${directional})$`, "i"),
    cityAndFullState: new RegExp(`^(?:(.+?)\\s+)??(${stateFullName})\\s*$`, "i"),
  };

  return cached;
}

export {
  CA_UNIT_CIVIC_PATTERN,
  CANADIAN_NUMBERED_HIGHWAY,
  COUNTY_PATTERN,
  PREFIX_UNIT_PATTERN,
  SPANISH_ORDER_STATE,
  STANDALONE_UNIT_AT_END_PATTERN,
  standardRegexes,
  STREET_TYPE_ABBREVIATION_AT_END,
  URBANIZATION_PATTERN,
};
export type { StandardRegexes };
