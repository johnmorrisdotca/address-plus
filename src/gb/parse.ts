// Reads an address in the United Kingdom in the shape of Royal Mail's Postcode Address File: a sub-building (a flat),
// a building's name, a number and a thoroughfare, the localities, the POST TOWN, a county if one is written, and the
// postcode, which may stand anywhere after the street (on its own line, before the town or after it).

import { GB_POSTCODE_AREAS, isValidUKPostcode, parseUKPostcode, POSTCODE_SHAPE } from "../constants/gb";
import { GB_COUNTIES, GB_THOROUGHFARE_DESCRIPTORS } from "../constants/gb/words";
import { partsOf, snakeCased, tidyAddressText } from "../country/shared";
import type { ParseOptions } from "../types/parse-options";
import type { ParsedAddress } from "../types/parsed-address";
import type { UKNationCode } from "../types/united-kingdom";

const DESCRIPTOR_FORMS: Map<string, string> = new Map(
  Object.entries(GB_THOROUGHFARE_DESCRIPTORS).flatMap(([word, forms]) => [
    [word.toUpperCase(), word] as const,
    ...forms.map((form) => [form, word] as const),
  ]),
);
const COUNTY_FORMS: Map<string, string> = new Map(
  GB_COUNTIES.map((county) => [county.toUpperCase().replace(/\./g, ""), county] as const),
);

// A country written at the end. The nations name where the postcode is; the Crown Dependencies are not the UK.
const TRAILING_COUNTRY =
  /[\s,]+(united\s+kingdom|u\.?\s?k\.?|great\s+britain|g\.?\s?b\.?|england|scotland|wales|cymru|northern\s+ireland|channel\s+islands|jersey|guernsey|isle\s+of\s+man)\.?$/i;
const COUNTRY_NATIONS: Readonly<Record<string, UKNationCode>> = {
  ENGLAND: "ENG",
  SCOTLAND: "SCT",
  WALES: "WLS",
  CYMRU: "WLS",
  "NORTHERN IRELAND": "NIR",
};
const CROWN_DEPENDENCIES: Readonly<Record<string, "GY" | "IM" | "JE">> = {
  JERSEY: "JE",
  GUERNSEY: "GY",
  "ISLE OF MAN": "IM",
};
const BFPO = /\bBFPO\s*(\d{1,4})\b/i;
const GIR = /\bGIR\s*0AA\b/i;

// "Flat 2", "Apartment 5B", "Unit 26", "Studio J", "Suite 3", "Flat 2/1" (Glasgow's floor and door): group 1 the
// type, group 2 the number, group 3 the rest.
const SUB_BUILDING =
  /^(flat|apartment|apt|unit|studio|suite|room|maisonette|penthouse|office)\.?\s+(\d+[A-Z]?(?:\/\d+)?|[A-Z]\d*|\d+[A-Z]?\d*)\b\s*(.*)$/i;
