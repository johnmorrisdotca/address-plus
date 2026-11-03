// A Japanese address written in romaji, the English order: the building and block first, the town, municipality and
// prefecture after, split at the commas.

import { findMunicipalitiesByRomaji, findPrefecture } from "../constants/jp";
import type { JapanesePrefecture } from "../types/japan";
import type { ParsedAddress } from "../types/parsed-address";
import type { Block, BuildingParts, Fields } from "./address-parts";
import { assemble, takePostalCode, trimSeparators, withoutCountry } from "./address-parts";
import { chooseMunicipality } from "./parse-script";
import {
  COMBINING_MARKS,
  COMMA_SPLIT,
  LINE_BREAK,
  PART_TRIM,
  ROMAJI_BLOCK,
  ROMAJI_BUILDING_WORD,
  ROMAJI_CHOME,
  ROMAJI_FLOOR,
  ROMAJI_MUNICIPALITY_DESIGNATOR,
  ROMAJI_PART_END,
  ROMAJI_ROOM,
  WHITESPACE_RUN,
} from "./patterns";

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

export { parseRomaji };
