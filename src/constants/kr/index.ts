// South Korea's postcodes (the five-digit area numbers since 2015): whether GeoNames' list has one, and the province or
// metropolitan city it is in.

import { postcodeLookups } from "../../country/postcode-lookups";
import type { PostcodeRegion } from "../../types/postcode-country";
import { KR_PROVINCE_NAMES } from "./names";
import { KR_POSTCODE_REGION_RUNS, KR_POSTCODES_PACKED } from "./postcodes.data";
import { KR_PROVINCES } from "./regions.data";

const KR_POSTCODE_SHAPE = /^\d{5}$/;

const lookup = postcodeLookups({
  shape: KR_POSTCODE_SHAPE,
  length: 5,
  packed: KR_POSTCODES_PACKED,
  runs: KR_POSTCODE_REGION_RUNS,
  normalize: (postcode) => postcode.trim(),
});

// The runs write a province as a letter, its place in the table.
const lookups = {
  ...lookup,
  regionOf: (postcode: string): string | undefined => {
    const letter = lookup.regionOf(postcode);

    return letter === undefined ? undefined : KR_PROVINCES[letter.charCodeAt(0) - 65]?.code;
  },
  lookup: (postcode: string) => {
    const found = lookup.lookup(postcode);

    return found.region === undefined
      ? found
      : { ...found, region: KR_PROVINCES[found.region.charCodeAt(0) - 65]?.code };
  },
};

const plain = (text: string): string =>
  text
    .normalize("NFC")
    .toUpperCase()
    .replace(/[\s-]+/g, "");

/**
 * Finds a province or metropolitan city of South Korea by its code (`11`, `KR-11`), its name in English (`Seoul`,
 * `Gyeonggi-do`) or its name in Korean (`서울특별시`, `서울`), ignoring letter case, spaces and hyphens.
 *
 * @param query - The province's code or name.
 * @returns The province, or `undefined` when none has that code or name.
 * @example
 * ```ts
 * import { findKoreanProvince } from "@johnmorrisdotca/address-plus/kr";
 *
 * console.log([findKoreanProvince("서울")?.code, findKoreanProvince("gyeonggi-do")?.name, findKoreanProvince("KR-26")?.name, findKoreanProvince("x")]);
 * // → ["11","Gyeonggi","Busan",null]
 * ```
 */
function findKoreanProvince(query: string): PostcodeRegion | undefined {
  const wanted = plain(String(query ?? "")).replace(/^KR(?=\d{2}$)/, "");
  if (wanted === "") return undefined;
  const byCode = KR_PROVINCES.find((province) => province.code === wanted);
  if (byCode) return byCode;
  for (const [code, names] of Object.entries(KR_PROVINCE_NAMES)) {
    if (names.some((name) => plain(name) === wanted)) return KR_PROVINCES.find((province) => province.code === code);
  }

  return undefined;
}

export { findKoreanProvince, lookups as koreanPostcodes, KR_POSTCODE_SHAPE, KR_PROVINCE_NAMES, KR_PROVINCES };
