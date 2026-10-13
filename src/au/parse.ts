// Reads an Australian address the way Australia Post and AS4590 lay one out: the delivery line (a unit, a level, a lot
// or a number and the street, or a postal delivery such as a PO Box), then the suburb or town, the state and the
// postcode. A unit before a slash is Australia's own shorthand: 3/12 Smith St is unit 3 at number 12.

import { AU_STATES, getStatesForAustralianPostcode } from "../constants/au";
import {
  AU_LEVEL_TYPES,
  AU_POSTAL_DELIVERY_TYPES,
  AU_STREET_SUFFIXES,
  AU_STREET_TYPES,
  AU_STREET_TYPE_VARIANTS,
  AU_UNIT_TYPES,
} from "../constants/au/words";
import { partsOf, snakeCased, tidyAddressText } from "../country/shared";
import type { AustralianStateCode } from "../types/australia";
import type { ParseOptions } from "../types/parse-options";
import type { ParsedAddress } from "../types/parsed-address";

const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
// Longest first, so "Lower Ground Floor" is tried before "Lower Ground", and the spaces in a form match any spacing.
const alternation = (forms: readonly string[]): string =>
  [...forms]
    .sort((a, b) => b.length - a.length)
    .map((form) => escape(form).replace(/ /g, "\\s*"))
    .join("|");

// A form as a key: capitals, without full stops or spaces, so "P.O. Box", "PO Box" and "P O BOX" are one.
const keyOf = (form: string): string => form.toUpperCase().replace(/[.\s]/g, "");
// Each form a word can be written in, to what the parser reports for it.
const formsOf = (table: Readonly<Record<string, readonly string[]>>): Map<string, string> =>
  new Map(Object.entries(table).flatMap(([reported, forms]) => forms.map((form) => [keyOf(form), reported] as const)));
const formsIn = (table: Readonly<Record<string, readonly string[]>>): string[] => Object.values(table).flat();

const DELIVERY_FORMS = formsOf(AU_POSTAL_DELIVERY_TYPES);
const UNIT_FORMS = formsOf(AU_UNIT_TYPES);
const LEVEL_FORMS = formsOf(AU_LEVEL_TYPES);
const STREET_TYPE_FORMS: Map<string, string> = new Map([
  ...Object.keys(AU_STREET_TYPES).map((code) => [code.toUpperCase(), code] as const),
  ...Object.entries(AU_STREET_TYPES).map(([code, word]) => [word.toUpperCase(), code] as const),
  ...Object.entries(AU_STREET_TYPE_VARIANTS),
]);

// "PO Box 37", "Locked Bag 801", "Care PO": group 1 the type, group 2 the number, group 3 the rest.
const DELIVERY = new RegExp(
  `^(${alternation(formsIn(AU_POSTAL_DELIVERY_TYPES))})\\.?(?:\\s*(?:no\\.?\\s*)?([A-Z]?\\d+[A-Z]?))?(?![A-Z])\\s*(.*)$`,
  "i",
);
// "Level 6", "L6", "Ground Floor", "6th Floor": groups 1 the type and 2 the number, or 3 the number and 4 the type.
const ONE_LETTER_LEVELS = /^(?:B|G|L|M)$/i;
const LEVEL = new RegExp(
  `^(?:(${alternation(formsIn(AU_LEVEL_TYPES))})\\.?\\s*(\\d+[A-Z]?)?(?![A-Z])|(\\d+)(?:st|nd|rd|th)\\s+(floor|level))\\s*(.*)$`,
  "i",
);
// "Unit 3", "U3", "Shop 5", "Suite 2.01", "Apt B": group 1 the type, group 2 the number, group 3 the rest.
const UNIT = new RegExp(
  `^(${alternation(formsIn(AU_UNIT_TYPES))})\\.?\\s*(?:no\\.?\\s*)?([A-Z]?\\d+(?:\\.\\d+)?[A-Z]?|[A-Z])(?![A-Z0-9])\\s*(.*)$`,
  "i",
);
// "3/12", "3A/12-14", "G/5": group 1 the unit, group 2 the number, group 3 the rest.
const SLASH = /^([A-Z]?\d+[A-Z]?|[A-Z])\s*\/\s*(\d+[A-Z]?(?:\s*-\s*\d+[A-Z]?)?)(?:\s+(.*))?$/i;
// "Lot 12": group 1 the lot, group 2 the rest.
const LOT = /^lot\s+(\d+[A-Z]?)\b\s*(.*)$/i;
// "12", "12A", "12-14": group 1 the number, group 2 the street.
const NUMBER = /^(\d+[A-Z]?(?:\s*-\s*\d+[A-Z]?)?)\b,?\s*(.*)$/i;
const ONLY_NUMBER = /^\d+[A-Z]?(?:\s*-\s*\d+[A-Z]?)?$/i;

