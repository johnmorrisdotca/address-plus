// Spain's postcodes: five digits, the first two a province's number (01 to 52), whether GeoNames' list has one, and the
// province it is in.

import { postcodeLookups } from "../../country/postcode-lookups";
import type { PostcodeRegion } from "../../types/postcode-country";
import { ES_POSTCODE_REGION_RUNS, ES_POSTCODES_PACKED } from "./postcodes.data";
import { ES_PROVINCES } from "./regions.data";

const ES_POSTCODE_SHAPE = /^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/;

const lookups = postcodeLookups({
  shape: ES_POSTCODE_SHAPE,
  length: 5,
  packed: ES_POSTCODES_PACKED,
  runs: ES_POSTCODE_REGION_RUNS,
  regionOfAnyValid: true,
  normalize: (postcode) => postcode.trim(),
});

const plain = (text: string): string => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();

/**
 * Finds a province of Spain by its code (`M`, `ES-M`) or its name in English, ignoring accents and letter case.
 *
 * @param query - The province's code or name.
 * @returns The province, or `undefined` when none has that code or name.
 * @example
 * ```ts
 * import { findSpanishProvince } from "@johnmorrisdotca/address-plus/es";
 *
 * console.log([findSpanishProvince("seville")?.code, findSpanishProvince("ES-B")?.name, findSpanishProvince("zz")]);
 * // → ["SE","Barcelona",null]
 * ```
 */
function findSpanishProvince(query: string): PostcodeRegion | undefined {
  const wanted = plain(String(query ?? "")).replace(/^ES-/, "");
  if (wanted === "") return undefined;

  return ES_PROVINCES.find((province) => province.code === wanted || plain(province.name) === wanted);
}

export { ES_POSTCODE_SHAPE, ES_PROVINCES, findSpanishProvince, lookups as spanishPostcodes };
