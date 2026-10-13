// Reads an address in France in the shape La Poste asks for (its specification SP 8855, which follows the norm NF
// Z10-011): who or what the address is care of, the delivery point (an apartment, a floor, a staircase), the entrance,
// the building, residence or zone, the number and the street, a lieu-dit or a box, and the line of the postcode, the
// commune and a CEDEX. The postcode comes before the commune, and may stand anywhere after the street.

import { isValidFrenchPostcode, parseFrenchPostcode } from "../constants/fr";
import {
  FR_BUILDING_WORDS,
  FR_COUNTRY_NAMES,
  FR_NUMBER_EXTENSIONS,
  FR_ROMAN_NUMERALS,
  FR_STREET_TYPES,
  FR_UNIT_TYPES,
} from "../constants/fr/words";
import { partsOf, snakeCased, tidyAddressText } from "../country/shared";
import type { FrenchPostalCountry } from "../types/france";
import type { ParseOptions } from "../types/parse-options";
import type { ParsedAddress } from "../types/parsed-address";

// A word in capitals with no accents, one letter for one: so a position in the folded text is a position in the text.
const fold = (text: string): string => text.replace(/[À-ſ]/g, (one) => one.normalize("NFD")[0]).toUpperCase();
// The same, with a hyphen, full stop or apostrophe taken as a space, for matching a name against the tables.
const key = (text: string): string =>
  fold(text)
    .replace(/[-.'’]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const STREET_TYPE_FORMS: Map<string, string> = new Map(
  Object.entries(FR_STREET_TYPES).flatMap(([type, forms]) => [
    [key(type), type] as const,
    ...forms.map((form) => [key(form), type] as const),
  ]),
);
const UNIT_TYPE_FORMS: Map<string, string> = new Map(
  Object.entries(FR_UNIT_TYPES).flatMap(([type, forms]) => [
    [key(type), type] as const,
    ...forms.map((form) => [key(form), type] as const),
  ]),
);
const BUILDING_FORMS: Set<string> = new Set(
  Object.entries(FR_BUILDING_WORDS).flatMap(([word, forms]) => [key(word), ...forms.map(key)]),
);
const EXTENSIONS: Set<string> = new Set(FR_NUMBER_EXTENSIONS.map((word) => word.toUpperCase()));

// What may end an address: a country or a territory, or FR. Longest first, so SAINT PIERRE ET MIQUELON is not cut at
// MIQUELON.
const COUNTRY_KEYS: string[] = [...Object.keys(FR_COUNTRY_NAMES), "FR"].sort((a, b) => b.length - a.length);

// "F-75008", "FR 75008" before a postcode: the country's code, which is not part of it.
const POSTCODE = /(?:\bF(?:R)?[-\s]?)?(?<!\d)(\d{5})(?!\d)/gi;
// What a five-digit number is when it follows these: a box, not a postcode.
const BOX_BEFORE_NUMBER = /(?:\bCS|\bTSA|\bBP|\bB\.\s?P\.?|\bCP|\bBOITE POSTALE|\bCASE POSTALE)\s*$/;
const BOX = /(?:^|[\s,])(BP|B\.\s?P\.?|BO[IÎ]TE POSTALE|CS|TSA)\s*(\d{1,6})\b[\s,.]*/i;
const CEDEX = /[\s,]+CEDEX(?:\s*(\d{1,2}))?\s*$/i;
const CEDEX_ALONE = /^CEDEX(?:\s*(\d{1,2}))?$/i;
// "Paris 8e", "LYON 03", "Marseille 13": the arrondissement after the name; and before it, "9e arrondissement Paris".
const ARRONDISSEMENT_AFTER =
  /^(Paris|Lyon|Marseille)[\s-]+(\d{1,2})(?:\s*(?:er|e|ème|eme|è|ieme|ième))?(?:\s+arr(?:ondissement|\.)?)?$/i;
const ARRONDISSEMENT_BEFORE =
  /^(\d{1,2}|[IVX]{1,5})\s*(?:er|e|ème|eme|è|ieme|ième)?\s+arr(?:ondissement|\.)?\s+(?:de\s+)?(Paris|Lyon|Marseille)$/i;

const CARE_OF = /^(?:chez|c\/o|aux bons soins de)\s+(.+)$/i;
const LIEU_DIT = /^(?:lieu[-\s]?dit|ld)\s+(.+)$/i;
// "3e étage", "3ème étage", "Étage 3", "Rez-de-chaussée", "RDC".
const FLOOR =
  /^(?:(\d{1,2})\s*(?:er|e|ème|eme|è|ieme|ième)\s+(?:étage|etage)|(?:étage|etage|niveau)\s*(\d{1,2})|(rez[-\s]de[-\s]chauss[ée]e|rdc|sous[-\s]sol))$/i;
const STAIRCASE = /^(?:escalier|esc\.?)\s*([A-Z0-9]{1,3})$/i;
const ENTRANCE = /^(?:entrée|entree|ent\.?)\s*([A-Z0-9]{1,3})$/i;
// "Appartement 12", "Apt. 4B", "Porte 3", "Bureau 21": group 1 the type, group 2 the number, group 3 the rest.
const UNIT = /^([A-Za-zÀ-ÿ]+)\.?\s*(?:n°|no\.?|#)?\s*(\d+[A-Z]?|[A-Z]\d*)\b[\s,]*(.*)$/i;
const NUMBER_ONLY = /^(?:n°\s*)?\d{1,4}(?:\s*-\s*\d{1,4})?\s*(?:bis|ter|quater|[A-Z])?$/i;
// "12 rue", "12bis rue", "12-14 rue", "N° 12 rue": the number, a glued extension, and the rest.
const NUMBERED =
  /^(?:n°\s*)?(\d{1,4}(?:\s*[-–]\s*\d{1,4})?)(bis|ter|quater|quinquies|sexies|septies|[A-Za-z])?(?=[\s,.]|$)[\s,.]*(.*)$/i;
// "Résidence du Parc 12 rue Pasteur": a name, then a number and a street, with no comma between them.
const NAME_THEN_NUMBER = /^(.+?)\s+(\d{1,4}(?:\s*-\s*\d{1,4})?(?:bis|ter|quater|[A-Za-z])?)\s+(.+)$/i;
const EXTENSION_THEN_REST = /^(bis|ter|quater|quinquies|sexies|septies)\b[\s,.]*(.*)$/i;
const LETTER_THEN_REST = /^([A-Za-z])\b[\s,.]*(.*)$/;

// The type of voie a street's text begins with, and what follows it: "rue de la Paix" is Rue and "de la Paix", "bd
// Haussmann" Boulevard and "Haussmann", "rond-point des Champs-Élysées" Rond-point. The type needs a name after it.
function splitStreetType(text: string): { type: string; name: string } | null {
  const words = /^([\p{L}]+\.?)(?:[\s-]+([\p{L}]+\.?))?(?=[\s,]|$)\s*(.*)$/u.exec(text.trim());
  if (!words) return null;
  const [, first, second] = words;
  if (second) {
    const two = STREET_TYPE_FORMS.get(key(`${first} ${second}`));
    const start = text.trim().search(/\S/) + text.trim().indexOf(second, first.length) + second.length;
    const name = text
      .trim()
      .slice(start)
      .replace(/^[\s,]+/, "");
    if (two && name !== "") return { type: two, name };
  }
  const one = STREET_TYPE_FORMS.get(key(first));
  const name = text
    .trim()
    .slice(first.length)
    .replace(/^[\s,]+/, "");
  if (one && name !== "") return { type: one, name };

  return null;
}

const startsWithStreetType = (text: string): boolean => splitStreetType(text) !== null;

// A country at the end of the text: the part of the text before it, and its code.
function takeCountry(text: string): { rest: string; country: FrenchPostalCountry } | null {
  const folded = fold(text).replace(/[-.'’]+/g, " ");
  for (const name of COUNTRY_KEYS) {
    const at = folded.length - name.length;
    if (at < 0 || folded.slice(at) !== name || (at > 0 && !/[\s,]/.test(folded[at - 1]))) continue;
    // France is not the end of Fort-de-France, nor of a name that ends "de France".
    if (
      name === "FRANCE" &&
      (/-$/.test(text.slice(0, at)) || /(?:^|[\s,])(?:DE|D|LA|LE)\s*$/.test(folded.slice(0, at)))
    )
      continue;
    // FR on its own is a country only after a postcode or a comma: "Rue de la Paix FR" is not.
    if (name === "FR" && !/[,\d]\s*$/.test(folded.slice(0, at))) continue;
    // Saint-Martin and Saint-Barthélemy are communes of France too: a country only after a comma, beside a postcode.
    if (
      (name === "SAINT MARTIN" || name === "SAINT BARTHELEMY") &&
      !(/,\s*$/.test(folded.slice(0, at)) && /\d{5}/.test(folded))
    ) {
      continue;
    }

    return { rest: text.slice(0, at), country: name === "FR" ? "FR" : FR_COUNTRY_NAMES[name] };
  }

  return null;
}

// The arrondissement of a commune written with it: Paris 8e, 9e arrondissement Paris, IXe arrondissement Paris.
function readCommune(text: string): { city: string; arrondissement?: string } {
  const after = ARRONDISSEMENT_AFTER.exec(text);
  if (after) return { city: after[1], arrondissement: String(Number(after[2])) };
  const before = ARRONDISSEMENT_BEFORE.exec(text);
  if (before) {
    const number = /^\d/.test(before[1]) ? Number(before[1]) : FR_ROMAN_NUMERALS[before[1].toUpperCase()];
    if (number) return { city: before[2], arrondissement: String(number) };
  }

  return { city: text };
}

// A box found anywhere in a part, set on the result and cut out of the part.
function takeBox(part: string, result: ParsedAddress): string {
  const box = BOX.exec(part);
  if (!box || result.postalBoxType) return part;
  const type = key(box[1]).replace(/ /g, "");
  result.postalBoxType = type === "CS" ? "CS" : type === "TSA" ? "TSA" : "BP";
  result.postalBoxNum = box[2];

  return `${part.slice(0, box.index)} ${part.slice(box.index + box[0].length)}`.replace(/\s+/g, " ").trim();
}

// What a part holds above the street, one thing at a time: care of, a floor, a staircase, an entrance, an apartment
// or a door, a lieu-dit. Each found is set on the result and the part is taken off (or what is left of it is returned).
function takeDelivery(part: string, result: ParsedAddress): string {
  let rest = part;
  for (let guard = 0; guard < 4 && rest !== ""; guard += 1) {
    const careOf = CARE_OF.exec(rest);
    if (careOf && !result.careOf) {
      result.careOf = careOf[1];
      return "";
    }
    const floor = FLOOR.exec(rest);
    if (floor && !result.floorType) {
      if (floor[3]) result.floorType = /^sous/i.test(floor[3]) ? "Sous-sol" : "Rez-de-chaussée";
      else {
        result.floorType = "Étage";
        result.floor = floor[1] ?? floor[2];
      }
      return "";
    }
    const staircase = STAIRCASE.exec(rest);
    if (staircase && !result.staircase) {
      result.staircase = staircase[1].toUpperCase();
      return "";
    }
    const entrance = ENTRANCE.exec(rest);
    if (entrance && !result.entrance) {
      result.entrance = entrance[1].toUpperCase();
      return "";
    }
    const unit = UNIT.exec(rest);
    const unitType = unit ? UNIT_TYPE_FORMS.get(key(unit[1])) : undefined;
    if (unit && unitType && !result.secUnitType) {
      result.secUnitType = unitType;
      result.secUnitNum = unit[2].toUpperCase();
      rest = unit[3].trim();
      continue;
    }
    break;
  }

  return rest;
}

// A building's or residence's line: it opens with one of the words that name one.
const isBuilding = (text: string): boolean => {
  const first = /^([\p{L}]+)/u.exec(text.trim())?.[1];

  return first !== undefined && BUILDING_FORMS.has(key(first)) && !startsWithStreetType(text);
};

// The number, its extension and the street: "12 bis rue de la Paix", "3B av. Foch", "5 Le Bourg".
function readStreetLine(text: string, result: ParsedAddress): void {
  let street = text.trim();
  const numbered = NUMBERED.exec(street);
  if (numbered) {
    const [, number, glued, tail] = numbered;
    let rest = tail;
    let extension: string | undefined;
    if (glued && (EXTENSIONS.has(glued.toUpperCase()) || /^[A-Za-z]$/.test(glued))) extension = glued;
    if (!extension) {
      const written = EXTENSION_THEN_REST.exec(rest);
      const letter = LETTER_THEN_REST.exec(rest);
      if (written) {
        extension = written[1];
        rest = written[2];
      } else if (letter && startsWithStreetType(letter[2])) {
        extension = letter[1];
        rest = letter[2];
      }
    }
    result.number = number.replace(/\s+/g, "");
    if (extension) {
      result.numberExtension = EXTENSIONS.has(extension.toUpperCase())
        ? extension.toLowerCase()
        : extension.toUpperCase();
    }
    street = rest.trim();
  }
  const typed = splitStreetType(street);
  if (typed) {
    result.type = typed.type;
    result.street = typed.name;
  } else if (street !== "") {
    result.street = street;
  }
}

// The parts before the commune's line, in La Poste's order: what each is decides where it goes.
function readDelivery(parts: string[], result: ParsedAddress): void {
  // "12, rue de la Paix": a number on its own joins the part after it.
  for (let at = parts.length - 2; at >= 0; at -= 1) {
    if (NUMBER_ONLY.test(parts[at]) && !UNIT.test(parts[at])) parts.splice(at, 2, `${parts[at]} ${parts[at + 1]}`);
  }
  const rests = parts.map((part) => takeDelivery(takeBox(part, result), result)).filter((rest) => rest !== "");
  const isStreet = (text: string): boolean => NUMBERED.test(text) || startsWithStreetType(text);
  // A name run into the street with no comma ("Résidence du Parc 12 rue Pasteur"): the name goes up a line.
  for (let at = 0; at < rests.length; at += 1) {
    const joined = NAME_THEN_NUMBER.exec(rests[at]);
    if (joined && !isStreet(rests[at]) && startsWithStreetType(joined[3]) && !rests.slice(0, at).some(isStreet)) {
      rests.splice(at, 1, joined[1], `${joined[2]} ${joined[3]}`);
      break;
    }
  }
  const streetAt = rests.findIndex(isStreet);
  if (streetAt >= 0) {
    readStreetLine(rests[streetAt], result);
    // What comes before the street is the building's, unless it is named a lieu-dit.
    for (const text of rests.slice(0, streetAt)) {
      const named = LIEU_DIT.exec(text)?.[1];
      if (named) result.lieuDit = named;
      else result.building = result.building ? `${result.building}, ${text}` : text;
    }
    // What follows the street: a lieu-dit, written with or without its name's words.
    const after = rests.slice(streetAt + 1);
    if (after.length > 0) result.lieuDit = LIEU_DIT.exec(after.join(", "))?.[1] ?? after.join(", ");
    return;
  }
  // No street: the lines are a building's name, and a lieu-dit.
  const plain = rests.map((text) => LIEU_DIT.exec(text)?.[1] ?? text);
  const named = rests.findIndex((text) => LIEU_DIT.test(text));
  if (named >= 0) {
    result.lieuDit = plain[named];
    plain.splice(named, 1);
    plain.forEach((text) => (result.building = result.building ? `${result.building}, ${text}` : text));
  } else if (result.postalBoxType && plain.length > 0) {
    // A name above a box (a company's) is a line of the building's, not a lieu-dit.
    result.building = plain.join(", ");
  } else if (plain.length === 1) {
    if (isBuilding(plain[0])) result.building = plain[0];
    else result.lieuDit = plain[0];
  } else if (plain.length > 1) {
    result.lieuDit = plain[plain.length - 1];
    result.building = plain.slice(0, -1).join(", ");
  }
}

const FIELD_ORDER: readonly (keyof ParsedAddress)[] = [
  "careOf",
  "building",
  "secUnitType",
  "secUnitNum",
  "floorType",
  "floor",
  "staircase",
  "entrance",
  "number",
  "numberExtension",
  "type",
  "street",
  "lieuDit",
  "postalBoxType",
  "postalBoxNum",
  "city",
  "arrondissement",
  "cedex",
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
 * Parses an address in France (or Monaco, or an overseas department or collectivity, which are written the same way)
 * into the parts La Poste's norm names: who it is care of (`careOf`), an apartment or a door (`secUnitType`,
 * `secUnitNum`), a floor, a staircase, an entrance, the building or residence (`building`), the number with its
 * extension (`numberExtension`: `bis`, `ter`, a letter), the type of voie in full in `type` and its name in `street`
 * (`rue de la Paix` is `Rue` and `de la Paix`), a lieu-dit, a box (`BP 12`, `CS 30001`), the commune in `city` with
 * its arrondissement and CEDEX, and the postcode in `zip` with the department's code in `state`. The postcode may
 * stand anywhere after the street; `F-75008` is read as `75008`.
 *
 * @param text - The address as one string; commas and line breaks both separate its parts.
 * @param options - `useSnakeCase` gives snake_case keys; the other options are not used.
 * @returns The parts found, with `country` `FR` (or `MC` or a collectivity's code), or `null` when the text is empty
 * or holds nothing that makes it an address.
 * @example
 * ```ts
 * import { parseFrenchAddress } from "@johnmorrisdotca/address-plus/fr";
 *
 * console.log(parseFrenchAddress("Résidence Les Lilas, 12 bis rue de la Paix, 75002 Paris"));
 * // → {"building":"Résidence Les Lilas","number":"12","numberExtension":"bis","type":"Rue","street":"de la Paix","city":"Paris","state":"75","zip":"75002","zipValid":true,"country":"FR"}
 * ```
 */
function parseFrenchAddress(text: string, options: ParseOptions = {}): ParsedAddress | null {
  if (!text || typeof text !== "string") return null;
  let work = tidyAddressText(text);
  const result: ParsedAddress = {};
  let writtenCountry: FrenchPostalCountry | undefined;

  const written = takeCountry(work);
  if (written) {
    writtenCountry = written.country;
    work = tidyAddressText(written.rest);
  }

  // The postcode, the last five digits that are not a box's number, with the commune after it.
  const postcodes = [...work.matchAll(POSTCODE)].filter(
    (match) => !BOX_BEFORE_NUMBER.test(fold(work.slice(0, match.index)).replace(/\./g, "")),
  );
  const postcode = postcodes[postcodes.length - 1];
  let communeText = "";
  if (postcode && postcode.index !== undefined) {
    result.zip = postcode[1];
    communeText = work.slice(postcode.index + postcode[0].length).replace(/^[\s,]+/, "");
    work = tidyAddressText(work.slice(0, postcode.index));
  }
  const cedex = CEDEX.exec(` ${communeText}`) ?? (CEDEX_ALONE.exec(communeText) ? CEDEX.exec(` ${communeText}`) : null);
  if (cedex) {
    result.cedex = cedex[1] ? `CEDEX ${cedex[1]}` : "CEDEX";
    communeText = communeText.replace(/[\s,]*CEDEX(?:\s*\d{1,2})?\s*$/i, "").trim();
  }
  const parts = partsOf(work);
  if (communeText === "" && postcode && writtenCountry === "MC") communeText = "Monaco";
  if (communeText !== "") {
    // A commune and what follows a comma after it ("75008 Paris, Hôtel X") are not expected: the line is the commune.
    const commune = readCommune(partsOf(communeText).join(" ").trim());
    result.city = commune.city;
    if (commune.arrondissement) result.arrondissement = commune.arrondissement;
  } else if (
    !postcode &&
    parts.length >= 1 &&
    (ARRONDISSEMENT_AFTER.test(parts[parts.length - 1]) || ARRONDISSEMENT_BEFORE.test(parts[parts.length - 1]))
  ) {
    // "7e arrondissement Lyon" on its own: the commune and its arrondissement.
    const commune = readCommune(parts.pop() as string);
    result.city = commune.city;
    result.arrondissement = commune.arrondissement;
  } else if (!postcode && (parts.length >= 2 || (parts.length === 1 && writtenCountry))) {
    // With no postcode, the last part is the commune unless it is a street, a box or a building.
    const last = parts[parts.length - 1];
    if (!NUMBERED.test(last) && !startsWithStreetType(last) && !BOX.test(last) && !isBuilding(last)) {
      const commune = readCommune(last);
      result.city = commune.city;
      if (commune.arrondissement) result.arrondissement = commune.arrondissement;
      parts.pop();
    }
  }
  if (result.zip === undefined && parts.length > 0) {
    // A commune with a CEDEX and no postcode: "Paris Cedex 08" stays a commune.
    const last = parts[parts.length - 1];
    const bare = CEDEX.exec(` ${last}`);
    if (bare && !result.cedex) {
      result.cedex = bare[1] ? `CEDEX ${bare[1]}` : "CEDEX";
      parts[parts.length - 1] = last.replace(/[\s,]*CEDEX(?:\s*\d{1,2})?\s*$/i, "").trim();
      if (parts[parts.length - 1] === "") parts.pop();
    }
  }
  readDelivery(parts, result);

  // Words with nothing that makes them an address (no postcode, number, box, CEDEX or voie, and no country written)
  // are not one.
  const anchored =
    writtenCountry ||
    [
      result.zip,
      result.cedex,
      result.number,
      result.postalBoxType,
      result.type,
      result.secUnitType,
      result.arrondissement,
    ].some(Boolean);
  if (!anchored || Object.keys(result).length === 0) return null;
  let country: FrenchPostalCountry = writtenCountry ?? "FR";
  if (result.zip) {
    const parsed = parseFrenchPostcode(result.zip);
    // A postcode is valid when its number names a department, a collectivity, Monaco or Clipperton.
    result.zipValid =
      parsed !== null &&
      isValidFrenchPostcode(result.zip) &&
      (parsed.department !== undefined || parsed.country !== "FR" || parsed.place === "989");
    if (parsed?.department) result.state = parsed.department;
    if (parsed && result.zipValid) country = parsed.country;
  }
  result.country = country;

  return options.useSnakeCase ? snakeCased(ordered(result)) : ordered(result);
}

/**
 * Whether an address is surely French, with no hint: it ends with France, an overseas department, Monaco or one of the
 * collectivities, or holds CEDEX beside a postcode, or its last line begins with a postcode whose number names a
 * department, a collectivity or Monaco, followed by a commune (`75008 Paris`), while the address has a French type of
 * voie (`rue`, `avenue`, `chemin`) at the start of a street, a `BP`, a `TSA` or a `lieu-dit`. A US ZIP code follows its
 * state and a Canadian one ends in a digit, so neither is the shape of that last line; a German one has its postcode
 * first too, but its streets end in `straße` or `weg` and begin with no French type.
 *
 * @param text - The address as one string.
 * @returns `true` when the address is French beyond doubt, `false` otherwise.
 * @example
 * ```ts
 * import { looksFrench } from "@johnmorrisdotca/address-plus/fr";
 *
 * console.log([looksFrench("12 rue de la Paix, 75002 Paris"), looksFrench("123 Main St, Seattle, WA 98101")]);
 * // → [true,false]
 * ```
 */
function looksFrench(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const work = tidyAddressText(text);
  if (/\bCEDEX\b/i.test(work) && /\d{5}/.test(work)) return true;
  if (takeCountry(work)) return true;
  // An arrondissement of Paris, Lyon or Marseille is written nowhere else.
  if (/\barr(?:ondissement|\.)\s+(?:de\s+)?(?:Paris|Lyon|Marseille)\b/i.test(work)) return true;
  // The last line: a postcode and a commune after it, with nothing like a US state before the postcode.
  const line = /(?:^|[\s,])(?:F(?:R)?[-\s]?)?(\d{5})\s+\p{L}[^,]*$/iu.exec(work);
  const postcode = line ? parseFrenchPostcode(line[1]) : null;
  // Whose number names a department, a collectivity or Monaco: a postcode La Poste does not list is a typo in one.
  if (
    !line ||
    line.index === undefined ||
    !postcode ||
    !(postcode.known || postcode.country !== "FR" || postcode.department)
  ) {
    return false;
  }
  const before = work.slice(0, line.index + (/^[\s,]/.test(line[0]) ? 1 : 0));
  if (/\b(?!FR\b)[A-Z]{2}[\s,]+$/.test(before)) return false;
  // A box or a lieu-dit before it is French, as the words are (BP, boîte postale, lieu-dit).
  if (/(?:^|[\s,])(?:BP|B\.\s?P\.?|BO[IÎ]TE POSTALE|TSA|LIEU[-\s]?DIT)\s*\d*/i.test(before)) return true;
  // Or a street that begins with a French type of voie, after any number and its extension.
  const street = (part: string): string =>
    part.replace(
      /^(?:n°\s*)?\d{1,4}(?:\s*[-–]\s*\d{1,4})?(?:bis|ter|quater|[A-Za-z](?=\s|$))?[\s,]*(?:bis|ter|quater|[A-Za-z]\s+(?=\p{L}))?/iu,
      "",
    );

  // A German street is Allee der Kosmonauten 8: the French type written with no accent and the number after the name.
  const german = (part: string): boolean => /^Allee\s.*\s\d+\s?[A-Za-z]?$/.test(part.trim());

  return partsOf(before).some((part) => !german(part) && startsWithStreetType(street(part)));
}

export { looksFrench, parseFrenchAddress };
