// The parts a Japanese address is made of once its municipality is known: the postal code, the block as chome, ban and go, the
// town, the building, floor and room, and the assembly of them into the fields of a parsed address.

import { municipalitiesAtStart, prefectureShortRomaji } from "../constants/jp";
import type { JapaneseMunicipality, JapanesePrefecture } from "../types/japan";
import type { ParsedAddress } from "../types/parsed-address";
import {
  BLOCK_BAN_GO,
  BLOCK_BARE_NUMBER,
  BLOCK_CHOME,
  BLOCK_HYPHENATED,
  BLOCK_START,
  BUILDING_LEAD,
  DIGIT,
  FLOOR,
  HYPHENATED_POSTAL_CODE,
  KYOTO_DIRECTION,
  KYOTO_TOWN_FIRST,
  LEADING_COUNTRY,
  LEADING_POSTAL_CODE,
  MARKED_POSTAL_CODE,
  POSTAL_CODE_SHAPE,
  POSTAL_MARK,
  ROOM,
  RURAL_TOWN,
  SEPARATORS_AT_END,
  SEPARATORS_AT_START,
  SPACE_INSIDE_JAPANESE,
  TRAILING_COUNTRY,
  TRAILING_POSTAL_CODE,
  WHITESPACE_RUN,
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

export {
  assemble,
  KYOTO_PREFECTURE_CODE,
  kyotoTown,
  splitBuilding,
  splitTownAndBlock,
  takePostalCode,
  trimSeparators,
  withoutCountry,
};
export type { Block, BuildingParts, Fields, MunicipalityMatch };
