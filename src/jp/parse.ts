// Parsing a Japanese address, written in Japanese or in romaji, into one set of fields.
//
// Japanese order runs from the largest part to the smallest: postal code, prefecture, municipality,
// town, then the block as 丁目 (chome), 番 (ban) and 号 (go), then a building, floor and room.
// English order runs the other way, comma-separated, with the block written 1-2-3 before the town.
// Both end up in the same ParsedAddress: the Japan-specific fields, plus the shared ones so that
// formatting, comparison and validation treat the result like any other address.
//
// How a pair of numbers is read. 1-2-3 is always chome, ban and go. Two numbers are ambiguous: 丸の内1-2 could be
// 1丁目2番, and 寿町2-31 is 2番31号. A pair written straight after the town is read as ban and go, because that is
// what it almost always is: of the 907 addresses in Geolonia's test set that end in a bare pair after the town,
// 899 are ban and go, since a person in a town of chome writes all three numbers. A chome written as such (1丁目2-3)
// is kept, and the pair after it is ban and go. Three numbers in a town named with 大字 or 字, or whose first
// number is 100 or more (too high for a chome), are ban, go and a room. The block is "2-31" either way, so a caller
// that needs certainty should read block rather than the parts.

import {
  findMunicipalitiesByRomaji,
  findPrefecture,
  getPrefectureFromJapanesePostalCode,
  municipalitiesAtStart,
  prefectureAtStart,
  prefectureShortAtStart,
  prefectureShortName,
  prefectureShortRomaji,
} from "../constants/jp";
import type { JapaneseMunicipality, JapanesePrefecture } from "../types/japan";
import type { ParseOptions } from "../types/parse-options";
import type { ParsedAddress } from "../types/parsed-address";
import { toSnakeCase } from "../utils/case-converter";
import { hasJapaneseScript, normalizeJapaneseAddressText } from "./normalize";
import {
  BLOCK_BAN_GO,
  BLOCK_BARE_NUMBER,
  BLOCK_CHOME,
  BLOCK_HYPHENATED,
  BLOCK_START,
  BUILDING_LEAD,
  CAMEL_CASE_CAPITAL,
  COMBINING_MARKS,
  COMMA_SPLIT,
  DIGIT,
  DIGITS_ONLY,
  ENGLISH_MUNICIPALITY_WORD,
  FLOOR,
  HYPHENATED_POSTAL_CODE,
  KYOTO_DIRECTION,
  KYOTO_TOWN_FIRST,
  LATIN_LETTER,
  LEADING_COUNTRY,
  LEADING_POSTAL_CODE,
  LINE_BREAK,
  MARKED_POSTAL_CODE,
  PART_TRIM,
  POSTAL_CODE_SHAPE,
  POSTAL_MARK,
  ROMAJI_BLOCK,
  ROMAJI_BUILDING_WORD,
  ROMAJI_CHOME,
  ROMAJI_DESIGNATOR_WORD,
  ROMAJI_FLOOR,
  ROMAJI_MUNICIPALITY_DESIGNATOR,
  ROMAJI_PART_END,
  ROMAJI_ROOM,
  ROOM,
  RURAL_TOWN,
  SEPARATORS_AT_END,
  SEPARATORS_AT_START,
  SPACE_INSIDE_JAPANESE,
  TRAILING_COUNTRY,
  TRAILING_POSTAL_CODE,
  WHITESPACE_RUN,
  WORD_SPLIT,
  WRITTEN_MUNICIPALITY,
} from "./patterns";

// No town runs to a hundred chome, so three numbers whose first is that high are ban, go and a room.
const LOWEST_NUMBER_NOT_A_CHOME = 100;

// Kyoto's prefecture, the one place whose addresses carry street directions (通り名).
const KYOTO_PREFECTURE_CODE = "26";

interface Block {
  ban?: string;
  streetDirections?: string;
  chome?: string;
  go?: string;
  room?: string;
  town?: string;
}

interface BuildingParts {
  building?: string;
  floor?: string;
  room?: string;
}

interface Fields extends Block, BuildingParts {
  municipality?: JapaneseMunicipality;
  municipalityName?: string; // A municipality written but not identified: not in the table, or ambiguous
  postalCode?: string;
  prefecture?: JapanesePrefecture;
}

