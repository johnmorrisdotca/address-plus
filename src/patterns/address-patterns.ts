// Address-specific patterns for components, units, and facilities

/**
 * The secondary unit designators that take a value after them, as one alternation for a regular expression, longest
 * first so that `apartment` is tried before `apt`: USPS Publication 28 Appendix C2, Canada Post's English and French
 * unit words, and a few spellings people write.
 *
 * @example
 * ```ts
 * import { UNIT_TYPE_KEYWORDS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(new RegExp("^(?:" + UNIT_TYPE_KEYWORDS + ")$", "i").test("suite"));
 * // → true
 * ```
 */
const UNIT_TYPE_KEYWORDS =
  "appartement|workstation|department|apartment|building|penthouse|hangar|hanger|trailer|office|" +
  "bureau|suite|floor|lobby|level|space|stall|unité|unite|booth|apt|ste|bldg|dept|hngr|trlr|unit|" +
  "pier|slip|stop|gate|room|desk|bay|lot|spc|flr|fl|lt|rm|lv|off|ofc|pmb|app|key";

// Designators that stand alone, with no number (Pub 28: BSMT, FRNT, LBBY, LOWR, OFC, PH, REAR, SIDE, UPPR).
const STANDALONE_UNIT_KEYWORDS =
  "basement|penthouse|lobby|front|lower|upper|office|rear|side|bsmt|frnt|lbby|lowr|uppr|ofc|ph";

// What may follow a designator: "Apt 4B", "Apt. 7", "Apt #4B", "Apt No. 456", "Ste D304". A value holds a
// digit or is a single letter, so "Office Rd" in "Old Post Office Rd" is not a unit.
const UNIT_VALUE = String.raw`(?:[a-z]?\d[a-z0-9-]*|[a-z])(?![\p{L}\p{N}])`;
const UNIT_SEPARATOR = String.raw`\.?(?:\s*#\s*|\s+(?:no\.?|n°)\s*|\s+)`;

// A floor written number first: "6th Floor", "Sixth Floor", "6th Fl". Group 1 is the ordinal.
const ORDINAL_FLOOR = String.raw`(\d+(?:st|nd|rd|th)|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\s+(?:floor|flr|fl)\.?`;
const ORDINAL_FLOOR_PATTERN = new RegExp(`^${ORDINAL_FLOOR}$`, "i");

// Written numbers that can appear as street numbers
// Includes comprehensive ordinal support, plurals, and compound numbers
// Supports both English and French
const WRITTEN_NUMBERS_EN =
  "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|" +
  "thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|" +
  "twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|" +
  "hundred(?:s)?|thousand(?:s)?|" +
  "first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|" +
  "eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|" +
  "seventeenth|eighteenth|nineteenth|" +
  "(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)" +
  "(?:[-\\s]?(?:one|two|three|four|five|six|seven|eight|nine))?";

const WRITTEN_NUMBERS_FR =
  "deux|trois|quatre|cinq|sept|huit|neuf|onze|douze|" +
  "treize|quatorze|quinze|seize|dix-sept|dix-huit|dix-neuf|" +
  "vingt|trente|quarante|cinquante|soixante|soixante-dix|quatre-vingt|quatre-vingt-dix|" +
  "mille|" +
  "deuxième|troisième|quatrième|cinquième|septième|huitième|neuvième|" +
  "onzième|douzième|treizième|quatorzième|quinzième|seizième|" +
  "dix-septième|dix-huitième|dix-neuvième";

/**
 * House numbers written as words (`One`, `Twenty`), as one alternation for a regular expression, so `One Microsoft
 * Way` is read as number 1.
 *
 * @example
 * ```ts
 * import { WRITTEN_NUMBERS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(new RegExp("^(?:" + WRITTEN_NUMBERS + ")$", "i").test("one"));
 * // → true
 * ```
 */
const WRITTEN_NUMBERS = WRITTEN_NUMBERS_EN + "|" + WRITTEN_NUMBERS_FR;

/**
 * A unit at the end of a street line: group 1 is the street before it, group 2 the unit.
 *
 * @example
 * ```ts
 * import { SECONDARY_UNIT_PATTERN } from "@johnmorrisdotca/address-plus";
 *
 * console.log(SECONDARY_UNIT_PATTERN.exec("123 Main St Apt 4")?.[2]);
 * // → "Apt 4"
 * ```
 */
const SECONDARY_UNIT_PATTERN = new RegExp(
  `^(.*?)\\s+((?:${UNIT_TYPE_KEYWORDS})${UNIT_SEPARATOR}${UNIT_VALUE}|(?:lt|lot)[a-z0-9]+|#\\s*[a-z0-9-]+|${ORDINAL_FLOOR.replace("(", "(?:")})\\s*$`,
  "iu",
);

// A comma part, or a line, that is only a unit: "Unit 4", "app. 4", "#12", "Bsmt".
const UNIT_PART_PATTERN = new RegExp(
  `^(?:(?:${UNIT_TYPE_KEYWORDS})${UNIT_SEPARATOR}${UNIT_VALUE}|#\\s*[a-z0-9-]+|(?:${STANDALONE_UNIT_KEYWORDS})\\.?|${ORDINAL_FLOOR.replace("(", "(?:")})$`,
  "iu",
);

/**
 * Whether a text has a common street type in it, used to judge that a parse found a street.
 *
 * @example
 * ```ts
 * import { STREET_TYPE_DETECTION_PATTERN } from "@johnmorrisdotca/address-plus";
 *
 * console.log(STREET_TYPE_DETECTION_PATTERN.test("123 Main Street"));
 * // → true
 * ```
 */
