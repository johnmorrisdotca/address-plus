// Lookups over the generated Japanese tables: prefectures by name, kana, romaji or JIS code;
// municipalities by name or romaji within a prefecture; and which prefecture a postal code delivers to.

import type { JapaneseMunicipality, JapanesePrefecture } from "../../types/japan";
import { JP_MUNICIPALITIES } from "./municipalities.data";
import { JP_POSTAL_EXCEPTIONS, JP_POSTAL_PREFIXES } from "./postal-prefixes.data";
import { JP_PREFECTURES } from "./prefectures.data";

// Designators written after a name: 都道府県 on a prefecture, 市区町村 and 郡 on a municipality.
const PREFECTURE_DESIGNATOR = /[都道府県]$/;
const PREFECTURE_ROMAJI_DESIGNATOR = /-(?:to|do|fu|ken)$/;
const ROMAJI_DESIGNATOR = /-(?:to|do|fu|ken|shi|ku|cho|machi|mura|son|gun)\b/g;
const ENGLISH_DESIGNATOR = /\b(?:prefecture|pref\.?|metropolis|city|ward|town|village|district)\b/g;
const COMBINING_MARKS = /[\u0300-\u036f]/g;
const NOT_ROMAJI_LETTER = /[^a-z\s]/g;
const WHITESPACE_RUN = /\s+/g;
const ROMAJI_DISTRICT_WORD = /\S+-gun\b/i;
const NOT_ROMAJI_DESIGNATOR_CHARACTER = /[^a-z\s-]/g;
const TRAILING_ROMAJI_DESIGNATOR = /-(shi|ku|cho|machi|mura|son)$/;

// The English word for a designator, to the romaji designators it can stand for.
const ENGLISH_DESIGNATOR_ROMAJI: Readonly<Record<string, string[]>> = {
  city: ["shi"],
  town: ["cho", "machi"],
  village: ["mura", "son"],
  ward: ["ku"],
};

// A town or village inside a district (郡). Only these carry one: 郡山市, 蒲郡市, 大和郡山市, 郡上市 and
// 小郡市 have 郡 in their own names.
const DISTRICT_PREFIX = /^.+?郡(?=.+[町村]$)/;

// A ward of a designated city: 札幌市中央区 is 札幌市 and 中央区.
const DESIGNATED_CITY_WARD = /^(.+?市)(.+区)$/;

// Characters written for one another in municipality names, folded only to match them, never in what is
// returned: the small ヶ and ヵ beside ケ and カ (鎌ヶ谷市, 鎌ケ谷市), and old or variant forms of a kanji
// (飛驒市 for 飛騨市, 﨑 for 崎, 髙 for 高). Each pair is one character for one, so a match keeps its length.
const VARIANT_CHARACTERS: Readonly<Record<string, string>> = { ヶ: "ケ", ヵ: "カ", 驒: "騨", 﨑: "崎", 髙: "高" };
const VARIANT_CHARACTER = /[ヶヵ驒﨑髙]/g;

// A spelling with its variant characters folded.
const foldVariants = (text: string): string =>
  text.replace(VARIANT_CHARACTER, (character) => VARIANT_CHARACTERS[character] ?? character);

// The romaji designator each prefecture designator is written with.
const PREFECTURE_DESIGNATOR_ROMAJI: Readonly<Record<string, string>> = { 府: "fu", 県: "ken", 道: "do", 都: "to" };

// Spellings in common use that the table's romaji does not have: Geolonia writes 群馬 as Gumma, the older
// Hepburn, where most English text now writes Gunma.
const PREFECTURE_ALIASES: Readonly<Record<string, string>> = { gunma: "10" };

// Romaji without macrons, lower-cased, single-spaced: Tōkyō → tokyo.
const plainRomaji = (text: string): string =>
  text.normalize("NFKD").replace(COMBINING_MARKS, "").trim().replace(WHITESPACE_RUN, " ").toLowerCase();

// 北海道 is the one prefecture whose designator is part of its name: nobody says 北海.
const prefectureShortName = (prefecture: JapanesePrefecture): string =>
  prefecture.name === "北海道" ? prefecture.name : prefecture.name.replace(PREFECTURE_DESIGNATOR, "");

// Tokyo, Osaka, Hokkaido: the form English addresses use.
const prefectureShortRomaji = (prefecture: JapanesePrefecture): string =>
  prefecture.romaji.replace(PREFECTURE_ROMAJI_DESIGNATOR, "");