// The municipalities matched at the start of a text, as municipalitiesAtStart returns them.
type MunicipalityMatch = NonNullable<ReturnType<typeof municipalitiesAtStart>>;

// Text with its leading and trailing commas and spaces taken off.
const trimSeparators = (text: string): string => text.replace(SEPARATORS_AT_START, "").replace(SEPARATORS_AT_END, "");

// Japan named at either end comes off: 日本 東京都…, …六本木6-10-1, Japan.
const withoutCountry = (text: string): string =>
  trimSeparators(text.replace(TRAILING_COUNTRY, "").replace(LEADING_COUNTRY, ""));

// The postal code in the text, written NNN-NNNN, and the text without it. 〒 marks it wherever it is;
// otherwise it is taken at the start or the end, or anywhere it is written with its hyphen.
function takePostalCode(text: string): { postalCode?: string; rest: string } {
  for (const pattern of [MARKED_POSTAL_CODE, LEADING_POSTAL_CODE, TRAILING_POSTAL_CODE, HYPHENATED_POSTAL_CODE]) {
    const found = text.match(pattern);
    if (found) {
      const rest = `${text.slice(0, found.index)} ${text.slice(found.index! + found[0].length)}`;

      return { postalCode: `${found[1]}-${found[2]}`, rest: trimSeparators(rest.replace(POSTAL_MARK, " ")) };
    }
  }

  return { rest: trimSeparators(text.replace(POSTAL_MARK, " ")) };
}

// Of the municipalities a name could mean, the one the prefecture or postal code points to, or none
// when the choice cannot be made. A ward named with only its prefecture (Kita-ku, Osaka) is the ward
// of the city that shares the prefecture's name, 大阪市北区 rather than 堺市北区, as such an address is
// always meant.
function chooseMunicipality(
  candidates: readonly JapaneseMunicipality[],
  prefecture: JapanesePrefecture | undefined,
  postalCode: string | undefined,
): JapaneseMunicipality | undefined {
  if (candidates.length === 1) return candidates[0];
  const prefectureCode = prefecture?.code ?? (postalCode ? getPrefectureFromJapanesePostalCode(postalCode) : null);
  const narrowed = prefectureCode ? candidates.filter((candidate) => candidate.prefecture === prefectureCode) : [];
  if (narrowed.length === 1) return narrowed[0];
  const namesake = findPrefecture(prefectureCode ?? "");
  const cityPrefix = namesake ? `${prefectureShortRomaji(namesake)}-shi ` : "";
  const inNamesakeCity = cityPrefix ? narrowed.filter((candidate) => candidate.romaji.startsWith(cityPrefix)) : [];

  return inNamesakeCity.length === 1 ? inNamesakeCity[0] : undefined;
}

// Where the block starts: the first number followed by a block marker, a dash and another number, or
// the end of the address. A number followed by anything else belongs to the town (北3条西, 第2地割).
function blockStart(text: string): number {
  for (let index = 0; index < text.length; index++) {
    if (!DIGIT.test(text[index]) || (index > 0 && DIGIT.test(text[index - 1]))) continue;
    if (BLOCK_START.test(text.slice(index))) return index;
  }

  return -1;
}

// The numbers of a block written 1-2-3, 1-2 or 1-2-3-405, as chome, ban, go and room (see the note at the top
// of this file for how a pair and three numbers are read).
function hyphenatedBlock(numbers: string[], town: string | undefined, chome: string | undefined): Block {
  const [first, second, third, fourth] = numbers;
  if (chome !== undefined) return { ban: first, chome, go: second, room: third };
  if (third === undefined) return { ban: first, go: second };
  if ((town && RURAL_TOWN.test(town)) || Number(first) >= LOWEST_NUMBER_NOT_A_CHOME) {
    return { ban: first, go: second, room: third };
  }

  return { ban: second, chome: first, go: third, room: fourth };
}