const STREET_TYPE_DETECTION_PATTERN =
  /\b(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|lane|ln|court|ct|place|pl|way|highway|hwy|parkway|pkwy|circle|cir|terrace|ter|trail|trl)\b/i;

/**
 * A unit's designator and value: groups 1 and 2 (`apt 123`, `Apt. #4B`), groups 3 and 4 for a lot run together
 * (`lt42`), group 5 for the value after a bare `#`.
 *
 * @example
 * ```ts
 * import { UNIT_TYPE_NUMBER_PATTERN } from "@johnmorrisdotca/address-plus";
 *
 * console.log(UNIT_TYPE_NUMBER_PATTERN.exec("Apt. #4B")?.slice(1, 3));
 * // → ["Apt","4B"]
 * ```
 */
const UNIT_TYPE_NUMBER_PATTERN = new RegExp(
  `(?<![\\p{L}\\p{N}])(${UNIT_TYPE_KEYWORDS})${UNIT_SEPARATOR}(${UNIT_VALUE})|(?<![\\p{L}\\p{N}])(lt|lot)([a-z0-9]+)|#\\s*([a-z0-9-]+)`,
  "iu",
);

/**
 * Words in parentheses inside an address; group 1 is what is inside them.
 *
 * @example
 * ```ts
 * import { PARENTHETICAL_PATTERN } from "@johnmorrisdotca/address-plus";
 *
 * console.log(PARENTHETICAL_PATTERN.exec("123 Main St (Rear)")?.[1]);
 * // → "Rear"
 * ```
 */
const PARENTHETICAL_PATTERN = /\(([^)]+)\)/g;

/**
 * Words that mark a place's name as a facility (`center`, `tower`, `hospital`, `université`), in lower case.
 *
 * @example
 * ```ts
 * import { FACILITY_INDICATORS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(FACILITY_INDICATORS.includes("hospital"));
 * // → true
 * ```
 */
const FACILITY_INDICATORS = [
  "center",
  "centre",
  "building",
  "tower",
  "plaza",
  "square",
  "garden",
  "gardens",
  "park",
  "university",
  "college",
  "school",
  "hospital",
  "library",
  "museum",
  "station",
  "airport",
  "mall",
  "market",
  "stadium",
  "arena",
  "theater",
  "theatre",
  "hotel",
  "resort",
  "memorial",
  "monument",
  "bridge",
  "tunnel",
  "complex",
] as const;

// Common facility name patterns for extraction
const FACILITY_PATTERNS_EN = [
  /\b(hospital|medical center|clinic|mall|shopping center|plaza|tower|building|center|centre)\b/i,
  /\b(school|university|college|library|church|temple|mosque|synagogue)\b/i,
  /\b(airport|station|terminal|depot|port|harbor|harbour)\b/i,
  /\b(park|recreation|rec center|community center|civic center)\b/i,
];

const FACILITY_PATTERNS_FR = [
  /\b(hôpital|centre médical|clinique|centre commercial|place|tour|bâtiment|centre)\b/i,
  /\b(école|université|collège|bibliothèque|église|temple|mosquée|synagogue)\b/i,
  /\b(aéroport|gare|terminal|dépôt|port)\b/i,
  /\b(parc|récréation|centre récréatif|centre communautaire|centre civique)\b/i,
];

/**
 * The patterns that find a facility's name, in English and French.
 *
 * @example
 * ```ts
 * import { FACILITY_PATTERNS } from "@johnmorrisdotca/address-plus";
 *
 * console.log(FACILITY_PATTERNS.some((pattern) => pattern.test("Empire State Building")));
 * // → true
 * ```
 */
const FACILITY_PATTERNS: RegExp[] = [...FACILITY_PATTERNS_EN, ...FACILITY_PATTERNS_FR];

/**
 * A facility's name followed by a comma or a dash and then the address.
 *
 * @example
 * ```ts
 * import { FACILITY_DELIMITER_PATTERN } from "@johnmorrisdotca/address-plus";
 *
 * console.log(FACILITY_DELIMITER_PATTERN.test("City Hall - 100 Queen St W"));
 * // → true
 * ```
 */
const FACILITY_DELIMITER_PATTERN = /(?:[:;|\u2013\u2014-]|\s{2,})/;

/**
 * Nashville's Music Square East, whose name ends in a directional word that is part of it.
 *
 * @example
 * ```ts
 * import { MUSIC_SQUARE_EAST_PATTERN } from "@johnmorrisdotca/address-plus";
 *
 * console.log(MUSIC_SQUARE_EAST_PATTERN.test("1 Music Square East"));
 * // → true
 * ```
 */
const MUSIC_SQUARE_EAST_PATTERN = /^(.*square)\s+(east)\s*$/i;

export {
  FACILITY_DELIMITER_PATTERN,
  FACILITY_INDICATORS,
  FACILITY_PATTERNS,
  MUSIC_SQUARE_EAST_PATTERN,
  ORDINAL_FLOOR_PATTERN,
  PARENTHETICAL_PATTERN,
  SECONDARY_UNIT_PATTERN,
  STANDALONE_UNIT_KEYWORDS,
  STREET_TYPE_DETECTION_PATTERN,
  UNIT_PART_PATTERN,
  UNIT_SEPARATOR,
  UNIT_TYPE_KEYWORDS,
  UNIT_TYPE_NUMBER_PATTERN,
  UNIT_VALUE,
  WRITTEN_NUMBERS,
};