// The romaji designator for a prefecture: Tokyo-to, Hokkaido-do, Kyoto-fu, Aichi-ken.
const prefectureDesignatorRomaji = (prefecture: JapanesePrefecture): string =>
  PREFECTURE_DESIGNATOR_ROMAJI[prefecture.name.slice(-1)] ?? "";

// The English spellings of a prefecture, from the short romaji: osaka, osaka-fu, osaka fu, osaka prefecture.
const romajiSpellings = (short: string, prefecture: JapanesePrefecture): string[] => {
  const designator = prefectureDesignatorRomaji(prefecture);
  const spellings = [
    short,
    `${short}-${designator}`,
    `${short} ${designator}`,
    `${short} prefecture`,
    `${short} pref`,
    `${short} pref.`,
    `${short}-${designator} prefecture`,
  ];
  if (designator === "to") spellings.push(`${short} metropolis`, `${short} metropolitan`);

  return spellings;
};

const PREFECTURE_BY_CODE: ReadonlyMap<string, JapanesePrefecture> = new Map(
  JP_PREFECTURES.map((prefecture) => [prefecture.code, prefecture]),
);

// Every spelling a prefecture goes by, lower-cased, to the prefecture.
const PREFECTURE_BY_NAME: ReadonlyMap<string, JapanesePrefecture> = (() => {
  const map = new Map<string, JapanesePrefecture>();
  for (const prefecture of JP_PREFECTURES) {
    const short = prefectureShortRomaji(prefecture).toLowerCase();
    const spellings = [
      prefecture.name,
      prefectureShortName(prefecture),
      prefecture.kana,
      prefecture.romaji.toLowerCase(),
      ...romajiSpellings(short, prefecture),
    ];
    for (const spelling of spellings) map.set(spelling, prefecture);
  }
  for (const [alias, code] of Object.entries(PREFECTURE_ALIASES)) {
    const prefecture = PREFECTURE_BY_CODE.get(code)!;
    for (const spelling of romajiSpellings(alias, prefecture)) map.set(spelling, prefecture);
  }

  return map;
})();

// The longest common start of a list of strings.
const commonStart = (texts: readonly string[]): string => {
  let start = texts[0] ?? "";
  for (const text of texts) {
    while (!text.startsWith(start)) start = start.slice(0, -1);
  }

  return start;
};

/**
 * The twenty designated cities (政令指定都市) as municipalities of their own. Geolonia lists only their wards, but addresses
 * often name the city alone (`大阪市`, `Sapporo`), and the city has a JIS code of its own: its wards' codes with the last
 * digit 0 (札幌市 01100).
 *
 * @example
 * ```ts
 * import { JP_DESIGNATED_CITIES } from "@johnmorrisdotca/address-plus/jp";
 *
 * console.log(JP_DESIGNATED_CITIES.length);
 * // → 20
 * ```
 */
const JP_DESIGNATED_CITIES: readonly JapaneseMunicipality[] = (() => {
  const wardsByCity = new Map<string, JapaneseMunicipality[]>();
  for (const municipality of JP_MUNICIPALITIES) {
    const ward = municipality.name.match(DESIGNATED_CITY_WARD);
    if (!ward) continue;
    const key = `${municipality.prefecture}${ward[1]}`;
    if (!wardsByCity.has(key)) wardsByCity.set(key, []);
    wardsByCity.get(key)!.push(municipality);
  }

  return [...wardsByCity.values()].map((wards): JapaneseMunicipality => {
    const first = [...wards].sort((left, right) => left.code.localeCompare(right.code))[0];
    const lowest = Number(first.code);

    return {
      code: String(lowest - (lowest % 10)).padStart(5, "0"),
      kana: commonStart(wards.map((ward) => ward.kana)),
      name: first.name.match(DESIGNATED_CITY_WARD)![1],
      prefecture: first.prefecture,
      romaji: first.romaji.split(" ")[0],
    };
  });
})();

// Every municipality a lookup may answer with: the generated table and the designated cities.
const ALL_MUNICIPALITIES: readonly JapaneseMunicipality[] = [...JP_MUNICIPALITIES, ...JP_DESIGNATED_CITIES];

const MUNICIPALITIES_BY_PREFECTURE: ReadonlyMap<string, readonly JapaneseMunicipality[]> = (() => {
  const map = new Map<string, JapaneseMunicipality[]>();
  for (const municipality of ALL_MUNICIPALITIES) {
    if (!map.has(municipality.prefecture)) map.set(municipality.prefecture, []);
    map.get(municipality.prefecture)!.push(municipality);
  }

  return map;
})();