// The town and block at the start of the text, and whatever follows them.
function splitTownAndBlock(text: string): { block: Block; rest: string } {
  const start = blockStart(text);
  if (start < 0) {
    // No block: the town runs to the first space, and a building may follow it.
    const space = text.indexOf(" ");
    const town = (space < 0 ? text : text.slice(0, space)).trim();

    return { block: { town: town || undefined }, rest: space < 0 ? "" : text.slice(space) };
  }
  const town = text.slice(0, start).replace(SPACE_INSIDE_JAPANESE, "").trim() || undefined;
  let rest = text.slice(start);
  let chome: string | undefined;
  const chomeHit = rest.match(BLOCK_CHOME);
  if (chomeHit) {
    chome = chomeHit[1];
    rest = rest.slice(chomeHit[0].length);
  }

  const banGo = rest.match(BLOCK_BAN_GO);
  if (banGo) {
    return {
      block: { ban: banGo[1], chome, go: banGo[2], room: banGo[3], town },
      rest: rest.slice(banGo[0].length),
    };
  }
  const hyphenated = rest.match(BLOCK_HYPHENATED);
  if (hyphenated) {
    const numbers = hyphenated.slice(1).filter((number): number is string => number !== undefined);

    return { block: { ...hyphenatedBlock(numbers, town, chome), town }, rest: rest.slice(hyphenated[0].length) };
  }
  const bare = rest.match(BLOCK_BARE_NUMBER);
  if (bare) return { block: { ban: bare[1], chome, town }, rest: rest.slice(bare[0].length) };

  return { block: { chome, town }, rest };
}

// The building, floor and room in what follows the block. 号 after a building is a room (サンプルビル501号),
// as 号室 is; after the block it was the go, and the block has already taken it.
function splitBuilding(text: string): BuildingParts {
  let rest = trimSeparators(text.replace(BUILDING_LEAD, ""));
  if (!rest) return {};
  let floor: string | undefined;
  const floorHit = rest.match(FLOOR);
  if (floorHit) {
    const [, underground, undergroundFloor, basementFloor, aboveFloor] = floorHit;
    floor = underground ? `B${undergroundFloor}` : basementFloor ? `B${basementFloor}` : aboveFloor;
    rest = `${rest.slice(0, floorHit.index)} ${rest.slice(floorHit.index! + floorHit[0].length)}`.trim();
  }
  let room: string | undefined;
  const roomHit = rest.match(ROOM);
  if (roomHit) {
    room = roomHit[1] ?? roomHit[2] ?? roomHit[3];
    rest = `${rest.slice(0, roomHit.index)} ${rest.slice(roomHit.index! + roomHit[0].length)}`;
  }
  const building = trimSeparators(rest.replace(WHITESPACE_RUN, " ")) || undefined;

  return { building, floor, room };
}

// A Kyoto town written with its street directions, split into the town and the directions: 寺町通御池上る上本能寺前町
// is the town 上本能寺前町, found north (上る) of the corner of 寺町通 and 御池. Words in brackets after the
// directions, often the town again, are set aside for the building.
function kyotoTown(town: string): { aside?: string; streetDirections?: string; town?: string } {
  const directions = [...town.matchAll(KYOTO_DIRECTION)];
  const last = directions[directions.length - 1];
  if (!last) return { town };
  const end = last.index! + last[0].length;
  const locator = town.slice(0, end);
  const after = town.slice(end).trim();
  if (after && !after.startsWith("(")) return { streetDirections: locator, town: after };
  const first = locator.match(KYOTO_TOWN_FIRST);
  if (!first) return { aside: after || undefined, town };

  return { aside: after || undefined, streetDirections: locator.slice(first[1].length), town: first[1] };
}

const blockOf = (chome?: string, ban?: string, go?: string): string | undefined =>
  [chome, ban, go].filter((part) => part !== undefined).join("-") || undefined;