// The names of the states and the codes Australia Post writes, with full stops or without.
const STATE_FORMS: Map<string, AustralianStateCode> = new Map(
  AU_STATES.flatMap((state) => [
    [state.code, state.code] as const,
    [state.name.toUpperCase(), state.code] as const,
    [state.code.split("").join("."), state.code] as const,
  ]),
);
// The state's code or name at the end of the text: group 1 what comes before, group 2 the state.
const STATE_ALTERNATION = alternation([...STATE_FORMS.keys()]);
const STATE_AT_END = new RegExp(`^(.*?)(?:^|[\\s,]+)(${STATE_ALTERNATION})\\.?$`, "i");
// Four digits at the end, after a space or a comma: group 1 what comes before, group 2 the postcode.
const POSTCODE_AT_END = /^(.*?)[\s,]+(\d{4})$/;
// What before four digits makes them a box's number, not a postcode: "PO Box 1234".
const DELIVERY_WORD_AT_END = /(?:^|\s)(?:box|bag|rmb|rsd|rms|cmb|cma|cpa|ms|lot|unit|level|suite|shop)$/i;
const TRAILING_COUNTRY = /[\s,]+(?:australia|aus)\.?$/i;
const TRAILING_AU = /(\d{4})[\s,]+AU$/;

// A postal delivery with its number ("PO Box 37"), or Care PO, which has none. "Box Hill" is a suburb.
function deliveryAt(text: string): RegExpExecArray | null {
  const match = DELIVERY.exec(text);

  return match && (match[2] || DELIVERY_FORMS.get(keyOf(match[1])) === "Care PO") ? match : null;
}

// Street types that end a street wherever they stand: a word after one of them is the suburb's.
const TERMINAL_TYPES = new Set([
  "Ave",
  "Bvd",
  "Cct",
  "Cl",
  "Cres",
  "Ct",
  "Dr",
  "Esp",
  "Gr",
  "Hwy",
  "Lane",
  "Pde",
  "Pl",
  "Rd",
  "Sq",
  "St",
  "Tce",
]);

// Whether a part begins the delivery line: a number, a unit, a level, a lot or a postal delivery.
function startsDelivery(part: string): boolean {
  if (/^\d/.test(part) || deliveryAt(part) || LOT.test(part) || SLASH.test(part)) return true;
  const unit = UNIT.exec(part);
  if (unit && /\d/.test(unit[2])) return true;
  const level = LEVEL.exec(part);

  return (
    level !== null && (level[2] !== undefined || level[3] !== undefined || !ONE_LETTER_LEVELS.test(level[1] ?? ""))
  );
}

// Whether a word is a street type, and its AS4590 abbreviation.
const streetTypeOf = (word: string): string | undefined => STREET_TYPE_FORMS.get(word.replace(/\.$/, "").toUpperCase());
const suffixOf = (words: string): string | undefined => AU_STREET_SUFFIXES[words.replace(/\.$/, "").toUpperCase()];

// The street: its name, its type and a suffix after the type. The type is taken only when a name is left before it:
// "The Esplanade" is a name.
function readStreet(text: string, result: ParsedAddress): void {
  const words = text.split(" ").filter((word) => word !== "");
  for (const suffixLength of [2, 1, 0]) {
    if (words.length < suffixLength + 2) continue;
    const suffix = suffixLength > 0 ? suffixOf(words.slice(-suffixLength).join(" ")) : undefined;
    if (suffixLength > 0 && !suffix) continue;
    const typeWord = words[words.length - suffixLength - 1];
    const type = streetTypeOf(typeWord);
    const name = words.slice(0, words.length - suffixLength - 1);
    if (!type || name.length === 0 || (name.length === 1 && /^the$/i.test(name[0]))) continue;
    result.street = name.join(" ");
    result.type = type;
    if (suffix) result.suffix = suffix;
    return;
  }
  result.street = words.join(" ");
}

