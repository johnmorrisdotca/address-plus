// What is Indian about an address in India: the six-digit PIN code after the city (and the state before it), the house or
// flat and the building before the street, the street's number before its name, and the area on a line of its own.

import { findIndianState, indianPostcodes } from "../constants/in";
import type { PostcodeCountrySpec } from "../country/postcode-country";
import type { ParsedAddress } from "../types/parsed-address";

// The PIN ends the address (the country, if written, was taken off before), with "PIN" or "Pin code" before it when written.
const POSTCODE = /(?<!\d)(?:(?:pin(?:\s*code)?|IN)\s*[:\-–.]*\s*)?([1-9]\d{2}\s?\d{3})(?!\d)(?=[\s,.]*$)/gi;
const NUMBER_FIRST =
  /^(?:(?:no|h\.?\s?no|house no|plot no|door no)\.?\s*|#\s*)?(\d+[A-Za-z]?(?:\s?[-/]\s?\d+[A-Za-z]?)*)(?:,|\s)\s*(\p{L}.*)$/iu;
const NUMBER_ALONE =
  /^(?:(?:no|h\.?\s?no|house no|plot no|door no)\.?\s*|#\s*)?(\d+[A-Za-z]?(?:\s?[-/]\s?\d+[A-Za-z]?)*)$/i;
const STREET_END =
  /\b(?:road|rd|street|st|marg|lane|ln|avenue|ave|cross|main|path|chowk|bazaar|bazar|highway|nagar road|circle|colony road|salai|veedhi|gali|sarani|rasta)\.?$|\b(?:road|marg)\s+(?:no\.?\s*)?\d+$/i;
const CARE_OF = /^(?:c\/o|care of|s\/o|d\/o|w\/o|attn:?|attention:?)\s+(.+)$/i;
const UNIT =
  /^(flat|apartment|apt|unit|room|shop|office|suite|villa|plot|house|door|block|tower|wing)\.?\s*(?:no\.?\s*)?([A-Za-z0-9/-]+)$/i;
const FLOOR = /^(\d{1,2})(?:st|nd|rd|th)?\s+floor$|^(ground|first|second|third|fourth|fifth) floor$/i;
const BOX = /^(?:p\.?\s?o\.?\s?box|post box|post bag)\s*(?:no\.?\s*)?(\d+)$/i;
const LANDMARK = /^(?:near|opp\.?|opposite|behind|beside|next to|landmark:?)\s+(.+)$/i;

const capital = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

function takeDelivery(part: string, result: ParsedAddress): string {
  const careOf = CARE_OF.exec(part);
  if (careOf && !result.careOf) {
    result.careOf = careOf[1].trim();

    return "";
  }
  const box = BOX.exec(part);
  if (box && !result.secUnitType) {
    result.secUnitType = "Post Box";
    result.secUnitNum = box[1];

    return "";
  }
  const landmark = LANDMARK.exec(part);
  if (landmark && !result.place) {
    result.place = part;

    return "";
  }
  const floor = FLOOR.exec(part);
  if (floor && !result.floorType) {
    result.floorType = "Floor";
    result.floor = (floor[1] ?? floor[2]).toLowerCase();

    return "";
  }
  const unit = UNIT.exec(part);
  if (unit && !result.secUnitType) {
    result.secUnitType = capital(unit[1].replace(/^apt$/i, "Apartment"));
    result.secUnitNum = unit[2].toUpperCase();

    return "";
  }
  // A number on its own before the street's name: "12, MG Road".
  if (!result.number && !result.street) {
    const alone = NUMBER_ALONE.exec(part);
    if (alone) {
      result.number = alone[1].replace(/\s+/g, "").toUpperCase();

      return "";
    }
  }

  return part;
}

function readStreet(part: string, result: ParsedAddress): boolean {
  const first = NUMBER_FIRST.exec(part);
  if (first && !result.number) {
    result.number = first[1].replace(/\s+/g, "").toUpperCase();
    result.street = first[2];

    return true;
  }
  if (STREET_END.test(part)) {
    result.street = part;

    return true;
  }

  return false;
}

// "Bengaluru Karnataka" and "New Delhi": the city, and the state when its name ends the text.
function readPlace(text: string, result: ParsedAddress): void {
  const cleaned = text.replace(/[\s,\-–:]+$/, "");
  const words = cleaned.split(/\s+/);
  for (let count = Math.min(4, words.length - 1); count >= 1; count -= 1) {
    const state = findIndianState(words.slice(-count).join(" "));
    if (state && !result.state && !/\bnew$/i.test(words.slice(0, -count).join(" "))) {
      result.state = state.code;
      result.city = words.slice(0, -count).join(" ");

      return;
    }
  }
  result.city = cleaned;
}

// A PIN after a place, with the word PIN before it, or with a state's name before it: nothing else writes six digits so.
const PIN_WORD = /\bpin(?:\s*code)?\s*[:\-–.]*\s*[1-9]\d{2}\s?\d{3}\s*$/i;
const STATE_BEFORE_PIN = /(?:^|[\s,])([\p{L}&]+(?:\s[\p{L}&]+){0,3})\s*[-–:,]?\s*([1-9]\d{2}\s?\d{3})\s*$/u;

function detectShape(text: string): boolean {
  if (PIN_WORD.test(text)) return true;
  const found = STATE_BEFORE_PIN.exec(text);
  if (!found || !indianPostcodes.isKnown(found[2])) return false;
  const words = found[1].split(/\s+/);

  return [1, 2, 3, 4].some(
    (count) => count <= words.length && findIndianState(words.slice(-count).join(" ")) !== undefined,
  );
}

const STREET_FORMS: readonly (readonly [RegExp, string])[] = [
  [/\b(?:ROAD|RD)$/, "ROAD"],
  [/\b(?:STREET|ST)$/, "STREET"],
  [/\b(?:AVENUE|AVE)$/, "AVENUE"],
  [/\b(?:LANE|LN)$/, "LANE"],
];

function streetForm(folded: string): string {
  let text = folded;
  for (const [pattern, type] of STREET_FORMS) text = text.replace(pattern, type);

  return text.replace(/\s+/g, " ");
}

// The states that are one city (Delhi, Chandigarh): the name is the city's too, and the state only when the part before it
// holds the name as well (`New Delhi, Delhi`).
const CITY_STATES = new Set(["DL", "CH", "PY", "LD", "AN"]);

function regionFromName(text: string, previous?: string): string | undefined {
  const state = findIndianState(text);
  if (!state) return undefined;
  if (!CITY_STATES.has(state.code)) return state.code;

  return previous !== undefined && previous.toLowerCase().includes(text.toLowerCase()) ? state.code : undefined;
}

const indianSpec: PostcodeCountrySpec = {
  code: "IN",
  name: "India",
  names: ["INDIA", "REPUBLIC OF INDIA", "BHARAT"],
  // No code: IN is also Indiana's, so an address is Indian by its country's name, a PIN word or a state's name, never by IN.
  codes: [],
  postcode: POSTCODE,
  placeFirst: true,
  approximateRegion: true,
  list: "GeoNames' list for India",
  shape: "six digits, the first not nought",
  isValid: indianPostcodes.isValid,
  isKnown: indianPostcodes.isKnown,
  normalize: (postcode) => postcode.replace(/\s+/g, ""),
  regionOf: indianPostcodes.regionOf,
  regionFromName,
  takeDelivery,
  readStreet,
  readPlace,
  detectShape,
  streetForm,
};

export { indianSpec };
