// Reads an address in Germany the way Deutsche Post and DIN 5008 lay one out: who the address is care of, the part of the
// building and the delivery point (a flat, a floor), the street and its number (after the street, as German has it) or a
// Postfach or Packstation, and the line of the five-digit postcode and the place. The postcode comes before the place and
// may stand anywhere after the street.

import { getStateFromGermanPostcode, isValidGermanPostcode } from "../constants/de";
import {
  DE_BUILDING_WORDS,
  DE_COUNTRY_NAMES,
  DE_STREET_OPENERS,
  DE_STREET_SUFFIXES,
  DE_UNIT_TYPES,
} from "../constants/de/words";
import { partsOf, snakeCased, tidyAddressText } from "../country/shared";
import type { ParseOptions } from "../types/parse-options";
import type { ParsedAddress } from "../types/parsed-address";

// A word in lower case with the umlauts and ß written out and the full stops taken off, so that Straße, Strasse and
// Str. are three spellings of one word.
const plain = (text: string): string =>
  text
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/[.]/g, "");

// Words that are a name's end on their own, and words that a name only ends with when it is longer than they are
// (Hof and Park are no suffix of Gasthof or Marketingpark, but are a street's name in Alter Hof).
const STAND_ALONE_ONLY = new Set(["hof", "park", "wall", "tor", "berg", "tal"]);
const TYPE_WORDS: Set<string> = new Set(DE_STREET_SUFFIXES.map(plain));
const COMPOUND_SUFFIXES: string[] = DE_STREET_SUFFIXES.map(plain).filter((suffix) => !STAND_ALONE_ONLY.has(suffix));
const OPENERS: Set<string> = new Set(DE_STREET_OPENERS.map(plain));
const ARTICLES = new Set(["der", "die", "das", "dem", "den", "des"]);
const BUILDING_WORDS: Set<string> = new Set(DE_BUILDING_WORDS.map(plain));
const UNIT_TYPE_FORMS: Map<string, string> = new Map(
  Object.entries(DE_UNIT_TYPES).flatMap(([type, forms]) => [
    [plain(type), type] as const,
    ...forms.map((form) => [plain(form), type] as const),
  ]),
);
const COUNTRY_KEYS: string[] = [...DE_COUNTRY_NAMES].sort((a, b) => b.length - a.length);

const FLOOR_TYPES: Readonly<Record<string, string>> = {
  og: "Obergeschoss",
  obergeschoss: "Obergeschoss",
  etage: "Etage",
  stock: "Stock",
  ug: "Untergeschoss",
  untergeschoss: "Untergeschoss",
  dg: "Dachgeschoss",
  dachgeschoss: "Dachgeschoss",
  eg: "Erdgeschoss",
  erdgeschoss: "Erdgeschoss",
  parterre: "Erdgeschoss",
  souterrain: "Untergeschoss",
};

// "D-10115", "DE-10115" before a postcode, which is the country's code and not part of it.
const POSTCODE = /(?:\b(?:D|DE)[-\s]?)?(?<!\d)(\d{5})(?!\d)/gi;
// What a five-digit number is when it follows these: a box's number, not a postcode.
const BOX_BEFORE_NUMBER = /(?:postfach|postf|pf|packstation|postnummer|nr)\.?\s*$/i;
const CARE_OF = /^(?:c\/o|c\.\s?o\.|z\.\s?Hd\.?|z\.\s?H\.|zu\s+Händen|zu\s+Haenden|per\s+Adresse)\s*(.+)$/i;
const BEI = /^bei\s+(?!der\b|dem\b|den\b|die\b|das\b|m\b)(\p{L}[^\d]*)$/iu;
const POSTFACH = /^(?:postfach|postf\.?|pf\.?)\s*(?:nr\.?\s*)?(\d[\d\s]*)$/i;
const PACKSTATION = /^(packstation|postfiliale|paketbox)\s*(?:nr\.?\s*)?(\d+)$/i;
// "2. OG", "EG", "3. Etage", "Dachgeschoss links": group 1 a floor's number, 2 its kind, 3 a kind with no number, 4 a side.
const FLOOR =
  /^(?:(?:(\d{1,2})\.?\s*(OG|Obergeschoss|Etage|Stock|UG|Untergeschoss|DG|Dachgeschoss)|(?:Etage|Stock)\s+(\d{1,2})|(EG|Erdgeschoss|Parterre|DG|Dachgeschoss|UG|Untergeschoss|Souterrain)))\.?(?:\s+(links|rechts|mitte|li|re)\.?)?$/i;