// Shared fields laid over the Japanese ones, so the rest of the library reads the result as an address.
function assemble(fields: Fields): ParsedAddress {
  const address: ParsedAddress = { country: "JP" };
  if (fields.postalCode) {
    address.postalCode = fields.postalCode;
    address.zip = fields.postalCode;
    address.zipValid = POSTAL_CODE_SHAPE.test(fields.postalCode);
    address.postalType = "postal";
  }
  if (fields.prefecture) {
    address.prefecture = fields.prefecture.name;
    address.prefectureCode = fields.prefecture.code;
    address.prefectureRomaji = prefectureShortRomaji(fields.prefecture);
    address.state = fields.prefecture.code;
  }
  const municipalityName = fields.municipality?.name ?? fields.municipalityName;
  if (municipalityName) {
    address.municipality = municipalityName;
    address.city = municipalityName;
  }
  if (fields.municipality) {
    address.municipalityCode = fields.municipality.code;
    address.municipalityRomaji = fields.municipality.romaji;
  }
  if (fields.streetDirections) address.streetDirections = fields.streetDirections;
  if (fields.town) {
    address.town = fields.town;
    address.street = fields.town;
  }
  if (fields.chome) address.chome = fields.chome;
  if (fields.ban) address.ban = fields.ban;
  if (fields.go) address.go = fields.go;
  const block = blockOf(fields.chome, fields.ban, fields.go);
  if (block) {
    address.block = block;
    address.number = block;
  }
  if (fields.building) {
    address.building = fields.building;
    address.place = fields.building;
  }
  if (fields.floor) address.floor = fields.floor;
  if (fields.room) address.room = fields.room;

  return address;
}

// The municipalities at the start of the text, read as if the spaces were not there, so that 京都市 下京区 and
// 上北郡 横浜町 are found whole. The match is the longer of the text as written and the text without spaces.
function municipalitiesAtStartAcrossSpaces(text: string, prefectureCode?: string): MunicipalityMatch | null {
  const asWritten = municipalitiesAtStart(text, prefectureCode);
  const positions: number[] = [];
  let compact = "";
  for (let index = 0; index < text.length; index++) {
    if (/\s/.test(text[index])) continue;
    positions.push(index);
    compact += text[index];
  }
  if (compact === text) return asWritten;
  const joined = municipalitiesAtStart(compact, prefectureCode);
  if (!joined || (asWritten && asWritten.matched.length >= joined.matched.length)) return asWritten;
  const end = positions[joined.matched.length - 1] + 1;

  return { ...joined, rest: text.slice(end) };
}

// A ward written with its prefecture but not its city, 大阪府北区, as the ward of the city named like the
// prefecture (大阪市北区), or null when that city has no such ward.
function namesakeWard(text: string, prefecture: JapanesePrefecture): MunicipalityMatch | null {
  const namesakeCity = `${prefectureShortName(prefecture)}市`;
  const ward = municipalitiesAtStartAcrossSpaces(`${namesakeCity}${text}`, prefecture.code);
  if (!ward || ward.matched.length <= namesakeCity.length) return null;

  return { ...ward, matched: ward.matched.slice(namesakeCity.length) };
}

// The prefecture and municipality at the start of a Japanese-script address, and the text after them.
// The prefecture is read first by its full name; then the municipality, in that prefecture or, when it
// is not there, anywhere (validation then reports the mismatch). With no prefecture written in full, a
// prefecture written without its designator is tried too (東京千代田区, 千葉市川市), and whichever reading takes
// in more of the text wins, so 千葉市川市 is 千葉 and 市川市 while 大阪市北区 stays 大阪市北区. A ward written with
// its prefecture but not its city (大阪府北区) is the ward of the city named like the prefecture.
function prefectureAndMunicipality(
  text: string,
  postalCode: string | undefined,
): Pick<Fields, "municipality" | "municipalityName" | "prefecture"> & { rest: string } {
  let rest = text;
  let prefecture: JapanesePrefecture | undefined;
  const full = prefectureAtStart(rest);
  if (full) {
    prefecture = full.prefecture;
    rest = trimSeparators(full.rest);
  }
  let found =
    (prefecture && (municipalitiesAtStartAcrossSpaces(rest, prefecture.code) ?? namesakeWard(rest, prefecture))) ||
    municipalitiesAtStartAcrossSpaces(rest);
  if (!prefecture) {
    const short = prefectureShortAtStart(rest);
    const afterShort = short ? trimSeparators(short.rest) : "";
    const inShort = short && municipalitiesAtStartAcrossSpaces(afterShort, short.prefecture.code);
    const consumedPlain = found ? rest.length - found.rest.length : 0;
    const consumedShort = inShort ? rest.length - inShort.rest.length : 0;
    if (short && inShort && consumedShort > consumedPlain) {
      prefecture = short.prefecture;
      found = inShort;
    } else if (short && !found && !afterShort) {
      return { prefecture: short.prefecture, rest: "" };
    }
  }
  if (found) {
    rest = trimSeparators(found.rest);
    const municipality = chooseMunicipality(found.municipalities, prefecture, postalCode);
    if (!municipality) return { municipalityName: found.matched, prefecture, rest };
    if (!prefecture) prefecture = findPrefecture(municipality.prefecture) ?? undefined;

    return { municipality, prefecture, rest };
  }

  // Not in the table, but written as a municipality: keep the name and let validation say so.
  const written = rest.match(WRITTEN_MUNICIPALITY);
  if (written) return { municipalityName: written[1], prefecture, rest: trimSeparators(rest.slice(written[1].length)) };

  return { prefecture, rest };
}