// Where the delivery line ends in a part with no comma before the suburb: after the street type (and a suffix), or
// after a postal delivery's number. The type is the first street-type word after the first word of the name, and a
// run of them is one ("Beach Park Rd"); "12 Smith St Albert Park" ends at St.
function deliveryEnd(words: string[]): number | undefined {
  const delivery = deliveryAt(words.join(" "));
  if (delivery) {
    const taken = `${delivery[1]}${delivery[2] ? ` ${delivery[2]}` : ""}`.split(" ").filter(Boolean).length;
    return taken < words.length ? taken : undefined;
  }
  let start = 0;
  while (start < words.length && /\d/.test(words[start])) start += 1;
  for (let at = start + 1; at < words.length; at += 1) {
    if (!streetTypeOf(words[at])) continue;
    let end = at;
    // "Beach Park Rd": a run of type words is one, unless it ends at a type that always ends a street ("Main St Mount
    // Druitt", "River Rd Lane Cove": the suburb starts after St and Rd).
    while (
      end + 1 < words.length - 1 &&
      !TERMINAL_TYPES.has(streetTypeOf(words[end]) ?? "") &&
      streetTypeOf(words[end + 1])
    ) {
      end += 1;
    }
    // A direction after the type, with words still to come, starts the suburb (North Sydney, South Yarra) rather than
    // being the street's suffix: suburbs named so are far more common than suffixes, and a comma settles it.
    return end + 1 < words.length ? end + 1 : undefined;
  }
  return undefined;
}

// One part of the delivery lines, read from its start: a postal delivery, a level, a unit, a slash, a lot, a number,
// then the street. A part with none of these is a building's name when more follows it, or the street otherwise.
function readDeliveryPart(part: string, result: ParsedAddress, isLast: boolean, streetFollows: boolean): void {
  let rest = part.trim();
  const delivery = deliveryAt(rest);
  if (delivery) {
    result.secUnitType = DELIVERY_FORMS.get(keyOf(delivery[1])) ?? delivery[1];
    if (delivery[2]) result.secUnitNum = delivery[2].toUpperCase();
    rest = delivery[3].trim();
  }
  for (let guard = 0; rest !== "" && guard < 4; guard += 1) {
    const level = LEVEL.exec(rest);
    if (level && !result.floorType && (level[2] || level[3] || !ONE_LETTER_LEVELS.test(level[1] ?? ""))) {
      result.floorType = level[4]
        ? level[4].toLowerCase() === "floor"
          ? "Floor"
          : "Level"
        : LEVEL_FORMS.get(keyOf(level[1]));
      const number = level[2] ?? level[3];
      if (number) result.floor = number.toUpperCase();
      rest = level[5].trim();
      continue;
    }
    const unit = UNIT.exec(rest);
    if (unit && !result.secUnitType && !(unit[1].length === 1 && !/\d/.test(unit[2]))) {
      result.secUnitType = UNIT_FORMS.get(keyOf(unit[1]));
      result.secUnitNum = unit[2].toUpperCase();
      // "Unit 3/12 Smith St": the slash joins the unit to the number.
      rest = unit[3].replace(/^\/\s*/, "").trim();
      continue;
    }
    break;
  }
  const slash = SLASH.exec(rest);
  if (slash) {
    if (!result.secUnitType) result.secUnitType = "Unit";
    result.secUnitNum = slash[1].toUpperCase();
    result.number = slash[2].replace(/\s+/g, "").toUpperCase();
    rest = (slash[3] ?? "").trim();
  } else {
    const lot = LOT.exec(rest);
    if (lot) {
      result.lot = lot[1].toUpperCase();
      rest = lot[2].trim();
    }
    const number = NUMBER.exec(rest);
    if (number && !result.number && (number[2] !== "" || isLast)) {
      result.number = number[1].replace(/\s+/g, "").toUpperCase();
      rest = number[2].trim();
    }
  }
  if (rest === "") return;
  const words = rest.split(" ");
  const endsInType =
    streetTypeOf(words[words.length - 1]) !== undefined ||
    (words.length > 2 && suffixOf(words[words.length - 1]) !== undefined && !!streetTypeOf(words[words.length - 2]));
  // A name with no number before a part that holds the street is a building's ("The Rocks Centre, Shop 3, 10 Playfair
  // St"), even when it ends in a word that is also a street type.
  if (!result.number && !result.street && (streetFollows || (!isLast && !endsInType))) {
    result.building = result.building ? `${result.building}, ${rest}` : rest;
    return;
  }
  if (result.street) {
    // A second street line: the first was a building's name after all.
    result.building = result.building ? `${result.building}, ${streetText(result)}` : streetText(result);
    delete result.type;
    delete result.suffix;
  }
  readStreet(rest, result);
}

