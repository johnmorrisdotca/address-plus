// Clean address string functionality
// Provides string-based cleaning and normalization of address data

import { COUNTRIES } from "../constants";
import {
  CA_PROVINCE_NAMES as CA_PROVINCE_NAMES_TO_CODES,
  DIRECTION_EXPANSIONS,
  PROVINCE_EXPANSIONS,
  SECONDARY_UNIT_TYPES,
  STREET_TYPE_DETECTION_PATTERN,
  STREET_TYPE_EXPANSIONS,
  US_STATE_EXPANSIONS,
  US_STATE_NAMES as US_STATE_NAMES_TO_CODES,
} from "../constants/index.js";
import { parseLocation } from "../index.js";
import { formatJapanese } from "../jp/format";
import { UTILITY_PATTERNS } from "../patterns/parser-patterns";
import type { CleanAddressOptions, CleanAddressResult } from "../types/clean-address.js";
import type { ParsedAddress } from "../types/index.js";

import { formatAddress, formatCanadaPost, formatUSPS } from "./address-formatting.js";

/**
 * Tidies an address typed in a hurry: spaces, commas, letter case, the street type and the state, without changing
 * what it says.
 *
 * @param addressString - The address as typed.
 * @param options - What to tidy and the letter case to set (see `CleanAddressOptions`).
 * @returns The tidied address; the input, trimmed, when it cannot be parsed.
 * @example
 * ```ts
 * import { cleanAddress } from "@johnmorrisdotca/address-plus";
 *
 * console.log(cleanAddress("350 FIFTH AVENUE, NEW YORK, NY 10118"));
 * // → "350 Fifth Ave, New York NY 10118"
 * ```
 */
function cleanAddress(addressString: string, options: CleanAddressOptions = {}): string {
  const result = cleanAddressDetailed(addressString, options);
  return result.cleanedAddress;
}

/**
 * Tidies an address like `cleanAddress`, and says what it changed.
 *
 * @param addressString - The address as typed.
 * @param options - What to tidy and the letter case to set (see `CleanAddressOptions`).
 * @returns The tidied address, the input, whether anything changed, and a line for each change.
 * @example
 * ```ts
 * import { cleanAddressDetailed } from "@johnmorrisdotca/address-plus";
 *
 * console.log(cleanAddressDetailed("742 evergreen terrace,springfield ,  il 62704").cleanedAddress);
 * // → "742 Evergreen Ter, Springfield IL 62704"
 * ```
 */
function cleanAddressDetailed(addressString: string, options: CleanAddressOptions = {}): CleanAddressResult {
  // Set default options
  const opts = {
    format: "standard" as const,
    removeExtraSpaces: true,
    standardizeCase: "none" as const,
    expandAbbreviations: false,
    ...options,
  };

  const changes: string[] = [];

  // Handle empty or whitespace-only input
  if (!addressString || !addressString.trim()) {
    return {
      cleanedAddress: addressString.trim(),
      wasModified: false,
      changes: [],
    };
  }

  // Parse the address
  const parsedAddress = parseLocation(addressString.trim());

  // Check if parsing was successful
  if (!parsedAddress || Object.keys(parsedAddress).length === 0 || !hasValidAddressComponents(parsedAddress)) {
    return {
      cleanedAddress: addressString.trim(),
      wasModified: false,
      changes: ["Could not parse address"],
    };
  }

  // A Japanese address is written back the way Japan Post asks, in one line: one width of digit, the block as
  // 1-2-3, the prefecture and municipality from the tables. Letter case and abbreviations do not apply to it.
  if (parsedAddress.country === "JP") {
    const japanese = formatJapanese(parsedAddress, { multiline: false });
    const wasModified = japanese !== addressString.trim();

    return {
      cleanedAddress: japanese,
      wasModified,
      changes: wasModified ? ["Wrote the Japanese address the way Japan Post asks"] : [],
    };
  }

  // Apply expansion of abbreviations if requested
  if (opts.expandAbbreviations) {
    expandAddressAbbreviations(parsedAddress);
    changes.push("Expanded abbreviations to full names");
  }

  // Start with basic formatting - always use standard format initially
  const formattedResult = formatAddress(parsedAddress);
  let formattedAddress = formattedResult.singleLine;

  // Apply expansion of abbreviations to the formatted result if requested
  // This is done on the string level for simplicity
  if (opts.expandAbbreviations) {
    formattedAddress = expandStringAbbreviations(formattedAddress);
  }

  // Apply all formatting and cleaning options at the end for clean architecture
  formattedAddress = applyFinalFormatting(formattedAddress, parsedAddress, opts, changes);

  const wasModified = formattedAddress !== addressString.trim();

  return {
    cleanedAddress: formattedAddress,
    wasModified,
    changes,
  };
}