// A Japanese-script address: 〒100-0005 東京都千代田区丸の内1丁目2番3号 サンプルビル5階.
function parseJapaneseScript(text: string): ParsedAddress | null {
  const { postalCode, rest: afterPostal } = takePostalCode(withoutCountry(normalizeJapaneseAddressText(text)));
  const place = prefectureAndMunicipality(withoutCountry(afterPostal), postalCode);
  if (!place.prefecture && !place.municipality && !place.municipalityName && !postalCode) return null;
  if (!place.prefecture && !place.municipality && !place.municipalityName && postalCode) {
    place.prefecture = findPrefecture(getPrefectureFromJapanesePostalCode(postalCode) ?? "") ?? undefined;
  }
  const { block, rest } = splitTownAndBlock(place.rest);
  const kyoto = place.prefecture?.code === KYOTO_PREFECTURE_CODE && block.town ? kyotoTown(block.town) : {};
  const building = splitBuilding([kyoto.aside, rest].filter(Boolean).join(" "));

  return assemble({
    ...place,
    ...block,
    ...building,
    postalCode,
    room: building.room ?? block.room,
    streetDirections: kyoto.streetDirections,
    town: kyoto.town ?? block.town,
  });
}

// The prefecture named in the comma-separated parts of a romaji address, looked for from the end: a
// whole part (Tokyo, Osaka Prefecture, Hokkaido-do) or the last words of one (Chiyoda-ku Tokyo).
function takeRomajiPrefecture(parts: string[]): JapanesePrefecture | undefined {
  for (let index = parts.length - 1; index >= 0; index--) {
    const whole = findPrefecture(parts[index]);
    if (whole) {
      parts.splice(index, 1);

      return whole;
    }
    const words = parts[index].split(" ");
    for (const count of [2, 1]) {
      if (words.length <= count) continue;
      const tail = findPrefecture(words.slice(-count).join(" "));
      if (tail) {
        parts[index] = words.slice(0, -count).join(" ");

        return tail;
      }
    }
  }

  return undefined;
}

// The municipality named in the parts, looked for from the end: a ward and its city in two parts
// (Omiya-ku, Saitama-shi) before either alone, so that the city alone does not win over its ward.
function takeRomajiMunicipality(
  parts: string[],
  prefecture: JapanesePrefecture | undefined,
  postalCode: string | undefined,
): Pick<Fields, "municipality" | "municipalityName"> & { at?: number } {
  for (let index = parts.length - 1; index >= 0; index--) {
    if (index > 0) {
      const joined = findMunicipalitiesByRomaji(`${parts[index - 1]} ${parts[index]}`, prefecture?.code);
      const municipality = chooseMunicipality(joined, prefecture, postalCode);
      if (municipality) {
        parts.splice(index - 1, 2);

        return { at: index - 1, municipality };
      }
    }
    const alone = findMunicipalitiesByRomaji(parts[index], prefecture?.code);
    if (alone.length > 0) {
      const municipality = chooseMunicipality(alone, prefecture, postalCode);
      const name = parts[index];
      parts.splice(index, 1);

      return municipality ? { at: index, municipality } : { at: index, municipalityName: name };
    }
  }
  // Not in the table, but written as a municipality: the last part with a designator.
  for (let index = parts.length - 1; index >= 0; index--) {
    if (ROMAJI_MUNICIPALITY_DESIGNATOR.test(parts[index]) && !ROMAJI_BLOCK.test(parts[index])) {
      const [name] = parts.splice(index, 1);

      return { at: index, municipalityName: name };
    }
  }

  return {};
}