const streetText = (result: ParsedAddress): string =>
  [result.street, result.type, result.suffix].filter(Boolean).join(" ");

/**
 * Parses an Australian address into its parts, as Australia Post lays one out: the delivery line, then the suburb or
 * town, the state and the postcode. Reads a unit written `3/12`, `Unit 3/12`, `Unit 3, 12` or `U3 12`; a level
 * (`Level 6`, `L6`, `Ground Floor`); a lot (`Lot 12`); a range of numbers (`12-14`); a building's name on a line of
 * its own; and the postal deliveries `PO Box`, `GPO Box`, `Locked Bag`, `Private Bag`, `RMB`, `RSD`, `RMS`, `CMB`,
 * `CMA`, `CPA`, `MS` and `Care PO`. The street type is reported as AS4590's abbreviation (`St`, `Pde`, `Cres`). A state
 * is written by its code or its name; a trailing `Australia` is dropped.
 *
 * @param text - The address as one string; commas and line breaks both separate its parts.
 * @param options - `useSnakeCase` gives snake_case keys; the other options are not used.
 * @returns The parts found, with `country: "AU"`, or `null` when the text is empty or has nothing but a state.
 * @example
 * ```ts
 * import { parseAustralianAddress } from "@johnmorrisdotca/address-plus/au";
 *
 * console.log(parseAustralianAddress("Unit 3/12 Smith St, Parramatta NSW 2150"));
 * // → {"secUnitType":"Unit","secUnitNum":"3","number":"12","street":"Smith","type":"St","city":"Parramatta","state":"NSW","zip":"2150","zipValid":true,"country":"AU"}
 * ```
 */
function parseAustralianAddress(text: string, options: ParseOptions = {}): ParsedAddress | null {
  if (!text || typeof text !== "string") return null;
  const tidied = tidyAddressText(text);
  const namesAustralia = TRAILING_COUNTRY.test(tidied) || TRAILING_AU.test(tidied);
  let work = tidied.replace(TRAILING_COUNTRY, "").replace(TRAILING_AU, "$1");
  if (work === "") return null;

  const result: ParsedAddress = {};
  // The last line, from its end: the postcode, then the state before it. Four digits after a state, a comma or a
  // word that is not a box's are the postcode.
  const postcode = POSTCODE_AT_END.exec(work);
  if (postcode && !DELIVERY_WORD_AT_END.test(postcode[1]) && !ONLY_NUMBER.test(postcode[1])) {
    result.zip = postcode[2];
    work = postcode[1];
  }
  const state = STATE_AT_END.exec(work);
  if (state && (state[1] !== "" || result.zip)) {
    result.state = STATE_FORMS.get(state[2].toUpperCase().replace(/\s+/g, " ").replace(/\.$/, ""));
    work = state[1];
  }
  work = work.replace(/[\s,]+$/, "");

  // "12, Smith St": a number on its own joins the street after it.
  const parts = partsOf(work);
  for (let at = parts.length - 2; at >= 0; at -= 1) {
    if (ONLY_NUMBER.test(parts[at]) || /\/\s*$/.test(parts[at])) {
      parts.splice(at, 2, `${parts[at]} ${parts[at + 1]}`.replace(/\s*\/\s*/, "/"));
    }
  }

  // The suburb: the last part, or the words after the delivery line when no comma divides them. A last part that is
  // a suburb's name may end in a word that is also a street type ("Albert Park"); only a number, a unit, a lot or a
  // postal delivery at its start makes it the delivery line.
  let suburb: string | undefined;
  const lastPart = parts[parts.length - 1];
  if (lastPart !== undefined) {
    const words = lastPart.split(" ");
    const end = deliveryEnd(words);
    if (parts.length >= 2 && !startsDelivery(lastPart)) {
      suburb = parts.pop();
    } else if (end !== undefined) {
      parts[parts.length - 1] = words.slice(0, end).join(" ");
      suburb = words.slice(end).join(" ");
    } else if (parts.length === 1 && !/\d/.test(lastPart) && !deliveryAt(lastPart) && (result.state || result.zip)) {
      suburb = parts.pop();
    }
  }

  parts.forEach((part, index) =>
    readDeliveryPart(
      part,
      result,
      index === parts.length - 1,
      parts.slice(index + 1).some((later) => /\d/.test(later)),
    ),
  );

  if (suburb) result.city = suburb;
  // Words with nothing that makes them an address (no number, postcode, state, unit, box or lot, and no Australia
  // written) are not one: "hello" is not a street.
  const anchored =
    namesAustralia ||
    [result.number, result.zip, result.state, result.secUnitType, result.lot, result.floorType].some(Boolean);
  const alone = Object.keys(result).length === 1 && (result.state !== undefined || result.number !== undefined);
  if (!anchored || alone) return null;
  if (result.zip) result.zipValid = true;
  result.country = "AU";

  return options.useSnakeCase ? snakeCased(ordered(result)) : ordered(result);
}