const MUNICIPALITY_BY_CODE: ReadonlyMap<string, JapaneseMunicipality> = new Map(
  ALL_MUNICIPALITIES.map((municipality) => [municipality.code, municipality]),
);

// The ways a municipality is written in Japanese: its full name, and for a town or village in a district
// the name without the district (当別町 for 石狩郡当別町), which is how most people write it.
const japaneseSpellings = (municipality: JapaneseMunicipality): string[] => {
  const withoutDistrict = municipality.name.replace(DISTRICT_PREFIX, "");

  return withoutDistrict === municipality.name ? [municipality.name] : [municipality.name, withoutDistrict];
};

// Every Japanese spelling, with its variant characters folded, to the municipalities it can mean; 府中市 is in
// Tokyo and in Hiroshima.
const MUNICIPALITIES_BY_SPELLING: ReadonlyMap<string, readonly JapaneseMunicipality[]> = (() => {
  const map = new Map<string, JapaneseMunicipality[]>();
  for (const municipality of ALL_MUNICIPALITIES) {
    for (const spelling of japaneseSpellings(municipality).map(foldVariants)) {
      if (!map.has(spelling)) map.set(spelling, []);
      map.get(spelling)!.push(municipality);
    }
  }

  return map;
})();

// The spellings, longest first, so the first one a text starts with is the longest match.
const SPELLINGS_LONGEST_FIRST: readonly string[] = [...MUNICIPALITIES_BY_SPELLING.keys()].sort(
  (left, right) => right.length - left.length,
);

