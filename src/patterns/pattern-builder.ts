// Pattern building utilities for address parsing
// Constructs regex patterns from data constants

import { CA_PROVINCES, CA_STREET_TYPES, DIRECTIONAL_MAP, US_STATES, US_STREET_TYPES } from "../constants";

import { UNIT_TYPE_KEYWORDS, WRITTEN_NUMBERS } from "./address-patterns";
import { VALIDATION_PATTERNS } from "./core-patterns";
import { ZIP_CODE_REGEX_PATTERN } from "./location-patterns";

interface AddressPatterns {
  number: string;
  fraction: string;
  directional: string;
  streetType: string;
  state: string;
  stateAbbrev: string;
  stateFullName: string;
  zip: string;
  poBox: string;
  intersection: string;
  secUnit: string;
}

// The tables are fixed when the module loads, so the pattern strings are built once. Rebuilding them on every call
// sorted and joined every street type for every parser stage of every address, four fifths of a US parse.
let cachedPatterns: Readonly<AddressPatterns> | undefined;

// The regex pattern strings for address parsing, shared and frozen.
function buildPatterns(): Readonly<AddressPatterns> {
  cachedPatterns ??= Object.freeze(composePatterns());

  return cachedPatterns;
}

// Build regex patterns for address parsing
function composePatterns(): AddressPatterns {
  const streetTypes = Object.keys(US_STREET_TYPES)
    .concat(Object.values(US_STREET_TYPES))
    .concat(Object.keys(CA_STREET_TYPES))
    .concat(Object.values(CA_STREET_TYPES))
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort((a, b) => b.length - a.length)
    .map((s) => s.replace(VALIDATION_PATTERNS.REGEX_ESCAPE, "\\$&")) // Escape regex special characters
    .join("|");

  // Keys only: every symbol is also a key, except Canada Post's French NO and SO, which as words are "no"
  // and "so" and must not be read as directionals.
  const directionals = Object.keys(DIRECTIONAL_MAP)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort((a, b) => b.length - a.length)
    .map((d) => d.replace(VALIDATION_PATTERNS.REGEX_ESCAPE, "\\$&")) // Escape regex special characters
    .join("|");

  const states = Object.keys(US_STATES)
    .concat(Object.values(US_STATES))
    .concat(Object.keys(CA_PROVINCES))
    .concat(Object.values(CA_PROVINCES))
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join("|");

  // Create separate pattern for state abbreviations (2-3 chars) vs full names
  const stateAbbrevs = (Object.values(US_STATES).concat(Object.values(CA_PROVINCES)) as string[])
    .filter((v, i, arr) => arr.indexOf(v) === i && v.length <= 3)
    .sort((a, b) => b.length - a.length)
    .join("|");

  const stateFullNames = Object.keys(US_STATES)
    .concat(Object.keys(CA_PROVINCES))
    .filter((v, i, arr) => arr.indexOf(v) === i && v.length > 3)
    .sort((a, b) => b.length - a.length)
    .join("|");

  return {
    // A number may end in a letter (123A, 2455-B), but not in N, S, E or W: in "412E" or "48S" the letter
    // is a directional.
    number: String.raw`(\d+(?:[-\/]*\d+)?(?:-?[A-DF-MO-RT-VX-Z])?|\w\d+\w\d+|${WRITTEN_NUMBERS})`,
    fraction: String.raw`(\d+\/\d+)`,
    directional: `(${directionals})`,
    streetType: `(${streetTypes})`,
    // The three state patterns are bare groups, like streetType: callers anchor them, and an unanchored
    // search wraps them in wholeWord() with the `u` flag so an accented city cannot hide a state code.
    state: `(${states})`,
    stateAbbrev: `(${stateAbbrevs})`,
    stateFullName: `(${stateFullNames})`,
    zip: ZIP_CODE_REGEX_PATTERN, // Use pattern from validation.ts for DRY compliance
    // Extend to include Canadian variants: C.P./CP, Case/Boîte postale, POBox, Box, and loose 'P.O. box'
    // We'll still capture the box number in group 2 when present
    poBox: String.raw`(p\.?\s*o\.?\s*box|post\s*office\s*box|pobox|po\s*box|pob(?=\s*\d)|c\.?p\.?|cp|case\s*postale|bo[iî]te\s*postale|boite\s*postale|box)\s*(\d+)?`,
    intersection: String.raw`\s+(?:and|&|at|\@)\s+`,
    secUnit: String.raw`(?:(${UNIT_TYPE_KEYWORDS}|#)\s+([a-z0-9-]+))`,
  };
}

export { buildPatterns };
export type { AddressPatterns };
