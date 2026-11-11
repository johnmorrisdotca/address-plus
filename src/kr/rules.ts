// What is Korean about an address in South Korea: written from the largest to the smallest in Hangul (`서울특별시 중구
// 세종대로 110`) or from the smallest to the largest in Latin letters (`110 Sejong-daero, Jung-gu, Seoul 04524`), the road
// and its building number, the district in brackets, the floor and the unit, and the five-digit postcode at either end.

import { findKoreanProvince, koreanPostcodes, KR_PROVINCE_NAMES } from "../constants/kr";
import type { PostcodeCountrySpec } from "../country/postcode-country";
import { tidyAddressText } from "../country/shared";
import type { ParseOptions } from "../types/parse-options";
import type { ParsedAddress } from "../types/parsed-address";

const HANGUL = /[ㄱ-ㆎ가-힣]/;
const COUNTRY_AT_END = /[,\s]*(?:대한민국|한국|south korea|republic of korea|korea)\s*$/i;
const POSTCODE_START = /^\(?(\d{5})\)?[\s,]+/;
const POSTCODE_END = /[\s,(]+\(?(\d{5})\)?\s*$/;
const POSTCODE_BRACKETED = /\(\s*(\d{5})\s*\)/;

const PROVINCES = new Map<string, string>();
for (const [code, names] of Object.entries(KR_PROVINCE_NAMES)) {
  for (const name of names)
    PROVINCES.set(
      name
        .normalize("NFC")
        .toLowerCase()
        .replace(/[\s-]+/g, ""),
      code,
    );
}
const provinceCode = (text: string): string | undefined =>
  PROVINCES.get(
    text
      .normalize("NFC")
      .toLowerCase()
      .replace(/[\s-]+/g, ""),
  );

// A road, in Hangul (`세종대로`, `중앙로12번길`) and in Latin letters (`Sejong-daero`, `Teheran-ro 152beon-gil`).
const ROAD_HANGUL = /^.+(?:로|길|대로|\d+번길)$/;
const ROAD_ROMAN = /(?:-?(?:daero|ro|gil)|\d+beon-?gil)$/i;
const NUMBER = /^\d+(?:-\d+)?$/;
const DISTRICT_HANGUL = /^.+(?:시|군|구)$/;
const DISTRICT_ROMAN = /^.+-(?:si|gun|gu)$/i;
const LOCALITY_HANGUL = /^.+(?:동|리|가|읍|면)$/;
const LOCALITY_ROMAN = /^.+-(?:dong|ri|ga|eup|myeon)$/i;
const FLOOR_HANGUL = /^(지하)?(\d+)층$/;
const UNIT_HANGUL = /^(\d+|[A-Za-z]\d*)호$/;
const BLOCK_HANGUL = /^(\d+|[A-Za-z])동$/;
const FLOOR_ROMAN = /^(?:(\d+)(?:st|nd|rd|th)?\s*(?:floor|fl\.?)|(\d+)F|floor\s*(\d+)|B(\d+)F?)$/i;
const UNIT_ROMAN = /^(?:(?:unit|room|suite|apt\.?|apartment|ho)\s*#?\s*|#)([A-Za-z0-9-]+)$/i;

// The Hangul address: tokens from the province down.
function readHangul(text: string, result: ParsedAddress): void {
  const brackets = [...text.matchAll(/\(([^)]*)\)/g)].flatMap((found) =>
    found[1].split(/[,，]/).map((part) => part.trim()),
  );
  const tokens = text
    .replace(/\([^)]*\)/g, " ")
    .split(/[\s,，]+/)
    .filter((token) => token !== "");
  let at = 0;
  const province = tokens[at] ? provinceCode(tokens[at]) : undefined;
  if (province) {
    result.state = province;
    at += 1;
  }
  const districts: string[] = [];
  while (
    at < tokens.length &&
    DISTRICT_HANGUL.test(tokens[at]) &&
    !ROAD_HANGUL.test(tokens[at]) &&
    districts.length < 3
  ) {
    districts.push(tokens[at]);
    at += 1;
  }
  if (districts.length > 0) result.city = districts.join(" ");
  const names: string[] = [];
  for (; at < tokens.length; at += 1) {
    const token = tokens[at];
    const floor = FLOOR_HANGUL.exec(token);
    const unit = UNIT_HANGUL.exec(token);
    const block = BLOCK_HANGUL.exec(token);
    if (!result.street && ROAD_HANGUL.test(token)) result.street = token;
    else if (!result.street && !result.locality && LOCALITY_HANGUL.test(token) && !FLOOR_HANGUL.test(token))
      result.locality = token;
    else if (!result.number && NUMBER.test(token) && (result.street || result.locality)) result.number = token;
    else if (floor && !result.floorType) {
      result.floorType = "층";
      result.floor = floor[1] ? `B${floor[2]}` : floor[2];
    } else if (unit && !result.secUnitType) {
      result.secUnitType = "호";
      result.secUnitNum = unit[1];
    } else if (block && !result.building) result.building = token;
    else names.push(token);
  }
  for (const part of brackets) {
    if (part === "") continue;
    if (!result.locality && LOCALITY_HANGUL.test(part)) result.locality = part;
    else names.push(part);
  }
  if (names.length > 0) result.building = [result.building, ...names].filter(Boolean).join(" ");
}