// The fields in the order a reader expects them, from the unit to the country.
const FIELD_ORDER: readonly (keyof ParsedAddress)[] = [
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "lot",
  "number",
  "street",
  "type",
  "suffix",
  "city",
  "state",
  "zip",
  "zipValid",
  "country",
];

function ordered(result: ParsedAddress): ParsedAddress {
  const out: Record<string, unknown> = {};
  for (const field of FIELD_ORDER) if (result[field] !== undefined) out[field] = result[field];

  return out as ParsedAddress;
}

// A state's code or name, then four digits, at the end of the text.
const STATE_AND_POSTCODE = new RegExp(`(?:^|[\\s,])(${STATE_ALTERNATION})\\.?[\\s,]+(\\d{4})$`, "i");
const AUSTRALIA_AT_END = /[\s,](?:australia)\.?$/i;

/**
 * Whether an address is surely Australian, with no hint: it ends with `Australia`, or with a state and an Australian
 * postcode (`NSW 2150`, `Victoria 3000`, `VIC 2000`, whose postcode is Sydney's). `WA` needs one of Western
 * Australia's postcodes (`WA 6000`), since `WA 9810` is a Washington ZIP code cut short. A postcode alone is not
 * enough: four digits end addresses in many countries.
 *
 * @param text - The address as one string.
 * @returns `true` when the address is Australian beyond doubt, `false` otherwise.
 * @example
 * ```ts
 * import { looksAustralian } from "@johnmorrisdotca/address-plus/au";
 *
 * console.log([looksAustralian("12 Smith St, Parramatta NSW 2150"), looksAustralian("123 Main St, Seattle, WA 9810")]);
 * // → [true,false]
 * ```
 */
function looksAustralian(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const work = tidyAddressText(text);
  if (AUSTRALIA_AT_END.test(work)) return true;
  const match = STATE_AND_POSTCODE.exec(work.replace(TRAILING_AU, "$1"));
  if (!match) return false;
  const state = STATE_FORMS.get(match[1].toUpperCase().replace(/\s+/g, " ").replace(/\.$/, ""));

  // WA is also Washington's code, and a Washington ZIP code cut to four digits (WA 9810) must stay American, so WA
  // needs a postcode of Western Australia's. Every other state needs only a postcode in some state's block: a
  // postcode from the wrong state is still Australian, and the validator says so.
  const serves = getStatesForAustralianPostcode(match[2]);

  return state !== undefined && (state === "WA" ? serves.includes("WA") : serves.length > 0);
}

export { looksAustralian, parseAustralianAddress, streetTypeOf };
