// Address formatting utilities for standardized output formats

import { CA_PROVINCE_NAMES, DIRECTIONAL_MAP, US_STATE_NAMES, US_STREET_TYPES } from "../constants";
import type {
  AddressAbbreviations,
  AddressFormattingOptions,
  CanadaPostFormattingOptions,
  FormattedAddress,
  ParsedAddress,
  USPSFormattingOptions,
} from "../types";
import { capitalize } from "../utils/capitalization";

// Simple unit type abbreviations for formatting
const UNIT_ABBREVIATIONS: Record<string, string> = {
  apartment: "Apt",
  suite: "Ste",
  unit: "Unit",
  building: "Bldg",
  floor: "Fl",
  room: "Rm",
};

// French street types, which Canada Post writes before the name.
const FRENCH_TYPES_FIRST: Set<string> = new Set([
  "rue",
  "ch",
  "rang",
  "mtée",
  "côte",
  "imp",
  "crois",
  "tsse",
  "cercle",
  "car",
  "cours",
  "rdpt",
  "allée",
  "quai",
  "parc",
  "pte",
  "île",
  "sent",
  "rle",
  "aut",
  "carref",
  "voie",
]);

// A street name opening with a French particle: "des Pins", "de la Montagne", "d'Youville".
const FRENCH_PARTICLE_START = /^(?:de|du|des|la|le|les|d'|l')(?:\s|(?<=')\S)/;

/**
 * Writes a parsed address back out as lines and as one line, with abbreviations or in full.
 *
 * @param address - The address, as `parseLocation` returns it.
 * @param options - How to write it: abbreviated or in full, the letter case, the country (see
 * `AddressFormattingOptions`).
 * @returns The address as an array of lines and as one line.
 * @example
 * ```ts
 * import { formatAddress, parseLocation } from "@johnmorrisdotca/address-plus";
 *
 * const parsedAddress1=parseLocation("123 Main Street, Anytown, NY 12345");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatAddress(parsedAddress1).singleLine);
 * // → "123 Main St, Anytown NY 12345"
 * ```
 */
function formatAddress(address: ParsedAddress, options: AddressFormattingOptions = {}): FormattedAddress {
  const {
    includeCountry = false,
    includeSecondaryUnit = true,
    upperCase = false,
    separator = " ",
    abbreviateStreetTypes = false,
    abbreviateDirections = false,
    abbreviateStates = false,
  } = options;

  const lines: string[] = [];

  // Build delivery line (street address)
  const deliveryLine = buildDeliveryLine(address, {
    includeSecondaryUnit,
    abbreviateStreetTypes,
    abbreviateDirections,
    separator,
  });

  if (deliveryLine) {
    lines.push(deliveryLine);
  }

  // Build last line (city, state, postal)
  const lastLine = buildLastLine(address, {
    abbreviateStates,
    separator,
  });

  if (lastLine) {
    lines.push(lastLine);
  }

  // Add country if requested and not US/Canada
  if (includeCountry && address.country && !["US", "CA"].includes(address.country)) {
    lines.push(address.country);
  }

  // Apply case transformation
  const formattedLines = lines.map((line) => (upperCase ? line.toUpperCase() : line));

  return {
    lines: formattedLines,
    singleLine: formattedLines.join(", "),
    deliveryLine,
    lastLine,
    country: address.country,
    format: "standard",
  };
}

/**
 * Writes a parsed address the way USPS Publication 28 asks: capitals, standard abbreviations, the unit on the street
 * line, and the city, state and ZIP+4 on the last.
 *
 * @param address - The address, as `parseLocation` returns it.
 * @param options - USPS settings (see `USPSFormattingOptions`).
 * @returns The address as lines and as one line.
 * @example
 * ```ts
 * import { formatUSPS, parseLocation } from "@johnmorrisdotca/address-plus";
 *
 * const parsedAddress1=parseLocation("123 Main Street Apt 4, Anytown, NY 12345");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatUSPS(parsedAddress1).lines);
 * // → ["123 MAIN ST APT 4","ANYTOWN NY 12345"]
 * ```
 */
function formatUSPS(address: ParsedAddress, options: USPSFormattingOptions = {}): FormattedAddress {
  const { includeDeliveryLine = true, includeLastLine = true, standardizeCase = true } = options;

  const lines: string[] = [];

  // USPS specific delivery line with unit after street
  const deliveryLine = buildDeliveryLine(address, {
    includeSecondaryUnit: true,
    abbreviateStreetTypes: true,
    abbreviateDirections: true,
    separator: " ",
  });

  if (includeDeliveryLine && deliveryLine) {
    lines.push(deliveryLine);
  }

  // Build last line (city, state, postal)
  const lastLine = buildLastLine(address, {
    abbreviateStates: true,
    separator: " ",
  });

  if (includeLastLine && lastLine) {
    lines.push(lastLine);
  }

  return {
    lines: standardizeCase ? lines.map((line) => line.toUpperCase()) : lines,
    singleLine: lines.join(", "),
    deliveryLine,
    lastLine,
    country: address.country,
    format: "usps",
  };
}

/**
 * Writes a parsed address the way Canada Post asks: capitals, the unit before the civic number joined by a hyphen, and
 * the postal code two spaces after the province.
 *
 * @param address - The address, as `parseLocation` returns it.
 * @param options - Canada Post settings (see `CanadaPostFormattingOptions`).
 * @returns The address as lines and as one line.
 * @example
 * ```ts
 * import { formatCanadaPost, parseLocation } from "@johnmorrisdotca/address-plus";
 *
 * const parsedAddress1=parseLocation("100 Queen Street West, Toronto, Ontario M5H 2N2");
 * if (!parsedAddress1) throw new Error("The example address did not parse.");
 * console.log(formatCanadaPost(parsedAddress1).lines);
 * // → ["100 QUEEN ST W","TORONTO ON M5H 2N2"]
 * ```
 */
function formatCanadaPost(address: ParsedAddress, options: CanadaPostFormattingOptions = {}): FormattedAddress {
  const { includeDeliveryLine = true, includeLastLine = true, standardizeCase = true } = options;

  const lines: string[] = [];

  // Canada Post specific formatting
  const deliveryLine = buildDeliveryLine(address, {
    includeSecondaryUnit: true,
    abbreviateStreetTypes: true,
    abbreviateDirections: true,
    separator: " ",
    canadaPostUnit: true,
  });

  if (includeDeliveryLine && deliveryLine) {
    lines.push(deliveryLine);
  }

  // Canada Post last line format: CITY PROVINCE POSTAL_CODE
  let lastLine = "";
  if (address.city && address.state && address.zip) {
    const province = abbreviateProvince(address.state);
    lastLine = `${address.city} ${province}  ${address.zip}`;
  } else if (address.city && address.state) {
    const province = abbreviateProvince(address.state);
    lastLine = `${address.city} ${province}`;
  }

  if (includeLastLine && lastLine) {
    lines.push(lastLine);
  }

  return {
    lines: standardizeCase ? lines.map((line) => line.toUpperCase()) : lines,
    singleLine: lines.join(", "),
    deliveryLine,
    lastLine,
    country: address.country || "CA",
    format: "canada-post",
  };
}

/**
 * Every abbreviation the formatters use: street types, directionals, secondary units, states and provinces.
 *
 * @returns One map per kind, each from the full word to its abbreviation.
 * @example
 * ```ts
 * import { getAddressAbbreviations } from "@johnmorrisdotca/address-plus";
 *
 * console.log(getAddressAbbreviations().streetTypes.avenue);
 * // → "Ave"
 * ```
 */
function getAddressAbbreviations(): AddressAbbreviations {
  // Create properly capitalized versions of the mappings
  const streetTypes: Record<string, string> = {};
  for (const [key, value] of Object.entries(US_STREET_TYPES)) {
    streetTypes[key] = capitalize(value);
  }

  return {
    streetTypes,
    directions: { ...DIRECTIONAL_MAP },
    states: { ...US_STATE_NAMES },
    provinces: { ...CA_PROVINCE_NAMES },
    unitTypes: { ...UNIT_ABBREVIATIONS },
  };
}

// Helper functions

function buildDeliveryLine(
  address: ParsedAddress,
  options: {
    includeSecondaryUnit: boolean;
    abbreviateStreetTypes: boolean;
    abbreviateDirections: boolean;
    separator: string;
    canadaPostUnit?: boolean; // Write the unit before the civic number with a hyphen, as Canada Post does
  },
): string {
  const parts: string[] = [];
  const hasUnit = options.includeSecondaryUnit && !!address.secUnitType;
  // Canada Post joins the unit to the civic number, unit first: "4-123 Main St".
  const hyphenUnit = hasUnit && options.canadaPostUnit && !!address.secUnitNum && !!address.number;

  // Add street number
  if (address.number) {
    parts.push(hyphenUnit ? `${address.secUnitNum}-${address.number}` : address.number);
  }

  // Add directional prefix
  if (address.prefix) {
    const prefix = options.abbreviateDirections ? abbreviateDirection(address.prefix) : address.prefix;
    parts.push(prefix);
  }

  // Add street name and type. A French type goes before the name, as it was written ("rue des Jardins",
  // "boulevard René-Lévesque"); so does any type before a name that opens with a French particle.
  const streetType =
    address.type && (options.abbreviateStreetTypes ? abbreviateStreetType(address.type) : address.type);
  const typeFirst =
    !!streetType &&
    (FRENCH_TYPES_FIRST.has(address.type!.toLowerCase()) || FRENCH_PARTICLE_START.test(address.street ?? ""));
  if (streetType && typeFirst) parts.push(streetType);
  if (address.street) {
    parts.push(address.street);
  }
  if (streetType && !typeFirst) parts.push(streetType);

  // Add directional suffix
  if (address.suffix) {
    const suffix = options.abbreviateDirections ? abbreviateDirection(address.suffix) : address.suffix;
    parts.push(suffix);
  }

  // The unit goes after the street, as USPS Publication 28 and Canada Post's English form both write it:
  // "123 Main St Apt 4". A pound sign is joined to its number ("#4"); a unit with no number stands alone.
  if (hasUnit && !hyphenUnit) {
    const unitType = options.abbreviateStreetTypes ? abbreviateUnitType(address.secUnitType!) : address.secUnitType!;
    if (!address.secUnitNum) {
      parts.push(unitType);
    } else if (unitType === "#") {
      parts.push(`#${address.secUnitNum}`);
    } else {
      parts.push(unitType, address.secUnitNum);
    }
  }

  // Add unit suffix if it exists and not already added as prefix
  if (options.includeSecondaryUnit && address.unit && !address.secUnitType) {
    parts.push(address.unit);
  }

  return parts.join(options.separator);
}

function buildLastLine(
  address: ParsedAddress,
  options: {
    abbreviateStates: boolean;
    separator: string;
  },
): string {
  const parts: string[] = [];

  if (address.city) {
    parts.push(address.city);
  }

  if (address.state) {
    const state = options.abbreviateStates ? abbreviateState(address.state) : address.state;
    parts.push(state);
  }

  if (address.zip) {
    let postal = address.zip;
    if (address.plus4) {
      postal += `-${address.plus4}`;
    }
    parts.push(postal);
  }

  return parts.join(options.separator);
}

function abbreviateStreetType(streetType: string): string {
  const normalized = streetType.toLowerCase();
  const abbrev = US_STREET_TYPES[normalized];
  return abbrev ? capitalize(abbrev) : streetType;
}

function abbreviateDirection(direction: string): string {
  const normalized = direction.toLowerCase();
  return DIRECTIONAL_MAP[normalized] || direction;
}

function abbreviateState(state: string): string {
  const normalized = state.toLowerCase();
  return US_STATE_NAMES[normalized] || state;
}

function abbreviateProvince(province: string): string {
  const normalized = province.toLowerCase();
  return CA_PROVINCE_NAMES[normalized] || province;
}

function abbreviateUnitType(unitType: string): string {
  const normalized = unitType.replace(/[^a-zA-Z]/g, "").toLowerCase();
  return UNIT_ABBREVIATIONS[normalized] || unitType;
}

export { formatAddress, formatCanadaPost, formatUSPS, getAddressAbbreviations };