// Helper function to check if parsed address has valid components
function hasValidAddressComponents(parsedAddress: ParsedAddress): boolean {
  // Must have either a number or street, or be a recognized address type
  return !!(
    parsedAddress.number ||
    parsedAddress.street ||
    parsedAddress.city ||
    parsedAddress.state ||
    parsedAddress.zip ||
    parsedAddress.generalDelivery ||
    (parsedAddress.street && STREET_TYPE_DETECTION_PATTERN.test(parsedAddress.street))
  );
}

// Helper function to expand address abbreviations in parsed address
function expandAddressAbbreviations(address: ParsedAddress): void {
  // Street type expansions
  if (address.type) {
    const expanded = STREET_TYPE_EXPANSIONS[address.type.toLowerCase()];
    if (expanded) address.type = expanded;
  }

  // Direction expansions
  if (address.prefix) {
    const expanded = DIRECTION_EXPANSIONS[address.prefix.toLowerCase()];
    if (expanded) address.prefix = expanded;
  }

  if (address.suffix) {
    const expanded = DIRECTION_EXPANSIONS[address.suffix.toLowerCase()];
    if (expanded) address.suffix = expanded;
  }

  // State/province expansions
  if (address.state) {
    const lowerState = address.state.toLowerCase();
    const expanded =
      address.country === COUNTRIES.CANADA ? PROVINCE_EXPANSIONS[lowerState] : US_STATE_EXPANSIONS[lowerState];
    if (expanded) address.state = expanded;
  }

  // Unit type expansions
  if (address.secUnitType) {
    const expanded = SECONDARY_UNIT_TYPES[address.secUnitType.toLowerCase().replace(UTILITY_PATTERNS.NON_ALPHA, "")];
    if (expanded) address.secUnitType = expanded;
  }
}

// Helper function to apply case standardization
function applyCaseStandardization(text: string, caseType: "upper" | "lower" | "title" | "none"): string {
  switch (caseType) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return applySmartTitleCase(text);
    default:
      return text;
  }
}

// State and province codes, kept in capitals where a state goes: before the ZIP or postal code, before a comma
// or at the end. Elsewhere "De", "La" or "In" are words ("Rue de la Paix"), not Delaware or Louisiana.
const REGION_CODES: Set<string> = new Set([
  ...Object.values(US_STATE_NAMES_TO_CODES),
  ...Object.values(CA_PROVINCE_NAMES_TO_CODES),
]);

// Directions, always in capitals.
const DIRECTION_CODES: Set<string> = new Set(["N", "S", "E", "W", "NE", "NW", "SE", "SW"]);

