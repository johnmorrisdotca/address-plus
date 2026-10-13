// The words of an address in Germany, written here in our own words from Deutsche Post's addressing guidance and common
// usage: what a street's name ends with (a type of street is part of the name in German: Hauptstraße), the words that
// open a street's name, the words for a flat, a floor and a part of a building, and the names Germany goes by at the end
// of an address.

/**
 * What a street's name may end with, which makes the word the name ends in a thoroughfare (`Hauptstraße`, `Berliner Str.`,
 * `Kastanienallee`), in lower case with their spellings: `strasse` for `straße`, `str` for the abbreviation. The parser
 * reads the street's whole name as written into `street`; these tell where it ends.
 *
 * @example
 * ```ts
 * import { DE_STREET_SUFFIXES } from "@johnmorrisdotca/address-plus/de";
 *
 * console.log(DE_STREET_SUFFIXES.slice(0, 4));
 * // → ["straße","strasse","str","weg"]
 * ```
 */
const DE_STREET_SUFFIXES: readonly string[] = [
  "straße",
  "strasse",
  "str",
  "weg",
  "platz",
  "allee",
  "gasse",
  "ring",
  "damm",
  "ufer",
  "chaussee",
  "steig",
  "stieg",
  "pfad",
  "markt",
  "hof",
  "park",
  "brücke",
  "bruecke",
  "zeile",
  "promenade",
  "wall",
  "graben",
  "kamp",
  "anger",
  "tor",
  "berg",
  "tal",
];

/**
 * The words that begin a street's name with no suffix to end it (`Am Markt`, `An der Weide`, `Zum alten Hof`, `Im Winkel`),
 * and the adjectives that begin one (`Große Bleiche`, `Alte Dorfstraße`), in lower case.
 *
 * @example
 * ```ts
 * import { DE_STREET_OPENERS } from "@johnmorrisdotca/address-plus/de";
 *
 * console.log(DE_STREET_OPENERS.slice(0, 5));
 * // → ["am","an","auf","im","in"]
 * ```
 */
const DE_STREET_OPENERS: readonly string[] = [
  "am",
  "an",
  "auf",
  "im",
  "in",
  "zum",
  "zur",
  "zu",
  "unter",
  "vor",
  "hinter",
  "bei",
  "beim",
  "über",
  "neben",
  "oberer",
  "obere",
  "unterer",
  "untere",
  "alte",
  "alter",
  "neue",
  "neuer",
  "große",
  "grosse",
  "kleine",
  "lange",
  "hohe",
  "breite",
  "schmale",
];

/**
 * The words for a flat or a room, which the parser reports as `secUnitType` in full, with the abbreviations it reads
 * for each: `Whg. 12` is `Wohnung 12`.
 *
 * @example
 * ```ts
 * import { DE_UNIT_TYPES } from "@johnmorrisdotca/address-plus/de";
 *
 * console.log(DE_UNIT_TYPES.Wohnung);
 * // → ["whg","wohn","wo"]
 * ```
 */
const DE_UNIT_TYPES: Readonly<Record<string, readonly string[]>> = {
  Wohnung: ["whg", "wohn", "wo"],
  Appartement: ["app", "apt", "appt"],
  Zimmer: ["zi"],
  Büro: ["bü", "buero"],
  Raum: ["rm"],
};

/**
 * The words for a part of a building, which open the line the parser keeps whole as `building` (`Hinterhaus`, `Haus B`,
 * `Gebäude 4`, `Block C`), in lower case.
 *
 * @example
 * ```ts
 * import { DE_BUILDING_WORDS } from "@johnmorrisdotca/address-plus/de";
 *
 * console.log(DE_BUILDING_WORDS.slice(0, 3));
 * // → ["hinterhaus","vorderhaus","seitenflügel"]
 * ```
 */
const DE_BUILDING_WORDS: readonly string[] = [
  "hinterhaus",
  "vorderhaus",
  "seitenflügel",
  "seitenfluegel",
  "gartenhaus",
  "quergebäude",
  "haus",
  "gebäude",
  "gebaeude",
  "block",
  "aufgang",
  "eingang",
  "turm",
  "trakt",
  "flügel",
  "halle",
];

/**
 * What a country at the end of an address may be called, in capitals with no umlauts: `DEUTSCHLAND`, `GERMANY`,
 * `ALLEMAGNE`, `BRD`.
 *
 * @example
 * ```ts
 * import { DE_COUNTRY_NAMES } from "@johnmorrisdotca/address-plus/de";
 *
 * console.log(DE_COUNTRY_NAMES.includes("DEUTSCHLAND"));
 * // → true
 * ```
 */
const DE_COUNTRY_NAMES: readonly string[] = [
  "BUNDESREPUBLIK DEUTSCHLAND",
  "FEDERAL REPUBLIC OF GERMANY",
  "DEUTSCHLAND",
  "GERMANY",
  "ALLEMAGNE",
  "ALEMANIA",
  "GERMANIA",
  "BRD",
];

export { DE_BUILDING_WORDS, DE_COUNTRY_NAMES, DE_STREET_OPENERS, DE_STREET_SUFFIXES, DE_UNIT_TYPES };