const SUB_BUILDING_TYPES: Readonly<Record<string, string>> = { APT: "Apartment" };
// A part of a building with no number: "Basement Flat", "Ground Floor Flat", "Stables Flat".
const NAMED_FLAT = /^(?:[A-Z][\w'-]*\s+){1,3}flat$/i;
// "4th Floor", "Floor 4", "Ground Floor", "Basement": the floor.
const FLOOR =
  /^(?:(\d+)(?:st|nd|rd|th)\s+floor|(floor|level)\s+(\d+)|(ground\s+floor|basement|lower\s+ground\s+floor|first\s+floor|second\s+floor|third\s+floor|top\s+floor))$/i;
const PO_BOX = /^p\.?\s*o\.?\s*box\s+(\d+[A-Z]?)\b\s*(.*)$/i;
// "100-106 Leonard Street", "1A Egmont Road": group 1 the number, group 2 the rest.
// A minus sign before the number is kept, as libpostal's fixtures write one (-1 Priory Road).
const NUMBERED = /^(-?\d+[A-Z]?(?:\s*-\s*\d+[A-Z]?)?)\b,?\s+(.+)$/i;
const ONLY_NUMBER = /^\d+[A-Z]?(?:\s*-\s*\d+[A-Z]?)?$/i;
// "The Book Club 100-106 Leonard St": a name, then a number and the street.
const NAME_THEN_NUMBER = /^(.+?)\s+(\d+[A-Z]?(?:\s*-\s*\d+[A-Z]?)?)\s+(.+)$/i;

const capitalized = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
const descriptorOf = (word: string): string | undefined => DESCRIPTOR_FORMS.get(word.replace(/\.$/, "").toUpperCase());
const lastWord = (text: string): string => text.slice(text.lastIndexOf(" ") + 1);

// A thoroughfare: it ends in a descriptor, or is "The" and a name ("The Marina", "The Rushes").
function isStreetLike(text: string): boolean {
  const words = text.split(" ");
  if (words.length >= 2 && /^the$/i.test(words[0])) return true;
  return words.length >= 2 && descriptorOf(lastWord(text)) !== undefined;
}

// The street's name and its descriptor in full: "Leonard St" is Leonard and Street, "The Blvd" is the street "The
// Boulevard", which has no name before its descriptor.
function readStreet(text: string, result: ParsedAddress): void {
  const words = text.split(" ").filter((word) => word !== "");
  const descriptor = words.length >= 2 ? descriptorOf(words[words.length - 1]) : undefined;
  const name = words.slice(0, -1);
  if (descriptor && !(name.length === 1 && /^the$/i.test(name[0]))) {
    result.street = name.join(" ");
    result.type = descriptor;
    return;
  }
  if (descriptor) {
    result.street = `${name[0]} ${descriptor}`;
    return;
  }
  result.street = words.join(" ");
}

// Where the street ends in a part with no comma before the town: after the first descriptor past the street's first
// word ("1 Riverside Dr Liverpool" ends at Dr).
function streetEnd(words: string[]): number | undefined {
  let start = 0;
  while (start < words.length && /\d/.test(words[start])) start += 1;
  for (let at = start + 1; at < words.length - 1; at += 1) {
    if (descriptorOf(words[at])) return at + 1;
  }
  return undefined;
}

// What a part holds first: a flat or unit, a floor, a PO Box. Each found is set on the result and taken off the part.
function takeSubBuilding(part: string, result: ParsedAddress): string {
  let rest = part;
  for (let guard = 0; guard < 3 && rest !== ""; guard += 1) {
    const floor = FLOOR.exec(rest);
    if (floor && !result.floorType) {
      if (floor[4]) result.floorType = floor[4].split(/\s+/).map(capitalized).join(" ");
      else {
        result.floorType = floor[1] ? "Floor" : capitalized(floor[2]);
        result.floor = floor[1] ?? floor[3];
      }
      return "";
    }
    const box = PO_BOX.exec(rest);
    if (box && !result.secUnitType) {
      result.secUnitType = "PO Box";
      result.secUnitNum = box[1].toUpperCase();
      rest = box[2].trim();
      continue;
    }
    const unit = SUB_BUILDING.exec(rest);
    if (unit && !result.secUnitType) {
      const type = unit[1].toUpperCase();
      result.secUnitType = SUB_BUILDING_TYPES[type] ?? capitalized(type);
      result.secUnitNum = unit[2].toUpperCase();
      rest = unit[3].trim();
      continue;
    }
    if (NAMED_FLAT.test(rest) && !result.subBuilding && !result.secUnitType) {
      result.subBuilding = rest;
      return "";
    }
    break;
  }
  return rest;
}

const append = (result: ParsedAddress, field: "building", text: string): void => {
  result[field] = result[field] ? `${result[field]}, ${text}` : text;
};

// The parts before the post town: sub-buildings, buildings, the number and thoroughfare, then the localities.
function readDelivery(parts: string[], result: ParsedAddress): void {
  // "21, Kingswood Road": a number on its own joins the part after it.
  for (let at = parts.length - 2; at >= 0; at -= 1) {
    if (ONLY_NUMBER.test(parts[at])) parts.splice(at, 2, `${parts[at]} ${parts[at + 1]}`);
  }
  const rests = parts.map((part) => takeSubBuilding(part, result));
  const kept = rests.filter((rest) => rest !== "");
  const isThoroughfareLike = (text: string | undefined): boolean =>
    text !== undefined && (NUMBERED.test(text) || isStreetLike(text) || NAME_THEN_NUMBER.test(text));
  const plain = (text: string): boolean => !NUMBERED.test(text) && !isStreetLike(text) && !NAME_THEN_NUMBER.test(text);
  // With no thoroughfare at all ("Leda Engineering Ltd, Appleford"), the first part is a building and the rest are
  // localities; a single plain part is a street with no descriptor ("Stockwell Head").
  // A forces address or a PO Box has no street: its other lines name who it goes to ("HQ Company, BFPO 105").
  if ((result.bfpo || result.secUnitType === "PO Box") && (kept.length === 1 || kept.every(plain))) {
    kept.forEach((text) => append(result, "building", text));
    return;
  }
  if (kept.length >= 2 && kept.every(plain)) {
    append(result, "building", kept[0]);
    setLocalities(kept.slice(1), result);
    return;
  }
  let afterStreet = false;
  const localities: string[] = [];
  kept.forEach((text, index) => {
    const next = kept[index + 1];
    if (afterStreet) {
      localities.push(text);
      return;
    }
    const numbered = NUMBERED.exec(text);
    if (numbered) {
      const [, number, rest] = numbered;
      if (isThoroughfareLike(next) && !result.street) {
        if (isStreetLike(rest)) {
          // "1A Seastone Cottages, Station Road": the number and a dependent thoroughfare.
          result.number = number.replace(/\s+/g, "").toUpperCase();
          result.dependentThoroughfare = rest;
        } else {
          // "10B Barry Jackson Tower, Estone Walk": a building whose name holds its number.
          append(result, "building", text);
        }
        return;
      }
      result.number = number.replace(/\s+/g, "").toUpperCase();
      readStreet(rest, result);
      afterStreet = true;
      return;
    }
    const named = NAME_THEN_NUMBER.exec(text);
    if (named && isStreetLike(named[3])) {
      append(result, "building", named[1]);
      result.number = named[2].replace(/\s+/g, "").toUpperCase();
      readStreet(named[3], result);
      afterStreet = true;
      return;
    }
    // A name before the thoroughfare is a building's: "Royal Opera House, Bow St", "Lloyds Bank, PO Box 111,
    // Peveril Buildings, Peveril Square".
    if (kept.slice(index + 1).some(isThoroughfareLike)) {
      append(result, "building", text);
      return;
    }
    readStreet(text, result);
    afterStreet = true;
  });
  setLocalities(localities, result);
}

// The localities between the thoroughfare and the post town: the last is the dependent locality, one before it the
// double dependent locality. More than two stay together in the double dependent locality.
function setLocalities(localities: string[], result: ParsedAddress): void {
  if (localities.length === 0) return;
  result.locality = localities[localities.length - 1];
  if (localities.length > 1) result.doubleDependentLocality = localities.slice(0, -1).join(", ");
}

/**
 * Parses an address in the United Kingdom (or Jersey, Guernsey and the Isle of Man, which share Royal Mail's
 * postcodes) into the parts of Royal Mail's Postcode Address File: a flat or unit (`secUnitType`, `secUnitNum`) or a
 * named part of a building (`subBuilding`), a floor, the building's name, the number, a dependent thoroughfare, the
 * thoroughfare (its name in `street`, its descriptor in full in `type`), the dependent localities, the post town in
 * `city`, a county, and the postcode in `zip` with the nation it delivers to. The postcode is found wherever it is
 * written and normalised to capitals with one space; `BFPO 105` is read as a forces address.
 *
 * @param text - The address as one string; commas and line breaks both separate its parts.
 * @param options - `useSnakeCase` gives snake_case keys; the other options are not used.
 * @returns The parts found, with `country` `GB` (or `JE`, `GY`, `IM`), or `null` when the text is empty.
 * @example
 * ```ts
 * import { parseUKAddress } from "@johnmorrisdotca/address-plus/gb";
 *
 * console.log(parseUKAddress("Flat 14, Ziggurat Building, 60-66 Saffron Hill, London EC1N 8QX"));
 * // → {"secUnitType":"Flat","secUnitNum":"14","building":"Ziggurat Building","number":"60-66","street":"Saffron","type":"Hill","city":"London","zip":"EC1N 8QX","zipValid":true,"nation":"ENG","country":"GB"}
 * ```
 */
function parseUKAddress(text: string, options: ParseOptions = {}): ParsedAddress | null {
  if (!text || typeof text !== "string") return null;
  let work = tidyAddressText(text);
  const result: ParsedAddress = {};
  let writtenNation: UKNationCode | undefined;
  let writtenCountry: "GB" | "GY" | "IM" | "JE" | undefined;
  let namesUK = false;

  // The country, at the very end or just before the postcode.
  const takeCountry = (): void => {
    const country = TRAILING_COUNTRY.exec(work);
    if (!country) return;
    const name = country[1].toUpperCase().replace(/\s+/g, " ");
    writtenNation ??= COUNTRY_NATIONS[name];
    writtenCountry ??= CROWN_DEPENDENCIES[name];
    namesUK = true;
    work = work.slice(0, country.index);
  };
  takeCountry();

  // The postcode, wherever it stands: the last thing shaped like one. BFPO and GIR 0AA have shapes of their own.
  const bfpo = BFPO.exec(work);
  const shapes = [...work.matchAll(POSTCODE_SHAPE)];
  const shape = GIR.exec(work) ?? shapes[shapes.length - 1];
  if (bfpo) {
    result.bfpo = bfpo[1];
    work = `${work.slice(0, bfpo.index)}, ${work.slice(bfpo.index + bfpo[0].length)}`;
  }
  if (shape && shape.index !== undefined) {
    const written = shape[0].toUpperCase().replace(/\s+/g, "");
    result.zip = `${written.slice(0, -3)} ${written.slice(-3)}`;
    result.zipValid = isValidUKPostcode(result.zip);
    work = `${work.slice(0, shape.index)}, ${work.slice(shape.index + shape[0].length)}`;
  }
  work = tidyAddressText(work);
  takeCountry();

  const parts = partsOf(work);
  // A county written last, after the town.
  if (parts.length >= 2) {
    const county = COUNTY_FORMS.get(parts[parts.length - 1].toUpperCase().replace(/\./g, ""));
    if (county) {
      result.county = parts.pop();
    }
  }
  // The post town: the last part, or the words after the street when no comma divides them. A forces address has
  // BFPO for its town, and a last part beginning "The" is a thoroughfare ("Victoria Institute, The Blvd, ST6 6BD").
  if (parts.length > 0 && !result.bfpo && !/^the\s/i.test(parts[parts.length - 1])) {
    const last = parts[parts.length - 1];
    const words = last.split(" ");
    if (parts.length === 1 || /^\d/.test(last) || SUB_BUILDING.test(last) || PO_BOX.test(last)) {
      const end = streetEnd(words);
      if (end !== undefined) {
        parts[parts.length - 1] = words.slice(0, end).join(" ");
        result.city = words.slice(end).join(" ");
      } else if (parts.length === 1 && !/\d/.test(last) && !isStreetLike(last)) {
        result.city = parts.pop();
      }
    } else {
      result.city = parts.pop();
    }
  }
  readDelivery(parts, result);

  // Words with nothing that makes them an address (no postcode, BFPO number, building number, flat or box, and no
  // country written) are not one.
  const anchored =
    writtenNation ||
    writtenCountry ||
    namesUK ||
    [result.zip, result.bfpo, result.number, result.secUnitType].some(Boolean);
  if (!anchored) return null;
  const postcode = result.zip && result.zipValid ? parseUKPostcode(result.zip) : null;
  const nation = postcode?.nation ?? writtenNation;
  if (nation) result.nation = nation;
  if (Object.keys(result).length === 0) return null;
  result.country = postcode?.country ?? writtenCountry ?? "GB";

  return options.useSnakeCase ? snakeCased(ordered(result)) : ordered(result);
}

const FIELD_ORDER: readonly (keyof ParsedAddress)[] = [
  "subBuilding",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "building",
  "number",
  "dependentThoroughfare",
  "street",
  "type",
  "doubleDependentLocality",
  "locality",
  "city",
  "county",
  "bfpo",
  "zip",
  "zipValid",
  "nation",
  "country",
];

function ordered(result: ParsedAddress): ParsedAddress {
  const out: Record<string, unknown> = {};
  for (const field of FIELD_ORDER) if (result[field] !== undefined) out[field] = result[field];

  return out as ParsedAddress;
}

const UK_AT_END =
  /[\s,](?:united\s+kingdom|u\.?k\.?|great\s+britain|england|scotland|wales|northern\s+ireland|jersey|guernsey|isle\s+of\s+man|channel\s+islands)\.?$/i;

/**
 * Whether an address is surely British, with no hint: it ends with the United Kingdom or one of its nations (or
 * Jersey, Guernsey or the Isle of Man), or it holds a full postcode in Royal Mail's grammar whose area Royal Mail
 * uses, or `BFPO` and a number. A Canadian postal code never passes: it ends in a digit (`M5V 1A1`), a British
 * postcode in two letters (`W1A 0AX`).
 *
 * @param text - The address as one string.
 * @returns `true` when the address is British beyond doubt, `false` otherwise.
 * @example
 * ```ts
 * import { looksBritish } from "@johnmorrisdotca/address-plus/gb";
 *
 * console.log([looksBritish("10 Downing Street, London SW1A 2AA"), looksBritish("100 Queen St W, Toronto, ON M5H 2N2")]);
 * // → [true,false]
 * ```
 */
function looksBritish(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const work = tidyAddressText(text);
  if (UK_AT_END.test(work) || BFPO.test(work) || GIR.test(work)) return true;
  // The postcode is in one of the last two parts: on the town's line, or on its own line before or after the town.
  const tail = partsOf(work).slice(-2).join(", ");
  const shapes = [...tail.matchAll(POSTCODE_SHAPE)];
  const last = shapes[shapes.length - 1];
  if (!last) return false;
  const postcode = parseUKPostcode(last[0]);

  return postcode !== null && GB_POSTCODE_AREAS[postcode.area] !== undefined;
}

export { looksBritish, parseUKAddress };
