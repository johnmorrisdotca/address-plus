// What is from New Zealand about an address there: the postcode of four digits after the city, the street's number before
// its name, with a unit's number before it after a slash (`3/45 Dominion Road`), the suburb on a line of its own, and
// boxes, bags and rural deliveries.

import { newZealandPostcodes } from "../constants/nz";
import type { PostcodeCountrySpec } from "../country/postcode-country";
import type { ParsedAddress } from "../types/parsed-address";

// The postcode ends the address (the country, if written, was taken off before), so a house number of four digits is not one.
const POSTCODE = /(?<!\d)(\d{4})(?!\d)(?=\s*$)/g;
// The number with a unit before it: "3/45", "12A", "12-14", "3A/45".
const NUMBER_FIRST =
  /^(?:(\d{1,4}[A-Za-z]?)\s?\/\s?)?(\d{1,5}[A-Za-z]?(?:\s?[-–]\s?\d{1,5}[A-Za-z]?)?)(?:,|\s)\s*(\p{L}.*)$/u;
const STREET_END =
  /\b(?:street|st|road|rd|avenue|ave|drive|dr|place|pl|lane|ln|terrace|tce|crescent|cres|highway|hwy|way|quay|parade|boulevard|blvd|esplanade|grove|close|court|ct|square|sq|mall|rise|track|valley|view|heights|loop|walk|row|crossing|domain)\.?$/i;
const UNIT = /^(unit|flat|apartment|apt|suite|shop|villa|tower|lot)\.?\s*([A-Za-z0-9-]+)$/i;
const LEVEL = /^(?:level|floor)\s*([A-Za-z0-9]+)$/i;
const BOX = /^(p\.?\s?o\.?\s?box|private bag|locked bag|post restante)\s*(\w+)?$/i;
const RURAL = /^(?:rd|r\.d\.|rural delivery)\s*(\d+[A-Za-z]?)$/i;
const CARE_OF = /^(?:c\/o|c\/-|care of|attn:?|attention:?)\s+(.+)$/i;

const capital = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

function takeDelivery(part: string, result: ParsedAddress): string {
  const careOf = CARE_OF.exec(part);
  if (careOf && !result.careOf) {
    result.careOf = careOf[1].trim();

    return "";
  }
  const box = BOX.exec(part);
  if (box && !result.secUnitType) {
    const kind = box[1].replace(/\./g, "").replace(/\s+/g, " ").toLowerCase();
    result.secUnitType =
      kind === "po box" || kind === "pobox" ? "PO Box" : kind.replace(/\b\w/g, (letter) => letter.toUpperCase());
    if (box[2]) result.secUnitNum = box[2];

    return "";
  }
  const rural = RURAL.exec(part);
  if (rural && !result.secUnitType) {
    result.secUnitType = "RD";
    result.secUnitNum = rural[1].toUpperCase();

    return "";
  }
  const level = LEVEL.exec(part);
  if (level && !result.floorType) {
    result.floorType = "Level";
    result.floor = level[1];

    return "";
  }
  const unit = UNIT.exec(part);
  if (unit && !result.secUnitType) {
    result.secUnitType = capital(unit[1].replace(/^apt$/i, "Apartment"));
    result.secUnitNum = unit[2].toUpperCase();

    return "";
  }

  return part;
}

function readStreet(part: string, result: ParsedAddress): boolean {
  const first = NUMBER_FIRST.exec(part);
  if (first) {
    if (first[1]) {
      result.secUnitType ??= "Unit";
      result.secUnitNum ??= first[1].toUpperCase();
    }
    result.number = first[2].replace(/\s+/g, "").toUpperCase();
    result.street = first[3];

    return true;
  }
  if (STREET_END.test(part) && !/^\d/.test(part)) {
    result.street = part;

    return true;
  }

  return false;
}

// A place of one or two words and a postcode that end the address, with Private Bag, a rural delivery or Aotearoa in it:
// the signs that no other country with four-digit postcodes writes.
const SIGNS = /\b(?:private bag|aotearoa|rd\s?\d|rural delivery)\b/i;

function detectShape(text: string): boolean {
  return SIGNS.test(text) && /\p{L}\s+\d{4}$/u.test(text) && newZealandPostcodes.isKnown(text.slice(-4));
}

// A street's type in one form: Road and Rd, Street and St, Avenue and Ave.
const TYPE_FORMS: readonly (readonly [RegExp, string])[] = [
  [/\b(?:ROAD|RD)\.?$/, "ROAD"],
  [/\b(?:STREET|ST)\.?$/, "STREET"],
  [/\b(?:AVENUE|AVE)\.?$/, "AVENUE"],
  [/\b(?:DRIVE|DR)\.?$/, "DRIVE"],
  [/\b(?:PLACE|PL)\.?$/, "PLACE"],
  [/\b(?:LANE|LN)\.?$/, "LANE"],
  [/\b(?:TERRACE|TCE)\.?$/, "TERRACE"],
  [/\b(?:CRESCENT|CRES)\.?$/, "CRESCENT"],
  [/\b(?:HIGHWAY|HWY)\.?$/, "HIGHWAY"],
  [/\b(?:BOULEVARD|BLVD)\.?$/, "BOULEVARD"],
  [/\b(?:COURT|CT)\.?$/, "COURT"],
  [/\b(?:SQUARE|SQ)\.?$/, "SQUARE"],
];

function streetForm(folded: string): string {
  let text = folded;
  for (const [pattern, type] of TYPE_FORMS) text = text.replace(pattern, type);

  return text.replace(/^MT\b/, "MOUNT").replace(/\s+/g, " ");
}

const newZealandSpec: PostcodeCountrySpec = {
  code: "NZ",
  name: "New Zealand",
  names: ["NEW ZEALAND", "AOTEAROA", "AOTEAROA NEW ZEALAND"],
  codes: ["NZ"],
  postcode: POSTCODE,
  placeFirst: true,
  list: "GeoNames' list for New Zealand",
  shape: "four digits",
  isValid: newZealandPostcodes.isValid,
  isKnown: newZealandPostcodes.isKnown,
  normalize: (postcode) => postcode.trim(),
  regionOf: newZealandPostcodes.regionOf,
  takeDelivery,
  readStreet,
  detectShape,
  streetForm,
};

export { newZealandSpec };
