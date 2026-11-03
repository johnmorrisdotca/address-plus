// A Japanese address written in Japanese script: the prefecture and municipality at its start, then the town and block.

import {
  findPrefecture,
  getPrefectureFromJapanesePostalCode,
  municipalitiesAtStart,
  prefectureAtStart,
  prefectureShortAtStart,
  prefectureShortName,
  prefectureShortRomaji,
} from "../constants/jp";
import type { JapaneseMunicipality, JapanesePrefecture } from "../types/japan";
import type { ParsedAddress } from "../types/parsed-address";
import type { Fields, MunicipalityMatch } from "./address-parts";
import {
  assemble,
  KYOTO_PREFECTURE_CODE,
  kyotoTown,
  splitBuilding,
  splitTownAndBlock,
  takePostalCode,
  trimSeparators,
  withoutCountry,
} from "./address-parts";
import { normalizeJapaneseAddressText } from "./normalize";
import { WRITTEN_MUNICIPALITY } from "./patterns";

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

export { chooseMunicipality, parseJapaneseScript };