// The town and block in the part that holds the numbers: 1-2-3 Marunouchi, Kasumigaseki 1-chome 2-1.
function romajiTownAndBlock(part: string): Block {
  let rest = part;
  let chome: string | undefined;
  let ban: string | undefined;
  let go: string | undefined;
  const chomeHit = rest.match(ROMAJI_CHOME);
  if (chomeHit) {
    chome = chomeHit[1];
    rest = rest.replace(chomeHit[0], " ");
  }
  const numbers = rest.match(ROMAJI_BLOCK);
  if (numbers) {
    rest = rest.replace(numbers[0], " ");
    // A pair is ban and go, after a chome or alone, as in Japanese script (see the note at the top of this file).
    if (numbers[3] !== undefined) [chome, ban, go] = [numbers[1], numbers[2], numbers[3]];
    else [ban, go] = [numbers[1], numbers[2]];
  }

  return { ban, chome, go, town: trimSeparators(rest.replace(WHITESPACE_RUN, " ")) || undefined };
}

// The building, floor and room in the parts before the street: Sample Bldg 5F, Room 501.
function romajiBuilding(parts: readonly string[]): BuildingParts {
  let floor: string | undefined;
  let room: string | undefined;
  const names: string[] = [];
  for (const part of parts) {
    let rest = part;
    const floorHit = floor === undefined ? rest.match(ROMAJI_FLOOR) : null;
    if (floorHit) {
      floor = floorHit[1] ?? floorHit[2];
      rest = rest.replace(floorHit[0], " ");
    }
    const roomHit = room === undefined ? rest.match(ROMAJI_ROOM) : null;
    if (roomHit) {
      room = roomHit[1] ?? roomHit[2];
      rest = rest.replace(roomHit[0], " ");
    }
    const name = trimSeparators(rest.replace(WHITESPACE_RUN, " "));
    if (name) names.push(name);
  }

  return { building: names.join(", ") || undefined, floor, room };
}

// A romaji address: Sample Bldg 5F, 1-2-3 Marunouchi, Chiyoda-ku, Tokyo 100-0005, Japan.
function parseRomaji(text: string): ParsedAddress | null {
  const plain = text
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .normalize("NFKC")
    .trim()
    .replace(LINE_BREAK, ", ")
    .replace(WHITESPACE_RUN, " ");
  const { postalCode, rest } = takePostalCode(withoutCountry(plain));
  const parts = withoutCountry(rest)
    .replace(ROMAJI_PART_END, "$1, ")
    .split(COMMA_SPLIT)
    .map((part) => part.replace(PART_TRIM, "").trim())
    .filter(Boolean);

  let prefecture = takeRomajiPrefecture(parts);
  const { at, municipality, municipalityName } = takeRomajiMunicipality(parts, prefecture, postalCode);
  if (!prefecture && municipality) prefecture = findPrefecture(municipality.prefecture) ?? undefined;
  if (!prefecture && !municipality && !municipalityName) return null;

  const blockAt = parts.findIndex((part) => ROMAJI_BLOCK.test(part) || ROMAJI_CHOME.test(part));
  // In English order the building comes before the block, and whatever is left after the municipality is a
  // region the tables do not know (a misspelt prefecture), not a building.
  if (at !== undefined && blockAt >= 0 && blockAt < at) parts.splice(at);
  let block: Block = {};
  if (blockAt >= 0) {
    block = romajiTownAndBlock(parts[blockAt]);
    parts.splice(blockAt, 1);
  } else if (parts.length > 0 && !ROMAJI_BUILDING_WORD.test(parts[parts.length - 1])) {
    block = { town: parts.pop() };
  }
  const building = parts.length > 0 ? romajiBuilding(parts) : {};

  return assemble({ ...block, ...building, municipality, municipalityName, postalCode, prefecture });
}