// A romaji municipality reduced to its words without designators, sorted, so "Chuo-ku, Sapporo" and
// "Sapporo-shi Chuo-ku" meet at "chuo sapporo". Macrons are dropped first: Chūō-ku is Chuo-ku.
const romajiKey = (text: string): string =>
  plainRomaji(text)
    .replace(ROMAJI_DESIGNATOR, "")
    .replace(ENGLISH_DESIGNATOR, "")
    .replace(NOT_ROMAJI_LETTER, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .sort()
    .join(" ");

const indexByRomaji = (
  keyOf: (municipality: JapaneseMunicipality) => string,
): ReadonlyMap<string, readonly JapaneseMunicipality[]> => {
  const map = new Map<string, JapaneseMunicipality[]>();
  for (const municipality of ALL_MUNICIPALITIES) {
    const key = keyOf(municipality);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(municipality);
  }

  return map;
};

const MUNICIPALITIES_BY_ROMAJI = indexByRomaji((municipality) => romajiKey(municipality.romaji));

// A designated city's ward by its own name, for "Kita-ku, Osaka": asked only when nothing else is found.
const MUNICIPALITIES_BY_WARD = indexByRomaji((municipality) =>
  DESIGNATED_CITY_WARD.test(municipality.name) ? romajiKey(municipality.romaji.split(" ").slice(1).join(" ")) : "",
);

// The same without the district, for "Tobetsu-cho, Hokkaido": asked only when the full key finds nothing.
const MUNICIPALITIES_BY_ROMAJI_WITHOUT_DISTRICT = indexByRomaji((municipality) =>
  romajiKey(municipality.romaji.replace(ROMAJI_DISTRICT_WORD, "")),
);

// The designators a romaji municipality ends with, an English word standing for the ones it can mean:
// "Kiso-mura" → ["mura"]; "Kiso Village" → ["mura", "son"]; "Sapporo-shi Chuo-ku" → ["ku"].
const designatorOf = (text: string): string[] => {
  const words = plainRomaji(text).replace(NOT_ROMAJI_DESIGNATOR_CHARACTER, " ").split(" ").filter(Boolean);
  const last = words[words.length - 1] ?? "";
  const hyphenated = last.match(TRAILING_ROMAJI_DESIGNATOR);
  if (hyphenated) return [hyphenated[1]];

  return ENGLISH_DESIGNATOR_ROMAJI[last] ?? [];
};

const inPrefecture = (
  municipalities: readonly JapaneseMunicipality[],
  prefectureCode?: string,
): JapaneseMunicipality[] =>
  prefectureCode
    ? municipalities.filter((municipality) => municipality.prefecture === prefectureCode)
    : [...municipalities];

/**
 * The prefecture a name, reading, romaji spelling or JIS code refers to: `東京都`, `東京`, `トウキョウト`, `Tokyo`, `Osaka
 * Prefecture`, `13`.
 *
 * @param text - The name, reading or code; letter case and macrons do not matter.
 * @returns The prefecture, or `null` when the text names none.
 * @example
 * ```ts
 * import { findPrefecture } from "@johnmorrisdotca/address-plus/jp";
 *
 * console.log(findPrefecture("Osaka Prefecture")?.name);
 * // → "大阪府"
 * ```
 */
function findPrefecture(text: string): JapanesePrefecture | null {
  if (!text) return null;
  const clean = plainRomaji(text);

  return PREFECTURE_BY_CODE.get(clean) ?? PREFECTURE_BY_NAME.get(clean) ?? null;
}

// The prefecture whose full name opens the text, with what follows it.
function prefectureAtStart(text: string): { prefecture: JapanesePrefecture; rest: string } | null {
  for (const prefecture of JP_PREFECTURES) {
    if (text.startsWith(prefecture.name)) return { prefecture, rest: text.slice(prefecture.name.length) };
  }

  return null;
}

// The prefecture whose name opens the text without its designator (東京千代田区), with what follows.
// 北海道 has no shorter form. Asked only after the municipality tables, since 大阪市 and 京都市 open
// with a prefecture's short name too.
function prefectureShortAtStart(text: string): { prefecture: JapanesePrefecture; rest: string } | null {
  for (const prefecture of JP_PREFECTURES) {
    const short = prefectureShortName(prefecture);
    if (short !== prefecture.name && text.startsWith(short)) return { prefecture, rest: text.slice(short.length) };
  }

  return null;
}

// The municipalities whose name opens the text, with what follows it. Looks in one prefecture when it
// is known, otherwise everywhere. The longest spelling wins, so 大阪市北区 beats 大阪市; when several
// municipalities share that spelling (府中市, 池田町) all of them are returned, for the caller to choose
// between with whatever else it knows.
function municipalitiesAtStart(
  text: string,
  prefectureCode?: string,
): { matched: string; municipalities: JapaneseMunicipality[]; rest: string } | null {
  const folded = foldVariants(text);
  for (const spelling of SPELLINGS_LONGEST_FIRST) {
    if (!folded.startsWith(spelling)) continue;
    const municipalities = inPrefecture(MUNICIPALITIES_BY_SPELLING.get(spelling) ?? [], prefectureCode);
    if (municipalities.length > 0) {
      return { matched: text.slice(0, spelling.length), municipalities, rest: text.slice(spelling.length) };
    }
  }

  return null;
}

/**
 * The municipalities a Japanese name could mean: several when the name is shared (`府中市` is in Tokyo and in Hiroshima).
 * A town or village may be named without its district (`当別町`).
 *
 * @param name - The municipality's name in Japanese.
 * @param prefectureCode - A prefecture's JIS code, to look in that prefecture only.
 * @returns Every match, an empty array when there is none.
 * @example
 * ```ts
 * import { findMunicipalitiesByName } from "@johnmorrisdotca/address-plus/jp";
 *
 * console.log(findMunicipalitiesByName("府中市").map((one) => one.code + " " + one.romaji));
 * // → ["13206 Fuchu-shi","34208 Fuchu-shi"]
 * ```
 */
function findMunicipalitiesByName(name: string, prefectureCode?: string): JapaneseMunicipality[] {
  return inPrefecture(MUNICIPALITIES_BY_SPELLING.get(foldVariants(name)) ?? [], prefectureCode);
}

/**
 * The municipalities a romaji name could mean, written with or without macrons and designators (`Chiyoda-ku`, `Chiyoda
 * City`, `Sapporo-shi Chuo-ku`, `Chuo-ku, Sapporo`). A town written without its district, and then a ward written
 * without its city, are looked up when the full name finds nothing.
 *
 * @param text - The name in romaji.
 * @param prefectureCode - A prefecture's JIS code, to look in that prefecture only.
 * @returns Every match, an empty array when there is none.
 * @example
 * ```ts
 * import { findMunicipalitiesByRomaji } from "@johnmorrisdotca/address-plus/jp";
 *
 * console.log(findMunicipalitiesByRomaji("Chuo-ku, Sapporo").map((one) => one.name));
 * // → ["札幌市中央区"]
 * ```
 */
function findMunicipalitiesByRomaji(text: string, prefectureCode?: string): JapaneseMunicipality[] {
  const key = romajiKey(text);
  if (!key) return [];
  const written = designatorOf(text);
  let found: JapaneseMunicipality[] = [];
  for (const index of [MUNICIPALITIES_BY_ROMAJI, MUNICIPALITIES_BY_ROMAJI_WITHOUT_DISTRICT, MUNICIPALITIES_BY_WARD]) {
    found = inPrefecture(index.get(key) ?? [], prefectureCode);
    // A ward found by its own name must not contradict the designator written: Urawa-shi, a city merged away
    // in 2001, is not 浦和区, the ward of さいたま市 that took its name.
    if (index === MUNICIPALITIES_BY_WARD && written.length > 0) {
      found = found.filter((municipality) => written.includes(designatorOf(municipality.romaji)[0]));
    }
    if (found.length > 0) break;
  }
  if (found.length < 2) return found;

  // Names that differ only in their designator, 木曽町 (Kiso-machi) and 木祖村 (Kiso-mura), are told
  // apart by the designator written, when there is one.
  const matching = found.filter((municipality) => written.includes(designatorOf(municipality.romaji)[0]));

  return matching.length > 0 ? matching : found;
}

/**
 * Every municipality of a prefecture, the designated cities included.
 *
 * @param prefectureCode - The prefecture's JIS code.
 * @returns The municipalities, an empty array for an unknown code.
 * @example
 * ```ts
 * import { municipalitiesOf } from "@johnmorrisdotca/address-plus/jp";
 *
 * console.log(municipalitiesOf("47").length);
 * // → 41
 * ```
 */
function municipalitiesOf(prefectureCode: string): readonly JapaneseMunicipality[] {
  return MUNICIPALITIES_BY_PREFECTURE.get(prefectureCode) ?? [];
}

/**
 * The municipality with a JIS X 0402 code, a designated city's own code included.
 *
 * @param code - The five-digit code.
 * @returns The municipality, or `null` for a code the tables do not have.
 * @example
 * ```ts
 * import { findMunicipalityByCode } from "@johnmorrisdotca/address-plus/jp";
 *
 * console.log(findMunicipalityByCode("13101")?.name);
 * // → "千代田区"
 * ```
 */
function findMunicipalityByCode(code: string): JapaneseMunicipality | null {
  return MUNICIPALITY_BY_CODE.get(code) ?? null;
}

/**
 * The prefecture a Japanese postal code delivers to, from Japan Post's data: by its first three digits, and for the
 * codes on the far side of a prefix that straddles a border, by the whole code.
 *
 * @param postalCode - The seven-digit code, with or without its hyphen, in either width.
 * @returns The prefecture's JIS code, or `null` for a malformed code or one no Japanese code begins like.
 * @example
 * ```ts
 * import { getPrefectureFromJapanesePostalCode } from "@johnmorrisdotca/address-plus/jp";
 *
 * console.log(getPrefectureFromJapanesePostalCode("530-0001"));
 * // → "27"
 * ```
 */
function getPrefectureFromJapanesePostalCode(postalCode: string): string | null {
  if (!postalCode) return null;
  const digits = postalCode.normalize("NFKC").replace(/\D/g, "");
  if (digits.length !== 7) return null;

  return JP_POSTAL_EXCEPTIONS[digits] ?? JP_POSTAL_PREFIXES[digits.slice(0, 3)] ?? null;
}

/**
 * The three-digit postal prefixes a prefecture's codes begin with, the reverse of
 * `getPrefectureFromJapanesePostalCode`. A prefix on a border is listed under the prefecture most of its codes belong
 * to.
 *
 * @param prefecture - The prefecture, by JIS code, name or romaji, as `findPrefecture` reads it.
 * @returns The prefixes in ascending order, an empty array for an unknown prefecture.
 * @example
 * ```ts
 * import { getPostalPrefixesForPrefecture } from "@johnmorrisdotca/address-plus/jp";
 *
 * console.log(getPostalPrefixesForPrefecture("沖縄県"));
 * // → ["900","901","902","903","904","905","906","907"]
 * ```
 */
function getPostalPrefixesForPrefecture(prefecture: string): string[] {
  const prefectureCode = findPrefecture(prefecture)?.code;
  if (!prefectureCode) return [];

  return Object.entries(JP_POSTAL_PREFIXES)
    .filter(([, code]) => code === prefectureCode)
    .map(([prefix]) => prefix)
    .sort();
}

export {
  findMunicipalitiesByName,
  findMunicipalitiesByRomaji,
  findMunicipalityByCode,
  findPrefecture,
  getPostalPrefixesForPrefecture,
  getPrefectureFromJapanesePostalCode,
  JP_DESIGNATED_CITIES,
  JP_MUNICIPALITIES,
  JP_POSTAL_EXCEPTIONS,
  JP_POSTAL_PREFIXES,
  JP_PREFECTURES,
  municipalitiesAtStart,
  municipalitiesOf,
  prefectureAtStart,
  prefectureShortAtStart,
  prefectureShortName,
  prefectureShortRomaji,
  romajiKey,
};