// The Latin-letter address, small to large: the number and the road, the unit, the districts, the province.
function readRoman(text: string, result: ParsedAddress): void {
  const parts = text
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
  const districts: string[] = [];
  const before: string[] = [];
  for (const part of parts) {
    const province = provinceCode(part);
    const floor = FLOOR_ROMAN.exec(part);
    const unit = UNIT_ROMAN.exec(part);
    const first = /^(\d+(?:-\d+)?)\s+(.+)$/.exec(part);
    const last = /^(.+?)\s+(\d+(?:-\d+)?)$/.exec(part);
    if (province && !result.state) result.state = province;
    else if (floor && !result.floorType) {
      result.floorType = "Floor";
      result.floor = floor[4] ? `B${floor[4]}` : (floor[1] ?? floor[2] ?? floor[3]);
    } else if (unit && !result.secUnitType) {
      result.secUnitType = "Unit";
      result.secUnitNum = unit[1].toUpperCase();
    } else if (!result.street && first && ROAD_ROMAN.test(first[2])) {
      result.number = first[1];
      result.street = first[2];
    } else if (!result.street && last && ROAD_ROMAN.test(last[1])) {
      result.street = last[1];
      result.number = last[2];
    } else if (!result.street && ROAD_ROMAN.test(part)) result.street = part;
    else if (DISTRICT_ROMAN.test(part)) districts.push(part);
    else if (LOCALITY_ROMAN.test(part) && !result.locality) result.locality = part;
    else before.push(part);
  }
  // The districts are written small to large; the city is kept large to small, as in Hangul.
  if (districts.length > 0) result.city = districts.reverse().join(" ");
  if (!result.state && result.city === undefined && before.length > 0) result.city = before.pop();
  if (before.length > 0) result.building = before.join(", ");
}

/** Reads a Korean address in Hangul or in Latin letters, for the Korean module. */
function parseKoreanText(text: string, options: ParseOptions = {}): ParsedAddress | null {
  if (!text || typeof text !== "string") return null;
  let work = tidyAddressText(text);
  const result: ParsedAddress = {};
  let namesCountry = false;
  if (COUNTRY_AT_END.test(work)) {
    work = work.replace(COUNTRY_AT_END, "");
    namesCountry = true;
  }
  const bracketed = POSTCODE_BRACKETED.exec(work);
  const start = POSTCODE_START.exec(work);
  const end = POSTCODE_END.exec(work);
  const found = bracketed ?? start ?? end;
  if (found) {
    result.zip = found[1];
    work = work.replace(found[0], bracketed ? " " : "").trim();
  }
  if (HANGUL.test(work)) readHangul(work, result);
  else readRoman(work, result);
  const anchored = namesCountry || [result.zip, result.street, result.state].some(Boolean);
  if (!anchored || Object.keys(result).length === 0) return null;
  if (result.zip) {
    result.zipValid = koreanPostcodes.isValid(result.zip);
    const region = koreanPostcodes.regionOf(result.zip);
    if (region && !result.state) result.state = region;
  }
  result.country = "KR";

  return options.useSnakeCase
    ? (Object.fromEntries(
        Object.entries(result).map(([key, value]) => [
          key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
          value,
        ]),
      ) as ParsedAddress)
    : order(result);
}

const FIELD_ORDER: readonly (keyof ParsedAddress)[] = [
  "state",
  "city",
  "street",
  "number",
  "locality",
  "building",
  "floorType",
  "floor",
  "secUnitType",
  "secUnitNum",
  "zip",
  "zipValid",
  "country",
];

function order(result: ParsedAddress): ParsedAddress {
  const out: Record<string, unknown> = {};
  for (const field of FIELD_ORDER) if (result[field] !== undefined) out[field] = result[field];

  return out as ParsedAddress;
}

// A postcode and a Korean sign: a province's name in Hangul or a road in Hangul, or a Latin address with a road and a province
// before the postcode.
const HANGUL_SIGN = /(?:특별시|광역시|특별자치시|특별자치도|[가-힣]+도\s|[가-힣]+(?:로|길)\s*\d)/;

function detectShape(text: string): boolean {
  if (HANGUL.test(text)) return HANGUL_SIGN.test(text) && /\d{5}|[가-힣]+(?:로|길)/.test(text);
  const found = /(?:^|,)\s*([A-Za-z -]+?)\s*,?\s*(\d{5})\s*$/.exec(text);
  if (!found || !koreanPostcodes.isKnown(found[2])) return false;
  const roman = text.split(",").some((part) =>
    ROAD_ROMAN.test(
      part
        .trim()
        .replace(/\s+\d+(?:-\d+)?$/, "")
        .replace(/^\d+(?:-\d+)?\s+/, ""),
    ),
  );

  return roman && provinceCode(found[1].replace(/\s+\d{5}$/, "")) !== undefined;
}

const koreanSpec: PostcodeCountrySpec = {
  code: "KR",
  name: "South Korea",
  names: ["SOUTH KOREA", "REPUBLIC OF KOREA", "KOREA"],
  codes: ["KR"],
  postcode: /(?<!\d)(\d{5})(?!\d)/g,
  list: "GeoNames' list for South Korea",
  shape: "five digits",
  isValid: koreanPostcodes.isValid,
  isKnown: koreanPostcodes.isKnown,
  normalize: (postcode) => postcode.trim(),
  regionOf: koreanPostcodes.regionOf,
  takeDelivery: (part) => part,
  readStreet: () => false,
  detectShape,
  streetForm: (folded) => folded.replace(/[\s-]+/g, ""),
};

export { findKoreanProvince, koreanSpec, parseKoreanText };