// "Wohnung 12", "Whg. 3b", "App. 4": group 1 the type, 2 the number.
const UNIT = /^([A-Za-zäöüÄÖÜ]+)\.?\s*(?:nr\.?|no\.?|#)?\s*(\d+[A-Za-z]?|[A-Za-z]\d*)$/i;
const LOCALITY = /^(?:OT|Ortsteil|Stadtteil)\s+(.+)$/i;
// The house number at the end: "12", "12a", "12 a", "12-14", "12/14", "Nr. 12", "Hausnummer 12".
const NUMBER_AT_END =
  /^(.*?\S)\s+(?:(?:haus-?\s*)?nr\.?\s*|no\.?\s*|hausnummer\s+)?(\d{1,4}\s?[A-Za-z]?(?:\s*[-–/]\s*\d{1,4}\s?[A-Za-z]?)?)$/i;
const NUMBER_FIRST = /^(\d{1,4}\s?[A-Za-z]?(?:\s*[-–/]\s*\d{1,4}\s?[A-Za-z]?)?)\s+(\p{L}.*)$/u;

const wordsOf = (text: string): string[] => text.split(/\s+/).filter((word) => word !== "");
const compactNumber = (text: string): string =>
  text.replace(/\s+/g, "").replace(/[a-z]$/, (letter) => letter.toUpperCase());
const isBare = (word: string): boolean => TYPE_WORDS.has(plain(word));
const endsWithSuffix = (word: string): boolean => COMPOUND_SUFFIXES.some((suffix) => plain(word).endsWith(suffix));

// Where a street's name begins among the words before its number: the last word ends it, a type of street standing alone
// (Straße, Platz, Markt) takes the word before it, and an opener (Am, An der, Zum alten) and its articles belong to it.
// What comes before is a name: a building's, a company's.
function splitStreet(words: string[]): { name: string[]; street: string[] } {
  // A type of street and an article (Platz der Republik, Straße des 17. Juni) begin the street's name where they stand.
  for (let at = words.length - 2; at >= 0; at -= 1) {
    if (isBare(words[at]) && ARTICLES.has(plain(words[at + 1])))
      return { name: words.slice(0, at), street: words.slice(at) };
  }
  let start = words.length - 1;
  if (words.length >= 2 && isBare(words[start])) start -= 1;
  while (start > 0) {
    const before = plain(words[start - 1]);
    if (OPENERS.has(before) || ARTICLES.has(before)) start -= 1;
    else break;
  }
  // A bare article is no street's beginning.
  while (start < words.length - 1 && ARTICLES.has(plain(words[start]))) start += 1;

  return { name: words.slice(0, start), street: words.slice(start) };
}

// Whether words read as a street's name: the last ends with a suffix, or is a type of street standing alone beside a
// word before it, or the first is an opener (Am Markt, An der Weide).
function isStreetLike(words: string[]): boolean {
  if (words.length === 0) return false;
  const last = words[words.length - 1];
  if (endsWithSuffix(last)) return true;
  if (words.length >= 2 && isBare(last)) return true;
  if (words.some((word, at) => at + 1 < words.length && isBare(word) && ARTICLES.has(plain(words[at + 1]))))
    return true;

  return OPENERS.has(plain(words[0])) && words.length >= 2;
}

// A country at the end of the text: what is before it, or null.
function takeCountry(text: string): string | null {
  const folded = text
    .replace(/[äÄ]/g, "A")
    .replace(/[öÖ]/g, "O")
    .replace(/[üÜ]/g, "U")
    .replace(/ß/g, "S")
    .replace(/[\u00c0-\u017f]/g, (one) => one.normalize("NFD")[0])
    .toUpperCase();
  for (const name of COUNTRY_KEYS) {
    const at = folded.length - name.length;
    if (at < 0 || folded.slice(at) !== name || (at > 0 && !/[\s,]/.test(folded[at - 1]))) continue;

    return text.slice(0, at);
  }
  const code = /,\s*(?:DE|D)\s*$/i.exec(text) ?? (/\d{5}/.test(text) ? /\s+DE\s*$/.exec(text) : null);

  return code ? text.slice(0, code.index) : null;
}

function readFloor(part: string, result: ParsedAddress): boolean {
  const floor = FLOOR.exec(part);
  if (!floor || result.floorType) return false;
  const kind = floor[2] ?? floor[4] ?? "etage";
  result.floorType = FLOOR_TYPES[plain(kind)] ?? kind;
  const number = floor[1] ?? floor[3];
  if (number) result.floor = number;
  if (floor[5]) {
    const side = floor[5].toLowerCase().replace(/^li$/, "links").replace(/^re$/, "rechts");
    // The side of the landing is the flat when no flat is named; beside a flat's number it is kept with the building.
    if (result.secUnitType) addBuilding(result, side);
    else {
      result.secUnitType = "Wohnung";
      result.secUnitNum = side;
    }
  }

  return true;
}

const addBuilding = (result: ParsedAddress, text: string): void => {
  result.building = result.building ? `${result.building}, ${text}` : text;
};

// The street and its house number, from one part: "Hauptstraße 12a", "Eschenbräu Bräurei Triftstraße 67", "12 Hauptstraße".
function readStreetPart(part: string, result: ParsedAddress): boolean {
  const last = NUMBER_AT_END.exec(part);
  if (last) {
    const words = wordsOf(last[1]);
    // A number after a word that is no street's ("Wohnung 12", "Postfach 3") was taken before it got here.
    const { name, street } = splitStreet(words);
    if (name.length > 0) addBuilding(result, name.join(" "));
    result.street = street.join(" ");
    result.number = compactNumber(last[2]);

    return true;
  }
  const first = NUMBER_FIRST.exec(part);
  if (first && isStreetLike(wordsOf(first[2]))) {
    result.number = compactNumber(first[1]);
    result.street = first[2];

    return true;
  }
  if (isStreetLike(wordsOf(part))) {
    const { name, street } = splitStreet(wordsOf(part));
    if (name.length > 0) addBuilding(result, name.join(" "));
    result.street = street.join(" ");

    return true;
  }

  return false;
}

// What a part holds apart from the street: care of, a box, a floor, a flat, a building, a locality. Each found is set on
// the result and the part is taken off.
function takeDelivery(part: string, result: ParsedAddress): string {
  const careOf = CARE_OF.exec(part) ?? BEI.exec(part);
  if (careOf && !result.careOf) {
    result.careOf = careOf[1].trim();
    return "";
  }
  const box = POSTFACH.exec(part);
  if (box && !result.secUnitType) {
    result.secUnitType = "Postfach";
    result.secUnitNum = box[1].replace(/\s+/g, "");
    return "";
  }
  const packstation = PACKSTATION.exec(part);
  if (packstation && !result.secUnitType) {
    result.secUnitType = packstation[1].charAt(0).toUpperCase() + packstation[1].slice(1).toLowerCase();
    result.secUnitNum = packstation[2];
    return "";
  }
  if (readFloor(part, result)) return "";
  const unit = UNIT.exec(part);
  const unitType = unit ? UNIT_TYPE_FORMS.get(plain(unit[1])) : undefined;
  if (unit && unitType && (!result.secUnitType || /^(links|rechts|mitte)$/.test(result.secUnitNum ?? ""))) {
    // A flat's number after a floor's side of the landing (2. OG links, Wohnung 12) takes the flat's place.
    if (result.secUnitNum) addBuilding(result, result.secUnitNum);
    result.secUnitType = unitType;
    result.secUnitNum = unit[2].toUpperCase();
    return "";
  }
  const locality = LOCALITY.exec(part);
  if (locality && !result.locality) {
    result.locality = locality[1];
    return "";
  }

  return part;
}

const isBuildingLine = (part: string): boolean => {
  const first = wordsOf(part)[0];

  return first !== undefined && BUILDING_WORDS.has(plain(first));
};

// The parts before the place's line, in order: what each is decides where it goes. A name before the street is the
// building's, one after it the locality's; with no street at all, a lone name is the locality and the last of several is.
function readDelivery(parts: string[], result: ParsedAddress): void {
  const rests = parts.map((part) => takeDelivery(part, result)).filter((rest) => rest !== "");
  const before: string[] = [];
  const after: string[] = [];
  let found = false;
  for (const text of rests) {
    if (!found && !isBuildingLine(text) && readStreetPart(text, result)) found = true;
    else (found ? after : before).push(text);
  }
  const hasBox = result.secUnitType === "Postfach" || result.secUnitType === "Packstation";
  if (!found && !hasBox && before.length > 0 && !isBuildingLine(before[before.length - 1]) && !result.locality) {
    result.locality = before.pop();
  }
  for (const text of before) addBuilding(result, text);
  if (after.length > 0) {
    if (result.locality) after.forEach((text) => addBuilding(result, text));
    else {
      result.locality = after[0];
      after.slice(1).forEach((text) => addBuilding(result, text));
    }
  }
}

const FIELD_ORDER: readonly (keyof ParsedAddress)[] = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "street",
  "number",
  "locality",
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

/**
 * Parses an address in Germany into the parts Deutsche Post and DIN 5008 lay out: who it is care of (`careOf`, from
 * `c/o`, `z. Hd.`, `bei`), the part of a building (`building`: `Hinterhaus`, `Haus B`, or a name above the street), a
 * flat (`secUnitType` and `secUnitNum`: `Wohnung 12`), a floor (`floorType` and `floor`: `Obergeschoss` and `2`), the
 * street's whole name as written in `street` (`Hauptstraße`, `Berliner Str.`, `Am Markt`), its house number in `number`
 * (`12a`, `12-14`), a Postfach or Packstation (`secUnitType` and `secUnitNum`), the Ortsteil in `locality`, the place in
 * `city`, and the postcode in `zip` with the Land's code in `state`. The postcode may stand anywhere after the street;
 * `D-10115` is read as `10115`.
 *
 * @param text - The address as one string; commas and line breaks both separate its parts.
 * @param options - `useSnakeCase` gives snake_case keys; the other options are not used.
 * @returns The parts found, with `country` `DE`, or `null` when the text is empty or holds nothing that makes it an
 * address.
 * @example
 * ```ts
 * import { parseGermanAddress } from "@johnmorrisdotca/address-plus/de";
 *
 * console.log(parseGermanAddress("c/o Weber, Hinterhaus, Hauptstraße 12a, 10115 Berlin"));
 * // → {"careOf":"Weber","building":"Hinterhaus","street":"Hauptstraße","number":"12A","city":"Berlin","state":"BE","zip":"10115","zipValid":true,"country":"DE"}
 * ```
 */
function parseGermanAddress(text: string, options: ParseOptions = {}): ParsedAddress | null {
  if (!text || typeof text !== "string") return null;
  let work = tidyAddressText(text);
  const result: ParsedAddress = {};
  let namesGermany = false;

  const rest = takeCountry(work);
  if (rest !== null) {
    namesGermany = true;
    work = tidyAddressText(rest);
  }

  // The postcode: the last five digits that are not a box's number, with the place after it.
  const postcodes = [...work.matchAll(POSTCODE)].filter((match) => !BOX_BEFORE_NUMBER.test(work.slice(0, match.index)));
  const postcode = postcodes[postcodes.length - 1];
  let placeText = "";
  if (postcode && postcode.index !== undefined) {
    result.zip = postcode[1];
    placeText = work.slice(postcode.index + postcode[0].length).replace(/^[\s,]+/, "");
    work = tidyAddressText(work.slice(0, postcode.index));
  }
  const parts = partsOf(work);
  if (placeText !== "") {
    const locality = /^(.*?\S)\s+(?:OT|Ortsteil)\s+(.+)$/i.exec(placeText);
    result.city = (locality ? locality[1] : placeText).replace(/[\s,]+$/, "");
    if (locality) result.locality = locality[2];
  } else if (!postcode && parts.length >= 2) {
    // With no postcode, the last part is the place unless it is a street, a box or a building.
    const last = parts[parts.length - 1];
    const asStreet = NUMBER_AT_END.test(last) || NUMBER_FIRST.test(last) || isStreetLike(wordsOf(last));
    if (!asStreet && !POSTFACH.test(last) && !PACKSTATION.test(last) && !isBuildingLine(last) && !FLOOR.test(last)) {
      result.city = parts.pop();
    }
  } else if (
    !postcode &&
    parts.length === 1 &&
    namesGermany &&
    !NUMBER_AT_END.test(parts[0]) &&
    !isStreetLike(wordsOf(parts[0]))
  ) {
    result.city = parts.pop();
  }
  readDelivery(parts, result);

  // Words with nothing that makes them an address (no postcode, number, street, box or flat, and no country written) are
  // not one.
  const anchored = namesGermany || [result.zip, result.number, result.street, result.secUnitType].some(Boolean);
  if (!anchored || Object.keys(result).length === 0) return null;
  if (result.zip) {
    result.zipValid = isValidGermanPostcode(result.zip);
    const state = getStateFromGermanPostcode(result.zip);
    if (state) result.state = state;
  }
  result.country = "DE";

  return options.useSnakeCase ? snakeCased(ordered(result)) : ordered(result);
}

// Whether a part is a German street and its number: a name that reads as a street (it ends with a suffix, or begins with an
// opener) followed by the house number, with no number in front, which would be French or American.
function hasGermanStreetShape(part: string): boolean {
  if (/^\s*\d/.test(part)) return false;
  const found = NUMBER_AT_END.exec(part);

  return found !== null && isStreetLike(wordsOf(found[1]));
}

/**
 * Whether an address is surely German, with no hint: it ends with Germany, Deutschland or a code such as `D-10115` before
 * the place, or its last line begins with a postcode and a place (`10115 Berlin`) while the address has a street that ends
 * in a German suffix (`Hauptstraße`, `Kastanienallee`, `Am Markt`) followed by its number, or a `Postfach` or a
 * `Packstation`. A US ZIP code follows its state, a Canadian one ends in a digit and a French street begins with its
 * number and a type of voie, so none of those has that shape.
 *
 * @param text - The address as one string.
 * @returns `true` when the address is German beyond doubt, `false` otherwise.
 * @example
 * ```ts
 * import { looksGerman } from "@johnmorrisdotca/address-plus/de";
 *
 * console.log([looksGerman("Hauptstraße 12, 10115 Berlin"), looksGerman("123 Main St, Seattle, WA 98101")]);
 * // → [true,false]
 * ```
 */
function looksGerman(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const work = tidyAddressText(text);
  if (takeCountry(work) !== null) return true;
  const line = /(?:^|[\s,])(?:(?:D|DE)[-\s]?)?(\d{5})\s+\p{L}[^,]*$/iu.exec(work);
  if (!line || line.index === undefined) return false;
  const postcode = line[1];
  // The first digit of a German postcode is never nought followed by nought, and the ones past 99998 do not exist.
  if (!isValidGermanPostcode(postcode) || Number(postcode) < 1001 || Number(postcode) > 99998) return false;
  const before = work.slice(0, line.index + (/^[\s,]/.test(line[0]) ? 1 : 0));
  if (/\b(?!D\b|DE\b)[A-Z]{2}[\s,]+$/.test(before)) return false;
  if (/(?:^|[\s,])(?:Postfach|Pf\.|Packstation)\s*\d/i.test(before)) return true;

  return partsOf(before).some(hasGermanStreetShape);
}

export { looksGerman, parseGermanAddress };