// Title-case one word. A word holding a digit is a number, a unit or part of a postal code: a short one goes
// to capitals ("2B", "M5H", "2N2", "D304"), except an ordinal's ending ("1st", "22nd"). Letters after a hyphen
// or an apostrophe start a new word.
function titleCaseWord(word: string): string {
  if (/\d/.test(word)) {
    if (/^\d+(?:st|nd|rd|th)$/i.test(word)) return word.toLowerCase();
    return word.length <= 4 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }
  if (DIRECTION_CODES.has(word.toUpperCase())) return word.toUpperCase();
  return word
    .toLowerCase()
    .replace(/(^|[-'’])(\p{L})/gu, (_whole: string, before: string, letter: string) => before + letter.toUpperCase());
}

// Smart title case that keeps directions, state and province codes, postal codes, units and "PO Box" in
// their usual form.
function applySmartTitleCase(text: string): string {
  const pieces = text.split(/(\s+|,)/);
  return pieces
    .map((piece: string, index: number) => {
      if (/^\s*$|^,$/.test(piece)) return piece;
      const next = pieces.slice(index + 1).find((later: string) => !/^\s*$/.test(later));
      const inStatePlace = next === undefined || next === "," || /\d/.test(next);
      if (REGION_CODES.has(piece.toUpperCase()) && inStatePlace) return piece.toUpperCase();
      return titleCaseWord(piece);
    })
    .join("")
    .replace(/\bPo Box\b/g, "PO Box");
}

// Apply string-level abbreviation expansion
function expandStringAbbreviations(addressString: string): string {
  let result = addressString;

  // Expand street types
  Object.entries(STREET_TYPE_EXPANSIONS).forEach(([abbr, expansion]) => {
    const regex = new RegExp(`\\b${abbr}\\b`, "gi");
    result = result.replace(regex, expansion);
  });

  // Expand directions
  Object.entries(DIRECTION_EXPANSIONS).forEach(([abbr, expansion]) => {
    const regex = new RegExp(`\\b${abbr}\\b`, "gi");
    result = result.replace(regex, expansion);
  });

  // Expand unit types
  Object.entries(SECONDARY_UNIT_TYPES).forEach(([abbr, expansion]) => {
    const regex = new RegExp(`\\b${abbr}\\b`, "gi");
    result = result.replace(regex, expansion);
  });

  // Expand US states
  Object.entries(US_STATE_EXPANSIONS).forEach(([abbr, expansion]) => {
    const regex = new RegExp(`\\b${abbr}\\b`, "gi");
    result = result.replace(regex, expansion);
  });

  // Expand provinces
  Object.entries(PROVINCE_EXPANSIONS).forEach(([abbr, expansion]) => {
    const regex = new RegExp(`\\b${abbr}\\b`, "gi");
    result = result.replace(regex, expansion);
  });

  return result;
}

// Apply all final formatting options in the correct order
function applyFinalFormatting(
  addressString: string,
  parsedAddress: ParsedAddress,
  opts: CleanAddressOptions,
  changes: string[],
): string {
  let result = addressString;

  // 1. Remove extra spaces and punctuation first
  if (opts.removeExtraSpaces) {
    const beforeSpaces = result;
    result = result
      .replace(/[.!@#$%^&*]+/g, "") // Remove extra punctuation marks
      .replace(/,+/g, ",") // Replace multiple commas with single comma
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim();

    if (beforeSpaces !== result) {
      changes.push("Removed extra spaces");
    }
  }

  // 2. Apply format-specific formatting (USPS/Canada Post)
  if (opts.format && opts.format !== "standard") {
    const beforeFormat = result;
    let formattedResult;

    switch (opts.format) {
      case "usps":
        formattedResult = formatUSPS(parsedAddress);
        result = formattedResult.lines.join(", ");
        break;
      case "canada-post":
        formattedResult = formatCanadaPost(parsedAddress);
        result = formattedResult.lines.join(", ");
        break;
    }

    if (beforeFormat !== result) {
      const formatName = opts.format === "canada-post" ? "Canada Post" : opts.format.toUpperCase();
      changes.push(`Applied ${formatName} formatting standards`);
    }
  }

  // 3. Apply case standardization last (or smart title case for standard format)
  if (opts.standardizeCase && opts.standardizeCase !== "none") {
    const originalCase = result;
    result = applyCaseStandardization(result, opts.standardizeCase);
    if (originalCase !== result) {
      changes.push(`Applied ${opts.standardizeCase} case standardization`);
    }
  } else if (opts.format === "standard" || !opts.format) {
    // Apply smart title case for standard format when no explicit case is set
    const originalCase = result;
    result = applySmartTitleCase(result);
    if (originalCase !== result) {
      changes.push("Applied smart title case");
    }
  }

  return result;
}

export { cleanAddress, cleanAddressDetailed };