/**
 * Whether a text is a Japanese address: in Japanese script, ending with Japan, or naming a prefecture beside a
 * Japanese postal code, a romaji designator (`-ku`, `-shi`) or a municipality written with an English word (`Chiyoda
 * City`). A US address that only mentions a Japanese name (`100 Tokyo Ave`) does not count.
 *
 * @param text - The text.
 * @returns `true` when the text should be read as Japanese.
 * @example
 * ```ts
 * import { looksJapanese } from "@johnmorrisdotca/address-plus/jp";
 *
 * console.log(looksJapanese("1-2-3 Marunouchi, Chiyoda-ku, Tokyo"));
 * // → true
 * ```
 */
function looksJapanese(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  if (hasJapaneseScript(text)) return true;
  const plain = text.normalize("NFKC").trim();
  if (TRAILING_COUNTRY.test(plain)) return true;
  const hasPostal = HYPHENATED_POSTAL_CODE.test(plain) || TRAILING_POSTAL_CODE.test(plain);
  const hasDesignator = ROMAJI_DESIGNATOR_WORD.test(plain);
  const words = plain.split(WORD_SPLIT);
  // A prefecture by name: findPrefecture also reads a JIS code, and 34 in a street number is not Hiroshima.
  const namesPrefecture = words.some(
    (word, index) =>
      !DIGITS_ONLY.test(word) &&
      (findPrefecture(word) !== null || findPrefecture(`${word} ${words[index + 1] ?? ""}`) !== null),
  );

  return namesPrefecture && (hasPostal || hasDesignator || namesMunicipality(plain));
}

// Whether a comma-separated part of a romaji text is a municipality the tables know written with an English word,
// Chiyoda City or Kiso Village, for an address that has no -ku or -shi. The word is required: without it, USA
// would be 宇佐市 (Usa-shi).
function namesMunicipality(text: string): boolean {
  return text.split(COMMA_SPLIT).some((part) => {
    const name = part.replace(PART_TRIM, "");

    return ENGLISH_MUNICIPALITY_WORD.test(name) && findMunicipalitiesByRomaji(name).length > 0;
  });
}

// The result with snake_case keys, the Japanese fields included: postal_code, prefecture_code.
function snakeCased(address: ParsedAddress): ParsedAddress {
  const shared = toSnakeCase(address);

  return Object.fromEntries(
    Object.entries(shared).map(([key, value]) => [
      key.replace(CAMEL_CASE_CAPITAL, (capital) => `_${capital.toLowerCase()}`),
      value,
    ]),
  ) as ParsedAddress;
}

/**
 * Parses a Japanese address, in Japanese script or in romaji, into the Japanese fields and the shared ones.
 * `parseLocation` calls it for any address that looks Japanese; call it directly to skip the detection.
 *
 * @param text - The address as one string, in either script, with or without 〒 and the postal code.
 * @param options - `useSnakeCase` gives snake_case keys; the other options are ignored.
 * @returns The parts found, or `null` when nothing in the text names a place in Japan (no prefecture, municipality or
 * postal code).
 * @example
 * ```ts
 * import { parseJapaneseAddress } from "@johnmorrisdotca/address-plus/jp";
 *
 * console.log(parseJapaneseAddress("〒100-0005 東京都千代田区丸の内1丁目2番3号 サンプルビル5階501号室")?.block);
 * // → "1-2-3"
 * ```
 */
function parseJapaneseAddress(text: string, options: ParseOptions = {}): ParsedAddress | null {
  if (!text || typeof text !== "string") return null;
  // 〒 or 郵便番号 on an address otherwise in romaji does not make it Japanese script.
  const withoutMark = text.replace(POSTAL_MARK, "");
  const inRomaji = !hasJapaneseScript(text) || (!hasJapaneseScript(withoutMark) && LATIN_LETTER.test(withoutMark));
  const result = inRomaji ? parseRomaji(text) : parseJapaneseScript(text);
  if (result && options.useSnakeCase) return snakeCased(result);

  return result;
}

export { looksJapanese, parseJapaneseAddress };
